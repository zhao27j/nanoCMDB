from collections.abc import Sequence
from io import BytesIO
import datetime
from typing import Any
# import pathlib

# from typing import Any, Dict

# from django.core.files import File
from django.core.mail import EmailMessage
from django.utils import timezone

from django.http import HttpResponse, Http404, FileResponse
from django.template.loader import get_template, render_to_string
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse, reverse_lazy

from django.contrib import messages
from django.contrib.auth.models import User, Group
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required

from django.views import generic
from django.views.generic.edit import FormView, CreateView, UpdateView

from .models import Prjct, LegalEntity, Contract, PaymentTerm, PaymentRequest, NonPayrollExpense
from nanoassets.models import Config
from nanobase.models import ChangeHistory, UploadedFile

# from .forms import NewContractForm, NewLegalEntityForm, NewPaymentTermForm, NewPaymentRequestForm


# Create your views here.


"""
class NonPayrollExpenseListView(LoginRequiredMixin, generic.ListView):
    model = NonPayrollExpense
    # template_name = 'npe_lst_vw.html'
    # paginate_by = 10

    def get_queryset(self):
        nPE_reforecasting = get_reforecasting()
        return super().get_queryset().filter(non_payroll_expense_year=timezone.now().year, non_payroll_expense_reforecasting=get_reforecasting())

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # context["non_payroll_expense_year"] = digital_copies
        return context
"""


@login_required
def payment_request_paper_form(request, pk):
    payment_request = get_object_or_404(PaymentRequest, pk=pk)

    for legal_entity_b in payment_request.payment_term.contract.party_b_list.all():
        if legal_entity_b:
            vendor_address = legal_entity_b.reg_addr
            vendor_code = legal_entity_b.code
            vendor_telephone_number = legal_entity_b.reg_phone
            vendor_contact_person = ""
            for contact_profile in legal_entity_b.userprofile_set.all():
                vendor_contact_person = contact_profile.user.last_name + ', ' + contact_profile.user.first_name

    currency_type = payment_request.non_payroll_expense.get_currency_display()

    # if payment_request.payment_term.contract.get_total_amount():
    if payment_request.payment_term.contract.party_a_list.first().prjct.name == 'TSP':
        contract_amount = currency_type + "{:,.2f}".format(payment_request.amount)
    else:
        if payment_request.payment_term.contract.endup:
            contract_amount = currency_type + "{:,.2f}".format(payment_request.payment_term.contract.get_total_amount()['amount__sum'])
        else:
            contract_amount = currency_type + "{:,.2f}".format(payment_request.non_payroll_expense.get_nPE_subtotal())
    # else:
    #    contract_amount = '-'
    """
    payment_terms = PaymentTerm.objects.filter(contract=payment_request.payment_term.contract)
    
    contract_accumulated_payment_excluded_this_request = 0
    accumulated_payment_excluded_this_request = 0
    accumulated_payment_excluded_this_request_count = 0

    for paymentTerm in payment_terms:
        if paymentTerm.paymentrequest_set.all():
            for payment_req in paymentTerm.paymentrequest_set.all():
                if paymentTerm.pay_day < payment_request.payment_term.pay_day:
                    contract_accumulated_payment_excluded_this_request += payment_req.amount
                    if payment_request.requested_on.year == payment_req.non_payroll_expense.non_payroll_expense_year:
                        accumulated_payment_excluded_this_request += payment_req.amount
                        accumulated_payment_excluded_this_request_count += 1

    if contract_accumulated_payment_excluded_this_request == 0:
        contract_accumulated_payment_excluded_this_request = '-'
    else:
        contract_accumulated_payment_excluded_this_request = contract_accumulated_payment_excluded_this_request
    
    if accumulated_payment_excluded_this_request == 0:
        accumulated_payment_excluded_this_request = '-'
        remaining_budget_after_this_payment = payment_request.non_payroll_expense.get_nPE_subtotal() - payment_request.amount
    else:
        accumulated_payment_excluded_this_request = accumulated_payment_excluded_this_request
        remaining_budget_after_this_payment = payment_request.non_payroll_expense.get_nPE_subtotal() - payment_request.amount - accumulated_payment_excluded_this_request
    
    if accumulated_payment_excluded_this_request_count < payment_request.payment_term.pay_day.month:
        # accumulated_payment_excluded_this_request = payment_request.non_payroll_expense.get_nPE_subtotal_ytm(payment_request.payment_term.pay_day.month)
        remaining_budget_after_this_payment = payment_request.non_payroll_expense.get_nPE_subtotal() - payment_request.amount # - accumulated_payment_excluded_this_request
    
    if not payment_request.payment_term.contract.endup:
        contract_accumulated_payment_excluded_this_request = accumulated_payment_excluded_this_request
    """
    contract_accumulated_payment_excluded_this_request = payment_request.payment_term.contract.get_contract_accumulated_payment_excluded_this_request(payment_request)
    
    accumulated_payment_excluded_this_request = payment_request.non_payroll_expense.get_accumulated_payment_excluded_this_request(payment_request)
    remaining_budget_before_this_payment = payment_request.non_payroll_expense.get_nPE_subtotal() - accumulated_payment_excluded_this_request
    remaining_budget_after_this_payment = remaining_budget_before_this_payment - payment_request.amount # accumulated_payment_excluded_this_request

    context = {
        "payer": payment_request.payment_term.contract.get_party_a_display(), # Project name [项目公司名称]
        "date_of_request": payment_request.requested_on.date(), # Date of Request [申请日期]
        "payment_due_date": '',
        "contract_amount": contract_amount, # Total Contract Amount (including All approved ASA amount)) [合同总金额(包含所有已批准变更金额)]
        # "contract_amount": currency_type + "{:,.2f}".format(payment_request.amount), # Total Contract Amount (including All approved ASA amount)) [合同总金额(包含所有已批准变更金额)]
         # Prior Accu. Paid [前期累计付款]
        "contract_accumulated_payment_excluded_this_request": contract_accumulated_payment_excluded_this_request if type(contract_accumulated_payment_excluded_this_request) == str else currency_type + "{:,.2f}".format(contract_accumulated_payment_excluded_this_request),
        "included_in_the_budget_yes": '✔️',
        "included_in_the_budget_no": '☐',
        "budget_dept_code_budget_originator": payment_request.non_payroll_expense.functional_department, # Request Department [请款部门]
        "budget_expense_category_major_and_minor": payment_request.non_payroll_expense.global_gl_account,
        "total_budget_amount_in_gbs_minor_category": currency_type + "{:,.2f}".format(payment_request.non_payroll_expense.get_nPE_subtotal()), # Total Budget [预算]
        # Remaining Budget Before this payment [付款前可用预算]
        "remaining_budget_before_this_payment": currency_type + "{:,.2f}".format(remaining_budget_before_this_payment),
        "accumulated_payment_excluded_this_request": accumulated_payment_excluded_this_request if type(accumulated_payment_excluded_this_request) == str else currency_type + "{:,.2f}".format(accumulated_payment_excluded_this_request),
        "remaining_budget_after_this_payment": currency_type + "{:,.2f}".format(remaining_budget_after_this_payment), # Remaining Budget After this payment [付款后剩余可用预算]
        "job_code": payment_request.non_payroll_expense.global_expense_tracking_id,
        
        "item_1_description": payment_request.non_payroll_expense.description, # Description [描述]
        "item_1_amount": currency_type + "{:,.2f}".format(payment_request.amount), # Amount [金额]
        "item_1_allocation_code": payment_request.non_payroll_expense.allocation, # PMWeb Code/Budget Name/Budget Code [PMWeb code/预算科目预算编号]
        "item_1_allocation_percentage": '100%',
        "item_1_allocated_amount": currency_type + "{:,.2f}".format(payment_request.amount),
        
        "total_amount": currency_type + "{:,.2f}".format(payment_request.amount),
        "total_allocated_amount": currency_type + "{:,.2f}".format(payment_request.amount),
        "transfer_petty_cash": "✔️" if payment_request.method == 'CA' else "☐", # Cash [现金]
        "transfer_check": "✔️" if payment_request.method == 'CH' else "☐", # Cheque [支票]
        "transfer_wire": "✔️" if payment_request.method == 'WT' else "☐", # Wire Transfer [转账]
        "payee": payment_request.payment_term.contract.get_party_b_display(), # Vendor[供应商]
        "bank_information_deposit": payment_request.payment_term.contract.party_b_list.first().deposit_bank, # Bank Information [供应商银行信息]
        "bank_information_deposit_account": payment_request.payment_term.contract.party_b_list.first().deposit_bank_account, # Bank Information [供应商银行信息]
        
        # for Project Payment Request Form (Non-D&C)
        "contract_no": '',

        "vendor_address": vendor_address, # Address [地址]
        "vendor_code": vendor_code, # Vendor Code [供应商编码]
        "vendor_contact_person": vendor_contact_person, # Vendor contact person [供应商联络人]
        "vendor_telephone_number": vendor_telephone_number, # Telephone number [供应商联系电话]

        "budget_category_development_budget": "✔️" if payment_request.budget_category == 'D' else "☐", # Development budget [开发预算]
        "budget_category_operation_budget": "✔️" if payment_request.budget_category == 'O' else "☐", # Operation budget [运营预算]

        "budget_system_pmweb": "✔️" if payment_request.budget_system == 'P' else "☐", # PMWeb
        "budget_system_non_pmweb": "✔️" if payment_request.budget_system == 'N' else "☐", # Non-PMWeb
        
    }

    if payment_request.invoiceitem_set.all() and payment_request.invoiceitem_set.first():
        for index, invoice_item in enumerate(payment_request.invoiceitem_set.all()):
            i = str(index + 1)
            context['item_' + i + '_allocation_code'] = payment_request.non_payroll_expense.allocation # PMWeb Code/Budget Name/Budget Code [PMWeb code/预算科目预算编号]
            context['item_' + i + '_allocation_percentage'] = '100%'
            for field in invoice_item._meta.get_fields():
                if 'Decimal number' in field.description:
                    context['item_' + i + '_' + field.name] = currency_type + "{:,.2f}".format(getattr(invoice_item, field.name))
                    if context['item_' + i + '_allocation_percentage'] == '100%':
                        context['item_' + i + '_allocated_amount'] = currency_type + "{:,.2f}".format(getattr(invoice_item, field.name))
                elif field.name == 'description':
                    if invoice_item.description.strip() == '':
                        context['item_' + i + '_' + field.name] = payment_request.non_payroll_expense.description
                    else:
                        context['item_' + i + '_' + field.name] = getattr(invoice_item, field.name)
                elif field.is_relation:
                    pass
                else:
                    context['item_' + i + '_' + field.name] = getattr(invoice_item, field.name)

    if payment_request.payment_term.contract.party_a_list.first().prjct.name == 'TSP':
        path = "nanopay/payment_request_paper_form.html" # find the template and render it.
    else:
        path = "nanopay/payment_request_paper_form_project.html" # find the template and render it.
    template = get_template(path)
    html = template.render(context)
    return HttpResponse(html)


"""
@login_required
def payment_request_approve(request, pk):
    payment_request = get_object_or_404(PaymentRequest, pk=pk)
    payment_request.status = 'A'
    payment_request.IT_reviewed_by = request.user
    payment_request.IT_reviewed_on = datetime.date.today()

    payment_request.save()

    # payment_request.payment_term.contract.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Payment Request [ ' + str(payment_request.id) + ' ] was approved by ' + request.user.get_full_name())
    
    ChangeHistory.objects.create(
        on=timezone.now(),
        by=request.user,
        db_table_name=payment_request.payment_term.contract._meta.db_table,
        db_table_pk=payment_request.payment_term.contract.pk,
        detail='Payment Request [ ' + str(payment_request.id) + ' ] was approved'
        )
    
    messages.info(request, 'the Approval decision for Payment Request [ ' + str(payment_request.id) + ' ] was sent')

    message = get_template("nanopay/payment_request_email_approve.html").render({
        'protocol': 'http',
        # 'domain': '127.0.0.1:8000',
        'domain': request.META['HTTP_HOST'],
        'payment_request': payment_request,
    })
    mail = EmailMessage(
        subject='ITS expr - Pl noticed - Payment Request approved by ' + payment_request.requested_by.get_full_name(),
        body=message,
        from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
        to=[payment_request.requested_by.email],
        cc=[request.user.email],
        # reply_to=[EMAIL_ADMIN],
        # connection=
    )
    mail.content_subtype = "html"
    mail.send()

    # return redirect('nanopay:contract-detail', pk=payment_request.payment_term.contract.pk) # redirect to a new URL:
    return redirect('nanopay:payment-request-list')
"""

"""
class PaymentRequestDetailView(LoginRequiredMixin, generic.DetailView):
    model = PaymentRequest
"""

"""
@login_required
def payment_request_detail_invoice_scanned_copy(request, pk):
    payment_request = get_object_or_404(PaymentRequest, pk=pk)
    invoice_scanned_copy_path = payment_request.scanned_copy.name
    try:
        invoice_scanned_copy = open(invoice_scanned_copy_path, 'rb')
        return FileResponse(invoice_scanned_copy, content_type='application/pdf')
    except FileNotFoundError:
        # raise Http404
        messages.warning(request, 'the file [ ' + invoice_scanned_copy_path + ' ] does NOT exist')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
"""

class PaymentRequestListView(LoginRequiredMixin, generic.ListView):
    model = PaymentRequest
    template_name = 'nanopay/payment_request_list.html'
    paginate_by = 25

    def get_queryset(self):
        object_list = super().get_queryset()
        for obj in object_list: # add Data into querySet / 在 querySet 中 添加 数据
            obj.paymentTerm_all = obj.payment_term.contract.paymentterm_set.all().count()
            num_of_paymentTerm = 0
            for paymentTerm in obj.payment_term.contract.paymentterm_set.all().order_by('pay_day'):
                if paymentTerm.pay_day <= obj.payment_term.pay_day:
                    num_of_paymentTerm += 1
            if num_of_paymentTerm == 1:
                obj.num_of_paymentTerm = '1st'
            elif num_of_paymentTerm == 2:
                obj.num_of_paymentTerm = '2nd'
            elif num_of_paymentTerm == 3:
                obj.num_of_paymentTerm = '3rd'
            else:
                obj.num_of_paymentTerm = "%sth" % (num_of_paymentTerm)
            # obj.paymentTerm_applied = obj.payment_term.contract.paymentterm_set.filter(applied_on__isnull=False).count()

        return object_list

    def get_ordering(self) -> Sequence[str]:
        # return super().get_ordering()
        return ["-status", "-requested_on", ]

    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        digital_copies = UploadedFile.objects.filter(db_table_name=self.object_list.first()._meta.db_table).order_by("-on")
        context["digital_copies"] = digital_copies
        return context


"""
@login_required
def payment_request_new(request, pk):
    payment_term = get_object_or_404(PaymentTerm, pk=pk)
    if payment_term.contract.assets.first() == None:
        messages.info(request, 'please associated IT Assets with the Contract [ ' + payment_term.contract.briefing + ' ]')
        # return redirect(request.path) # 重定向 至 当前 页面 (不合适)
        return redirect('nanopay:contract-detail', pk=payment_term.contract.pk)
    # non_payroll_expenses = NonPayrollExpense.objects.all()
    non_payroll_expenses = NonPayrollExpense.objects.filter(non_payroll_expense_year=timezone.now().year, non_payroll_expense_reforecasting=get_reforecasting())
    if request.method == 'POST':
        form = NewPaymentRequestForm(request.POST, request.FILES)
        if form.is_valid():
            new_payment_request = PaymentRequest.objects.create(
                requested_by=request.user,
                payment_term=payment_term,
                # times=times,
                non_payroll_expense=get_object_or_404(NonPayrollExpense, description=form.cleaned_data['non_payroll_expense']),
                amount=form.cleaned_data.get('amount'),
                )
            # new_payment_request.scanned_copy = form.cleaned_data['scanned_copy']
            
            new_payment_request.save()

            payment_term.applied_on = new_payment_request.requested_on
            payment_term.save()

            digital_copies = request.FILES.getlist('digital_copies')
            for digital_copy in digital_copies:
                UploadedFile.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=new_payment_request._meta.db_table,
                    db_table_pk=new_payment_request.pk,
                    digital_copy=digital_copy,
                )

            # payment_term.contract.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Payment Request [ ' + str(new_payment_request.id) + ' ] was submitted by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=payment_term.contract._meta.db_table,
                db_table_pk=payment_term.contract.pk,
                detail='Payment Request [ ' + str(new_payment_request.id) + ' ] was submitted'
                )
            
            messages.info(request, 'the notification for Payment Request [ ' + str(new_payment_request.id) + ' ] was sent')

            IT_reviewer_emails = []
            for reviewer in User.objects.filter(groups__name='IT Reviewer'):
                IT_reviewer_emails.append(reviewer.email)

            message = get_template("nanopay/payment_request_new_email.html").render({
                'protocol': 'http',
                # 'domain': '127.0.0.1:8000',
                'domain': request.META['HTTP_HOST'],
                'new_payment_request': new_payment_request,
            })
            mail = EmailMessage(
                subject='ITS expr - Pl approve - Payment Request submitted by ' + new_payment_request.requested_by.get_full_name(),
                body=message,
                from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
                to=IT_reviewer_emails,
                cc=[request.user.email],
                # reply_to=[EMAIL_ADMIN],
                # connection=
            )
            mail.content_subtype = "html"
            mail.send()

            return redirect('nanopay:contract-detail', pk=payment_term.contract.pk) # redirect to a new URL:
            # return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面 (在此不适合)
    else:
        payment_term_last = PaymentTerm.objects.filter(contract=payment_term.contract).order_by("applied_on").last()
        
        # payment_request_last = PaymentRequest.objects.filter(payment_term__pk=payment_term.pk).order_by("requested_on").last()
        if payment_term_last.paymentrequest_set.first():
            non_payroll_expense_last = payment_term_last.paymentrequest_set.first().non_payroll_expense
        else:
            non_payroll_expense_last = ""
        form = NewPaymentRequestForm(
            initial={
                'amount': payment_term.amount,
                'non_payroll_expense': non_payroll_expense_last,
            })

    return render(request, 'nanopay/payment_request_new.html', {
        'form': form,
        'non_payroll_expenses': non_payroll_expenses,
        'payment_term': payment_term,
        })
"""


"""
@login_required
def payment_term_new(request, pk):
    contract = get_object_or_404(Contract, pk=pk)
    if request.method == 'POST': # if this is a POST request then process the Form data
        post = request.POST.copy()
        post['contract'] = contract
        form = NewPaymentTermForm(post) # create a form instance and populate it with data from the request (binding):
        # form.save(commit=False)
        if form.is_valid(): # check if the form is valid:
            # process the data in form.cleaned_data as required
            new_payment_term_plan = form.cleaned_data['plan']
            new_payment_term_recurring = form.cleaned_data['recurring']
            if new_payment_term_plan != 'C' and new_payment_term_recurring > 0:
                pay_day = form.cleaned_data['pay_day']
                recurring = 1
                recurring_added = recurring
                while recurring < new_payment_term_recurring:
                    if new_payment_term_plan == 'M':
                        if contract.endup or (pay_day + datetime.timedelta(weeks=(4.333333333333333333))).year < datetime.date.today().year + 1:
                            pay_day += datetime.timedelta(weeks=(4.333333333333333333))
                            PaymentTerm.objects.create(pay_day=pay_day, plan=new_payment_term_plan, recurring=1, amount=form.cleaned_data['amount'], contract=form.cleaned_data['contract'],)
                            recurring_added += 1
                    elif new_payment_term_plan == 'Q':
                        if contract.endup or (pay_day + datetime.timedelta(weeks=(13))).year < datetime.date.today().year + 1:
                            pay_day += datetime.timedelta(weeks=(13))
                            PaymentTerm.objects.create(pay_day=pay_day, plan=new_payment_term_plan, recurring=1, amount=form.cleaned_data['amount'], contract=form.cleaned_data['contract'],)
                            recurring_added += 1
                    elif new_payment_term_plan == 'S':
                        if contract.endup or (pay_day + datetime.timedelta(weeks=(26))).year < datetime.date.today().year + 1:
                            pay_day += datetime.timedelta(weeks=(26))
                            PaymentTerm.objects.create(pay_day=pay_day, plan=new_payment_term_plan, recurring=1, amount=form.cleaned_data['amount'], contract=form.cleaned_data['contract'],)
                            recurring_added += 1
                    elif new_payment_term_plan == 'A':
                        if contract.endup or (pay_day + datetime.timedelta(weeks=(52))).year < datetime.date.today().year + 1:
                            pay_day += datetime.timedelta(weeks=(52))
                            PaymentTerm.objects.create(pay_day=pay_day, plan=new_payment_term_plan, recurring=1, amount=form.cleaned_data['amount'], contract=form.cleaned_data['contract'],)
                            recurring_added += 1
                    
                    recurring += 1

            new_payment_term = form.save(commit=False)
            new_payment_term.recurring = 1
            # new_payment_term.contract = contract
            new_payment_term.save()

            # contract.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + str(new_payment_term_recurring) + ' x ' + new_payment_term.get_plan_display() + ' Payment Term scheduled since ' + str(new_payment_term.pay_day) + ' in amount ' + str(new_payment_term.amount) + ' were added by ' + request.user.get_full_name())

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=contract._meta.db_table,
                db_table_pk=contract.pk,
                detail=str(new_payment_term_recurring) + ' x ' + new_payment_term.get_plan_display()
                    + ' Payment Term scheduled since ' + str(new_payment_term.pay_day)
                      + ' in amount ' + str(new_payment_term.amount) + ' were added'
                )
            
            messages.info(
                request, 
                str(new_payment_term_recurring) + ' x ' + new_payment_term.get_plan_display()
                + ' Payment Terms for the Contract [ ' + contract.briefing + ' ] were added'
            )

            return redirect('nanopay:contract-detail', pk=pk) # redirect to a new URL:

    else: # if this is a GET (or any other method) create the default form.
        if PaymentTerm.objects.filter(contract=contract).order_by("pay_day").last():
            pay_day = PaymentTerm.objects.filter(contract=contract).order_by("pay_day").last().pay_day + datetime.timedelta(weeks=4.333333333333333333)
        else:
            pay_day = contract.startup + datetime.timedelta(weeks=4.333333333333333333)
        form = NewPaymentTermForm(initial={
            'pay_day': pay_day,
            'contract': contract,
            })

    return render(request, 'nanopay/payment_term_new.html', {'form': form,})
"""


"""
@login_required
def contract_new(request):
    if request.method == 'POST': # if this is a POST request then process the Form data
        form = NewContractForm(request.POST, request.FILES) # create a form instance and populate it with data from the request (binding):
        if form.is_valid(): # check if the form is valid:
            # process the data in form.cleaned_data as required
            new_contract = Contract()
            
            new_contract.briefing = form.cleaned_data['briefing']
            
            new_contract.type = form.cleaned_data['type']

            new_contract.startup = form.cleaned_data['startup']
            new_contract.endup = form.cleaned_data['endup']
            # new_contract.scanned_copy = form.cleaned_data['scanned_copy']
            new_contract.created_by = request.user
            new_contract.save()

            new_contract.party_a_list.set(form.cleaned_data['party_a_list'])
            new_contract.party_b_list.set(form.cleaned_data['party_b_list'])

            digital_copies = request.FILES.getlist('digital_copies')
            for digital_copy in digital_copies:
                UploadedFile.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=new_contract._meta.db_table,
                    db_table_pk=new_contract.pk,
                    digital_copy=digital_copy,
                )

            # new_contract.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'the base info was added by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=new_contract._meta.db_table,
                db_table_pk=new_contract.pk,
                detail='1 x new Contract [ ' + form.cleaned_data['briefing'] + ' ] was added'
                )
            
            messages.info(request, 'the base info of the new Contract [ ' + form.cleaned_data['briefing'] + ' ] was added')


            return redirect(new_contract.get_absolute_url()) # redirect to the new URL:
            # return redirect('nanopay:payment-term-new', pk=new_contract.pk)

    else: # if this is a GET (or any other method) create the default form.
        startup = datetime.date.today()
        endup = datetime.date.today() + datetime.timedelta(weeks=12)
        non_payroll_expenses = NonPayrollExpense.objects.filter(non_payroll_expense_year=datetime.date.today().year)
        
        form = NewContractForm(
            initial={
                'startup': startup,
                'endup': endup,
                })
        return render(request, 'nanopay/contract_new.html', {
            'form': form,
            'non_payroll_expenses': non_payroll_expenses,
            })

    return render(request, 'nanopay/contract_new.html', {'form': form,})
"""


class ContractListView(LoginRequiredMixin, generic.ListView):
    model = Contract
    # paginate_by = 25

    def get_queryset(self):
        contracts = super().get_queryset()
        for contract in contracts:
            if type != 'T' and contract.endup and contract.endup < datetime.date.today():
                contract.type = 'E'
                contract.save()

            
        """
                contract.paymentTerm_closest = 365
                for paymentTerm in contract.paymentterm_set.all():
                    how_soon = (paymentTerm.pay_day.date() - datetime.date.today()).days
                    contract.paymentTerm_closest = how_soon if how_soon > 0 and how_soon < contract.paymentTerm_closest else contract.paymentTerm_closest
                    
        contracts = contracts.order_by("paymentTerm_closest")
        """
        return contracts

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        prjct_lst = Prjct.objects.all()
        for prjct in prjct_lst:
            prjct.name_no_space = prjct.name.replace(' ', '')
            
        context["prjct_lst"] = prjct_lst

        return context


class portalVendor(LoginRequiredMixin, generic.ListView):
    model = Contract
    template_name = 'nanopay/portal_vendor.html'
    # paginate_by = 25

    def get_queryset(self):
        Legal_entity = self.request.user.userprofile.legal_entity.pk
        # contracts = super().get_queryset().filter(party_b_list=Legal_entity).order_by('-type')
        contracts = super().get_queryset().filter(party_b_list=Legal_entity).filter(type__in=['M', 'N', 'R'])
        
        for contract in contracts:

            if type != 'T' and contract.endup and contract.endup < datetime.date.today():
                contract.type = 'E'
                contract.save()

            if not contract.paymentterm_set.all().count():
                contracts = contracts.exclude(pk=contract.pk)

        return contracts
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context['invoice_scanned_copies'] = UploadedFile.objects.none()
        for obj in self.object_list:
            if obj.paymentterm_set.all():
                for payment_term in obj.paymentterm_set.all().order_by('-pay_day'):
                    if payment_term.paymentrequest_set.all():
                        payment_request = payment_term.paymentrequest_set.all().order_by('-requested_on').first()
                        context['invoice_scanned_copies'] |= UploadedFile.objects.filter(db_table_name=payment_request._meta.db_table, db_table_pk=payment_request.pk).order_by("-on")

            return context
        
    """
    def get_template_names(self) -> list[str]:
        template_name = super().get_template_names()
        return super().get_template_names()
    """


@login_required
def contract_detail_scanned_copy(request, pk):
    contract_instance = get_object_or_404(Contract, pk=pk)
    scanned_copy_path = contract_instance.scanned_copy.name
    try:
        scanned_copy = open(scanned_copy_path, 'rb')
        return FileResponse(scanned_copy, content_type='application/pdf')
    except FileNotFoundError:
        # raise Http404
        messages.warning(request, 'the file [ ' + scanned_copy_path + ' ] does NOT exist')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
        

class ContractDetailView(LoginRequiredMixin, generic.DetailView):
    model = Contract
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        if self.object.assets.all():
            instances = self.object.assets.all()
            for instnace in instances:
                instnace.configs = Config.objects.filter(db_table_name=instnace._meta.db_table, db_table_pk=instnace.pk).order_by("-on") # add Data into querySet / 在 querySet 中 添加 数据
            context["instances"] = instances
        else:
            context["instances"] = False

        if self.object.paymentterm_set.all():
            context["paymentTerm_all"] = self.object.paymentterm_set.all().count()
            context["paymentTerm_applied"] = self.object.paymentterm_set.filter(applied_on__isnull=False).count()
            context['invoice_scanned_copies'] = UploadedFile.objects.none()
            for payment_term in self.object.paymentterm_set.all().order_by('-pay_day'):
                # payment_term = self.object.paymentterm_set.all().first()
                if payment_term.paymentrequest_set.all():
                    payment_request = payment_term.paymentrequest_set.all().order_by('-requested_on').first()
                    non_payroll_expense = payment_request.non_payroll_expense
                    # context["non_payroll_expense"] = non_payroll_expense.description + ' [ ' + str(non_payroll_expense.non_payroll_expense_year) + non_payroll_expense.non_payroll_expense_reforecasting + ' ]'
                    context["non_payroll_expense"] = non_payroll_expense
                    context['invoice_scanned_copies'] |= UploadedFile.objects.filter(db_table_name=payment_request._meta.db_table, db_table_pk=payment_request.pk).order_by("-on")
                    # break
                else:
                    context["non_payroll_expense"] = False
        else:
            context["non_payroll_expense"] = False
        
        context["db_table_name"]=self.object._meta.db_table

        digital_copies = UploadedFile.objects.filter(db_table_name=self.object._meta.db_table, db_table_pk=self.object.pk).order_by("-on")
        context["digital_copies"] = digital_copies
        
        changes = ChangeHistory.objects.filter(db_table_name=self.object._meta.db_table, db_table_pk=self.object.pk).order_by("-on")
        context["changes"] = changes
        
        return context


"""
class LegalEntityUpdateView(LoginRequiredMixin, UpdateView):
    model = LegalEntity
    fields = '__all__'
    success_url = reverse_lazy('nanopay:legal-entity-list')
"""

"""
@login_required
def legal_entity_new(request):
    prjct_list = []
    for prjct in Prjct.objects.all():
        prjct_list.append(prjct.name)

    external_contact_list = []
    for external_contact in User.objects.exclude(email__icontains='org.com'):
        if  external_contact.username != 'admin' and not 'org.com' in external_contact.email.lower():
            if hasattr(external_contact, "userprofile"):
                if not external_contact.userprofile.legal_entity:
                    external_contact_list.append('%s - %s' % (external_contact.get_full_name(), external_contact.email))
            else:
                external_contact_list.append('%s - %s' % (external_contact.get_full_name(), external_contact.email))

    if request.method == 'POST':
        form = NewLegalEntityForm(request.POST)
        if form.is_valid():
            new_legal_entity = LegalEntity.objects.create(
                name=form.cleaned_data.get('name'),
                type=form.cleaned_data.get('type'),
                prjct=Prjct.objects.get(name=form.cleaned_data.get('prjct')) if form.cleaned_data.get('type') == 'I' else None,
                code = form.cleaned_data.get('code'),
                deposit_bank=form.cleaned_data.get('deposit_bank'),
                deposit_bank_account=form.cleaned_data.get('deposit_bank_account'),
                tax_number=form.cleaned_data.get('tax_number'),
                reg_addr=form.cleaned_data.get('reg_addr'),
                reg_phone=form.cleaned_data.get('reg_phone'),
                postal_addr=form.cleaned_data.get('postal_addr'),
            )

            if form.cleaned_data.get('contact') != '':
                contact = User.objects.get(username=form.cleaned_data.get('contact').split("-")[-1].split("@")[0].strip())
                contact.userprofile.legal_entity = new_legal_entity
                contact.userprofile.save()

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=new_legal_entity._meta.db_table,
                db_table_pk=new_legal_entity.pk,
                detail='1 x new Legal Entity [ ' + new_legal_entity.name + ' ] was added'
                )
            
            messages.info(request, '1 x new Legal Entity [ ' + form.cleaned_data['name'] + ' ] was added')

            return redirect(to='nanopay:legalentity-detail', pk=new_legal_entity.pk)
    else:
        form = NewLegalEntityForm(initial={})
    return render(request, 'nanopay/legalentity_new.html', {
        'form': form,
        'prjct_list': prjct_list,
        'external_contact_list': external_contact_list,
        })
"""


"""
class LegalEntityCreateView(LoginRequiredMixin, CreateView):
    model = LegalEntity
    fields = '__all__'
    # template_name = "TEMPLATE_NAME"
    success_url = reverse_lazy('nanopay:legal-entity-list')
"""


class LegalEntityDetailView(LoginRequiredMixin, generic.DetailView):
    model = LegalEntity
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        userprofiles = self.object.userprofile_set.all().filter(user__is_active=True)
        context["userprofiles"] = userprofiles if userprofiles.count() > 0 else False

        changes = ChangeHistory.objects.filter(db_table_name=self.object._meta.db_table, db_table_pk=self.object.pk).order_by("-on")
        context["changes"] = changes if changes.count() > 0 else False
        
        return context


def get_Contract_Qty_by_Legal_Entity(object_list):
    for obj in object_list:
        contract_qty = 0
        if Contract.objects.filter(party_a_list=obj.pk):
            contract_qty += Contract.objects.filter(party_a_list=obj.pk).count()
        elif Contract.objects.filter(party_b_list=obj.pk):
            contract_qty += Contract.objects.filter(party_b_list=obj.pk).count()

        obj.contract_qty = contract_qty
    
    return object_list


class LegalEntityListView(LoginRequiredMixin, generic.ListView):
    model = LegalEntity

    def get_queryset(self):
        object_list = super().get_queryset()

        return get_Contract_Qty_by_Legal_Entity(object_list)
        """
        for obj in object_list:
            contract_qty = 0
            if Contract.objects.filter(party_a_list=obj.pk):
                contract_qty += Contract.objects.filter(party_a_list=obj.pk).count()
            elif Contract.objects.filter(party_b_list=obj.pk):
                contract_qty += Contract.objects.filter(party_b_list=obj.pk).count()

            obj.contract_qty = contract_qty
 
        return object_list
        """

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        return context