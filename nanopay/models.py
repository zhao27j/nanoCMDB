import os
import datetime
import uuid

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from django.db import models
from django.db.models import Sum

# Create your models here.

def invoice_scanned_copy_path(instance, filename):
    file_name_base, file_name_ext = os.path.splitext(filename)
    file_name = str(instance.id) + '_invoice uploaded by_' + instance.requested_by.username + '_' + file_name_base  + file_name_ext
    file_path = 'uploads/payment_request/' + str(datetime.date.today().year)
    full_file_name = os.path.join(file_path, file_name)

    return full_file_name


class PaymentRequest(models.Model):
    id = models.UUIDField(_("Request ID"), primary_key=True, default=uuid.uuid4, help_text='Unique ID for the particular request')
    REQUEST_STATUS = (
        ('I', 'Initialized'),
        ('A', 'Approved'),
    )
    status = models.CharField(_("Request status"), choices=REQUEST_STATUS, default='I', max_length=1)
    payment_term = models.ForeignKey("nanopay.PaymentTerm", verbose_name=(_("Payment Term")), on_delete=models.SET_NULL, null=True, blank=True)
    non_payroll_expense = models.ForeignKey("nanopay.NonPayrollExpense", verbose_name=(_("Non Payroll Expense")), on_delete=models.SET_NULL, null=True, blank=True)
    BUDGET_CATEGORY = (
        ('D', 'Development Budget'),
        ('O', 'Operation Budget'),
    )
    budget_category = models.CharField(_("Budget category"), choices=BUDGET_CATEGORY, default='O', max_length=1)
    amount = models.DecimalField(_("Invoice Amount"), max_digits=8, decimal_places=2, null=True)
    scanned_copy = models.FileField(_("Scanned Copy of Invoice"), upload_to=invoice_scanned_copy_path, max_length=256, null=True, blank=True)
    # paper_form = models.FileField(_("Paper Form"), upload_to=paper_form_path, max_length=256, null=True, blank=True)

    requested_by = models.ForeignKey(User, verbose_name=(_("Requested by")), related_name='+', on_delete=models.SET_NULL, null=True)
    requested_on = models.DateTimeField(_("Requested on"), null=True)
    
    IT_reviewed_by = models.ForeignKey(User, verbose_name=(_("IT reviewed by")), related_name='+', on_delete=models.SET_NULL, null=True, blank=True)
    IT_reviewed_on = models.DateTimeField(_("IT reviewed on"), blank=True, null=True)
    
    def __str__(self):
        # return '%s Scrapping Request %s by %s on %s, Approved by %s on %s' % (self.case_id, self.status, self.requested_by, str(self.requested_on), self.approved_by, str(self.approved_on))
        return str(self.id)

    def get_absolute_url(self):
        return reverse("nanopay:payment-request-detail", kwargs={"pk": self.pk})

    class Meta:
        ordering = ['-status', 'requested_on', ]


class PaymentTerm(models.Model):
    pay_day = models.DateTimeField(_("Scheduled Pay day"))
    
    PAYMENT_PLAN = (
        ('M', 'Monthly'),
        ('Q', 'Quarterly'),
        ('S', 'Semi-anually'),
        ('A', 'Anually'),
        ('C', 'Custom'),
    )
    plan = models.CharField(_("Plan"), choices=PAYMENT_PLAN, default='M', max_length=1)
    recurring = models.DecimalField(_("Recurring"), max_digits=2, decimal_places=0, default=1)
    amount = models.FloatField(_("Amount"))
    applied_on = models.DateTimeField(_("Applied on"), null=True, blank=True)
    
    contract = models.ForeignKey("nanopay.Contract", verbose_name=(_("Contract")), on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return "%s, %s" % (self.pay_day, self.amount)
    
    def get_absolute_url(self):
        return reverse('nanopay:payment-term-detail', kwargs={'pk': self.pk})
    
    class Meta:
        ordering = ['contract', 'pay_day']


def timedelta_to_months(delta: datetime.timedelta) -> float:
    seconds_in_year = 365.25*24*60*60
    timedelta_to_years = delta.total_seconds() / seconds_in_year
    timedelta_to_months = timedelta_to_years * 12
    return timedelta_to_months


def contract_scanned_copy_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    file_name_base, file_name_ext = os.path.splitext(filename)
    file_name = str(instance.startup.year) + '_' + instance.get_type_display()+ '_uploaded by_' + instance.created_by.username + '_' + file_name_base  + file_name_ext
    file_path = 'uploads/contract_scanned_copy/' + str(instance.startup.year)
    full_file_name = os.path.join(file_path, file_name)
    # return "contract_scanned_copy/user_{0}/{1}".format(instance.user.id, filename)
    return full_file_name


class Contract(models.Model):
    briefing = models.CharField(_("Briefing"), unique=True, max_length=64, null=True)
    party_a_list = models.ManyToManyField("nanopay.LegalEntity", verbose_name=(_("Party A")), related_name='partyas')
    party_b_list = models.ManyToManyField("nanopay.LegalEntity", verbose_name=(_("Party B")), related_name='partybs')
    CONTRACT_TYPE = (
        ('M', 'Maintenance'),
        ('N', 'New'),
        ('R', 'Rental'),
        ('E', 'Expired'),
        ('T', 'Terminated'),
    )
    type = models.CharField(_("Contract Type"), choices=CONTRACT_TYPE, default='M', max_length=1)
    startup = models.DateField(_("From"), null=True)
    endup = models.DateField(_("To"), null=True, blank=True)
    scanned_copy = models.FileField(_("Scanned Copy"),
                                    # upload_to='contract_scanned_copy/%Y/',
                                    upload_to=contract_scanned_copy_path,
                                    max_length=256, null=True, blank=True)
    
    assets = models.ManyToManyField("nanoassets.Instance", verbose_name=(_("Assets associated with")), blank=True)
    
    created_by = models.ForeignKey(User, verbose_name=(_("Created by")), on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.briefing
    
    def get_absolute_url(self):
        return reverse('nanopay:contract-detail', kwargs={'pk': self.pk})
    
    def get_duration_in_month(self):
         if self.endup:
            return round(timedelta_to_months(self.endup - self.startup))
            # duration_in_month = duration_in_month * 12
            # return round((self.endup - self.startup).days / 30)
            # return (self.endup.year - self.startup.year) * 12 + (self.endup.month - self.startup.month)
         else:
             return 'NA'
    
    def get_time_passed_in_month(self):
            return round((datetime.date.today() - self.startup).days / 30)

    def get_time_remaining_in_percent(self):
        if self.endup:
            total_days = (self.endup - self.startup).days
            if total_days != 0:
                total_days_passed = (datetime.date.today() - self.startup).days
                if self.endup >= datetime.date.today():
                    return round((total_days_passed / total_days) * 100, 2)
                else:
                    return -round((total_days_passed / total_days) * 100, 2)
        else:
            return 'pay-as-you-go'

    def get_total_amount(self):
        if self.endup:
            return self.paymentterm_set.aggregate(Sum('amount'))
    
    def get_total_amount_applied(self):
        return self.paymentterm_set.filter(applied_on__isnull=False).aggregate(Sum('amount'))

    def get_contract_accumulated_payment_excluded_this_request(self, this_payment_request):
        contract_accumulated_payment_excluded_this_request = 0
        for payment_term in self.paymentterm_set.all().order_by('pay_day'):
            if payment_term.paymentrequest_set.first() and (payment_term.pay_day.year < this_payment_request.payment_term.pay_day.year or 
                (payment_term.pay_day.year == this_payment_request.payment_term.pay_day.year and 
                 payment_term.pay_day.month < this_payment_request.payment_term.pay_day.month)):
                contract_accumulated_payment_excluded_this_request += payment_term.paymentrequest_set.first().amount

        return contract_accumulated_payment_excluded_this_request

    def get_prjct(self):
        for party in self.party_a_list.all():
            if  party.type == 'I':
                return party.prjct
        for party in self.party_b_list.all():
            if  party.type == 'I':
                return party.prjct

    def get_parties_display(self):
        return ", ".join([party_a.name for party_a in self.party_a_list.all()]) + ", " + ", ".join([party_b.name for party_b in self.party_b_list.all()])
    
    def get_party_a_display(self):
        return ", ".join([party_a.name for party_a in self.party_a_list.all()])
    
    def get_party_b_display(self):
        return ", ".join([party_b.name for party_b in self.party_b_list.all()])
    
    def get_scanned_copy_base_file_name(self):
        return os.path.basename(self.scanned_copy.name).split('/')[-1]

    class Meta:
        ordering = ["-startup", ]


class LegalEntity(models.Model):
    name = models.CharField(_("主体名称"), max_length=128, unique=True)
    ENTITY_TYPE = (
        ('I', 'Internal'),
        ('E', 'External'),
    )
    type = models.CharField(_("主体类型"), choices=ENTITY_TYPE, default='E', max_length=1)
    code = models.CharField(_("编码"), max_length=8, null=True, blank=True)
    prjct = models.ForeignKey("nanopay.Prjct", verbose_name=(_("Project Name")), on_delete=models.SET_NULL, null=True, blank=True)
    deposit_bank = models.CharField(_("开户行"), max_length=64, null=True, blank=True)
    deposit_bank_account = models.CharField(_("开户行账号"), max_length=32, null=True, blank=True)
    tax_number = models.CharField(_("纳税人识别号"), max_length=32, null=True, blank=True)
    reg_addr = models.CharField(_("注册地址"), max_length=64, null=True, blank=True)
    reg_phone = models.CharField(_("注册电话"), max_length=16, null=True, blank=True)
    
    postal_addr = models.CharField(_("Postal Address"), max_length=256, null=True, blank=True)

    # external_contacts = models.ManyToManyField(User, verbose_name=(_("Contacts")), limit_choices_to={"is_staff": True' groups__name': 'External Contacts'}),)

    def __str__(self):
        # return "%s, %s (%s)" % (self.type, self.name, self.prjct)
        return self.name
    
    def get_absolute_url(self):
        return reverse('nanopay:legalentity-detail', kwargs={'pk': self.pk})
    
    class Meta:
        ordering = ['type', 'name', ]


class Prjct(models.Model):
    name = models.CharField(_("Project Name"), max_length=16, unique=True)
    allocations = models.CharField(_("allocation list"), max_length=256, blank=True, null=True)

    def __str__(self):
        return self.name


class NonPayrollExpense(models.Model):
    non_payroll_expense_year = models.DecimalField(_("Budget Year"), max_digits=4, decimal_places=0, default=datetime.datetime.now().year)
    QUARTERLY_REFORECASTING = (
        ('Q0', 'Q0'),
        ('Q1', 'Q1'),
        ('Q2', 'Q2'),
        ('Q3', 'Q3'),
    )
    non_payroll_expense_reforecasting = models.CharField(_("Quarterly Reforecasting"), choices=QUARTERLY_REFORECASTING, default='Q0', max_length=2)
    
    originating_sub_region = models.CharField(_("Originating Sub Region"), max_length=32)
    functional_department = models.CharField(_("Functional Department"), max_length=32)
    global_gl_account = models.DecimalField(_("Global GL Account"), max_digits=6, decimal_places=0)
    vendor = models.CharField(_("Vendor"), max_length=64, null=True, blank=True)
    global_expense_tracking_id = models.CharField(_("Global Expense Tracking ID"), max_length=16)
    CURRENCY_TYPE = (
        ('CNY', '￥'),
        ('USD', '$'),
    )
    currency = models.CharField(_("Currency"), choices=CURRENCY_TYPE, max_length=3, default='CNY')
    allocation = models.CharField(_("Allocation"), max_length=128)
    description = models.TextField(_("Description"))
    # description = models.TextField(_("Description"), unique=True)

    jan = models.DecimalField(_("Jan"), max_digits=8, decimal_places=2, default=0)
    feb = models.DecimalField(_("Feb"), max_digits=8, decimal_places=2, default=0)
    mar = models.DecimalField(_("Mar"), max_digits=8, decimal_places=2, default=0)
    apr = models.DecimalField(_("Apr"), max_digits=8, decimal_places=2, default=0)
    may = models.DecimalField(_("May"), max_digits=8, decimal_places=2, default=0)
    jun = models.DecimalField(_("Jun"), max_digits=8, decimal_places=2, default=0)
    jul = models.DecimalField(_("Jul"), max_digits=8, decimal_places=2, default=0)
    aug = models.DecimalField(_("Aug"), max_digits=8, decimal_places=2, default=0)
    sep = models.DecimalField(_("Sep"), max_digits=8, decimal_places=2, default=0)
    oct = models.DecimalField(_("Oct"), max_digits=8, decimal_places=2, default=0)
    nov = models.DecimalField(_("Nov"), max_digits=8, decimal_places=2, default=0)
    dec = models.DecimalField(_("Dec"), max_digits=8, decimal_places=2, default=0)
    ID_DIRECT_COST = (
        ('Y', 'Yes'),
        ('N', 'NO'),
    )
    is_direct_cost = models.CharField(_("Is Direct Cost"), choices=ID_DIRECT_COST, max_length=1, default='N')

    created_by = models.ForeignKey(User, verbose_name=(_("Created by")), on_delete=models.SET_NULL, null=True)
    created_on = models.DateField(_("Created on"), null=True)

    def __str__(self):
        return self.description
    
    def get_absolute_url(self):
        return reverse("nanopay:non-payroll-expense-detail", kwargs={"pk": self.pk})
    
    def get_nPE_subtotal(self):
        return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul + self.aug + self.sep + self.oct + self.nov + self.dec
    
    def get_accumulated_payment_excluded_this_request(self, this_payment_request):
        accumulated_payment_excluded_this_request= 0
        nPEs4theYear = NonPayrollExpense.objects.filter(description=self.description, non_payroll_expense_year=self.non_payroll_expense_year)
        for nPE in nPEs4theYear:
            for paymentReq in nPE.paymentrequest_set.all().order_by('requested_on'):
                # if paymentReq.payment_term.pay_day.month < this_payment_request.payment_term.pay_day.month:
                if (paymentReq.payment_term.pay_day.year == self.non_payroll_expense_year and 
                    paymentReq.payment_term.applied_on < this_payment_request.payment_term.applied_on):
                    accumulated_payment_excluded_this_request += paymentReq.amount

        # return self.get_nPE_subtotal() - accumulated_payment_excluded_this_request
        return accumulated_payment_excluded_this_request

    def get_nPE_subtotal_ytm(self, currentMonth):
        # currentMonth = datetime.date.today().month
        if currentMonth == 1:
            return 0
        elif currentMonth == 2:
            return self.jan
        elif currentMonth == 3:
            return self.jan + self.feb
        elif currentMonth == 4:
            return self.jan + self.feb + self.mar
        elif currentMonth == 5:
            return self.jan + self.feb + self.mar + self.apr
        elif currentMonth == 6:
            return self.jan + self.feb + self.mar + self.apr + self.may
        elif currentMonth == 7:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun
        elif currentMonth == 8:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul
        elif currentMonth == 9:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul + self.aug
        elif currentMonth == 10:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul + self.aug + self.sep
        elif currentMonth == 11:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul + self.aug + self.sep + self.oct
        elif currentMonth == 12:
            return self.jan + self.feb + self.mar + self.apr + self.may + self.jun + self.jul + self.aug + self.sep + self.oct + self.nov

    class Meta:
        ordering = ['non_payroll_expense_year', 'non_payroll_expense_reforecasting', 'allocation']