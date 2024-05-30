from import_export import resources, fields
from import_export.widgets import ManyToManyWidget, ForeignKeyWidget

from django.contrib.auth.models import User

from .models import Instance, ModelType, Manufacturer, branchSite, disposalRequest, Config, configClass
from nanobase.models import SubCategory


class ConfigResource(resources.ModelResource):
    
    class Meta:
        model = Config


class configClassResource(resources.ModelResource):
    
    class Meta:
        model = configClass


class branchSiteResource(resources.ModelResource):
    onSiteTech = fields.Field(column_name='onSiteTech',attribute='onSiteTech',widget=ManyToManyWidget(Instance, field='pk', separator=','))
    
    class Meta:
        model = branchSite
        # exclude = ('onSiteTech', )


class disposalRequestResource(resources.ModelResource):
    
    class Meta:
        model = disposalRequest
        import_id_fields = ('case_id',)


class InstanceResource(resources.ModelResource):
    disposal_request = fields.Field(attribute='disposal_request', column_name='disposal_request', widget=ForeignKeyWidget(disposalRequest, field='case_id'),)

    class Meta:
        model = Instance
        import_id_fields = ('serial_number',)


class ModelTypeResource(resources.ModelResource):
    
    class Meta:
        model = ModelType


class ManufacturerResource(resources.ModelResource):
    
    class Meta:
        model = Manufacturer


"""
class InstanceResource(resources.ModelResource):
    sub_category = fields.Field(attribute='sub_category', column_name='Sub Category', widget=ForeignKeyWidget(SubCategory, field='name'),)
    manufacturer = fields.Field(attribute='manufacturer', column_name='Manufacturer', widget=ForeignKeyWidget(Manufacturer, field='name'),)
    model_type = fields.Field(attribute='model_type', column_name='Model / Type', widget=ForeignKeyWidget(ModelType, field='name'),)
    # hostname = fields.Field(attribute='configuragion', column_name='Hostname', widget=ForeignKeyWidget(Configuragion, field='hostname'),)
    owner = fields.Field(attribute='owner', column_name='Owner', widget=ForeignKeyWidget(User, field='username'),)
    site = fields.Field(attribute='branchSite', column_name='Site', widget=ForeignKeyWidget(branchSite, field='name'),)

    def before_import_row(self, row, row_number=None, **kwargs):
        if str(row["Sub Category"]).strip() != '':
            sub_category_name = str(row["Sub Category"]).strip()
            sub_category_obj = SubCategory.objects.get_or_create(name=sub_category_name, defaults={"name": sub_category_name, })

        if str(row["Manufacturer"]).strip() != '':
            manufacturer_name = str(row["Manufacturer"]).strip()
            manufacturer_obj = Manufacturer.objects.get_or_create(name=manufacturer_name, defaults={"name": manufacturer_name, })

        if str(row["Model / Type"]).strip() != '':
            model_type_name = str(row["Model / Type"]).strip()
            model_type = ModelType.objects.get_or_create(name=model_type_name, defaults={"name": model_type_name,})

            model_type[0].manufacturer = manufacturer_obj[0]
            model_type[0].sub_category = sub_category_obj[0]
            model_type[0].save()

        # if str(row["Hostname"]).strip():
        #     configuragion_hostname = str(row["Hostname"]).strip()
        #     Configuragion.objects.get_or_create(hostname=configuragion_hostname, defaults={"hostname": configuragion_hostname})

        if str(row["Owner"]).strip() != '':
            owner_username = str(row["Owner"]).strip().lower()
            owner_first_name = str(row["First Name"]).strip().capitalize()
            owner_last_name = str(row["Last Name"]).strip().capitalize()
            owner_email = str(row["Email"]).strip()
            User.objects.get_or_create(username=owner_username, defaults={
                "username": owner_username,
                "first_name": owner_first_name,
                "last_name": owner_last_name,
                "email": owner_email,
                })

        if str(row["Site"]).strip():
            site_name = str(row["Site"]).strip()
            branchSite.objects.get_or_create(name=site_name, defaults={"name": site_name})

        return super().before_import_row(row, row_number, **kwargs)

    class Meta:
        model = Instance
        import_id_fields = ('serial_number',)
        skip_unchanged = True
        report_skipped = False
        # exclude = ('eol_date')
        fields = ('site', 'sub_category', 'manufacturer', 'model_type', 'serial_number', 'status', 'hostname', 'owner', 'user_first_name', 'user_last_name', 'user_email',
                  # 'eol_date'
                  )
"""
