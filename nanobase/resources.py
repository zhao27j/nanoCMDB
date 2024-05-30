from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget

from django.contrib.auth.models import User

from nanobase.models import SubCategory, UserDept, UserProfile, ChangeHistory, UploadedFile

class SubCategoryResource(resources.ModelResource):
    
    class Meta:
        model = SubCategory


class UserDeptResource(resources.ModelResource):
    
    class Meta:
        model = UserDept


class UserProfileResource(resources.ModelResource):
    
    class Meta:
        model = UserProfile


class ChangeHistoryResource(resources.ModelResource):
    
    class Meta:
        model = ChangeHistory


class UploadedFileResource(resources.ModelResource):
    
    class Meta:
        model = UploadedFile