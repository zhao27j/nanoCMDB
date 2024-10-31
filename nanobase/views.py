# from datetime import datetime

import os

import json

from django.core.files import File
# from django.core.paginator import Paginator

from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

from django.http import Http404, FileResponse

from django.views import generic
from django.views.generic.edit import CreateView

from django.db.models import Q

from .models import UserProfile, UserDept, ChangeHistory, UploadedFile
from nanopay.models import PaymentRequest, Contract, LegalEntity, Prjct
# from nanoassets.models import ActivityHistory
from nanoassets.models import ModelType, Instance, branchSite, disposalRequest, Config
from nanobase.models import ChangeHistory, UploadedFile, SubCategory


from .forms import UserProfileUpdateForm # , UserCreateForm

# Create your views here.

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

    except FileNotFoundError:
        return False
    

def get_search_results_instance(self_obj, kwrd_grps, context):
    object_list = Instance.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = Instance.objects.none()
        # kwrds = self_obj.request.GET.get('q').split(',')
        kwrds = kwrd_grp.split(',')
        # kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                configs = Config.objects.filter(Q(configPara__icontains=kwrd.strip()))
                if configs.count() > 0:
                    for config in configs:
                        try:
                            Instance.objects.get(pk=config.db_table_pk)
                            filtered_by_kwrd |= Instance.objects.filter(pk__icontains=config.db_table_pk)
                        except Instance.DoesNotExist:
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

    if object_list:
        sub_categories = []
        for instance in object_list:
            if instance.model_type.sub_category not in sub_categories:
                sub_categories.append(instance.model_type.sub_category)
        context["sub_categories"] = sub_categories

        """
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
        """

        # messages.info(self_obj.request, "%s results found" % object_list.count())
    # else:
        # messages.info(self_obj.request, "no results found")
        # self_obj.request.GET = self_obj.request.GET.copy()
        # self_obj.request.GET['q'] = ''

    context["instance_list"] = object_list

    return context


def get_search_results_contract(self_obj, kwrd_grps, context):
    object_list = Contract.objects.none()
    for kwrd_grp in kwrd_grps:
        filtered_by_kwrd = Contract.objects.none()
        # kwrds = self_obj.request.GET.get('q').split(',')
        kwrds = kwrd_grp.split(',')
        kwrds4filter = []
        for kwrd in kwrds:
            if kwrd.strip() != '':
                kwrds4filter.append(kwrd.strip())
                
        if filtered_by_kwrd.count() == 0:
            # filtered_by_kwrd = Instance.objects.filter(branchSite__onSiteTech=self_obj.request.user)
            filtered_by_kwrd = Contract.objects.all()

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
                
        if filtered_by_kwrd.count() == 0:
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
                
        if filtered_by_kwrd.count() == 0:
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


class SearchResultsListView(LoginRequiredMixin, generic.base.TemplateView):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        search_model = ''
        search_model_kwrd = "'"
        if search_model_kwrd in self.request.GET.get('q'):
            search_model = self.request.GET.get('q').split(search_model_kwrd)[0].lower()
            kwrd_grps = self.request.GET.get('q').split(search_model_kwrd)[1].split('+')
        else:
            kwrd_grps = self.request.GET.get('q').split('+')

        context |= get_search_results_contract(self, kwrd_grps, context)
        context |= get_search_results_legalEntity(self, kwrd_grps, context)
        context |= get_search_results_paymentRequest(self, kwrd_grps, context)
        context |= get_search_results_instance(self, kwrd_grps, context)

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
        """
        """
        paginator = Paginator(context['object_list'], 25)
        page_obj = paginator.get_page(self.request.GET.get("page"))
        context['paginator'] = paginator
        context['page_obj'] = page_obj
        context['is_paginated'] = True
        """

        messages.info(
            self.request, "%s x Instance, %s x Contract, %s x Legal Entity, and %s x Payment Request found" % (
                context["instance_list"].count(), 
                context["contract_list"].count(),
                context["legalentity_list"].count(),
                context["paymentrequest_list"].count()
                )
            )
        
        self.template_name = 'nanobase/search_result_list.html'

        return context


class UserListView(LoginRequiredMixin, generic.ListView):
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
        context["userprofiles"] = userprofiles
        # context["now"] = timezone.now().strftime("%Y-%m-%d %H:%M:%S")

        return context


class UserCreateView(LoginRequiredMixin, CreateView):
    model = User
    fields = ['username', 'first_name', 'last_name', 'email', ] # '__all__'
    # template_name = "TEMPLATE_NAME"
    success_url = reverse_lazy('nanoassets:supported-instance-list')


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


@login_required
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


@login_required
def get_digital_copy_display(request, pk):
    digital_copy_instance = get_object_or_404(UploadedFile, pk=pk)
    digital_copy_path = digital_copy_instance.digital_copy.name
    try:
        digital_copy = open(digital_copy_path, 'rb')
        # return FileResponse(digital_copy, content_type='application/pdf')
        return FileResponse(digital_copy)
    except FileNotFoundError:
        # raise Http404
        messages.warning(request, 'the file [ ' + digital_copy_path + ' ] does NOT exist')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面


@login_required
def get_digital_copy_delete(request, pk):
    digital_copy_instance = get_object_or_404(UploadedFile, pk=pk)
    digital_copy_path = digital_copy_instance.digital_copy.name

    if os.path.exists(digital_copy_path):
        os.remove(digital_copy_path)

        ChangeHistory.objects.create(
            on=timezone.now(),
            by=request.user,
            db_table_name=digital_copy_instance.db_table_name,
            db_table_pk=digital_copy_instance.db_table_pk,
            detail='the Digital Copy [ ' + digital_copy_path + ' ] was deleted'
            )

        number_of_objects_deleted, dictionary_with_the_number_of_deletions_per_object_type = digital_copy_instance.delete()

        messages.info(request, 'Digital Copy of [ ' + digital_copy_path + ' ] was deleted')
        
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
        
    else:
        messages.warning(request, 'the Digital Copy [ ' + digital_copy_path + ' ] does NOT exist')
        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面

    """
    try:
        digital_copy = open(digital_copy_path, 'rb')
        f = File(digital_copy)
        f.delete(save=True)
        # return FileResponse(digital_copy, content_type='application/pdf')
        return FileResponse(digital_copy)
    except FileNotFoundError:
        raise Http404
    """


@login_required
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


@login_required
def index(request):
    return render(request, "index.html", {})


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