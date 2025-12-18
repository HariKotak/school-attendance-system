from rest_framework import serializers
from .models import Student, ParentDetail

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
            "identifier_code",
            "parent_name",
            "contact",
            "address"
        ]

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
