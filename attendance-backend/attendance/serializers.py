from rest_framework import serializers
from .models import Student, ParentDetail, Device, DeviceCommand

class StudentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(write_only=True)
    contact = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            "roll_no",
            "student_name",
            "class_name",
            "fingerprint_id",
            "fingerprint_enrolled",
            "parent_name",
            "contact",
            "address"
        ]
        read_only_fields = ["fingerprint_id", "fingerprint_enrolled"]

    def create(self, validated_data):
        parent_name = validated_data.pop("parent_name")
        contact = validated_data.pop("contact")
        address = validated_data.pop("address", None)

        student = Student.objects.create(**validated_data)

        ParentDetail.objects.create(
            roll_no=student,
            parent_name=parent_name,
            contact=contact,
            address=address
        )

        return student


class DeviceSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = [
            'device_id',
            'name',
            'status',
            'current_mode',
            'is_online',
            'last_seen',
            'is_active'
        ]
    
    def get_is_online(self, obj):
        return obj.is_online()


class DeviceCommandSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)
    
    class Meta:
        model = DeviceCommand
        fields = [
            'id',
            'device',
            'device_name',
            'student',
            'student_name',
            'command_type',
            'fingerprint_id',
            'status',
            'message',
            'created_at',
            'updated_at',
            'completed_at'
        ]