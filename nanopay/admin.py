from django.contrib import admin

from import_export.admin import ImportExportModelAdmin, ImportMixin

# from .resources import PaymentRequestResource, PaymentTermResource, ContractResource, LegalEntityResource, PrjctResource
from .resources import NonPayrollExpenseResource
from .models import InvoiceItem, PaymentRequest, PaymentTerm, Contract, LegalEntity, NonPayrollExpense, Prjct

# Register your models here.


@admin.register(NonPayrollExpense)
class NonPayrollExpenseAdmin(ImportMixin, admin.ModelAdmin):
# class NonPayrollExpenseAdmin(ImportExportModelAdmin):
    resource_classes = [NonPayrollExpenseResource]
    
    list_display = ['non_payroll_expense_year', 'non_payroll_expense_reforecasting', 
                    'originating_sub_region', 'functional_department', 'global_gl_account', 
                    'vendor', 'global_expense_tracking_id', 'currency', 'allocation', 'description', 
                    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    list_filter = ['non_payroll_expense_year', 'non_payroll_expense_reforecasting', 'allocation',]
    search_fields = ['non_payroll_expense_year', 'non_payroll_expense_reforecasting', 'allocation', 'description', ]


@admin.register(InvoiceItem)
class PaymentRequestAdmin(admin.ModelAdmin):

    list_display = ['amount', 'vat', 'payment_request']


@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
# class PaymentRequestAdmin(ImportExportModelAdmin):
    # resource_classes = [PaymentRequestResource]

    list_display = ['id', 'status', 'amount', 'requested_on', 'requested_by', 'get_invoice_amount_excl_vat', 'non_payroll_expense', 'IT_reviewed_on', 'IT_reviewed_by']


class PaymentTermInline(admin.TabularInline):
    # Tabular Inline View for
    model = PaymentTerm
    # min_num = 3
    # max_num = 20
    extra = 1
    # raw_id_fields = (,)


@admin.register(PaymentTerm)
class PaymentTermAdmin(admin.ModelAdmin):
# class PaymentTermAdmin(ImportExportModelAdmin):
    # resource_classes = [PaymentTermResource]

    list_display = ['contract', 'pay_day', 'plan', 'recurring', 'amount', 'applied_on']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
# class ContractAdmin(ImportExportModelAdmin):
    # resource_classes = [ContractResource]

    search_fields = ['briefing', ]

    list_display = ['briefing', 'get_parties_display', 'get_prjct', 'type', 'get_total_amount', 'get_duration_in_month', 'get_time_remaining_in_percent']
    autocomplete_fields = ['party_a_list', 'party_b_list', 'assets', ]
    inlines = [PaymentTermInline, ]


@admin.register(LegalEntity)
class LegalEntityAdmin(admin.ModelAdmin):
# class LegalEntityAdmin(ImportExportModelAdmin):
    # resource_classes = [LegalEntityResource]

    search_fields = ['name', ]


@admin.register(Prjct)
class PrjctAdmin(admin.ModelAdmin):
# class PrjctAdmin(ImportExportModelAdmin):
    # resource_classes = [PrjctResource]

    search_fields = ['name', ]
    
    list_display = ['name', 'allocations', ]

# admin.site.register(InvoiceItem)
# admin.site.register(PaymentRequest)
# admin.site.register(PaymentTerm)
# admin.site.register(Contract)
# admin.site.register(LegalEntity)
# admin.site.register(Prjct)