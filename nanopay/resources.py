from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from django.contrib.auth.models import User

from .models import PaymentRequest, PaymentTerm, Contract, LegalEntity, Prjct, NonPayrollExpense
from nanoassets.models import Instance

class PaymentRequestResource(resources.ModelResource):
    
    class Meta:
        model = PaymentRequest


class PaymentTermResource(resources.ModelResource):
    
    class Meta:
        model = PaymentTerm


class ContractResource(resources.ModelResource):
    party_a_list = fields.Field(column_name='party_a_list',attribute='party_a_list',widget=ManyToManyWidget(LegalEntity, field='pk', separator=','))
    party_b_list = fields.Field(column_name='party_b_list',attribute='party_b_list',widget=ManyToManyWidget(LegalEntity, field='pk', separator=','))
    assets = fields.Field(column_name='assets',attribute='assets',widget=ManyToManyWidget(Instance, field='serial_number', separator=','))

    
    class Meta:
        model = Contract
        # exclude = ('party_a_list', 'party_b_list', 'assets', )


class LegalEntityResource(resources.ModelResource):
    
    class Meta:
        model = LegalEntity


class PrjctResource(resources.ModelResource):
    
    class Meta:
        model = Prjct


class NonPayrollExpenseResource(resources.ModelResource):
    
    class Meta:
        model = NonPayrollExpense


"""
class NonPayrollExpenseResource(resources.ModelResource):

    created_by = fields.Field(
        attribute='created_by', 
        column_name='created_by', 
        widget=ForeignKeyWidget(User, field='username'),
    )
    
    def before_import_row(self, row, row_number=None, **kwargs):
        
        if str(row["description"]).strip():
            row["description"] = str(row["description"]).strip()
            # description = str(row["description"]).strip()
            # Configuragion.objects.get_or_create(hostname=configuragion_hostname, defaults={"hostname": configuragion_hostname})

        # return super().before_import_row(row, row_number, **kwargs)

    class Meta:
        model = NonPayrollExpense

        import_id_fields = ('non_payroll_expense_year', 'non_payroll_expense_reforecasting', 'originating_sub_region', 'functional_department', 'global_gl_account', 'vendor', 'global_expense_tracking_id', 'currency', 'allocation', 'description', )   # 指定 primary key field
        skip_unchanged = True
        report_skipped = False
        # exclude = ('vendor', )
        # fields = ('non_payroll_expense_year', 'non_payroll_expense_reforecasting', 'originating_sub_region', 'functional_department', 'global_gl_account', 'vendor', 'global_expense_tracking_id', 'currency', 'allocation', 'description','jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'is_direct_cost', 'created_by', )
"""
