from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from datetime import date

from .models import Student, DailyAttendance, ParentDetail
from .serializers import StudentSerializer


# ---------------- STUDENTS ----------------

class StudentListCreate(APIView):
    def get(self, request):
        students = Student.objects.all().values(
            "roll_no", "student_name", "class_name", "identifier_code"
        )
        return Response(students)

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Student added"}, status=201)


class StudentDelete(APIView):
    def delete(self, request, roll_no):
        Student.objects.filter(roll_no=roll_no).delete()
        return Response({"message": "Student deleted"})
    

# ---------------- ATTENDANCE ----------------

class FinalizeAttendance(APIView):
    def post(self, request):
        today = date.today()

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO daily_attendance (roll_no, attendance_date, status)
                SELECT roll_no, %s, 'A'
                FROM student
                WHERE roll_no NOT IN (
                    SELECT roll_no FROM daily_attendance WHERE attendance_date = %s
                );
            """, [today, today])

        return Response({"message": "Attendance finalized"})


class AbsentList(APIView):
    def get(self, request):
        date_param = request.GET.get("date", date.today())
        class_name = request.GET.get("class")

        query = """
            SELECT s.roll_no, s.student_name, p.contact
            FROM student s
            JOIN parent_detail p ON s.roll_no = p.roll_no
            JOIN daily_attendance d ON s.roll_no = d.roll_no
            WHERE d.attendance_date = %s
            AND d.status = 'A'
        """
        params = [date_param]

        if class_name:
            query += " AND s.class = %s"
            params.append(class_name)

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        result = []
        for r in rows:
            msg = f"Dear Parent, Your child {r[1]} was absent on {date_param}."
            result.append({
                "roll_no": r[0],
                "student_name": r[1],
                "contact": r[2],
                "message": msg
            })

        return Response(result)
