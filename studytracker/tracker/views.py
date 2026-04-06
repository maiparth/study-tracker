import json
from datetime import timedelta
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, FileResponse, Http404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from .models import StudySession, StudyResource
from .forms import StudyResourceForm


def home(request):
    """Landing page with Pomodoro timer."""
    return render(request, 'tracker/home.html')


@login_required
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
                user=request.user,
                task_name=task_name,
                time_taken_seconds=time_taken_seconds,
                pomodoros_completed=pomodoros,
                completed_at=timezone.now(),
            )
            return JsonResponse({'status': 'ok', 'id': session.id})
        return JsonResponse({'status': 'error', 'message': 'Task name required'}, status=400)
    return JsonResponse({'status': 'error'}, status=405)


@login_required
def stats(request):
    """Stats page: list of all completed sessions."""
    start_date = parse_date(request.GET.get('start_date', ''))
    end_date = parse_date(request.GET.get('end_date', ''))

    sessions = StudySession.objects.filter(user=request.user)
    if start_date:
        sessions = sessions.filter(completed_at__date__gte=start_date)
    if end_date:
        sessions = sessions.filter(completed_at__date__lte=end_date)

    total_sessions = sessions.count()
    total_seconds = sum(s.time_taken_seconds for s in sessions)
    total_pomodoros = sum(s.pomodoros_completed for s in sessions)

    def format_duration(seconds):
        hours, remainder = divmod(seconds, 3600)
        minutes, secs = divmod(remainder, 60)
        if hours:
            return f"{hours}h {minutes}m {secs}s"
        return f"{minutes}m {secs}s"

    daily_stats = (
        sessions
        .annotate(day=TruncDate('completed_at'))
        .values('day')
        .annotate(
            total_seconds=Sum('time_taken_seconds'),
            total_pomodoros=Sum('pomodoros_completed'),
            session_count=Count('id'),
        )
        .order_by('day')
    )

    daily_study_data = []
    for row in daily_stats:
        day = row['day']
        day_seconds = row['total_seconds'] or 0
        daily_study_data.append({
            'date': day.strftime('%d %b %Y') if day else '',
            'short_date': day.strftime('%d %b') if day else '',
            'seconds': day_seconds,
            'time_display': format_duration(day_seconds),
            'sessions': row['session_count'],
            'pomodoros': row['total_pomodoros'] or 0,
        })

    weekly_stats = (
        sessions
        .annotate(week=TruncWeek('completed_at'))
        .values('week')
        .annotate(
            total_seconds=Sum('time_taken_seconds'),
            total_pomodoros=Sum('pomodoros_completed'),
            session_count=Count('id'),
        )
        .order_by('week')
    )

    weekly_summary_data = []
    for row in weekly_stats:
        week_start = row['week']
        week_seconds = row['total_seconds'] or 0
        week_end = week_start + timedelta(days=6) if week_start else None
        weekly_summary_data.append({
            'period': f"{week_start.strftime('%d %b')} - {week_end.strftime('%d %b') if week_end else ''}" if week_start else '',
            'seconds': week_seconds,
            'time_display': format_duration(week_seconds),
            'sessions': row['session_count'],
            'pomodoros': row['total_pomodoros'] or 0,
        })

    monthly_stats = (
        sessions
        .annotate(month=TruncMonth('completed_at'))
        .values('month')
        .annotate(
            total_seconds=Sum('time_taken_seconds'),
            total_pomodoros=Sum('pomodoros_completed'),
            session_count=Count('id'),
        )
        .order_by('month')
    )

    monthly_summary_data = []
    for row in monthly_stats:
        month = row['month']
        month_seconds = row['total_seconds'] or 0
        monthly_summary_data.append({
            'period': month.strftime('%b %Y') if month else '',
            'seconds': month_seconds,
            'time_display': format_duration(month_seconds),
            'sessions': row['session_count'],
            'pomodoros': row['total_pomodoros'] or 0,
        })

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
        'daily_study_data': daily_study_data,
        'weekly_summary_data': weekly_summary_data,
        'monthly_summary_data': monthly_summary_data,
        'start_date': start_date.isoformat() if start_date else '',
        'end_date': end_date.isoformat() if end_date else '',
        'start_date_display': start_date.strftime('%d %b %Y') if start_date else '',
        'end_date_display': end_date.strftime('%d %b %Y') if end_date else '',
    }
    return render(request, 'tracker/stats.html', context)


@login_required
def resources(request):
    """Resources page: PDF library."""
    all_resources = StudyResource.objects.filter(user=request.user)
    subjects = StudyResource.objects.filter(user=request.user).values_list('subject', flat=True).distinct()
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


@login_required
def upload_resource(request):
    """Upload a new PDF resource."""
    if request.method == 'POST':
        form = StudyResourceForm(request.POST, request.FILES)
        if form.is_valid():
            form.instance.user = request.user
            form.save()
            messages.success(request, 'Resource uploaded successfully.')
            return redirect('resources')

        messages.error(request, 'Upload failed. Please fix the highlighted fields and try again.')
        all_resources = StudyResource.objects.filter(user=request.user)
        subjects = StudyResource.objects.filter(user=request.user).values_list('subject', flat=True).distinct()
        context = {
            'resources': all_resources,
            'subjects': [s for s in subjects if s],
            'form': form,
            'subject_filter': '',
        }
        return render(request, 'tracker/resources.html', context, status=400)

    return redirect('resources')


@login_required
def delete_resource(request, pk):
    """Delete a PDF resource."""
    resource = get_object_or_404(StudyResource, pk=pk, user=request.user)
    resource.pdf_file.delete()
    resource.delete()
    return redirect('resources')


@login_required
def view_resource(request, pk):
    """Open a PDF resource in browser."""
    resource = get_object_or_404(StudyResource, pk=pk, user=request.user)
    if not resource.pdf_file:
        raise Http404('Resource file not found')

    file_name = resource.pdf_file.name.split('/')[-1]
    response = FileResponse(resource.pdf_file.open('rb'), content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="{file_name}"'
    return response


@login_required
def download_resource(request, pk):
    """Download a PDF resource file."""
    resource = get_object_or_404(StudyResource, pk=pk, user=request.user)
    if not resource.pdf_file:
        raise Http404('Resource file not found')

    file_name = resource.pdf_file.name.split('/')[-1]
    return FileResponse(resource.pdf_file.open('rb'), as_attachment=True, filename=file_name)


@login_required
def delete_session(request, pk):
    """Delete a study session record."""
    session = get_object_or_404(StudySession, pk=pk, user=request.user)
    session.delete()
    return redirect('stats')


def login_view(request):
    """Login view."""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'tracker/login.html')


def register_view(request):
    """Register view."""
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Registration failed. Please fix the errors.')
    else:
        form = UserCreationForm()
    return render(request, 'tracker/register.html', {'form': form})


def logout_view(request):
    """Logout view."""
    logout(request)
    return redirect('home')
