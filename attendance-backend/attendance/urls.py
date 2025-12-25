from django.urls import path
from .views import (
    StudentListCreate,
    StudentDelete,
    FinalizeAttendance,
    AbsentList,
    get_present_students,  # NEW: Import the new view
    mark_attendance,
    get_device_commands,
    update_command_status,
    device_status,
    enroll_student,
    delete_fingerprint,
    check_command_status,
    get_devices,
    test_db,
)

urlpatterns = [
    # Student endpoints
    path('students/', StudentListCreate.as_view(), name='student_list_create'),
    path('students/<int:roll_no>/', StudentDelete.as_view(), name='student_delete'),
    
    # Attendance endpoints
    path('attendance/finalize/', FinalizeAttendance.as_view(), name='finalize_attendance'),
    path('attendance/absent/', AbsentList.as_view(), name='absent_list'),
    path('attendance/present/', get_present_students, name='present_list'),  # NEW: Present students endpoint
    
    # Device endpoints (ESP32)
    path('attendance/mark/', mark_attendance, name='mark_attendance'),
    path('device/commands/', get_device_commands, name='get_device_commands'),
    path('device/status/', device_status, name='device_status'),
    path('device/command/update/', update_command_status, name='update_command_status'),
    
    # Web UI endpoints
    path('student/enroll/', enroll_student, name='enroll_student'),
    path('student/delete-fingerprint/', delete_fingerprint, name='delete_fingerprint'),
    path('command/status/<int:command_id>/', check_command_status, name='check_command_status'),
    path('devices/', get_devices, name='get_devices'),
    
    # Testing
    path('test-db/', test_db, name='test_db'),
]
