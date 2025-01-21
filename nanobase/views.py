# import os

import json

from datetime import datetime, date, timedelta

# from django.core.files import File
# from django.core.paginator import Paginator

from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone

from django.contrib import messages
from django.contrib.auth.mixins import UserPassesTestMixin, LoginRequiredMixin
from django.contrib.auth.decorators import user_passes_test #, login_required
from django.contrib.auth.models import User, Group
from django.contrib.auth.views import LoginView

from django.http import FileResponse #, Http404

from django.views import generic
from django.views.generic.edit import CreateView

from django.db.models import Q

from .models import ChangeHistory, UploadedFile, UserProfile #, UserDept
from nanopay.models import PaymentTerm, PaymentRequest, Contract, LegalEntity, Prjct
from nanoassets.models import Config, Instance #, ModelType, branchSite, disposalRequest, ActivityHistory
from nanobase.models import ChangeHistory, UploadedFile #, SubCategory

from .forms import UserProfileUpdateForm #, UserCreateForm

# Create your views here.

class nanoLoginView(LoginView):
    # redirect_authenticated_user = True
    
    def get_default_redirect_url(self):
        if self.request.user.email.split('@')[1] not in get_env('ORG_DOMAIN'):
            return reverse_lazy('nanopay:portal-vendor')
        else:
            return reverse_lazy('nanoassets:my-instance-list')


def is_iT_reviewer(requester):
    return Group.objects.get(name='IT Reviewer') in requester.groups.all() and requester.is_staff


def is_iT_staff(requester):
    return Group.objects.get(name='IT China') in requester.groups.all() and requester.is_staff


def is_iT(requester):
    return Group.objects.get(name='IT China') in requester.groups.all()


    """
    iT_grp = Group.objects.get(name='IT China')
    iT_reviewer_grp = Group.objects.get(name='IT Reviewer')

    is_iT = iT_grp in requester.groups.all()
    is_iT_reviewer = iT_reviewer_grp in requester.groups.all()
    is_staff = requester.is_staff

    return is_iT, is_staff
    """


def get_env(k, type = None):
    try:
        with open('nanoEnv.json', 'r') as env_json:
            env = json.load(env_json)
        
        if k in env:
            if type == 'str':
                return str(env[k])
            else:
                return env[k]
        else:
            return False

    except FileNotFoundError as e:
        return False


def get_toDo_list(context):
    context["configs_expiring"] = Config.objects.filter(expire__range=(date.today(), date.today() + timedelta(weeks=8)))
    for config in context["configs_expiring"]:
        if 'config' in config.db_table_name:
            parent_config = Config.objects.get(pk=config.db_table_pk)
            related_instance_pk = parent_config.db_table_pk
        else:
            related_instance_pk = config.db_table_pk

        config.instance = Instance.objects.get(pk=related_instance_pk) # add Data into querySet / 在 querySet 中 添加 数据

    context["contracts_expiring"] = Contract.objects.filter(
        endup__range=(date.today(), date.today() + timedelta(weeks=12))
    ).order_by('endup')

    contracts_w_o_peymentTerm = Contract.objects.none()
    contracts_w_o_assetsInstance = Contract.objects.none()
    contracts_endup_later_than_today = Contract.objects.filter(endup__gt=(date.today())).order_by('endup')
    for contract in contracts_endup_later_than_today:
        if not contract.paymentterm_set.exists():
            contracts_w_o_peymentTerm |= Contract.objects.filter(pk=contract.pk) # merge / 合并 querySet
        elif not contract.assets.exists():
            contracts_w_o_assetsInstance |= Contract.objects.filter(pk=contract.pk) # merge / 合并 querySet

    for contract in contracts_w_o_assetsInstance: # give count of paymentTerm applied / 给出 已申请付款 数量
        contract.paymentTerm_applied = contract.paymentterm_set.filter(applied_on__isnull=False).count()

    context["contracts_w_o_peymentTerm"] = contracts_w_o_peymentTerm
    context["contracts_w_o_assetsInstance"] = contracts_w_o_assetsInstance

    context["paymentTerms_upcoming"] = PaymentTerm.objects.filter(
        pay_day__range=(date.today(), date.today() + timedelta(weeks=6))
    ).order_by('pay_day')

    context["paymentTerms_overdue"] = PaymentTerm.objects.filter(
        pay_day__range=(date(date.today().year, 1, 1), date.today()), applied_on__exact=None
    ).order_by('pay_day')

    context["this_year"] = date.today().year

    return context


class toDoListView(LoginRequiredMixin, generic.base.TemplateView):
    template_name = 'nanobase/todo_list.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        return get_toDo_list(context)


def get_Contract_Qty_by_Legal_Entity(object_list):
    for obj in object_list:
        contract_qty = 0
        if Contract.objects.filter(party_a_list=obj.pk).exists():
            contract_qty += Contract.objects.filter(party_a_list=obj.pk).count()
        elif Contract.objects.filter(party_b_list=obj.pk).exists():
            contract_qty += Contract.objects.filter(party_b_list=obj.pk).count()

        obj.contract_qty = contract_qty
    
    return object_list


def get_grpd_cntrcts(context, contracts):
    context['cntrcts_total'] = 0

    context['cntrcts_by_prjct'] = {}

    prjct_lst = Prjct.objects.all()
    for prjct in prjct_lst:
        if contracts.filter(party_a_list__prjct=prjct).exists():
            context['cntrcts_by_prjct'][prjct.pk] = {}
            context['cntrcts_by_prjct'][prjct.pk]['name'] = prjct.name.replace(' ', '')

            context['cntrcts_by_prjct'][prjct.pk]['objs'] = contracts.filter(party_a_list__prjct=prjct).distinct()

            context['cntrcts_by_prjct'][prjct.pk]['subtotal'] = context['cntrcts_by_prjct'][prjct.pk]['objs'].count()
            context['cntrcts_total'] += context['cntrcts_by_prjct'][prjct.pk]['subtotal']

            context['cntrcts_by_prjct'][prjct.pk]['active'] = context['cntrcts_by_prjct'][prjct.pk]['objs'].filter(type__in=['M', 'N', 'R']).count()
            context['cntrcts_by_prjct'][prjct.pk]['expired'] = context['cntrcts_by_prjct'][prjct.pk]['objs'].filter(type__in=['E', 'T']).count()
        
            for contract in context['cntrcts_by_prjct'][prjct.pk]['objs']:
                if contract.paymentterm_set.exists():
                    contract.paymentTerm_applied = contract.paymentterm_set.filter(applied_on__isnull=False).count()

    return context


def get_grpd_instance(context, instances):
    context['instances_total'] = 0

    context['instances_by_subCat'] = {}

    subCats = []
    for instance in instances:
        if instance.model_type.sub_category not in subCats:
            subCats.append(instance.model_type.sub_category)
    
    for sub_category in subCats:
        if instances.filter(model_type__sub_category=sub_category).exists():
            context['instances_by_subCat'][sub_category.pk] = {}
            context['instances_by_subCat'][sub_category.pk]['name'] = sub_category.name.replace(' ', '')
            context['instances_by_subCat'][sub_category.pk]['objs'] = instances.filter(model_type__sub_category=sub_category).distinct()

            context['instances_by_subCat'][sub_category.pk]['available'] = context['instances_by_subCat'][sub_category.pk]['objs'].filter(status='AVAILABLE').count()
            context['instances_by_subCat'][sub_category.pk]['in_repair'] = context['instances_by_subCat'][sub_category.pk]['objs'].filter(status='inREPAIR').count()

            context['instances_by_subCat'][sub_category.pk]['subtotal'] = context['instances_by_subCat'][sub_category.pk]['objs'].count()
            context['instances_total'] += context['instances_by_subCat'][sub_category.pk]['subtotal']

            
            for obj in context['instances_by_subCat'][sub_category.pk]['objs']:
                obj.configs = Config.objects.filter(db_table_name=obj._meta.db_table, db_table_pk=obj.pk).order_by("-on") # add Data into querySet / 在 querySet 中 添加 数据

    return context


def get_search_results_instance(self_obj, kwrd_grps, context):
    object_list = Instance.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = Instance.objects.none()
        # kwrds = self_obj.request.GET.get('q').split(',')
        kwrds = kwrd_grp.split(',')
        # kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                configs = Config.objects.filter(
                    Q(configPara__icontains=kwrd.strip()) |
                    Q(configClass__name__icontains=kwrd.strip())
                )
                if configs.exists() > 0:
                    for config in configs:
                        try:
                            Instance.objects.get(pk=config.db_table_pk)
                            filtered_by_kwrd |= Instance.objects.filter(pk__icontains=config.db_table_pk)
                        except Instance.DoesNotExist as e:
                            parent_config = Config.objects.get(pk=config.db_table_pk)
                            filtered_by_kwrd |= Instance.objects.filter(pk=parent_config.db_table_pk)

                    # kwrds4filter.remove(kwrd)
                # else:
                    # kwrds4filter.append(kwrd.strip())
                
        object_list |= filtered_by_kwrd

        # if filtered_by_kwrd.count() == 0:
        filtered_by_kwrd = Instance.objects.filter(branchSite__onSiteTech=self_obj.request.user)

        # for kwrd in kwrds4filter:
        for kwrd in kwrds:
            if kwrd.strip() != '':
                kwrd = kwrd.strip()
                filtered_by_kwrd = filtered_by_kwrd.filter(
                    Q(serial_number__icontains=kwrd) |
                    Q(model_type__name__icontains=kwrd) |
                    Q(model_type__manufacturer__name__icontains=kwrd) |
                    Q(model_type__sub_category__name__icontains=kwrd) |
                    Q(status__icontains=kwrd) |
                    Q(owner__username__icontains=kwrd) |
                    Q(owner__first_name__icontains=kwrd) |
                    Q(owner__last_name__icontains=kwrd) |
                    Q(owner__email__icontains=kwrd) |
                    Q(hostname__icontains=kwrd) |
                    Q(branchSite__name__icontains=kwrd) |
                    # Q(branchSite__city__name__icontains=kwrd)
                    Q(branchSite__city__icontains=kwrd)
                )

        object_list |= filtered_by_kwrd
        # object_list = object_list.union(filtered_by_kwrd)

    object_list = object_list.distinct() # 去重 / deduplication

    """
    if object_list:
        sub_categories = []
        for instance in object_list:
            if instance.model_type.sub_category not in sub_categories:
                sub_categories.append(instance.model_type.sub_category)
        context["sub_categories"] = sub_categories

        
        branchSites_name = []
        for site in branchSite.objects.all():
            branchSites_name.append(site)
        context["branchSites_name"] = branchSites_name

        contracts = []
        for contract in Contract.objects.all():
            contracts.append(contract)
        context['contracts'] = contracts

        owner_list = []
        for owner in User.objects.all():
            # if owner.username != 'admin' and 'org.com' in owner.email:
            # to chk if String contains elements from A list
            if owner.username != 'admin' and any(ele in owner.email for ele in get_env('ORG_DOMAIN')):
                owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        context["owner_list"] = owner_list
        
        messages.info(self_obj.request, "%s results found" % object_list.count())
    else:
        messages.info(self_obj.request, "no results found")
        self_obj.request.GET = self_obj.request.GET.copy()
        self_obj.request.GET['q'] = ''
    
    context["instance_list"] = object_list
    """
    
    context |= get_grpd_instance(context, object_list)

    return context


def get_search_results_contract(self_obj, kwrd_grps, context):
    object_list = Contract.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = Contract.objects.none()
        kwrds = kwrd_grp.split(',') # self_obj.request.GET.get('q').split(',')
        kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                kwrds4filter.append(kwrd.strip())
                
        if not filtered_by_kwrd.exists(): # filtered_by_kwrd.count() == 0:
            filtered_by_kwrd = Contract.objects.all() # Instance.objects.filter(branchSite__onSiteTech=self_obj.request.user)

        for kwrd in kwrds4filter:
            kwrd = kwrd.strip()
            filtered_by_kwrd = filtered_by_kwrd.filter(
                Q(briefing__icontains=kwrd) |
                Q(assets__model_type__name__icontains=kwrd) |
                Q(assets__model_type__manufacturer__name__icontains=kwrd) |
                Q(assets__model_type__sub_category__name__icontains=kwrd) |
                Q(assets__branchSite__name__icontains=kwrd) |
                Q(assets__branchSite__city__icontains=kwrd) |
                Q(party_a_list__name__icontains=kwrd) |
                Q(party_b_list__name__icontains=kwrd)
            )

        object_list |= filtered_by_kwrd
        # object_list = object_list.union(filtered_by_kwrd)

    object_list = object_list.distinct() # 去重 / deduplication

    context |= get_grpd_cntrcts(context, object_list)

    """
    if object_list:
        prjct_lst = []
        for contract in object_list:
            if not contract.get_prjct() in prjct_lst:
                prjct = contract.get_prjct()
                prjct.name_no_space = prjct.name.replace(' ', '')
                prjct_lst.append(prjct)
        context["prjct_lst"] = prjct_lst

        # messages.info(self_obj.request, "%s results found" % object_list.count())
    # else:
        # messages.info(self_obj.request, "no results found")
        # self_obj.request.GET = self_obj.request.GET.copy()
        # self_obj.request.GET['q'] = ''
    
    context["contract_list"] = object_list
    """

    return context


def get_search_results_legalEntity(self_obj, kwrd_grps, context):
    object_list = LegalEntity.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = LegalEntity.objects.none()
        # kwrds = self_obj.request.GET.get('q').split(',')
        kwrds = kwrd_grp.split(',')
        kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                kwrds4filter.append(kwrd.strip())
                
        # if filtered_by_kwrd.count() == 0:
        if not filtered_by_kwrd.exists():
            # filtered_by_kwrd = Instance.objects.filter(branchSite__onSiteTech=self_obj.request.user)
            filtered_by_kwrd = LegalEntity.objects.all()

        for kwrd in kwrds4filter:
            kwrd = kwrd.strip()
            filtered_by_kwrd = filtered_by_kwrd.filter(
                Q(name__icontains=kwrd) |
                Q(type__icontains=kwrd) |
                Q(prjct__name__icontains=kwrd)
            )

        object_list |= filtered_by_kwrd
        # object_list = object_list.union(filtered_by_kwrd)

    object_list = object_list.distinct()

    object_list = get_Contract_Qty_by_Legal_Entity(object_list)

    # if object_list:
        # messages.info(self_obj.request, "%s results found" % object_list.count())
    # else:
        # messages.info(self_obj.request, "no results found")
        # self_obj.request.GET = self_obj.request.GET.copy()
        # self_obj.request.GET['q'] = ''

    context["legalentity_list"] = object_list # return object_list.distinct() # 去重 / deduplication

    return context


def get_search_results_paymentRequest(self_obj, kwrd_grps, context):
    object_list = PaymentRequest.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = PaymentRequest.objects.none()
        # kwrds = self_obj.request.GET.get('q').split(',')
        kwrds = kwrd_grp.split(',')
        kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                kwrds4filter.append(kwrd.strip())
                
        # if filtered_by_kwrd.count() == 0:
        if not filtered_by_kwrd.exists():
            # filtered_by_kwrd = Instance.objects.filter(branchSite__onSiteTech=self_obj.request.user)
            filtered_by_kwrd = PaymentRequest.objects.all()

        for kwrd in kwrds4filter:
            kwrd = kwrd.strip()
            filtered_by_kwrd = filtered_by_kwrd.filter(
                Q(non_payroll_expense__non_payroll_expense_year__icontains=kwrd) |
                Q(non_payroll_expense__description__icontains=kwrd) |
                Q(payment_term__contract__briefing__icontains=kwrd) |
                Q(payment_term__contract__assets__model_type__name__icontains=kwrd) |
                Q(payment_term__contract__assets__branchSite__name__icontains=kwrd) |
                Q(payment_term__contract__assets__branchSite__city__icontains=kwrd) |
                Q(payment_term__contract__party_a_list__name__icontains=kwrd) |
                Q(payment_term__contract__party_b_list__name__icontains=kwrd)
            )

        object_list |= filtered_by_kwrd
        # object_list = object_list.union(filtered_by_kwrd)

    object_list = object_list.distinct().order_by("-status", "-requested_on") # 去重 / deduplication
    
    if object_list:
        for paymentReq in object_list: # add Data into querySet / 在 querySet 中 添加 数据
            paymentReq.paymentTerm_all = paymentReq.payment_term.contract.paymentterm_set.all().count()
            num_of_paymentTerm = 0
            for paymentTerm in paymentReq.payment_term.contract.paymentterm_set.all().order_by('pay_day'):
                if paymentTerm.pay_day <= paymentReq.payment_term.pay_day:
                    num_of_paymentTerm += 1
            if num_of_paymentTerm == 1:
                paymentReq.num_of_paymentTerm = '1st'
            elif num_of_paymentTerm == 2:
                paymentReq.num_of_paymentTerm = '2nd'
            elif num_of_paymentTerm == 3:
                paymentReq.num_of_paymentTerm = '3rd'
            else:
                paymentReq.num_of_paymentTerm = "%sth" % (num_of_paymentTerm)
            # paymentReq.paymentTerm_applied = paymentReq.payment_term.contract.paymentterm_set.filter(applied_on__isnull=False).count()

        digital_copies = UploadedFile.objects.filter(db_table_name=object_list.first()._meta.db_table).order_by("-on")
        context["digital_copies"] = digital_copies

        # messages.info(self_obj.request, "%s results found" % object_list.count())
    # else:
        # messages.info(self_obj.request, "no results found")
        # self_obj.request.GET = self_obj.request.GET.copy()
        # self_obj.request.GET['q'] = ''

    context["paymentrequest_list"] = object_list

    return context


class SearchResultsListView(LoginRequiredMixin, UserPassesTestMixin, generic.base.TemplateView):
    def test_func(self):
        return is_iT(self.request.user)
    
    def handle_no_permission(self):
        messages.warning(self.request, 'you are NOT authorized iT staff')
        return redirect(to='/')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        search_model = ''
        search_model_kwrd = "'"
        if search_model_kwrd in self.request.GET.get('q'):
            search_model = self.request.GET.get('q').split(search_model_kwrd)[0].lower()
            kwrd_grps = self.request.GET.get('q').split(search_model_kwrd)[1].split('+')
        else:
            kwrd_grps = self.request.GET.get('q').split('+')

        context['is_iT']= is_iT(self.request.user)
        context['is_iT_staff'] = is_iT_staff(self.request.user)
        context['is_iT_reviewer'] = is_iT_reviewer(self.request.user)

        msg = ''
        context |= get_search_results_instance(self, kwrd_grps, context)
        msg += str(context["instances_total"]) + ' x Instance(s)'

        if context['is_iT_staff']:
            context |= get_search_results_contract(self, kwrd_grps, context)
            msg += ', ' + str(context["cntrcts_total"]) + ' x Contract(s)'
            context |= get_search_results_legalEntity(self, kwrd_grps, context)
            msg += ', ' + str(context["legalentity_list"].count()) + ' x Legal Entity(s)'
            context |= get_search_results_paymentRequest(self, kwrd_grps, context)
            msg += ', ' + str(context["paymentrequest_list"].count()) + ' x Payment Request(s)'

        """
        if 'c' in search_model: # self.request.META.get('HTTP_REFERER'):
            self.template_name = 'nanopay/contract_list.html'
            context = get_search_results_contract(self, kwrd_grps, context)
        elif 'l' in search_model: # self.request.META.get('HTTP_REFERER'):
            self.template_name = 'nanopay/legalentity_list.html'
            context = get_search_results_legalEntity(self, kwrd_grps, context)
        elif 'p' in search_model: # self.request.META.get('HTTP_REFERER'):
            self.template_name = 'nanopay/payment_request_list.html'
            context = get_search_results_paymentRequest(self, kwrd_grps, context)
        else:
            self.template_name = 'nanoassets/instance_list_search_results.html'
            context = get_search_results_instance(self, kwrd_grps, context)

        paginator = Paginator(context['object_list'], 25)
        page_obj = paginator.get_page(self.request.GET.get("page"))
        context['paginator'] = paginator
        context['page_obj'] = page_obj
        context['is_paginated'] = True
        
        messages.info(
            self.request, "%s x Instance(s), %s x Contract(s), %s x Legal Entity(s), and %s x Payment Request(s) were found" % (
                context["instances_total"], # context["instance_list"].count(), 
                context["cntrcts_total"], # context["contract_list"].count(),
                context["legalentity_list"].count(),
                context["paymentrequest_list"].count()
                )
            )
        """

        messages.info(self.request, msg + ' were found')

        self.template_name = 'nanobase/search_result_list.html'

        return context


class UserListView(LoginRequiredMixin, UserPassesTestMixin, generic.ListView):
    def test_func(self):
        return is_iT(self.request.user)
    
    def handle_no_permission(self):
        messages.warning(self.request, 'you are NOT authorized iT staff')
        return redirect(to='/')
    
    model = User
    # template_name = ''
    # paginate_by = 15

    # def get_queryset(self):
        # return super().get_queryset().filter(branchSite__onSiteTech=self.request.user)  # 跨多表查询

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        userprofiles = UserProfile.objects.exclude(user__username__icontains='admin').order_by('legal_entity')
        for user_profile in userprofiles:
            user_profile.instances = user_profile.user.instance_set.all()
            # user_profile.all_contracts = user_profile.user.contract_set.all().count()
            user_profile.active_contracts = user_profile.user.contract_set.filter(type__in=['M', 'N', 'R']).count()
        context["userprofiles"] = userprofiles
        # context["now"] = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        context['is_iT'] = is_iT(self.request.user)

        return context


"""
class UserCreateView(LoginRequiredMixin, CreateView):
    model = User
    fields = ['username', 'first_name', 'last_name', 'email', ] # '__all__'
    # template_name = "TEMPLATE_NAME"
    success_url = reverse_lazy('nanoassets:supported-instance-list')
"""


"""
@login_required
def user_create(request):
    dept_list = []
    for dept in UserDept.objects.all():
        dept_list.append(dept)

    legal_entity_list = []
    for legal_entity in LegalEntity.objects.all():
        legal_entity_list.append(legal_entity)

    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            new_user = User.objects.create_user(
                username=form.cleaned_data.get('username').strip(),
                first_name=form.cleaned_data.get('first_name').strip(),
                last_name=form.cleaned_data.get('last_name').strip(),
                email=form.cleaned_data.get('email').strip(),
                )
            # new_user.save()

            new_user.userprofile.title = form.cleaned_data.get('title').strip() if form.cleaned_data.get('title') else ''
            new_user.userprofile.dept = UserDept.objects.get(name=form.cleaned_data.get('dept').strip()) if form.cleaned_data.get('dept') else None
            new_user.userprofile.work_phone = form.cleaned_data.get('work_phone')
            new_user.userprofile.cellphone = form.cleaned_data.get('cellphone')
            new_user.userprofile.postal_addr = form.cleaned_data.get('postal_addr').strip() if form.cleaned_data.get('postal_addr') else ''
            new_user.userprofile.legal_entity = LegalEntity.objects.get(name=form.cleaned_data.get('legal_entity').strip()) if form.cleaned_data.get('legal_entity') else None
            new_user.userprofile.save()

            if new_user.userprofile.legal_entity:
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=new_user.userprofile.legal_entity._meta.db_table,
                    db_table_pk=new_user.userprofile.legal_entity.pk,
                    detail='1 x Contact [ ' + new_user.get_full_name() + ' ] is added and associated with this Legal Entity'
                    )
                messages.info(request, '1 x Contact [ ' + new_user.get_full_name() + 
                              ' ] is added and associated with the Legal Entity [ ' + form.cleaned_data.get('legal_entity') + ' ]')
                return redirect(to='nanopay:legal-entity-list')
            else:
                messages.info(request, '1 x User [ ' + new_user.get_full_name() + ' ] is created')
                return redirect(to='/')
    else:
        form = UserCreateForm(initial={})

    return render(request, 'nanobase/user_create.html', {
        'form': form,
        'dept_list': dept_list,
        'legal_entity_list': legal_entity_list,
        })
"""


@user_passes_test(is_iT_staff)
def user_profile_update(request, pk):
    if request.method == 'POST': # if this is a POST request then process the Form data
        form = UserProfileUpdateForm(
            request.POST,
            # request.FILES,
            instance=request.user.userprofile)
        
        if form.is_valid():
            form.save()
            return redirect(to='/')
    else:
        form = UserProfileUpdateForm(
            initial={
                # 'dept': request.user.userprofile.dept,
                # 'title': request.user.userprofile.title,
                'work_phone': request.user.userprofile.work_phone,
                'postal_addr': request.user.userprofile.postal_addr,
                'cellphone': request.user.userprofile.cellphone,
                # 'legal_entity': request.user.userprofile.legal_entity,
            }
        )

    return render(request, 'nanobase/user_profile_update.html', {'form': form})


@user_passes_test(is_iT_staff)
def get_digital_copy_display(request, pk):
    digital_copy_instance = get_object_or_404(UploadedFile, pk=pk)
    digital_copy_path = digital_copy_instance.digital_copy.name
    try:
        digital_copy = open(digital_copy_path, 'rb')
        # return FileResponse(digital_copy, content_type='application/pdf')
        return FileResponse(digital_copy)
    except FileNotFoundError as e:
        # raise Http404
        messages.warning(request, 'the file [ ' + digital_copy_path + ' ] does NOT exist')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面


@user_passes_test(is_iT_staff)
def get_digital_copy_add(request, pk, db_table_name):
    if request.method == 'POST':
        digital_copies = request.FILES.getlist('digital_copies')
        for digital_copy in digital_copies:
            uploadedFile = UploadedFile.objects.create(
                on=timezone.now(),
                by=request.user,
                # db_table_name=new_contract._meta.db_table,
                db_table_name=db_table_name,
                db_table_pk=pk,
                digital_copy=digital_copy,
            )
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=db_table_name,
                db_table_pk=pk,
                detail='Digital Copy of [ ' + uploadedFile.get_digital_copy_base_file_name() + ' ] was added'
                )
        messages.info(request, str(len(digital_copies)) + ' Digital Copies were added')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面


"""
@user_passes_test(is_iT_staff)
def index(request):
    return render(request, "index.html", {})
"""


"""
def data_migration_ActivityHistory_to_ChangeHistory(request):
    activity_history_all = ActivityHistory.objects.all()
    for activity_history in activity_history_all:
        if activity_history.Instance:
            db_table_name = activity_history.Instance._meta.db_table
            db_table_pk = activity_history.Instance.pk
        elif activity_history.Contract:
            db_table_name = activity_history.Contract._meta.db_table
            db_table_pk = activity_history.Contract.pk

        on = activity_history.description.strip("[").split("]")[0].strip()
        detail = activity_history.description.split(on)[1].strip().strip("]").strip()
        ChangeHistory.objects.create(
                # by=request.user,
                on=datetime.strptime(on, "%Y-%m-%d %H:%M:%S"),
                db_table_name=db_table_name,
                db_table_pk=db_table_pk,
                detail=detail,
                )
            
    return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
"""