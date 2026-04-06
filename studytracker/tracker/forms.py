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
            'pdf_file': forms.ClearableFileInput(attrs={'accept': '.pdf,application/pdf'}),
        }

    def clean_pdf_file(self):
        pdf_file = self.cleaned_data.get('pdf_file')
        if not pdf_file:
            return pdf_file

        file_name = pdf_file.name.lower()
        content_type = getattr(pdf_file, 'content_type', '') or ''
        allowed_types = {'application/pdf', 'application/x-pdf'}
        if not file_name.endswith('.pdf'):
            raise forms.ValidationError('Please upload a PDF file (.pdf).')
        if content_type and content_type not in allowed_types:
            raise forms.ValidationError('Only PDF files are allowed.')
        return pdf_file
