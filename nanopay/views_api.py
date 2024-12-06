
import json
import calendar
import operator
from functools import reduce
# import uuid
from decimal import Decimal

from django.utils import timezone

from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.core.serializers import serialize
from django.core.mail import EmailMessage

from django.http import JsonResponse
from django.template.loader import get_template

from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from django.shortcuts import get_object_or_404

from nanobase.views import get_env
from nanobase.views_api import get_digital_copy_delete

from django.db.models import Q

from .models import Contract, LegalEntity, Prjct, PaymentTerm, PaymentRequest, InvoiceItem, NonPayrollExpense, get_reforecasting
from nanobase.models import UserProfile, ChangeHistory, UploadedFile


# @login_required
def contract_c(request):
    if request.method == 'POST':
        chg_log = ''

        new_contract = Contract.objects.create(
            briefing=request.POST.get('briefing'),
            type=request.POST.get('type'),
            startup=request.POST.get('startup'),
            endup=request.POST.get('endup') if request.POST.get('endup') else None,

            created_by=request.user,
        )
        for party_list in ['party_a_list', 'party_b_list']:
            party_objects = []
            for party in request.POST.get(party_list).split(','):
                party_objects.append(LegalEntity.objects.get(name=party))

            new_contract.party_a_list.set(party_objects) if party_list == 'party_a_list' else new_contract.party_b_list.set(party_objects)

        scanned_copies = request.FILES.getlist('scanned_copy')
        for scanned_copy in scanned_copies:
            UploadedFile.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=new_contract._meta.db_table,
                db_table_pk=new_contract.pk,
                digital_copy=scanned_copy,
            )

        chg_log = '1 x new Contract [ ' + request.POST.get('briefing') + ' ] was added; '
        ChangeHistory.objects.create(
            on=timezone.now(),
            by=request.user,
            db_table_name=new_contract._meta.db_table,
            db_table_pk=new_contract.pk,
            detail=chg_log,
        )

        response = JsonResponse({"alert_msg": chg_log, "alert_type": 'success',})
        return response


# @login_required
def jsonResponse_contract_getLst(request):
    if request.method == 'GET':
        party_lst = dict(LegalEntity.objects.all().order_by("type").values_list('name', 'type'))
        briefing_lst = dict(Contract.objects.all().values_list('briefing', 'pk'))
        # get nPE list based on the year of Now 根据 Today 的 年份 获取 nPE 清单
        nPE_lst = NonPayrollExpense.objects.filter(non_payroll_expense_year=timezone.now().year, non_payroll_expense_reforecasting=get_reforecasting(timezone.now().year)).order_by('allocation')
        nPE_lst = dict(nPE_lst.values_list('description', 'non_payroll_expense_reforecasting'))

        user_lst = dict(User.objects.exclude(username__icontains='admin').values_list('username', 'email'))

        response = [party_lst, nPE_lst, briefing_lst, user_lst, ]

        return JsonResponse(response, safe=False)


# @login_required
def paymentTerm_c(request):
    if request.method == 'POST':
        contract = Contract.objects.get(pk=request.POST.get('contractPk'))
        for pay_day in request.POST.get('pay_day').split(','):
            if pay_day:
                new_payment_term = PaymentTerm.objects.create(
                    pay_day=pay_day,
                    plan=request.POST.get('plan'),
                    amount=request.POST.get('amount'),
                    contract=contract,
                )

                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=contract._meta.db_table,
                    db_table_pk=contract.pk,
                    detail=str(new_payment_term.recurring) + ' x ' + new_payment_term.get_plan_display()
                        + ' Payment Term scheduled @ ' + str(new_payment_term.pay_day)
                            + ' in amount ' + str(new_payment_term.amount) + ' was added'
                )
                
        alert_msg = request.POST.get('recurring') + ' x ' + new_payment_term.get_plan_display() + ' Payment Terms for the Contract [ ' + contract.briefing + ' ] were added'

        messages.info(request, alert_msg)
        response = JsonResponse({
                "alert_msg": alert_msg,
                "alert_type": 'success',
            })
        return response


# @login_required
def jsonResponse_paymentTerm_getLst(request):
    if request.method == 'GET':
        details = {}
        contract = Contract.objects.get(pk=request.GET.get('pK'))
        if contract.paymentterm_set.all():
            perment_term_last = contract.paymentterm_set.order_by('pay_day').last()
            for field in perment_term_last._meta.get_fields():
                
                if not field.is_relation:
                    if field.name == 'plan':
                        details[field.name] = perment_term_last.get_plan_display()
                    # elif isinstance(getattr(perment_term_last, field.name), Decimal):
                        # details[field.name] = int(getattr(perment_term_last, field.name))
                    else:
                        details[field.name] = getattr(perment_term_last, field.name)
        else:
            details = {
                "pay_day": timezone.now().date(),
                "plan": "Custom",
                "recurring": "1",
                "amount": 0,
            }

        details['contract_remaining'] = contract.get_time_remaining_in_percent()

        plan_lst = {
            'Monthly': 'M',
            'Quarterly': 'Q',
            'Semi-anually': 'S',
            'Anually': 'A',
            'Custom': 'C',
        }
        
        response = [details, plan_lst, ]

        return JsonResponse(response, safe=False)


# @login_required
def paymentReq_approve(request):
    if request.method == 'POST':
        if not request.user.groups.filter(name='IT Reviewer').exists():
            messages.info(request, 'you are NOT authorized iT reviewer')
            response = JsonResponse({
                "alert_msg": 'you are NOT authorized iT reviewer',
                "alert_type": 'danger',
            })
            return response

        msgs = msgs_type = ''
        try:
            requested_payments = PaymentRequest.objects.filter(pk__in=request.POST.get('payment_request_pks').split(','))
            requesters = requested_payments.order_by().values('requested_by').distinct()
            for requester in requesters:
                requested_payments_filtered_by_requester = requested_payments.filter(requested_by__id=requester['requested_by'])
                for payment_request in requested_payments_filtered_by_requester:
                    payment_request.status = 'A'
                    payment_request.IT_reviewed_by = request.user
                    # payment_request.IT_reviewed_on = datetime.date.today()
                    payment_request.IT_reviewed_on = timezone.now()


                if request.user.email.split('@')[1] not in get_env('ORG_DOMAIN'):
                    requester = payment_request.payment_term.contract.created_by.first_name
                    to = [payment_request.payment_term.contract.created_by.email]
                else:
                    requester = payment_request.requested_by.first_name
                    to = [payment_request.requested_by.email]

                message = get_template("nanopay/payment_request_email_approve.html").render({
                    'protocol': 'http',
                    # 'domain': '127.0.0.1:8000',
                    'domain': request.META['HTTP_HOST'],
                    'payment_request': requested_payments_filtered_by_requester,
                    'requester': requester,
                })
                mail = EmailMessage(
                    subject='ITS expr - Pl noticed - Payment Request approved by ' + request.user.get_full_name(),
                    body=message,
                    from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
                    to=to,
                    # to=['zhao27j@gmail.com'],
                    cc=[request.user.email],
                    # reply_to=[EMAIL_ADMIN],
                    # connection=
                )
                mail.content_subtype = "html"
                
                if mail.send():
                    for payment_request in requested_payments_filtered_by_requester:
                        
                        payment_request.save()

                        ChangeHistory.objects.create(
                            on=timezone.now(),
                            by=request.user,
                            db_table_name=payment_request.payment_term.contract._meta.db_table,
                            db_table_pk=payment_request.payment_term.contract.pk,
                            detail='Payment Request [ ' + str(payment_request.id) + ' ] was approved'
                        )
                        
                    msgs += 'Approval decision of ' + payment_request.requested_by.get_full_name() + " 's Payment Request [ " + request.POST.get('payment_request_pks') + ' ] were sent. '
                    msgs_type = 'success'

        except Exception as e:
            msgs = str(e) + ' in processing with Payment Request [ ' + str(payment_request.id) + ' ] for [ ' + payment_request.requested_by.email + ' ]'
        else:
            pass
        finally:
            if msgs_type != 'success':
                msgs_type = 'danger'

        messages.info(request, msgs)

        response = JsonResponse({
            "alert_msg": msgs,
            "alert_type": msgs_type,
            "approver": request.user.get_full_name(),
        })
        return response


# @login_required
def paymentReq_c(request):
    if request.method == 'POST':
        pk = request.POST.get('pK')
        chg_log = ''
        created = False
        try:
            paymentTerm_mdl_obj = PaymentTerm.objects.get(pk=pk)
        except Exception as e:
            paymentRequest_mdl_obj = PaymentRequest.objects.get(pk=pk)
        else:
            if paymentTerm_mdl_obj.paymentrequest_set.all():
                paymentRequest_mdl_obj = paymentTerm_mdl_obj.paymentrequest_set.first()
            else:
                paymentRequest_mdl_obj = PaymentRequest.objects.create(requested_by=request.user, requested_on=timezone.now(), payment_term=paymentTerm_mdl_obj)
                paymentTerm_mdl_obj.applied_on = paymentRequest_mdl_obj.requested_on
                paymentTerm_mdl_obj.save()

                created = True

        for k, v in request.POST.copy().items():
            try:
                PaymentRequest._meta.get_field(k)

                if created:
                    # chg_log = '1 x new Payment Request [ ' + paymentRequest_mdl_obj.name + ' ] was added'
                    chg_log = 'notification of new Payment Request [ ' + str(paymentRequest_mdl_obj.id) + ' ] was sent'
                else:
                    if getattr(paymentRequest_mdl_obj, k):
                        from_orig = getattr(paymentRequest_mdl_obj, k)
                        try:
                            PaymentRequest._meta.get_field(k).related_fields
                            from_orig = from_orig.name
                        # except AttributeError as e:
                        except Exception as e:
                            pass
                    else: 
                        from_orig = '🈳'
                    to_target = v if v != '' else '🈳'
                    if to_target != from_orig:
                        chg_log += 'The ' + k.capitalize() + ' was changed from [ ' + from_orig + ' ] to [ ' + to_target + ' ]; '

                # if k == 'paymentTerm_mdl_obj':
                if k == 'non_payroll_expense':
                    paymentRequest_mdl_obj.non_payroll_expense = get_object_or_404(
                        NonPayrollExpense, 
                        description=v,
                        non_payroll_expense_year=request.POST.get('budgetYr'),
                        non_payroll_expense_reforecasting=request.POST.get('reforecasting'),
                        )
                elif k == 'scanned_copy':
                    pass
                else:
                    setattr(paymentRequest_mdl_obj, k, v)

                paymentRequest_mdl_obj.save()
                
            # except FieldDoesNotExist as e:
            except Exception as e:
                pass

        try:
            invoice_item = json.loads(request.POST.get('invoice_item'))
        except Exception as e:
            pass
        else:
            if paymentRequest_mdl_obj.invoiceitem_set.all():
                paymentRequest_mdl_obj.invoiceitem_set.all().delete()
                
            paymentRequest_mdl_obj.amount = 0
            for itm in invoice_item:
                invoiceItem_mdl_obj = InvoiceItem.objects.create(date=paymentRequest_mdl_obj.requested_on, payment_request=paymentRequest_mdl_obj,)
                invoiceItem_mdl_obj.amount = invoice_item[itm]['amount'] if 'amount' in invoice_item[itm] else 0
                invoiceItem_mdl_obj.vat = invoice_item[itm]['vat'] if 'vat' in invoice_item[itm] else ''
                invoiceItem_mdl_obj.description = invoice_item[itm]['description'] if 'description' in invoice_item[itm] else ''
                invoiceItem_mdl_obj.save()

                # paymentRequest_mdl_obj.amount += float(invoice_item[itm]['amount'])
            paymentRequest_mdl_obj.amount = paymentRequest_mdl_obj.get_invoice_total_excl_vat()
            paymentRequest_mdl_obj.save()

        try:
            del_scanned_copies = json.loads(request.POST.get('del_scanned_copies'))
        except Exception as e:
            pass
        else:
            for scanned_copy_pk in del_scanned_copies:
                get_digital_copy_delete(request, scanned_copy_pk)

        scanned_copies = request.FILES.getlist('scanned_copy')
        for scanned_copy in scanned_copies:
            UploadedFile.objects.create(
                on=timezone.now(), by=request.user,
                db_table_name=paymentRequest_mdl_obj._meta.db_table, db_table_pk=paymentRequest_mdl_obj.pk,
                digital_copy=scanned_copy,
            )
        
        ChangeHistory.objects.create(
            on=timezone.now(), by=request.user,
            db_table_name=paymentRequest_mdl_obj.payment_term.contract._meta.db_table, db_table_pk=paymentRequest_mdl_obj.payment_term.contract.pk,
            detail='Payment Request [ ' + str(paymentRequest_mdl_obj.id) + ' ] was ' + paymentRequest_mdl_obj.get_status_display()
        )

        iT_reviewer_emails = []
        for reviewer in User.objects.filter(groups__name='IT Reviewer'):
            iT_reviewer_emails.append(reviewer.email)

        if paymentRequest_mdl_obj.status == 'Req': # request.POST.get('role') == 'vendor':
            subject = 'iTS expr - Pls verify - Payment Request applied by ' + request.user.get_full_name()
            to = [paymentRequest_mdl_obj.payment_term.contract.created_by.email]
            cc = iT_reviewer_emails # [request.user.email]
            first_name = paymentRequest_mdl_obj.payment_term.contract.created_by.first_name
        elif paymentRequest_mdl_obj.status == 'I':
            subject = 'iTS expr - Pls approve - Payment Request verified by ' + request.user.get_full_name()
            to = iT_reviewer_emails
            cc = [request.user.email]
            first_name = 'Approver'
        elif paymentRequest_mdl_obj.status == 'Rej':
            subject = 'iTS expr - Pls review - Payment Request rejected by ' + request.user.get_full_name()
            to = [paymentRequest_mdl_obj.requested_by.email]
            cc = [paymentRequest_mdl_obj.payment_term.contract.created_by.email, request.user.email]
            first_name = paymentRequest_mdl_obj.requested_by.first_name
        
        message = get_template("nanopay/payment_request_email.html").render({
            'protocol': 'http',
            'domain': request.META['HTTP_HOST'], # 'domain': '127.0.0.1:8000',
            'payment_request': paymentRequest_mdl_obj,
            'first_name': first_name,
        })
        mail = EmailMessage(
            subject=subject,
            body=message,
            from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
            to=to,
            cc=cc,
            # reply_to=[EMAIL_ADMIN],
            # connection=
        )
        mail.content_subtype = "html"
        is_sent = mail.send()

        if is_sent:
        # if True:
            messages.success(request, 'notification of Payment Request [ ' + str(paymentRequest_mdl_obj.id) + ' ] was sent')
            response = JsonResponse({
                "alert_msg": chg_log,
                "alert_type": 'success',
            })
        else:
            messages.info(request, 'notification of Payment Request [ ' + str(paymentRequest_mdl_obj.id) + ' ] was NOT sent due to some errors')
            response = JsonResponse({
                "alert_msg": False,
                "alert_type": 'danger',
            })
        
        return response


# @login_required
def jsonResponse_paymentReq_getLst(request):
    if request.method == 'GET':
        details = {}
        nPE_lst = {}
        try:
            paymentObj = get_object_or_404(PaymentRequest, pk=request.GET.get('pK'))
            paymentTerm = paymentObj.payment_term
            contract = paymentTerm.contract
            nPE_yr = paymentTerm.pay_day.year
        except Exception as e:
            paymentObj = get_object_or_404(PaymentTerm, pk=request.GET.get('pK'))
            paymentTerm = paymentObj
            contract = paymentObj.contract
            nPE_yr = paymentObj.pay_day.year
        else:
            pass

        if 'paymentterm' in paymentObj._meta.db_table:
            if paymentObj.paymentrequest_set.first():
                paymentObj = paymentObj.paymentrequest_set.first()
            else:
                details['vat'] = details['description'] = ''
                for term in PaymentTerm.objects.filter(contract=contract).exclude(pk=paymentTerm.pk).order_by("applied_on"):
                    if term.paymentrequest_set.first() and term.paymentrequest_set.first().invoiceitem_set.all():
                        for invoice_item in term.paymentrequest_set.first().invoiceitem_set.all().order_by("id"):
                            if details['description'] == '' and invoice_item.description and invoice_item.description.strip() != '':
                                details['description'] = invoice_item.description
                            if details['vat'] == '' and invoice_item.vat and invoice_item.vat.strip() != '':
                                details['vat'] = invoice_item.vat

                            if details['vat'] != '' and details['description'] != '':
                                break

        if 'paymentrequest' in paymentObj._meta.db_table and paymentObj.invoiceitem_set.all():
            details['invoice_item'] = {}
            for index, itm in enumerate(paymentObj.invoiceitem_set.all()):
                details['invoice_item'][index+1] = {}
                for field in itm._meta.get_fields():
                    if not field.is_relation:
                        details['invoice_item'][index+1][field.name] = getattr(itm, field.name)

        if request.user.email.split('@')[1] not in get_env('ORG_DOMAIN'):
            details['role'] = 'vendor'
        else:
            if request.user.is_staff and request.user.groups.filter(name='IT Reviewer').exists():
                details['role'] = 'reviewer'
            elif request.user == contract.created_by or request.user.is_staff and request.user.groups.filter(name='IT China').exists():
                details['role'] = 'verifier'

            if hasattr(paymentObj, 'non_payroll_expense') and hasattr(paymentObj.non_payroll_expense, 'description'):
                details['non_payroll_expense'] = paymentObj.non_payroll_expense.description
            else:
                details['non_payroll_expense'] = ''
                for term in PaymentTerm.objects.filter(contract=contract).exclude(pk=paymentTerm.pk).order_by("applied_on"):
                    if term and term.paymentrequest_set.first() and term.paymentrequest_set.first().non_payroll_expense:
                        details['non_payroll_expense'] = term.paymentrequest_set.first().non_payroll_expense.description
                        break

            # get nPE list based on the payDay of paymentTerm 根据 paymentTerm 的 payDay 获取 nPE 清单
            for nPE in NonPayrollExpense.objects.filter(non_payroll_expense_year=nPE_yr, non_payroll_expense_reforecasting=get_reforecasting(nPE_yr)):
                if nPE.allocation.strip().lower() in contract.get_prjct().allocations.lower():
                    nPE_lst[nPE.description] = str(nPE.non_payroll_expense_year) + '---' + str(nPE.non_payroll_expense_reforecasting)

        details['pay_day'] = paymentTerm.pay_day

        scanned_copies = UploadedFile.objects.filter(db_table_name=paymentObj._meta.db_table, db_table_pk=paymentObj.pk)
        if scanned_copies.count():
            details['scanned_copies'] = {}
            for scanned_copy in scanned_copies:
                # details['scanned_copies'].append(scanned_copy.get_digital_copy_base_file_name())
                # details['scanned_copies'] = scanned_copy.get_digital_copy_base_file_name()
                details['scanned_copies'][scanned_copy.pk] = scanned_copy.get_digital_copy_base_file_name()

        details['contract_pk'] = contract.pk
        # details['contract_briefing'] = contract.briefing
        details['contract_remaining'] = contract.get_time_remaining_in_percent()
        details['db_table'] = paymentObj._meta.db_table

        for field in paymentObj._meta.get_fields():
            if field.is_relation:
                # if field.name == 'non_payroll_expense':
                pass
            # elif not field.serialize:
            elif field.description == 'File':
                pass
            elif hasattr(field, 'choices') and field.choices: # identify if it's A choices field
                method_name = f'get_{field.name}_display'
                get_choices_field_display_method = getattr(paymentObj, method_name, None)
                details[f'get_{field.name}_display'] = get_choices_field_display_method()
                details[field.name] = getattr(paymentObj, field.name)
            else:
                details[field.name] = getattr(paymentObj, field.name)
        
        response = [details, nPE_lst]

        return JsonResponse(response, safe=False)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)


def decimal_to_month(decimal):
    # month_number = int(decimal) % 12 + 1
    month_number = 12 if int(decimal) % 12 == 0 else int(decimal) % 12
    return calendar.month_abbr[month_number].lower()


# @login_required
def jsonResponse_nonPayrollExpense_getLst(request):
    if request.method == 'GET':
        # budgetYr_lst = list(set(NonPayrollExpense.objects.values_list('non_payroll_expense_year', flat=True).distinct()))
        budgetYr_lst = []
        for budgetYr in list(set(NonPayrollExpense.objects.values_list('non_payroll_expense_year', flat=True).distinct())):
            budgetYr_lst.append(int(budgetYr))

        allocation_lst = {}
        reforecasting_lst = {}
        currency_lst = {}
        is_direct_cost_lst = {}

        # paymentRequest_by_budgetYr_lst = {}
        
        reforecasting = get_reforecasting(int(request.GET.get('budgetYr')));
        nPEs_by_budgetYr = NonPayrollExpense.objects.filter(non_payroll_expense_year=int(request.GET.get('budgetYr')), non_payroll_expense_reforecasting=reforecasting)

        nPE_by_budgetYr_lst = {}

        for nPE in nPEs_by_budgetYr:

            nPE_by_budgetYr_lst[nPE.pk] = {}

            nPE_related_PRs = []
            if PaymentRequest.objects.filter(non_payroll_expense__description=nPE.description, requested_on__year=int(request.GET.get('budgetYr'))):
                # nPE_by_budgetYr_lst[non_payroll_expense.pk][field.name] = list(set(PaymentRequest.objects.filter(non_payroll_expense=non_payroll_expense.pk, requested_on__year=int(request.GET.get('budgetYr'))).values_list('pk', flat=True).distinct()))
                for payment_request in PaymentRequest.objects.filter(non_payroll_expense__description=nPE.description, requested_on__year=int(request.GET.get('budgetYr'))):
                    text_color = 'text-primary' if int(request.GET.get('budgetYr')) == payment_request.payment_term.pay_day.year else 'text-danger'
                    # if text_color == 'text-warning-emphasis':
                    #     print(payment_request.requested_on.month)
                    nPE_related_PRs.append(
                        {
                            decimal_to_month(payment_request.requested_on.month): {
                                str(payment_request.pk): [payment_request.amount, text_color, payment_request.payment_term.pay_day.date(), payment_request.payment_term.contract.pk],
                            },
                        }
                    )
            for field in nPE._meta.get_fields():
                if field.name == 'non_payroll_expense_reforecasting':
                    nPE_by_budgetYr_lst[nPE.pk]['is_list'] = True # 标志 是否 在 页面 呈现
                    if nPE.non_payroll_expense_reforecasting:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = nPE.get_non_payroll_expense_reforecasting_display()   # status_lst[instance.status] = instance.get_status_display()
                        reforecasting_lst[nPE.get_non_payroll_expense_reforecasting_display()] = nPE.non_payroll_expense_reforecasting
                    else:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = ''
                elif field.name == 'currency':
                    if nPE.currency:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = nPE.get_currency_display()   # status_lst[instance.status] = instance.get_status_display()
                        currency_lst[nPE.get_currency_display()] = nPE.currency
                    else:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = ''
                elif field.name == 'is_direct_cost':
                    if nPE.is_direct_cost:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = nPE.get_is_direct_cost_display()   # status_lst[instance.status] = instance.get_status_display()
                        is_direct_cost_lst[nPE.get_is_direct_cost_display()] = nPE.is_direct_cost
                    else:
                        nPE_by_budgetYr_lst[nPE.pk][field.name] = ''
                elif field.name == 'allocation':
                    allocation_lst[nPE.allocation.strip().upper()] = ''

                    nPE_field = getattr(nPE, field.name)
                    nPE_by_budgetYr_lst[nPE.pk][field.name] = nPE_field.strip().upper() if nPE_field else ''
                elif field.name == 'paymentrequest' or field.name == 'created_by' or field.name == 'created_on':
                    pass
                else:
                    nPE_field = getattr(nPE, field.name)
                    # if len(nPE_related_PRs) == 0:
                    nPE_by_budgetYr_lst[nPE.pk][field.name] = nPE_field if nPE_field else ''
                    # else:
                    for pr in nPE_related_PRs:
                        if field.name in pr:
                            if not isinstance(nPE_by_budgetYr_lst[nPE.pk][field.name], dict):
                                nPE_by_budgetYr_lst[nPE.pk][field.name] = {}

                            for key in pr[field.name].keys():
                                nPE_by_budgetYr_lst[nPE.pk][field.name][key] = pr[field.name][key]
                                nPE_by_budgetYr_lst[nPE.pk][field.name]['budget'] = nPE_field if nPE_field else ''

        # response = [json.loads(serialize("json", nPEs_by_budgetYr)), json.dumps(budgetYr_lst, cls=DecimalEncoder)]
        # response = [reforecasting, json.dumps(budgetYr_lst, cls=DecimalEncoder), nPE_by_budgetYr_lst, reforecasting_lst, allocation_lst, currency_lst, is_direct_cost_lst, ]
        response = [reforecasting, budgetYr_lst, nPE_by_budgetYr_lst, reforecasting_lst, allocation_lst, currency_lst, is_direct_cost_lst, ]


        return JsonResponse(response, safe=False)


# @login_required
def contract_mail_me_the_assets_list(request):
    if request.method == 'GET':
        contract = Contract.objects.get(pk=request.GET.get('contractPk'))
        instances = contract.assets.none()
        if request.GET.get('instancesPk'):
            instances_selected_pk = request.GET.get('instancesPk').strip(',').split(',')
            for pk in instances_selected_pk:
                instance = contract.assets.filter(pk=pk)
                instances = instances | instance
        else:
            instances = contract.assets.all()
        
        message = get_template("nanopay/contract_mail_me_the_assets_list.html").render({
                'protocol': 'http',
                # 'domain': '127.0.0.1:8000',
                'domain': request.META['HTTP_HOST'],
                'contract': contract,
                'instances': instances,
                'by': request.user.get_full_name(),
                'on': timezone.now(),
        })
        mail = EmailMessage(
            subject='ITS expr - IT Assets list of ' + contract.briefing,
            body=message,
            from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
            to=[request.user.email, ],
            # cc=[request.user.email],
            # reply_to=[EMAIL_ADMIN],
            # connection=
        )
        mail.content_subtype = "html"
        is_sent = mail.send()
        if is_sent:
            messages.success(request, "the asset list of " + contract.briefing + " was successfully sent")
            response = JsonResponse({'is_sent': contract.briefing})
        else:
            messages.success(request, "the asset list of " + contract.briefing + " was NOT sent dur to some errors")
            response = JsonResponse({'is_sent': False})

        return response


# @login_required
def jsonResponse_legalEntities_getLst(request):
    if request.method == 'GET':
        legal_entities = LegalEntity.objects.all().order_by("type", "prjct")

        legal_entity_types = {}
        legal_entity_prjcts = {}
        legal_entity_contacts = {}
        for legal_entity in legal_entities:
            legal_entity_types[legal_entity.type] = legal_entity.get_type_display()
            
            if legal_entity.prjct:
                legal_entity_prjcts[legal_entity.prjct.pk] = legal_entity.prjct.name

            if legal_entity.userprofile_set.all():
                legal_entity_contacts[legal_entity.pk] = True

        # num_of_prjct = legal_entities.values('prjct').distinct().count()
        # num_of_type = legal_entities.values('type').distinct().count()

        response = [json.loads(serialize("json", legal_entities)), legal_entity_types, legal_entity_prjcts, legal_entity_contacts]

        return JsonResponse(response, safe=False)


# @login_required
def legalEntity_cu(request):
    if request.method == 'POST':
        # legal_entity, created = LegalEntity.objects.get_or_create(name=request.POST.get('name'))
        chg_log = ''
        try:
            legal_entity = LegalEntity.objects.get(pk=request.POST.get('pk'))
            created = False
        except LegalEntity.DoesNotExist as e:
            legal_entity = LegalEntity.objects.create()
            created = True

        for k, v in request.POST.copy().items():
            try:
                LegalEntity._meta.get_field(k)

                if created:
                    chg_log = '1 x new Legal Entity [ ' + legal_entity.name + ' ] was added'
                else:
                    if getattr(legal_entity, k):
                        from_orig = getattr(legal_entity, k)
                        try:
                            LegalEntity._meta.get_field(k).related_fields
                            from_orig = from_orig.name
                        except AttributeError as e:
                            pass
                    else: 
                        from_orig = '🈳'
                    to_target = v if v != '' else '🈳'
                    chg_log += 'The ' + k.capitalize() + ' was changed from [ ' + from_orig + ' ] to [ ' + to_target + ' ]; '

                if k == 'prjct':
                    if request.POST.get('type') == 'I':
                        legal_entity.prjct = Prjct.objects.get(name=v) 
                    else:
                        legal_entity.prjct = None
                else:
                    setattr(legal_entity, k, v)

                legal_entity.save()
                
            except FieldDoesNotExist as e:
                pass

            if k == 'contact' and v != '':
                # if 'org.com' in request.POST.get('contact'):
                # to chk if String contains elements from A list
                if any(ele in request.POST.get('contact') for ele in get_env('ORG_DOMAIN')):
                    username = request.POST.get('contact').split(":")[-1].split("@")[0].strip()
                else:
                    username = request.POST.get('contact').split(":")[-1].strip()

                contact = User.objects.get(username=username)
                if UserProfile.objects.filter(user=contact).exists():
                    contact.userprofile.legal_entity = legal_entity
                    contact.userprofile.save()
                else:
                    UserProfile.objects.create(user=contact, legal_entity=legal_entity)
            elif k == 'contact' and v == '':
                try:
                    user_profiles = UserProfile.objects.filter(legal_entity=legal_entity)
                    for user_profile in user_profiles:
                        user_profile.legal_entity = None
                        user_profile.save()
                except UserProfile.DoesNotExist as e:
                    pass

        ChangeHistory.objects.create(
            on=timezone.now(),
            by=request.user,
            db_table_name=legal_entity._meta.db_table,
            db_table_pk=legal_entity.pk,
            detail=chg_log
            )
        
        # messages.info(request, '1 x new Legal Entity [ ' + request.POST['name'] + ' ] was added')
        # return redirect(to='nanopay:legalentity-detail', pk=legal_entity.pk)

        # response = JsonResponse({"name": legal_entity.name})

        # chg_log = "<a href="{% url 'nanopay:legalentity-detail' legal_entity.pk %}" class="text-decoration-none"><small>{{ legal_entity.name }}</small></a>"
        response = JsonResponse({"chg_log": chg_log})
        return response


# @login_required
def jsonResponse_legalEntity_getLst(request):
    if request.method == 'GET':

        legal_entity_lst = {}
        for legal_entity in LegalEntity.objects.all():
            legal_entity_lst[legal_entity.name] = legal_entity.pk
        
        # legal_entity_lst = serializers.serialize("json", LegalEntity.objects.all(), fields=["name", "pk"])

        prjct_lst = {}
        for prjct in Prjct.objects.all():
            prjct_lst[prjct.name] = prjct.pk

        # prjct_lst = serializers.serialize("json", Prjct.objects.all(), fields=["name", "pk"])

        external_contact_lst = {}
        external_contacts = User.objects.exclude(reduce(operator.or_, (Q(email__icontains=domain) for domain in get_env('ORG_DOMAIN')))) # for external_contact in User.objects.exclude(email__icontains='org.com'):
        for external_contact in User.objects.exclude(
            #　the filter will return User objects if their email contains any of the substrings from a list
            reduce(operator.or_, (Q(email__icontains=domain) for domain in get_env('ORG_DOMAIN')))
        ):
            # if external_contact.username != 'admin' and no 'org.com' in external_contact.email.lower():
            # to chk if String contains elements from A list
            if external_contact.username != 'admin' and not any(ele in external_contact.email.lower() for ele in get_env('ORG_DOMAIN')):
                if hasattr(external_contact, "userprofile"):
                    if not external_contact.userprofile.legal_entity:
                        external_contact_lst['%s : %s' % (external_contact.get_full_name(), external_contact.email)] = external_contact.pk
                else:
                    external_contact_lst['%s : %s' % (external_contact.get_full_name(), external_contact.email)] = external_contact.pk

        legal_entity = {}
        if request.GET.get('legalEntityPk'):
            legalEntity_selected = LegalEntity.objects.get(pk=request.GET.get('legalEntityPk'))
            legal_entity['pk'] = legalEntity_selected.pk
            legal_entity['name'] = legalEntity_selected.name
            legal_entity['type'] = legalEntity_selected.type
            legal_entity['code'] = legalEntity_selected.code
            legal_entity['prjct'] = legalEntity_selected.prjct.name if legalEntity_selected.prjct else ''
            legal_entity['deposit_bank'] = legalEntity_selected.deposit_bank
            legal_entity['deposit_bank_account'] = legalEntity_selected.deposit_bank_account
            legal_entity['tax_number'] = legalEntity_selected.tax_number
            legal_entity['reg_addr'] = legalEntity_selected.reg_addr
            legal_entity['reg_phone'] = legalEntity_selected.reg_phone
            legal_entity['postal_addr'] = legalEntity_selected.postal_addr

            user_profiles = UserProfile.objects.filter(legal_entity=legalEntity_selected)
            for user_profile in user_profiles:
                legal_entity['contact'] = user_profile.user.get_full_name()

            """
            change_history = {}
            changes = ChangeHistory.objects.filter(db_table_name=legalEntity_selected._meta.db_table, db_table_pk=legalEntity_selected.pk).order_by("-on")
            for change in changes:
                change_history[change.detail] = change.by.get_full_name() + str(legalEntity_selected.pk) + change.on.strftime("%Y-%m-%d %H:%M:%S")
            """
            
            # legal_entity = serializers.serialize("json", LegalEntity.objects.filter(pk=request.GET.get('legalEntityPk')))

        response = [legal_entity, legal_entity_lst, prjct_lst, external_contact_lst]
        return JsonResponse(response, safe=False)
