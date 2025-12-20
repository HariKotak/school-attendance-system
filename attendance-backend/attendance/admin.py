from django.contrib import admin
from django.utils.html import format_html
from .models import Student, ParentDetail, DailyAttendance, TotalAttendance, Device, DeviceCommand, AttendanceLog

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['roll_no', 'student_name', 'class_name', 'fingerprint_status', 'fingerprint_id']
    list_filter = ['class_name', 'fingerprint_enrolled']
    search_fields = ['roll_no', 'student_name']
    readonly_fields = ['fingerprint_id', 'fingerprint_enrolled']
    
    def fingerprint_status(self, obj):
        if obj.fingerprint_enrolled:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Enrolled (ID: {})</span>',
                obj.fingerprint_id
            )
        return format_html('<span style="color: orange;">✗ Not Enrolled</span>')
    fingerprint_status.short_description = 'Fingerprint Status'


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'name', 'status_indicator', 'current_mode', 'last_seen']
    list_filter = ['status', 'current_mode', 'is_active']
    readonly_fields = ['last_seen', 'created_at']
    
    def status_indicator(self, obj):
        if obj.is_online():
            color = 'green'
            text = '● Online'
        else:
            color = 'red'
            text = '● Offline'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, text
        )
    status_indicator.short_description = 'Status'


@admin.register(DeviceCommand)
class DeviceCommandAdmin(admin.ModelAdmin):
    list_display = ['id', 'device', 'student', 'command_type', 'status_badge', 'fingerprint_id', 'created_at']
    list_filter = ['command_type', 'status', 'device']
    search_fields = ['student__student_name', 'student__roll_no']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'in_progress': 'blue',
            'completed': 'green',
            'failed': 'red',
            'expired': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'device', 'attendance_date', 'timestamp']
    list_filter = ['attendance_date', 'device']
    search_fields = ['student__student_name', 'student__roll_no']
    readonly_fields = ['timestamp', 'attendance_date']
    date_hierarchy = 'attendance_date'


@admin.register(ParentDetail)
class ParentDetailAdmin(admin.ModelAdmin):
    list_display = ['roll_no', 'parent_name', 'contact']
    search_fields = ['parent_name', 'contact', 'roll_no__student_name']


@admin.register(DailyAttendance)
class DailyAttendanceAdmin(admin.ModelAdmin):
    list_display = ['roll_no', 'attendance_date', 'status']
    list_filter = ['attendance_date', 'status']
    search_fields = ['roll_no__student_name', 'roll_no__roll_no']
    date_hierarchy = 'attendance_date'


@admin.register(TotalAttendance)
class TotalAttendanceAdmin(admin.ModelAdmin):
    list_display = ['roll_no', 'present_days', 'absent_days', 'present_percentage', 'continuous_absent']
    list_filter = ['present_percentage']
    readonly_fields = ['present_days', 'absent_days', 'continuous_absent', 'present_percentage']