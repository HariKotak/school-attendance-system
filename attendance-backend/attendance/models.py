from django.db import models
from django.utils import timezone

class Student(models.Model):
    roll_no = models.IntegerField(primary_key=True)
    student_name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=10, db_column="class")
    
    # SIMPLIFIED: Only fingerprint_id needed (no identifier_code)
    fingerprint_id = models.IntegerField(
        null=True, 
        blank=True, 
        unique=True,
        help_text="ID stored in fingerprint sensor (1-127)"
    )
    fingerprint_enrolled = models.BooleanField(
        default=False,
        help_text="True if fingerprint is enrolled in device"
    )

    class Meta:
        db_table = "student"
        managed = True

    def __str__(self):
        return f"{self.student_name} (Roll: {self.roll_no})"


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
        managed = True


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
        managed = True
        unique_together = ("roll_no", "attendance_date")


class TotalAttendance(models.Model):
    roll_no = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="roll_no"
    )
    present_days = models.IntegerField(default=0)  # ← ADD default=0
    absent_days = models.IntegerField(default=0)   # ← ADD default=0
    continuous_absent = models.IntegerField(default=0)  # ← ADD default=0
    present_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # ← ADD default=0.00

    class Meta:
        db_table = "total_attendance"
        managed = True


# ============== FINGERPRINT SYSTEM ==============

class Device(models.Model):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('error', 'Error'),
    ]
    
    MODE_CHOICES = [
        ('scanning', 'Scanning'),
        ('enrolling', 'Enrolling'),
        ('deleting', 'Deleting'),
    ]
    
    device_id = models.CharField(
        max_length=50, 
        unique=True, 
        primary_key=True,
        help_text="Unique device identifier (e.g., 'FP001')"
    )
    name = models.CharField(
        max_length=100,
        help_text="Friendly name (e.g., 'Main Entrance Scanner')"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='offline'
    )
    current_mode = models.CharField(
        max_length=20, 
        choices=MODE_CHOICES, 
        default='scanning'
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        help_text="Last time device communicated with server"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Set to False to disable device"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_online(self):
        if not self.last_seen:
            return False
        time_diff = (timezone.now() - self.last_seen).total_seconds()
        return time_diff < 60
    
    def __str__(self):
        return f"{self.name} ({self.device_id})"
    
    class Meta:
        verbose_name = "Fingerprint Device"
        verbose_name_plural = "Fingerprint Devices"


class DeviceCommand(models.Model):
    COMMAND_TYPES = [
        ('enroll', 'Enroll Fingerprint'),
        ('delete', 'Delete Fingerprint'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    device = models.ForeignKey(
        Device, 
        on_delete=models.CASCADE,
        help_text="Target device for this command"
    )
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE,
        db_column="roll_no",
        help_text="Student to enroll/delete"
    )
    command_type = models.CharField(
        max_length=20, 
        choices=COMMAND_TYPES
    )
    fingerprint_id = models.IntegerField(
        help_text="Fingerprint ID in sensor (1-127)"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    message = models.TextField(
        blank=True,
        help_text="Status message or error details"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Device Command"
        verbose_name_plural = "Device Commands"
    
    def __str__(self):
        return f"{self.get_command_type_display()} - {self.student.student_name} - {self.get_status_display()}"
    
    def is_expired(self):
        if self.status in ['completed', 'failed', 'expired']:
            return False
        time_diff = (timezone.now() - self.created_at).total_seconds()
        return time_diff > 300


class AttendanceLog(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        db_column="roll_no"
    )
    device = models.ForeignKey(
        Device, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        help_text="Device that recorded this attendance"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    attendance_date = models.DateField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Attendance Log"
        verbose_name_plural = "Attendance Logs"
    
    def __str__(self):
        return f"{self.student.student_name} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
