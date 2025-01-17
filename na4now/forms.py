from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from django import forms
from django.conf import settings
from django.core.mail import send_mail

from .models import branchSite

class TransferBranchSite(forms.Form):    
    new_branchsite = forms.ChoiceField(
        label='Transfer to ...',
        # choices=[site_list],
        help_text="Enter a date between now and 4 weeks (default 3).",
        required=True)
    
    def clean_field(self):
        data = self.cleaned_data["new_branchsite"]
        
        if data == None:
            raise ValidationError(_('no Site name'))
        
        return data
    

class ContactForm(forms.Form):

    name = forms.CharField(max_length=20)
    email = forms.EmailField()
    inquiry = forms.CharField(max_length=70)
    message = forms.CharField(widget=forms.Textarea)

    def get_info(self):
        """ Method that returns formatted information: return: subject, msg """

        # Cleaned data
        cl_data = super.clean()

        name = cl_data.get('name').strip()
        from_email = cl_data('email')
        subject = cl_data('inquiry')

        msg = f'{name} with email {from_email} said:'
        msg += f'\n"{subject}"\n\n'
        msg += cl_data.get('message')

        return subject, msg
    
    def send(self):
        subject, msg = self.get_info()

        send_mail(
            subject=subject,
            message=msg,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.RECIPIENT_ADDRESS],
        )


class InstanceHostnameUpdateForm(forms.Form):
    hostname = forms.CharField(max_length=32, required=True, widget=TextInput(attrs={'class': 'form-control', }))

    def clean(self):
        cleaned_data = super().clean()
        
        hostname = cleaned_data.get('hostname').strip()
        if hostname == '':
            raise ValidationError(_('invalid Hostname given'))
        
        if Instance.objects.filter(hostname=hostname).exists():
            raise ValidationError(_('the Hostname given does Exist'))


class InstnaceOwnerUpdateForm(forms.Form):
    owner = forms.CharField(max_length=64, required=False, widget=TextInput(attrs={
        'class': 'form-control',
        'list': 'owner_list',
    }))

    def clean(self):
        cleaned_data = super().clean()

        owner = cleaned_data.get('owner').strip(")").split("(")[-1].strip().lower()

        if owner != '' and not User.objects.filter(username=owner).exists():
            raise ValidationError(_('owner selected does NOT exist'))

        if owner == 'admin':
            raise ValidationError(_('can NOT be assigned to [ admin ]'))
