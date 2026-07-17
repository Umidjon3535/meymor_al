from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('', include('core.urls')),
]

# Whitenoise only serves STATIC_URL; MEDIA still needs Django to serve it
# since there's no separate object storage configured yet.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
