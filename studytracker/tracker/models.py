from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task_name = models.CharField(max_length=255)
    completed_at = models.DateTimeField(default=timezone.now)
    time_taken_seconds = models.IntegerField()  # total seconds taken
    pomodoros_completed = models.IntegerField(default=1)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.task_name} – {self.completed_at.strftime('%d %b %Y %H:%M')}"

    @property
    def time_taken_display(self):
        mins = self.time_taken_seconds // 60
        secs = self.time_taken_seconds % 60
        if mins >= 60:
            hrs = mins // 60
            mins = mins % 60
            return f"{hrs}h {mins}m {secs}s"
        return f"{mins}m {secs}s"


class StudyResource(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    pdf_file = models.FileField(upload_to='pdfs/')
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title
