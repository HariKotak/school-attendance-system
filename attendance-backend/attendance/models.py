from django.db import models

class Student(models.Model):
    roll_no = models.IntegerField(primary_key=True)
    student_name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=10, db_column="class")
    identifier_code = models.CharField(max_length=50, unique=True, null=True)

    class Meta:
        db_table = "student"
        managed = False   # VERY IMPORTANT

class ParentDetail(models.Model):
    roll_no = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="roll_no"
    )
    parent_name = models.CharField(max_length=100)
    contact = models.CharField(max_length=15)
    address = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = "parent_detail"
        managed = False

class DailyAttendance(models.Model):
    roll_no = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        db_column="roll_no"
    )
    attendance_date = models.DateField()
    status = models.CharField(max_length=1)

    class Meta:
        db_table = "daily_attendance"
        managed = False
        unique_together = ("roll_no", "attendance_date")

class TotalAttendance(models.Model):
    roll_no = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="roll_no"
    )
    present_days = models.IntegerField()
    absent_days = models.IntegerField()
    continuous_absent = models.IntegerField()
    present_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = "total_attendance"
        managed = False
