from django.urls import path
from . import views

urlpatterns = [
    # Student management
    path('students/', views.StudentListCreate.as_view()),
    path('students/<int:roll_no>/', views.StudentDelete.as_view()),
    
    # Attendance
    path('attendance/finalize/', views.FinalizeAttendance.as_view()),
    path('attendance/absent/', views.AbsentList.as_view()),
    
    # Device endpoints (ESP32)
    path('attendance/mark/', views.mark_attendance),
    path('device/commands/', views.get_device_commands),
    path('device/command-update/', views.update_command_status),
    path('device/status/', views.device_status),
    
    # Web UI endpoints
    path('student/enroll/', views.enroll_student),
    path('student/delete-fingerprint/', views.delete_fingerprint),
    path('command/<int:command_id>/', views.check_command_status),
    path('devices/', views.get_devices),
]