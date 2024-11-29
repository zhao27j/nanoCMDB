from django.contrib import admin
from import_export.admin import ImportExportModelAdmin, ImportExportMixin
# from .resources import SubCategoryResource, UserDeptResource,  UserProfileResource, ChangeHistoryResource, UploadedFileResource
from .models import SubCategory, UserDept, UserProfile, ChangeHistory, UploadedFile

# Register your models here.

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
# class SubCategoryAdmin(ImportExportModelAdmin):
    # resource_classes = [SubCategoryResource]

    list_display = ['name',]


@admin.register(UserDept)
class UserDeptAdmin(admin.ModelAdmin):
# class UserDeptAdmin(ImportExportModelAdmin):
    # resource_classes = [UserDeptResource]

    list_display = ['name',]


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
# class UploadedFileAdmin(ImportExportModelAdmin):
    # resource_classes = [UploadedFileResource]

    list_display = ['id', 'on', 'by', 'db_table_name', 'db_table_pk', 'digital_copy',]


@admin.register(ChangeHistory)
class ChangeHistoryAdmin(admin.ModelAdmin):
# class ChangeHistoryAdmin(ImportExportModelAdmin):
    # resource_classes = [ChangeHistoryResource]

    list_display = ['id', 'on', 'by', 'db_table_name', 'db_table_pk', 'detail',]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
# class UserProfileAdmin(ImportExportModelAdmin):
    # resource_classes = [UserProfileResource]

    list_display = ['user', 'title', 'dept', 'work_phone', 'postal_addr', 'cellphone', 'legal_entity']

    search_fields = ['user__username']
    

# admin.site.register(UserProfile)
# admin.site.register(SubCategory)
# admin.site.register(UserDept)
# admin.site.register(UploadedFile)