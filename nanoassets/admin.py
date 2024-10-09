from django.contrib import admin

from import_export.admin import ImportMixin, ImportExportModelAdmin, ImportExportMixin

# from .resources import ManufacturerResource, ModelTypeResource, disposalRequestResource, branchSiteResource, configClassResource, ConfigResource
from .resources import InstanceResource
from .models import Instance, ModelType, Manufacturer, branchSite, disposalRequest, Config, configClass

# Register your models here.

@admin.register(Config)
class ConfigAdmin(admin.ModelAdmin):
# class ConfigAdmin(ImportExportModelAdmin):
    # resource_classes = [ConfigResource]

    list_display = ['pk', 'on', 'by', 'db_table_name', 'db_table_pk', 'configClass', 'order', 'configPara', 'expire', 'is_secret', 'is_active', ]


@admin.register(configClass)
class configClassAdmin(admin.ModelAdmin):
# class configClassAdmin(ImportExportModelAdmin):
    # resource_classes = [configClassResource]

    list_display = ['name', 'desc', ]


@admin.register(branchSite)
class branchSiteAdmin(admin.ModelAdmin):
# class branchSiteAdmin(ImportExportModelAdmin):
    # resource_classes = [branchSiteResource]

    list_display = ['name', 'display_onSiteTech', 'city', 'addr',]
    # autocomplete_fields = ['country',]


"""
@admin.register(ScrapRequest)
class ScrapRequestAdmin(admin.ModelAdmin):
    list_display = ['case_id', 'status', 'requested_by', 'requested_on', 'approved_by', 'approved_on',]
"""


@admin.register(disposalRequest)
class disposalRequestAdmin(admin.ModelAdmin):
# class disposalRequestAdmin(ImportExportModelAdmin):
    # resource_classes = [disposalRequestResource]

    list_display = ['case_id', 'type', 'status', 'requested_by', 'requested_on', 'approved_by', 'approved_on',]


@admin.register(Instance)
# class InstanceAdmin(ImportExportModelAdmin):
class InstanceAdmin(ImportMixin, admin.ModelAdmin):
    resource_classes = [InstanceResource]

    list_display = ['serial_number', 'model_type', 'hostname', 'status', 'eol_date', 'owner', 'branchSite']
    list_filter = ['model_type', 'status', 'branchSite']
    search_fields = ['serial_number', 'model_type__name','status', 'owner__username', 'eol_date']


@admin.register(ModelType)
class ModelTypeAdmin(admin.ModelAdmin):
# class ModelTypeAdmin(ImportExportModelAdmin):
    # resource_classes = [ModelTypeResource]

    list_display = ['sub_category', 'manufacturer', 'name', ]


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
# class ManufacturerAdmin(ImportExportModelAdmin):
    # resource_classes = [ManufacturerResource]

    list_display = ['name', ]


"""
@admin.register(ActivityHistory)
class ActivityHistoryAdmin(admin.ModelAdmin):
    list_display = ['Instance', 'Contract', 'description',]
"""


# admin.site.register(Instance, InstanceAdmin)
# admin.site.register(ModelType)
# admin.site.register(Manufacturer)
# admin.site.register(ScrapRequest)
# admin.site.register(branchSite)
# admin.site.register(ActivityHistory)
