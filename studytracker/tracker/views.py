import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import StudySession, StudyResource
from .forms import StudyResourceForm


def home(request):
    """Landing page with Pomodoro timer."""
    return render(request, 'tracker/home.html')


@csrf_exempt
def save_session(request):
    """AJAX endpoint: save a completed task to DB."""
    if request.method == 'POST':
        data = json.loads(request.body)
        task_name = data.get('task_name', '').strip()
        time_taken_seconds = int(data.get('time_taken_seconds', 0))
        pomodoros = int(data.get('pomodoros', 1))

        if task_name:
            session = StudySession.objects.create(
                task_name=task_name,
                time_taken_seconds=time_taken_seconds,
                pomodoros_completed=pomodoros,
                completed_at=timezone.now(),
            )
            return JsonResponse({'status': 'ok', 'id': session.id})
        return JsonResponse({'status': 'error', 'message': 'Task name required'}, status=400)
    return JsonResponse({'status': 'error'}, status=405)


def stats(request):
    """Stats page: list of all completed sessions."""
    sessions = StudySession.objects.all()
    total_sessions = sessions.count()
    total_seconds = sum(s.time_taken_seconds for s in sessions)
    total_pomodoros = sum(s.pomodoros_completed for s in sessions)

    avg_seconds = total_seconds // total_sessions if total_sessions else 0
    avg_mins = avg_seconds // 60
    avg_secs = avg_seconds % 60

    total_mins = total_seconds // 60
    total_hrs = total_mins // 60
    total_mins_rem = total_mins % 60

    context = {
        'sessions': sessions,
        'total_sessions': total_sessions,
        'total_time': f"{total_hrs}h {total_mins_rem}m",
        'total_pomodoros': total_pomodoros,
        'avg_time': f"{avg_mins}m {avg_secs}s",
    }
    return render(request, 'tracker/stats.html', context)


def resources(request):
    """Resources page: PDF library."""
    all_resources = StudyResource.objects.all()
    subjects = StudyResource.objects.values_list('subject', flat=True).distinct()
    subject_filter = request.GET.get('subject', '')
    if subject_filter:
        all_resources = all_resources.filter(subject=subject_filter)

    form = StudyResourceForm()
    context = {
        'resources': all_resources,
        'subjects': [s for s in subjects if s],
        'form': form,
        'subject_filter': subject_filter,
    }
    return render(request, 'tracker/resources.html', context)


def upload_resource(request):
    """Upload a new PDF resource."""
    if request.method == 'POST':
        form = StudyResourceForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
    return redirect('resources')


def delete_resource(request, pk):
    """Delete a PDF resource."""
    resource = get_object_or_404(StudyResource, pk=pk)
    resource.pdf_file.delete()
    resource.delete()
    return redirect('resources')


def delete_session(request, pk):
    """Delete a study session record."""
    session = get_object_or_404(StudySession, pk=pk)
    session.delete()
    return redirect('stats')
