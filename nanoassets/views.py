from django.shortcuts import render, get_object_or_404, redirect

from django.contrib import messages
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin

from django.conf import settings
# from django.core.mail import send_mail, EmailMessage, EmailMultiAlternatives
from django.core.mail import EmailMessage
from django.core import serializers
from django.template.loader import get_template
# from django.template import Context

from django.views import generic
# from django.views.generic.edit import CreateView, UpdateView, DeleteView
# from django.urls import reverse_lazy
from django.utils import timezone

from django.db.models import Q

# from .forms import NewInstanceForm
from .models import ModelType, Instance, branchSite, disposalRequest, Config
from nanopay.models import Contract
from nanobase.models import ChangeHistory, UploadedFile, SubCategory

# Create your views here.

class InstanceDisposalRequestDetailView(LoginRequiredMixin, generic.DetailView):
    model = disposalRequest
    template_name = 'nanoassets/instance_disposal_request_detail.html'


class InstanceDisposalRequestListView(LoginRequiredMixin, generic.ListView):
    model = disposalRequest
    template_name = 'nanoassets/instance_disposal_request_list.html'
    # paginate_by = 10

"""
class InstanceSearchResultsListView(LoginRequiredMixin, generic.ListView):
    model = Instance
    template_name = 'nanoassets/instance_list_search_results.html'
    # paginate_by = 32

    def get_queryset(self):
        object_list = Instance.objects.none()

        kwrd_grps = self.request.GET.get('q').split('+')
        for kwrd_grp in kwrd_grps:
            filtered_by_kwrd = Instance.objects.none()
            # kwrds = self.request.GET.get('q').split(',')
            kwrds = kwrd_grp.split(',')
            kwrds4instance = []
            for kwrd in kwrds:
                if kwrd.strip() != '':
                    configs = Config.objects.filter(Q(configPara__icontains=kwrd.strip()))
                    if configs.count() > 0:
                        for config in configs:
                            filtered_by_kwrd = filtered_by_kwrd | Instance.objects.filter(pk__icontains=config.db_table_pk)
                    else:
                        kwrds4instance.append(kwrd.strip())
                    
            if filtered_by_kwrd.count() == 0:
                filtered_by_kwrd = Instance.objects.filter(branchSite__onSiteTech=self.request.user)

            for kwrd in kwrds4instance:
                # kwrd = kwrd.strip()
                filtered_by_kwrd = filtered_by_kwrd.filter(
                    Q(serial_number__icontains=kwrd.strip()) |
                    Q(model_type__name__icontains=kwrd.strip()) |
                    Q(model_type__manufacturer__name__icontains=kwrd.strip()) |
                    Q(model_type__sub_category__name__icontains=kwrd.strip()) |
                    Q(status__icontains=kwrd.strip()) |
                    Q(owner__username__icontains=kwrd.strip()) |
                    Q(owner__first_name__icontains=kwrd.strip()) |
                    Q(owner__last_name__icontains=kwrd.strip()) |
                    Q(owner__email__icontains=kwrd.strip()) |
                    Q(hostname__icontains=kwrd.strip()) |
                    Q(branchSite__name__icontains=kwrd.strip()) |
                    # Q(branchSite__city__name__icontains=kwrd.strip())
                    Q(branchSite__city__icontains=kwrd.strip())
                )

            object_list = object_list | filtered_by_kwrd
            # object_list = object_list.union(filtered_by_kwrd)

        if object_list:
            messages.info(self.request, "%s results found" % object_list.count())
        else:
            messages.info(self.request, "no results found")
            # self.request.GET = self.request.GET.copy()
            # self.request.GET['q'] = ''

        return object_list.distinct() # 去重 / deduplication

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        sub_categories = []
        for instance in self.object_list:
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
            if owner.username != 'admin' and 'tishmanspeyer.com' in owner.email:
                owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        context["owner_list"] = owner_list

        return context
"""

@login_required
def InstanceHostnameUpdate(request, pk):
    if request.method == 'POST':
        previous_url = request.META.get('HTTP_REFERER')
        instance = get_object_or_404(Instance, pk=pk)
        new_hostname = request.POST.get('hostname_re_name_to').strip()
        if new_hostname != '' and new_hostname != instance.hostname:
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='the Hostname of IT Assets [ ' + instance.serial_number + ' ] was renamed from [ '
                + (instance.hostname if instance.hostname else 'None') + ' ] to [ ' + new_hostname + ' ]'
                )
            messages.info(request, 'the Hostname of IT Assets [ ' + instance.serial_number + ' ] was renamed from [ '
                          + (instance.hostname if instance.hostname else 'None') + ' ] to [ ' + new_hostname + ' ]')
            instance.hostname = new_hostname
            instance.save()
            return redirect(previous_url)
        else:
            messages.warning(request, 'the Hostname got nothing to change')
            return redirect(previous_url)


class InstanceByTechListView(LoginRequiredMixin, generic.ListView):
    model = Instance
    template_name = 'nanoassets/instance_list_by_tech.html'
    # paginate_by = 32

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        sub_categories = []
        for instance in self.object_list:
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
            if owner.username != 'admin' and 'tishmanspeyer.com' in owner.email:
                owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        context["owner_list"] = owner_list
        """

        return context

    def get_queryset(self):
        return super().get_queryset().exclude(status__icontains="buyBACK").filter(branchSite__onSiteTech=self.request.user)  # 跨多表查询


class InstanceByUserListView(LoginRequiredMixin, generic.ListView):
    model = Instance
    template_name = 'nanoassets/instance_list_by_user.html'

    def get_queryset(self):
        if self.request.GET.get('id'):
            object_list = super().get_queryset().filter(owner=User.objects.get(username=self.request.GET.get('id')))
        else:
            object_list = super().get_queryset().filter(owner=self.request.user).filter(status__icontains='use').order_by('eol_date')
        
        for obj in object_list:
            obj.configs = Config.objects.filter(db_table_name=obj._meta.db_table, db_table_pk=obj.pk).order_by("-on") # add vakue to querySet | 往 querySet 里增加数据
        
        return object_list
        # return Instance.objects.filter(owner=self.request.user).filter(status__exact='u').order_by('eol_date')


class InstanceDetailView(LoginRequiredMixin, generic.DetailView):
    model = Instance

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        configs = Config.objects.filter(db_table_name=self.object._meta.db_table, db_table_pk=self.object.pk).order_by("-on")
        for config in configs:
            if Config.objects.filter(db_table_name=config._meta.db_table, db_table_pk=config.pk):
                config.has_sub_config = Config.objects.filter(db_table_name=config._meta.db_table, db_table_pk=config.pk).count()
            else:
                config.has_sub_config = False
            config.digital_copies = UploadedFile.objects.filter(db_table_name=config._meta.db_table, db_table_pk=config.pk).order_by("-on")
        context["configs"] = configs

        changes = ChangeHistory.objects.filter(db_table_name=self.object._meta.db_table, db_table_pk=self.object.pk).order_by("-on")
        context["changes"] = changes

        model_type_list = []
        for model_type in ModelType.objects.all():
            model_type_list.append('%s - %s' % (model_type.manufacturer, model_type.name))
        context["model_type_list"] = model_type_list

        hostname_list = []
        for instance in Instance.objects.all():
            if instance.hostname != None and not instance.hostname in hostname_list:
                hostname_list.append(instance.hostname)
        context["hostname_list"] = hostname_list
        
        """
        owner_list = []
        for owner in User.objects.all():
            if owner.username != 'admin' and 'tishmanspeyer.com' in owner.email:
                owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        context["owner_list"] = owner_list

        subcategory_list = []
        for subcategory in SubCategory.objects.all():
            subcategory_list.append(subcategory)
        context["subcategory_list"] = subcategory_list
        """

        return context


"""
@login_required
def InstanceNew(request):
    model_type_list = []
    for model_type in ModelType.objects.all():
        model_type_list.append('%s ( %s )' % (model_type.name, model_type.manufacturer))

    owner_list = []
    for owner in User.objects.all():
        if owner.username != 'admin' and 'tishmanspeyer.com' in owner.email:
            owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        
    branchsite_list = branchSite.objects.all()

    contract_list = Contract.objects.all()
    
    if request.method == 'POST':
        form = NewInstanceForm(request.POST)
        if form.is_valid():
            new_instance = Instance()
            new_instance.serial_number = form.cleaned_data['serial_number'].strip()
            new_instance.model_type = get_object_or_404(ModelType, name=form.cleaned_data['model_type'].split("(")[0].strip())
            new_instance.owner = get_object_or_404(User, username=form.cleaned_data['owner'].strip(")").split("(")[-1].strip())
            new_instance.status = form.cleaned_data['status'].strip()
            new_instance.branchSite = get_object_or_404(branchSite, name=form.cleaned_data['branchSite'].strip())

            new_instance.save()

            # new_instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'a New IT Assets was added by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=new_instance._meta.db_table,
                    db_table_pk=new_instance.pk,
                    detail='1 x New IT Assets was added'
                    )
            
            contract_associated_with = get_object_or_404(Contract, briefing=form.cleaned_data['contract'].strip())
            contract_associated_with.assets.add(new_instance)

            # contract_associated_with.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'a New IT Assets [ ' + new_instance.serial_number + ' ] was associated with this Contract by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=contract_associated_with._meta.db_table,
                    db_table_pk=contract_associated_with.pk,
                    detail='1 x New IT Assets [ ' + new_instance.serial_number + ' ] was associated with this Contract'
                    )

            messages.info(request, 'the New IT Assets [ ' + form.cleaned_data['serial_number'] + ' ] was added')

            return redirect('nanoassets:instance-detail', pk=new_instance.pk) # redirect to a new URL:
    else:
        form = NewInstanceForm()
    
    return render(request, 'nanoassets/instance_new.html', {
        'form': form,
        'model_type_list': model_type_list,
        'owner_list': owner_list,
        'branchsite_list': branchsite_list,
        'contract_list': contract_list
        })
"""
