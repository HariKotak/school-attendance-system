# Generated migration file

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Device',
            fields=[
                ('device_id', models.CharField(help_text="Unique device identifier (e.g., 'FP001')", max_length=50, primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(help_text="Friendly name (e.g., 'Main Entrance Scanner')", max_length=100)),
                ('status', models.CharField(choices=[('online', 'Online'), ('offline', 'Offline'), ('error', 'Error')], default='offline', max_length=20)),
                ('current_mode', models.CharField(choices=[('scanning', 'Scanning'), ('enrolling', 'Enrolling'), ('deleting', 'Deleting')], default='scanning', max_length=20)),
                ('last_seen', models.DateTimeField(auto_now=True, help_text='Last time device communicated with server')),
                ('is_active', models.BooleanField(default=True, help_text='Set to False to disable device')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Fingerprint Device',
                'verbose_name_plural': 'Fingerprint Devices',
            },
        ),
        migrations.CreateModel(
            name='Student',
            fields=[
                ('roll_no', models.IntegerField(primary_key=True, serialize=False)),
                ('student_name', models.CharField(max_length=100)),
                ('class_name', models.CharField(db_column='class', max_length=10)),
                ('fingerprint_id', models.IntegerField(blank=True, help_text='ID stored in fingerprint sensor (1-127)', null=True, unique=True)),
                ('fingerprint_enrolled', models.BooleanField(default=False, help_text='True if fingerprint is enrolled in device')),
            ],
            options={
                'db_table': 'student',
            },
        ),
        migrations.CreateModel(
            name='ParentDetail',
            fields=[
                ('roll_no', models.OneToOneField(db_column='roll_no', on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to='attendance.student')),
                ('parent_name', models.CharField(max_length=100)),
                ('contact', models.CharField(max_length=15)),
                ('address', models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                'db_table': 'parent_detail',
            },
        ),
        migrations.CreateModel(
            name='TotalAttendance',
            fields=[
                ('roll_no', models.OneToOneField(db_column='roll_no', on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to='attendance.student')),
                ('present_days', models.IntegerField(default=0)),
                ('absent_days', models.IntegerField(default=0)),
                ('continuous_absent', models.IntegerField(default=0)),
                ('present_percentage', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
            ],
            options={
                'db_table': 'total_attendance',
            },
        ),
        migrations.CreateModel(
            name='DailyAttendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attendance_date', models.DateField()),
                ('status', models.CharField(max_length=1)),
                ('roll_no', models.ForeignKey(db_column='roll_no', on_delete=django.db.models.deletion.CASCADE, to='attendance.student')),
            ],
            options={
                'db_table': 'daily_attendance',
                'unique_together': {('roll_no', 'attendance_date')},
            },
        ),
        migrations.CreateModel(
            name='DeviceCommand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('command_type', models.CharField(choices=[('enroll', 'Enroll Fingerprint'), ('delete', 'Delete Fingerprint')], max_length=20)),
                ('fingerprint_id', models.IntegerField(help_text='Fingerprint ID in sensor (1-127)')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('failed', 'Failed'), ('expired', 'Expired')], default='pending', max_length=20)),
                ('message', models.TextField(blank=True, help_text='Status message or error details')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('device', models.ForeignKey(help_text='Target device for this command', on_delete=django.db.models.deletion.CASCADE, to='attendance.device')),
                ('student', models.ForeignKey(db_column='roll_no', help_text='Student to enroll/delete', on_delete=django.db.models.deletion.CASCADE, to='attendance.student')),
            ],
            options={
                'verbose_name': 'Device Command',
                'verbose_name_plural': 'Device Commands',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AttendanceLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('attendance_date', models.DateField(auto_now_add=True)),
                ('device', models.ForeignKey(blank=True, help_text='Device that recorded this attendance', null=True, on_delete=django.db.models.deletion.SET_NULL, to='attendance.device')),
                ('student', models.ForeignKey(db_column='roll_no', on_delete=django.db.models.deletion.CASCADE, to='attendance.student')),
            ],
            options={
                'verbose_name': 'Attendance Log',
                'verbose_name_plural': 'Attendance Logs',
                'ordering': ['-timestamp'],
            },
        ),
    ]


