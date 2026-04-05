from django import forms
from .models import StudyResource


class StudyResourceForm(forms.ModelForm):
    class Meta:
        model = StudyResource
        fields = ['title', 'subject', 'description', 'pdf_file']
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': 'e.g. Operating Systems Notes'}),
            'subject': forms.TextInput(attrs={'placeholder': 'e.g. Computer Science'}),
            'description': forms.Textarea(attrs={'rows': 2, 'placeholder': 'Optional description...'}),
        }
