from django.urls import path
from .views import (
    StudentListCreate,
    StudentDelete,
    FinalizeAttendance,
    AbsentList
)

urlpatterns = [
    path("students/", StudentListCreate.as_view()),
    path("students/<int:roll_no>/", StudentDelete.as_view()),

    path("attendance/finalize/", FinalizeAttendance.as_view()),
    path("attendance/absent", AbsentList.as_view()),
]
