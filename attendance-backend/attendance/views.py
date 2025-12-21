from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.db import connection
from django.utils import timezone
from datetime import date

from .models import Student, DailyAttendance, ParentDetail, Device, DeviceCommand, AttendanceLog
from .serializers import StudentSerializer


# ---------------- STUDENTS ----------------

class StudentListCreate(APIView):
    def get(self, request):
        try:
            # Try to fetch students
            students = Student.objects.all()
            
            # Check if query works
            print(f"Found {students.count()} students")
            
            # Build response
            data = []
            for s in students:
                try:
                    data.append({
                        "roll_no": s.roll_no,
                        "student_name": s.student_name,
                        "class_name": s.class_name,
                        "fingerprint_id": s.fingerprint_id,
                        "fingerprint_enrolled": s.fingerprint_enrolled
                    })
                except Exception as e:
                    print(f"Error processing student {s.roll_no}: {str(e)}")
                    # Skip problematic student
                    continue
            
            return Response(data)
            
        except Exception as e:
            # Log the actual error
            import traceback
            error_details = traceback.format_exc()
            print(f"ERROR in StudentListCreate.get(): {str(e)}")
            print(error_details)
            
            # Return error to frontend for debugging
            return Response({
                "error": str(e),
                "details": error_details,
                "message": "Failed to fetch students"
            }, status=500)

    def post(self, request):
        try:
            serializer = StudentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"message": "Student added"}, status=201)
        except Exception as e:
            import traceback
            print(f"ERROR in StudentListCreate.post(): {str(e)}")
            print(traceback.format_exc())
            return Response({
                "error": str(e),
                "message": "Failed to add student"
            }, status=500)


class StudentDelete(APIView):
    def delete(self, request, roll_no):
        Student.objects.filter(roll_no=roll_no).delete()
        return Response({"message": "Student deleted"})


# ---------------- ATTENDANCE ----------------

class FinalizeAttendance(APIView):
    def post(self, request):
        today = date.today()

        with connection.cursor() as cursor:
            # Mark all students who haven't scanned as absent
            cursor.execute("""
                INSERT INTO daily_attendance (roll_no, attendance_date, status)
                SELECT roll_no, %s, 'A'
                FROM student
                WHERE roll_no NOT IN (
                    SELECT roll_no FROM daily_attendance WHERE attendance_date = %s
                )
            """, [today, today])

            # Update total_attendance table
            cursor.execute("""
                UPDATE total_attendance t
                SET 
                    present_days = (
                        SELECT COUNT(*) FROM daily_attendance d 
                        WHERE d.roll_no = t.roll_no AND d.status = 'P'
                    ),
                    absent_days = (
                        SELECT COUNT(*) FROM daily_attendance d 
                        WHERE d.roll_no = t.roll_no AND d.status = 'A'
                    ),
                    present_percentage = (
                        SELECT ROUND(
                            (COUNT(*) FILTER (WHERE status = 'P')::decimal / 
                            NULLIF(COUNT(*), 0)) * 100, 2
                        )
                        FROM daily_attendance d 
                        WHERE d.roll_no = t.roll_no
                    )
            """)

        return Response({
            "message": "Attendance finalized for today",
            "date": today
        })


class AbsentList(APIView):
    def get(self, request):
        date_param = request.GET.get("date", date.today())
        class_name = request.GET.get("class")

        query = """
            SELECT
                s.roll_no,
                s.student_name,
                s.class,
                p.contact,
                t.present_days,
                t.absent_days,
                t.continuous_absent
            FROM student s
            JOIN parent_detail p ON s.roll_no = p.roll_no
            JOIN daily_attendance d ON s.roll_no = d.roll_no
            LEFT JOIN total_attendance t ON s.roll_no = t.roll_no
            WHERE d.attendance_date = %s
              AND d.status = 'A'
        """
        params = [date_param]

        if class_name:
            query += " AND s.class = %s"
            params.append(class_name)

        query += " ORDER BY t.continuous_absent DESC NULLS LAST"

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        result = []
        for r in rows:
            msg = (
                f"Dear Parent, Your child {r[1]} (Class {r[2]}) was absent on {date_param}. "
                f"Total absences: {r[5] or 0}. "
                f"Continuous absence: {r[6] or 0} days. "
                f"Please ensure regular attendance."
            )

            result.append({
                "roll_no": r[0],
                "student_name": r[1],
                "class_name": r[2],
                "contact": r[3],
                "present_days": r[4] or 0,
                "absent_days": r[5] or 0,
                "continuous_absent": r[6] or 0,
                "message": msg
            })

        return Response(result)


# ============== FINGERPRINT DEVICE ENDPOINTS ==============

@api_view(['POST'])
def mark_attendance(request):
    """ESP32 calls this when fingerprint is scanned"""
    fingerprint_id = request.data.get('fingerprint_id')
    device_id = request.data.get('device_id', 'FP001')
    
    if not fingerprint_id:
        return Response({
            'error': 'fingerprint_id required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find student by fingerprint_id
        student = Student.objects.get(fingerprint_id=fingerprint_id)
        
        # Get or create device
        device, created = Device.objects.get_or_create(
            device_id=device_id,
            defaults={'name': f'Device {device_id}', 'status': 'online'}
        )
        
        # Update device status
        device.status = 'online'
        device.last_seen = timezone.now()
        device.save()
        
        # Check if already marked today
        today = timezone.now().date()
        
        existing = DailyAttendance.objects.filter(
            roll_no=student,
            attendance_date=today
        ).first()
        
        if existing:
            return Response({
                'message': 'Already marked present today',
                'student': student.student_name,
                'roll_no': student.roll_no,
                'time': existing.attendance_date.strftime('%Y-%m-%d')
            }, status=status.HTTP_200_OK)
        
        # Mark attendance
        DailyAttendance.objects.create(
            roll_no=student,
            attendance_date=today,
            status='P'
        )
        
        # Log attendance
        log = AttendanceLog.objects.create(
            student=student,
            device=device
        )
        
        return Response({
            'success': True,
            'message': 'Attendance marked successfully',
            'student': student.student_name,
            'roll_no': student.roll_no,
            'class': student.class_name,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None
        }, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        return Response({
            'error': f'No student found with fingerprint_id {fingerprint_id}'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_device_commands(request):
    """ESP32 polls this every 3 seconds"""
    device_id = request.GET.get('device_id')
    
    if not device_id:
        return Response({'error': 'device_id required'}, status=400)
    
    # Update device last_seen
    device, created = Device.objects.get_or_create(
        device_id=device_id,
        defaults={'name': f'Device {device_id}', 'status': 'online'}
    )
    device.status = 'online'
    device.last_seen = timezone.now()
    device.save()
    
    # Get oldest pending command
    command = DeviceCommand.objects.filter(
        device=device,
        status='pending'
    ).order_by('created_at').first()
    
    if command:
        # Check if expired
        if command.is_expired():
            command.status = 'expired'
            command.message = 'Command timeout'
            command.save()
            return Response({'command': None})
        
        # Mark as in progress
        command.status = 'in_progress'
        command.save()
        
        return Response({
            'command': command.command_type,
            'fingerprint_id': command.fingerprint_id,
            'student_name': command.student.student_name,
            'command_id': command.id
        })
    
    return Response({'command': None})


@api_view(['POST'])
def update_command_status(request):
    """ESP32 reports command completion"""
    command_id = request.data.get('command_id')
    result = request.data.get('status')
    message = request.data.get('message', '')

    if not command_id:
        return Response({'error': 'command_id required'}, status=400)

    try:
        command = DeviceCommand.objects.get(id=command_id)
    except DeviceCommand.DoesNotExist:
        return Response({'error': 'Command not found'}, status=404)

    student = command.student

    if result == 'success':
        command.status = 'completed'
        command.completed_at = timezone.now()
        command.message = message or 'Operation successful'

        if command.command_type == 'enroll':
            student.fingerprint_enrolled = True
            student.fingerprint_id = command.fingerprint_id
        elif command.command_type == 'delete':
            student.fingerprint_enrolled = False
            student.fingerprint_id = None
        
        student.save()

    elif result == 'error':
        command.status = 'failed'
        command.message = message or 'Operation failed'

    elif result == 'in_progress':
        command.status = 'in_progress'
        command.message = message

    command.save()
    return Response({'message': 'Status updated'})


@api_view(['POST'])
def device_status(request):
    """ESP32 heartbeat"""
    device_id = request.data.get('device_id')
    device_status_value = request.data.get('status', 'online')
    mode = request.data.get('mode', 'scanning')
    
    device, created = Device.objects.get_or_create(
        device_id=device_id,
        defaults={'name': f'Device {device_id}'}
    )
    
    device.status = device_status_value
    device.current_mode = mode
    device.last_seen = timezone.now()
    device.save()
    
    return Response({'message': 'Status updated'}, status=200)


# ============== WEB UI ENDPOINTS ==============

@api_view(['POST'])
def enroll_student(request):
    """Enroll fingerprint button"""
    roll_no = request.data.get('roll_no')
    device_id = request.data.get('device_id', 'FP001')
    
    try:
        student = Student.objects.get(roll_no=roll_no)
        device, created = Device.objects.get_or_create(
            device_id=device_id,
            defaults={'name': f'Device {device_id}'}
        )
        
        # Check device online
        if not device.is_online():
            return Response({
                'error': 'Device offline. Please check connection.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Check if already enrolled
        if student.fingerprint_enrolled:
            return Response({
                'error': f'Already enrolled (ID: {student.fingerprint_id})'
            }, status=400)
        
        # Find next available ID
        used_ids = Student.objects.filter(
            fingerprint_id__isnull=False
        ).values_list('fingerprint_id', flat=True)
        
        next_id = 1
        while next_id in used_ids and next_id <= 127:
            next_id += 1
        
        if next_id > 127:
            return Response({
                'error': 'No available slots (max 127)'
            }, status=400)
        
        # Create command
        command = DeviceCommand.objects.create(
            device=device,
            student=student,
            command_type='enroll',
            fingerprint_id=next_id,
            status='pending'
        )
        
        return Response({
            'message': 'Enrollment started',
            'fingerprint_id': next_id,
            'command_id': command.id,
            'instruction': 'Place finger on scanner'
        }, status=status.HTTP_201_CREATED)
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)


@api_view(['POST'])
def delete_fingerprint(request):
    """Delete fingerprint button"""
    roll_no = request.data.get('roll_no')
    device_id = request.data.get('device_id', 'FP001')
    
    try:
        student = Student.objects.get(roll_no=roll_no)
        
        if not student.fingerprint_enrolled or not student.fingerprint_id:
            return Response({
                'error': 'No fingerprint enrolled'
            }, status=400)
        
        device, created = Device.objects.get_or_create(
            device_id=device_id,
            defaults={'name': f'Device {device_id}'}
        )
        
        if not device.is_online():
            return Response({
                'error': 'Device offline'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Create deletion command
        command = DeviceCommand.objects.create(
            device=device,
            student=student,
            command_type='delete',
            fingerprint_id=student.fingerprint_id,
            status='pending'
        )
        
        return Response({
            'message': 'Deletion command sent',
            'command_id': command.id,
            'fingerprint_id': student.fingerprint_id
        }, status=status.HTTP_201_CREATED)
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)


@api_view(['GET'])
def check_command_status(request, command_id):
    """Frontend polling"""
    try:
        command = DeviceCommand.objects.get(id=command_id)
        return Response({
    'status': command.status,
    'message': command.message,
    'student_name': command.student.student_name,
    'fingerprint_id': command.fingerprint_id,
    'command_type': command.command_type,
    'created_at': command.created_at.isoformat() if command.created_at else None,
    'updated_at': command.updated_at.isoformat() if command.updated_at else None,
    'completed_at': command.completed_at.isoformat() if command.completed_at else None,
})

    except DeviceCommand.DoesNotExist:
        return Response({'error': 'Command not found'}, status=404)


@api_view(['GET'])
def get_devices(request):
    """Device list"""
    devices = Device.objects.all()
    data = []

    for device in devices:
        data.append({
            'device_id': device.device_id,
            'name': device.name,
            'status': device.status,
            'is_online': device.is_online(),
            'current_mode': device.current_mode,
            'last_seen': device.last_seen.isoformat() if device.last_seen else None
        })

    return Response(data)
    # At the end of views.py
@api_view(['GET'])
def test_db(request):
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        
        return Response({
            "status": "Database connection OK",
            "result": result
        })
    except Exception as e:
        import traceback
        return Response({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)
