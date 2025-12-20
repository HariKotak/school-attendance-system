from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),          # ✅ Admin works now
    path('api/', include('attendance.urls')), # ✅ All APIs moved to app
]
