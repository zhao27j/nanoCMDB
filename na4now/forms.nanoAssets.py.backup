from typing import Any, Dict
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from django.shortcuts import get_object_or_404

from django.contrib.auth.models import User

from django import forms
from django.forms import TextInput, Select
# from django.conf import settings
# from django.core.mail import send_mail

from .models import Instance, ModelType, branchSite
from nanopay.models import Contract

class NewInstanceForm(forms.Form):
    serial_number = forms.CharField(max_length=32, required=True, widget=TextInput(attrs={'class': 'form-control',}))
    model_type = forms.CharField(label='Model / Type', max_length=32, required=True, widget=TextInput(attrs={
        "list": "model_type_list",
        "class": "form-control",
    }))

    INSTANCE_STATUS = (
        ('AVAILABLE', 'Available'),
        ('inUSE', 'in Use'),
    )
    status = forms.ChoiceField(initial='inUSE', choices=INSTANCE_STATUS, required=True, widget=Select(attrs={
        "class": "form-control",
    }))

    owner = forms.CharField(max_length=32, required=False, widget=TextInput(attrs={
        "list": "owner_list",
        "class": "form-control",
    }))

    branchSite = forms.CharField(max_length=32, required=True, widget=TextInput(attrs={
        "list": "branchsite_list",
        "class": "form-control",
    }))

    contract = forms.CharField(max_length=72, required=False, widget=TextInput(attrs={
        "list": "contract_list",
        "class": "form-control",
    }))

    def clean(self):
        cleaned_data = super().clean()

        serial_number = cleaned_data.get('serial_number').strip()
        if Instance.objects.filter(serial_number=serial_number):
            raise ValidationError(_("the given Serial # [ " + serial_number + " ] does Exist"))

        model_type = cleaned_data.get('model_type').split("(")[0].strip()
        if not ModelType.objects.filter(name=model_type):
            raise ValidationError(_("the given Model / Type [ " + model_type + " ] does NOT exist"))
                
        owner = cleaned_data.get('owner').strip(")").split("(")[-1].strip()
        if owner != '' and not User.objects.filter(username=owner):
            raise ValidationError(_("the given Onwer [ " + owner + " ] does NOT exist"))
        
        status = cleaned_data.get('status').strip()
        if owner == '' and status == 'inUSE' or owner != '' and status == 'AVAILABLE':
            raise ValidationError(_("the given Status [ " + status + " ]  is invalid"))

        branch_site = cleaned_data.get('branchSite').strip()
        if not branchSite.objects.filter(name=branch_site):
            raise ValidationError(_("the given Site [ " + branch_site + " ] does NOT exist"))

        contract_associated_with = cleaned_data.get('contract').strip()
        if not Contract.objects.filter(briefing=contract_associated_with):
            raise ValidationError(_("the given Contract [ " + contract_associated_with + " ] does NOT exist"))