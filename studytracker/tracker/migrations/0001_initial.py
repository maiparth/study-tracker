from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='StudySession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('task_name', models.CharField(max_length=255)),
                ('completed_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('time_taken_seconds', models.IntegerField()),
                ('pomodoros_completed', models.IntegerField(default=1)),
            ],
            options={
                'ordering': ['-completed_at'],
            },
        ),
        migrations.CreateModel(
            name='StudyResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('subject', models.CharField(blank=True, max_length=100)),
                ('description', models.TextField(blank=True)),
                ('pdf_file', models.FileField(upload_to='pdfs/')),
                ('uploaded_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
