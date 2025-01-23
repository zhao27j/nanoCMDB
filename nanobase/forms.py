# from typing import Any, Dict
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User

from django import forms
# from django.core import validators
from django.core.exceptions import ValidationError, NON_FIELD_ERRORS

from .models import UserProfile, UserDept
from nanopay.models import LegalEntity

"""
class UserCreateForm(forms.Form):
    username = forms.CharField(required=True, max_length=16, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only',
                               # validators=[validators.RegexValidator(regex='^[-a-zA-Z0-9_]+$`', message='Enter a valid Username', code='invalid_username')],
                               widget=forms.TextInput(attrs={
                                   'class': 'form-control', 
                                   "placeholder": "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only",
                                   }))
    
    first_name = forms.CharField(required=True, max_length=16, 
                                 # validators=[validators.RegexValidator(regex='^[-a-zA-Z0-9_]+$`', message='Enter a valid First Name', code='invalid_first_name')],
                                 widget=forms.TextInput(attrs={'class': 'form-control', }))
    last_name = forms.CharField(required=True, max_length=16, 
                                # validators=[validators.RegexValidator(regex='^[-a-zA-Z0-9_]+$`', message='Enter a valid Last Name', code='invalid_last_name')],
                                widget=forms.TextInput(attrs={'class': 'form-control', }))
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control', }))

    title = forms.CharField(required=False, max_length=64, 
                            # validators=[validators.RegexValidator(regex='^[-a-zA-Z0-9_]+$`', message='Enter a valid Last Name', code='invalid_last_name')],
                            widget=forms.TextInput(attrs={'class': 'form-control', }))
    dept = forms.CharField(required=False, max_length=64, widget=forms.TextInput(attrs={
        'class': 'form-control',
        'list': 'dept_list',
        }))
    work_phone = forms.DecimalField(required=False, max_digits=8, decimal_places=0,
                                    # validators=[validators.RegexValidator(regex='^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$', message='Enter a valid Phone Number', code='invalid_work_phone')],
                                    widget=forms.NumberInput(attrs={'class': 'form-control'}, ))
    cellphone = forms.DecimalField(required=False, max_digits=11, decimal_places=0, 
                                   # validators=[validators.RegexValidator(regex='^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$', message='Enter a valid Cellphone Number', code='invalid_cellphone')],
                                   widget=forms.NumberInput(attrs={'class': 'form-control'}, ))
    postal_addr = forms.CharField(required=False, max_length=256, widget=forms.TextInput(attrs={'class': 'form-control', }))
    legal_entity = forms.CharField(required=False, max_length=128, widget=forms.TextInput(attrs={
        'class': 'form-control',
        'list': 'legal_entity_list',
        }))

    def clean(self):
        cleaned_data = super().clean()
        
        username = cleaned_data.get('username').strip()
        if User.objects.filter(username=username).exists():
            raise ValidationError(_('the Username given does Exist'))
        
        dept = cleaned_data.get('dept').strip()
        if dept != '' and not UserDept.objects.filter(name=dept).exists():
            raise ValidationError(_('the Department given does NOT exist'))
        
        legal_entity = cleaned_data.get('legal_entity').strip()
        if legal_entity != '' and not LegalEntity.objects.filter(name=legal_entity).exists():
            raise ValidationError(_('the Legal Entity given does NOT exist'))
"""

class UserProfileUpdateForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super().clean()
        
        """
        cellphone = cleaned_data.get('cellphone')
        if not cellphone or cellphone < 1 or len(str(cellphone)) < 11:
            raise ValidationError(_('invalid cellphone number'))
        """

        # return super().clean()

    class Meta:
        model = UserProfile

        fields = [
            # 'avatar', 'dept', 'title', 
            'work_phone', 'postal_addr', 'cellphone',
            ]
        
        widgets = {
            # "avatar": forms.ImageField(attrs={'class': 'form-control-file',}),
            # "dept": forms.TextInput(attrs={'class': 'form-control',}),
            # "title": forms.TextInput(attrs={'class': 'form-control',}),
            "work_phone": forms.TextInput(attrs={'class': 'form-control',}), # NumberInput(attrs={'class': 'form-control',}),
            "postal_addr": forms.TextInput(attrs={'class': 'form-control',}),
            "cellphone": forms.TextInput(attrs={'class': 'form-control',}), # NumberInput(attrs={'class': 'form-control',}),
        }
