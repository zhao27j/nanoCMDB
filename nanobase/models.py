import os

from django.db import models

from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from django.contrib.auth.models import User

from nanoassets.models import Instance, Config
from nanopay.models import Contract, PaymentRequest

# Create your models here.

class SubCategory(models.Model):
    name = models.CharField(_("Sub-Category"), max_length=64, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class UserDept(models.Model):
    name = models.CharField(_("Department"), max_length=64, unique=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, verbose_name=(_("User Profile")), on_delete=models.CASCADE)
    # avatar = models.ImageField(_("avatar"), upload_to=None, height_field=None, width_field=None, max_length=None)
    title = models.CharField(_("Title"), max_length=64, null=True, blank=True)
    dept = models.ForeignKey("nanobase.UserDept", verbose_name=(_("Department")), on_delete=models.SET_NULL, null=True, blank=True)
    work_phone = models.DecimalField(_("Work Phone"), max_digits=32, decimal_places=0, null=True, blank=True)
    postal_addr = models.CharField(_("Postal Address"), max_length=128, null=True, blank=True)
    cellphone = models.DecimalField(_("Cellphone"), max_digits=32, decimal_places=0, null=True, blank=True)

    legal_entity = models.ForeignKey("nanopay.LegalEntity", verbose_name=(_("Legal Entiry")), on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.user.username
    

class ChangeHistory(models.Model):
    on = models.DateTimeField((_("on")), null=True, blank=True)
    by = models.ForeignKey(User, verbose_name=(_("by")), on_delete=models.SET_NULL, null=True, blank=True)
    db_table_name = models.CharField((_("db_table_name")), max_length=32, null=True, blank=True)
    db_table_pk = models.CharField((_("db_table_pk")), max_length=32, null=True, blank=True)
    detail = models.TextField((_("Details")), null=True, blank=True)

    def __str__(self):
       return self.detail
    

def digital_copy_upload_to(instance, filename):
    file_name_base, file_name_ext = os.path.splitext(filename)

    if 'contract' in instance.db_table_name:
        contract = Contract.objects.get(pk=instance.db_table_pk)
        file_name = str(contract.startup.year) + '_' + contract.get_type_display() + '_uploaded by_' + contract.created_by.username + '_' + file_name_base  + file_name_ext
        file_path = 'uploads/contract_scanned_copy/' + str(contract.startup.year)

    elif 'paymentrequest' in instance.db_table_name:
        payment_request = PaymentRequest.objects.get(pk=instance.db_table_pk)
        file_name = str(payment_request.id) + '_invoice uploaded by_' + payment_request.requested_by.username + '_' + file_name_base  + file_name_ext
        file_path = 'uploads/payment_request/' + str(timezone.now().year)

    elif 'config' in instance.db_table_name:
        config = Config.objects.get(pk=instance.db_table_pk)
        asset_instance = Instance.objects.get(pk=config.db_table_pk)
        file_name = 'config_' + str(config.id) + '_' + config.configClass.name + '_' + config.order + '_uploaded by_' + config.by.username + '_' + file_name_base  + file_name_ext
        file_path = 'uploads/config/' + str(asset_instance.model_type.sub_category.name) + '/' + str(asset_instance.model_type.name) + '/' + str(config.db_table_pk)
        
    full_file_name = os.path.join(file_path, file_name)

    # return "contract_scanned_copy/user_{0}/{1}".format(instance.user.id, filename) # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return full_file_name


class UploadedFile(models.Model):
    on = models.DateTimeField((_("on")), null=True, blank=True)
    by = models.ForeignKey(User, verbose_name=(_("by")), on_delete=models.SET_NULL, null=True, blank=True)
    db_table_name = models.CharField((_("db_table_name")), max_length=32, null=True, blank=True)
    db_table_pk = models.CharField((_("db_table_pk")), max_length=32, null=True, blank=True)

    digital_copy = models.FileField(
        _("Digital Copy"),
        # upload_to='contract_scanned_copy/%Y/',
        upload_to=digital_copy_upload_to,
        max_length=256, null=True, blank=True,
        )

    def __str__(self):
        return self.db_table_name
    
    def get_digital_copy_base_file_name(self):
        return os.path.basename(self.digital_copy.name).split('/')[-1]