from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('stats/', views.stats, name='stats'),
    path('resources/', views.resources, name='resources'),
    path('save-session/', views.save_session, name='save_session'),
    path('upload-resource/', views.upload_resource, name='upload_resource'),
    path('resource/view/<int:pk>/', views.view_resource, name='view_resource'),
    path('resource/download/<int:pk>/', views.download_resource, name='download_resource'),
    path('delete-resource/<int:pk>/', views.delete_resource, name='delete_resource'),
    path('delete-session/<int:pk>/', views.delete_session, name='delete_session'),
]
