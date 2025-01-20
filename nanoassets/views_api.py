# import json
import operator

from functools import reduce

from django.http import JsonResponse

from django.core.exceptions import FieldDoesNotExist
from django.core.serializers import serialize
from django.core.mail import EmailMessage
# from django.core.exceptions import FieldDoesNotExist

from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from django.urls import reverse
from django.utils import timezone

from django.shortcuts import get_object_or_404
from django.template.loader import get_template

from nanobase.views import get_env, is_iT_staff

from django.db.models import Q

from .models import ModelType, Instance, branchSite, disposalRequest, configClass, Config
from nanopay.models import Contract
from nanobase.models import ChangeHistory, SubCategory, UploadedFile


# --- config ---

@login_required
def config_is_active(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instanceConfig = Config.objects.get(pk=request.POST.get('pk'))
        
        chg_log = 'activated' if request.POST.get('is_active') == 'true' else 'deactivated'
        chg_log = instanceConfig.configClass.name + ' # ' + instanceConfig.order + ' ' + instanceConfig.configPara + ' was ' + chg_log
        
        try:
            instance = Instance.objects.get(pk=instanceConfig.db_table_pk)
        except Instance.DoesNotExist as e:
            parentConfig = Config.objects.get(pk=instanceConfig.db_table_pk)
            instance = Instance.objects.get(pk=parentConfig.db_table_pk)

        ChangeHistory.objects.create(
            on=timezone.now(),
            by=request.user,
            db_table_name=instance._meta.db_table,
            db_table_pk=instance.pk,
            detail=chg_log,
            )
        
        instanceConfig.is_active = not instanceConfig.is_active
        instanceConfig.on = timezone.now()
        instanceConfig.save()

        response = JsonResponse({"alert_msg": chg_log, "alert_type": 'success',})
        return response


@login_required
def crud_field(request_original, request_post_copy, crud_item, crud_instance, mail_instance, chg_log, ):
    for k, v in request_post_copy.items():
        try:
            crud_instance._meta.get_field(k)
            
            if request_post_copy.get('crud'):
                if getattr(crud_instance, k):
                    from_orig = getattr(crud_instance, k)
                    try:
                        # Config._meta.get_field(k).related_fields
                        crud_instance._meta.get_field(k).related_fields
                        from_orig = from_orig.name
                    except AttributeError as e:
                        pass
                else: 
                    from_orig = '🈳'
                
                to_target = str(v) if v != '' else '🈳'
                
                if (bool(getattr(crud_instance, k)) or bool(v)) and (from_orig != to_target):
                    chg_log += 'The ' + k.capitalize() + ' of ' + crud_item + ' was changed from [ ' + str(from_orig) + ' ] to [ ' + to_target + ' ]; '

            else:
                from_orig = False
                to_target = True

            if (not bool(getattr(crud_instance, k)) and not bool(v)) or (from_orig == to_target):
                pass
            elif v == '':
                if 'date' in crud_instance._meta.get_field(k).get_internal_type().lower():
                    setattr(crud_instance, k, None)
            elif k == 'configClass':
                crud_instance.configClass = get_object_or_404(configClass, name=v)
            elif k == 'scanned_copy':
                chg_log += "this POST item is A scanned_copy"
            else:
                setattr(crud_instance, k, v)
                
            crud_instance.save()
            
        except FieldDoesNotExist as e:
            pass

    scanned_copies = request_original.FILES.getlist('scanned_copy')
    for scanned_copy in scanned_copies:
        UploadedFile.objects.create(
            on=timezone.now(),
            by=request_original.user,
            db_table_name=crud_instance._meta.db_table,
            db_table_pk=crud_instance.pk,
            digital_copy=scanned_copy,
        )
        chg_log += 'digital copy [ ' + scanned_copy.name + ' ] for ' + crud_item + ' was added; '
    
    ChangeHistory.objects.create(
        on=timezone.now(),
        by=request_original.user,
        db_table_name=mail_instance._meta.db_table,
        db_table_pk=mail_instance.pk,
        detail=chg_log,
    )

    return chg_log


@login_required
def config_cud(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        request_post_copy = request.POST.copy()
        request_post_copy['crud'] = True if 'update' in request_post_copy['crud'] else False
        request_post_copy['is_secret'] = True if request_post_copy['is_secret'] == 'true' else False
        chg_log = ''
        config_class_order = request.POST.get('configClass') + ' # ' + request.POST.get('order')
        config_para = 'X X X X X X X X' if request.POST.get('is_secret') == 'true' else request.POST.get('configPara')
        """
        if request.POST.get('crud') == 'deleteConfig':
            instanceConfig = Config.objects.get(pk=request.POST.get('pk'))
            instance = Instance.objects.get(pk=instanceConfig.db_table_pk)

            chg_log = '1 x Config [ ' + instanceConfig.configClass.name + ' # ' + instanceConfig.order + ' ' + instanceConfig.configPara + ' ]'

            if UploadedFile.objects.filter(db_table_name=instanceConfig._meta.db_table, db_table_pk=instanceConfig.pk).exists():
                chg_log += ' with the digital copy '
                for uploadedFile in UploadedFile.objects.filter(db_table_name=instanceConfig._meta.db_table, db_table_pk=instanceConfig.pk):
                    uploadedFile_path = uploadedFile.digital_copy.name
                    chg_log += uploadedFile_path + ', '
                    if os.path.exists(uploadedFile_path):
                        os.remove(uploadedFile_path)
                        
                        number_of_objects_deleted, dictionary_with_the_number_of_deletions_per_object_type = uploadedFile.delete()
            instanceConfig.delete()
            chg_log += ' was removed'
        else:
        """ # feature of delete Config was removed from this fn
        pks = request.POST.get('pk').split(',')
        for pk in pks:
            if request.POST.get('crud') == 'create_Config':
                # instance = Instance.objects.get(pk=request.POST.get('pk'))
                instance = Instance.objects.get(pk=pk)
                instanceConfig = Config.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=instance._meta.db_table,
                    db_table_pk=instance.pk,
                )
                chg_log = '1 x new Config [ ' + config_class_order + ' ' + config_para + ' ] was added; '
                crud_field(request, request_post_copy, config_class_order, instanceConfig, instance, chg_log)
            elif request.POST.get('crud') == 'create_Sub_Config':
                # relatedConfig = Config.objects.get(pk=request.POST.get('pk'))
                relatedConfig = Config.objects.get(pk=pk)
                instanceConfig = Config.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=relatedConfig._meta.db_table,
                    db_table_pk=relatedConfig.pk,
                )
                instance = Instance.objects.get(pk=relatedConfig.db_table_pk)
                chg_log = '1 x new sub Config [ ' + config_class_order + ' ' + config_para + ' ] related to [ ' + relatedConfig.configClass.name + ' ] was added'
                crud_field(request, request_post_copy, config_class_order, instanceConfig, instance, chg_log)
            elif request.POST.get('crud') == 'update_Config':
                # instanceConfig = Config.objects.get(pk=request.POST.get('pk'))
                instanceConfig = Config.objects.get(pk=pk)
                instanceConfig.on = timezone.now()
                instance = Instance.objects.get(pk=instanceConfig.db_table_pk)
                chg_log = crud_field(request, request_post_copy, config_class_order, instanceConfig, instance, chg_log)
            else:
                pass

        response = JsonResponse({"alert_msg": chg_log, "alert_type": 'success',})
        return response


@login_required
def jsonResponse_config_getLst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        
        configPara_lst = {}
        for config_class in configClass.objects.all():
            configPara_lst[config_class.name] = dict(Config.objects.filter(configClass=config_class).values_list('configPara', 'pk'))
            # configClass_lst[config_class.name] = config_class.desc
        
        configClass_lst = dict(configClass.objects.all().values_list('name', 'pk'))
        
        details = {}
        digital_copies = {}
        sub_configs = {}
        if request.GET.get('pK'):
            instanceConfg = Config.objects.get(pk=request.GET.get('pK'))
            details['configClass'] = instanceConfg.configClass.name
            details['order'] = instanceConfg.order
            details['configPara'] = instanceConfg.configPara
            details['expire'] = instanceConfg.expire
            details['comments'] = instanceConfg.comments
            details['is_secret'] = instanceConfg.is_secret
            details['is_active'] = instanceConfg.is_active

            for digital_copy in UploadedFile.objects.filter(db_table_name=instanceConfg._meta.db_table, db_table_pk=instanceConfg.pk).order_by("-on"):
                digital_copies[digital_copy.pk] = digital_copy.get_digital_copy_base_file_name()

            for sub_config in Config.objects.filter(db_table_name=instanceConfg._meta.db_table, db_table_pk=instanceConfg.pk).order_by("-on"):
                sub_configs[sub_config.pk] = {}
                sub_configs[sub_config.pk]['configClass'] = sub_config.configClass.name
                sub_configs[sub_config.pk]['order'] = sub_config.order
                sub_configs[sub_config.pk]['configPara'] = sub_config.configPara
                sub_configs[sub_config.pk]['expire'] = sub_config.expire
                sub_configs[sub_config.pk]['comments'] = sub_config.comments
                sub_configs[sub_config.pk]['is_secret'] = sub_config.is_secret
                sub_configs[sub_config.pk]['is_active'] = sub_config.is_active
                sub_configs[sub_config.pk]['on'] = sub_config.on.date()
                sub_configs[sub_config.pk]['by'] = sub_config.by.get_full_name()

            # response.append(details)

        response = [configClass_lst, configPara_lst, details, digital_copies, sub_configs, ]
        return JsonResponse(response, safe=False)


# --- instance list ---

@login_required
def jsonResponse_instance_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        instances = Instance.objects.exclude(status__icontains="buyBACK").filter(branchSite__onSiteTech=request.user)  # 跨多表查询

        instance_lst = {}
        # owner_lst = {}
        status_lst = {}
        model_type_lst = {}
        sub_categories_lst = {}
        manufacturer_lst = {}
        branchSite_lst = {}
        contract_lst = {}

        for instance in instances:
            instance_lst[instance.pk] = {}

            for field in instance._meta.get_fields():
                if field.name == 'disposal_request':
                    if instance.disposal_request:
                        instance_lst[instance.pk][field.name] = True
                    else:
                        instance_lst[instance.pk][field.name] = False
                elif field.name == 'status':
                    instance_lst[instance.pk]['is_list'] = True # 标志 是否 在 页面 呈现
                    if instance.status:
                        instance_lst[instance.pk][field.name] = instance.get_status_display()   # status_lst[instance.status] = instance.get_status_display()
                        status_lst[instance.get_status_display()] = instance.status
                    else:
                        instance_lst[instance.pk][field.name] = ''
                elif field.name == 'contract':
                    # instance_lst[instance.pk]['contract'] = {instance.contract_set.first().pk: instance.contract_set.first().get_type_display()} if instance.contract_set.exists() else {}
                    if instance.contract_set.exists():
                        instance_lst[instance.pk]['contract'] = {}
                        # instance_lst[instance.pk]['contract'] = instance.contract_set.first().get_type_display()
                        # instance_lst[instance.pk]['contract'] = {instance.contract_set.first().pk: instance.contract_set.first().get_type_display()}

                        # instance_lst[instance.pk]['contract']['pk'] = instance.contract_set.first().pk
                        instance_lst[instance.pk]['contract']['get_type_display'] = instance.contract_set.first().get_type_display()
                        instance_lst[instance.pk]['contract']['get_time_remaining_in_percent'] = instance.contract_set.first().get_time_remaining_in_percent()
                        instance_lst[instance.pk]['contract']['get_absolute_url'] = instance.contract_set.first().get_absolute_url()
                        
                        contract_lst[instance.contract_set.first().briefing] = instance.contract_set.first().pk
                    else:
                        # instance_lst[instance.pk]['contract'] = ''
                        instance_lst[instance.pk][field.name] = ''
                else:
                    instance_field = getattr(instance, field.name)
                    if field.is_relation:
                        if field.name == 'owner':
                            instance_lst[instance.pk]['owner'] = instance_field.get_full_name() if instance_field else ''
                            # instance_lst[instance.pk]['owner'] = {instance_field.pk: instance_field.get_full_name()} if instance_field else {}
                        else:
                            instance_lst[instance.pk][field.name] = instance_field.name if instance_field else ''
                            # instance_lst[instance.pk][field.name] = {instance_field.pk: instance_field.name} if instance_field else {}

                            if field.name == 'branchSite':
                                branchSite_lst[instance_field.name] = instance_field.pk
                            elif field.name == 'model_type':
                                model_type_lst[instance_field.name] = instance_field.pk
                                if instance_field.sub_category:
                                    instance_lst[instance.pk]['sub_category'] = instance_field.sub_category.name
                                    # instance_lst[instance.pk]['sub_category'] = {instance_field.sub_category.pk: instance_field.sub_category.name}
                                    sub_categories_lst[instance_field.sub_category.name] = instance_field.sub_category.pk
                                else:
                                    instance_lst[instance.pk]['sub_category'] = ''  # instance_lst[instance.pk]['sub_category'] = {}
                                if instance_field.manufacturer:
                                    instance_lst[instance.pk]['manufacturer'] = instance_field.manufacturer.name
                                    # instance_lst[instance.pk]['manufacturer'] = {instance_field.manufacturer.pk: instance_field.manufacturer.name}
                                    manufacturer_lst[instance_field.manufacturer.name] = instance_field.manufacturer.pk
                                else:
                                    instance_lst[instance.pk]['manufacturer'] = ''  # instance_lst[instance.pk]['manufacturer'] = {}
                    else:
                        instance_lst[instance.pk][field.name] = instance_field if instance_field else ''

        # response = [json.loads(serialize("json", instances)), owner_lst, status_lst, model_type_lst, sub_categories_lst, manufacturer_lst, branchSite_lst, contract_lst, ]
        response = [instance_lst, status_lst, model_type_lst, sub_categories_lst, manufacturer_lst, branchSite_lst, contract_lst, ]

        return JsonResponse(response, safe=False)


# --- new ---

@login_required
def new(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        serial_number_lst_posted = request.POST.get('serial_number').split(',')
        updated_instance_lst = {}
        for serial_number_posted in serial_number_lst_posted:
            new_instance = Instance()
            new_instance.serial_number = serial_number_posted.strip()
            # new_instance.model_type = get_object_or_404(ModelType, name=request.POST.get('model_type').split("(")[0].strip())
            new_instance.model_type = get_object_or_404(ModelType, name=request.POST.get('model_type'))
            
            if request.POST.get('isDefaultHostname') != 'false':
                new_instance.hostname == get_env('ORG_ABBR') + '-' + new_instance.serial_number
                

            # new_instance.owner = get_object_or_404(User, username=request.POST.get('owner').strip(")").split("(")[-1].strip())
            
            if request.POST.get('owner') == '':
                new_instance.status = 'AVAILABLE'
            else:
                new_instance.status = 'inUSE'

                if len(serial_number_lst_posted) == 1:
                    new_instance.owner = get_object_or_404(User, username=request.POST.get('owner'))
            
            new_instance.branchSite = get_object_or_404(branchSite, name=request.POST.get('branchSite').strip())

            new_instance.save()

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=new_instance._meta.db_table,
                db_table_pk=new_instance.pk,
                detail='this IT Assets [ ' + new_instance.serial_number + ' ] was added'
            )
                
            # contract_associated_with = get_object_or_404(Contract, briefing=request.POST.get('contract').strip())
            contract_associated_with = get_object_or_404(Contract, pk=request.POST.get('contract').strip())
            contract_associated_with.assets.add(new_instance)

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=contract_associated_with._meta.db_table,
                db_table_pk=contract_associated_with.pk,
                detail='1 x new IT Assets [ ' + new_instance.serial_number + ' ] was associated with this Contract'
            )

            updated_instance_lst[new_instance.pk] = new_instance.status

        response = JsonResponse(updated_instance_lst)
        return response


@login_required
def jsonResponse_new_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        instances = Instance.objects.all()
        instance_lst = {}
        for instance in instances:
            instance_lst[instance.serial_number] = instance.pk
        
        model_types = ModelType.objects.all()
        model_type_lst = {}
        for model_type in model_types:
            if model_type.manufacturer:
                model_type_lst['%s, %s' % (model_type.name, model_type.manufacturer.name)] = model_type.pk
            else:
                model_type_lst[model_type.name] = model_type.pk
        
        # owners = User.objects.filter(email__icontains='org.com')
        owners = User.objects.filter(
            #　the filter will return User objects if their email contains any of the substrings from a list
            reduce(operator.or_, (Q(email__icontains=domain) for domain in get_env('ORG_DOMAIN')))
        )
        owner_lst = {}
        for owner in owners:
            owner_lst['%s ( %s )' % (owner.get_full_name(), owner.username)] = owner.pk
        owner_lst[''] = ''

        branchSites = branchSite.objects.all()
        branchSite_lst = {}
        for branch_site in branchSites:
            branchSite_lst[branch_site.name] = branch_site.pk

        contracts = Contract.objects.all()
        contract_lst = {}
        for contract in contracts:
            # contract_lst[contract.briefing.strip()] = contract.get_absolute_url()
            contract_lst[contract.briefing.strip()] = contract.pk

        response = [instance_lst, model_type_lst, owner_lst, branchSite_lst, contract_lst, get_env("ORG_ABBR")]
        return JsonResponse(response, safe=False)


# --- disposing ---

@login_required
def disposal_request_approve(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        disposal_request_pk = request.POST.get('disposalRequestPk').strip()

        disposal_request = get_object_or_404(disposalRequest, pk=disposal_request_pk)
        disposal_request.status = 'A'
        disposal_request.approved_by = request.user
        disposal_request.approved_on = timezone.now()

        disposal_request.save()

        updated_instance_lst = {}
        for dispoasedInstance in disposal_request.instance_set.all():
            if disposal_request.type == 'S':
                dispoasedInstance.status = 'SCRAPPED'
                detail = 'Scrapping request was Approved'
            elif disposal_request.type == 'R':
                dispoasedInstance.status = 'reUSE'
                detail = 'Reusing request was Approved'
            elif dispoasedInstance.type == 'B':
                dispoasedInstance.status = 'buyBACK'
                detail = 'Buy-back request was Approved'
                
            dispoasedInstance.save()

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=dispoasedInstance._meta.db_table,
                db_table_pk=dispoasedInstance.pk,
                detail=detail
                )

            updated_instance_lst[dispoasedInstance.pk] = dispoasedInstance.status

        IT_reviewer_emails = []
        for reviewer in User.objects.filter(groups__name='IT Reviewer'):
            IT_reviewer_emails.append(reviewer.email)

        message = get_template("nanoassets/instance_disposal_request_email_approve.html").render({
            'protocol': 'http',
            # 'domain': '127.0.0.1:8000',
            'domain': request.META['HTTP_HOST'],
            # 'instances': request.POST.getlist('instance'),
            'disposal_request': disposal_request,
        })
        mail = EmailMessage(
            subject='iTS expr - Pl notice - Disposal request was Approved by ' + disposal_request.approved_by.get_full_name(),
            body=message,
            from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
            to=[disposal_request.requested_by.email],
            cc=IT_reviewer_emails,
            # reply_to=[EMAIL_ADMIN],
            # connection=
        )
        mail.content_subtype = "html"
        mail.send()
        messages.success(request, "the notification email with Approval decision was sent.")

        # return redirect('nanoassets:instance-disposal-request-list')
        # response = JsonResponse({"url_redirect": reverse("nanoassets:instance-disposal-request-list")})
        response = JsonResponse(updated_instance_lst)
        return response


@login_required
def disposal_request(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        bulkUpdModalInputValue = request.POST.get('bulkUpdModalInputValue').strip().split(",")[0].strip()
        if bulkUpdModalInputValue == 'Scraping':
            type = 'S'
            detail='Scraping requested'
        elif bulkUpdModalInputValue == 'Reusing':
            type = 'R'
            detail='Reusing requested'
        elif bulkUpdModalInputValue == 'Buying back':
            type = 'B'
            detail='Buying back requested'

        new_req = disposalRequest.objects.create(
                type=type,
                requested_by=request.user,
                requested_on=timezone.now(),
                )
        new_req.save()
        
        updated_instance_lst = {}
        for index, pk in enumerate(instance_selected_pk):
            selected_instance = get_object_or_404(Instance, pk=pk)
            selected_instance.disposal_request = new_req
            selected_instance.save()

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=selected_instance._meta.db_table,
                db_table_pk=selected_instance.pk,
                detail=detail
                )

            updated_instance_lst[pk] = index

        if new_req:
            IT_reviewer_emails = []
            for reviewer in User.objects.filter(groups__name='IT Reviewer'):
                IT_reviewer_emails.append(reviewer.email)

            message = get_template("nanoassets/instance_disposal_request_email.html").render({
                'protocol': 'http',
                # 'domain': '127.0.0.1:8000',
                'domain': request.META['HTTP_HOST'],
                'new_req': new_req,
            })
            mail = EmailMessage(
                subject='iTS expr - Pl approve - IT assets disposal requested by ' + new_req.requested_by.get_full_name(),
                body=message,
                from_email='nanoMsngr <do-not-reply@' + get_env('ORG_DOMAIN')[0] + '>',
                to=IT_reviewer_emails,
                cc=[request.user.email],
                # reply_to=[EMAIL_ADMIN],
                # connection=
            )
            mail.content_subtype = "html"
            mail.send()
            messages.success(request, "the notification email with the request detail is sent")

            response = JsonResponse(updated_instance_lst)
            return response
            # return redirect('nanoassets:instance-disposal-request-list')


@login_required
def jsonResponse_disposal_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            status = selected_instance.status
            if selected_instance.disposal_request:
                chk_lst[selected_instance.pk] = 'disposalRequested'
            else:
                chk_lst[selected_instance.pk] = selected_instance.status

        opt_lst = {}
        if status == 'AVAILABLE' or status == 'reUSE':
            opt_lst['Scraping'] = 'SCRAPPED'
        elif status == 'SCRAPPED':
            opt_lst['Reusing'] = 'reUSE'
            opt_lst['Buying back'] = 'buyBACK'
        """
        else:
            opt_lst['Scraping'] = 'SCRAPPED'
            opt_lst['Reusing'] = 'reUSE'
            opt_lst['Buying back'] = 'buyBACK'
        """
        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


# --- in Repairing ---

@login_required
def in_repair(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        instanceSelectedStatus = request.POST.get('instanceSelectedStatus')
        updated_instance_lst = {}
        for index, pk in enumerate(instance_selected_pk):
            selected_instance = get_object_or_404(Instance, pk=pk)

            if instanceSelectedStatus == 'inREPAIR':
                change_history_detail = 'Sent for repairing'
            else:
                change_history_detail = 'Got back from repairing'
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=selected_instance._meta.db_table,
                db_table_pk=selected_instance.pk,
                detail=change_history_detail
                )
            selected_instance.status = request.POST.get('instanceSelectedStatus')
            selected_instance.save()

            updated_instance_lst[pk] = instanceSelectedStatus

        response = JsonResponse(updated_instance_lst)
        return response


# --- model / type Changing to ---

@login_required
def jsonResponse_model_type_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            if selected_instance.model_type:
                model_type = selected_instance.model_type
                chk_lst[model_type.name] = model_type.pk
            else:
                chk_lst[''] = selected_instance.pk

        model_types = ModelType.objects.all()
        opt_lst = {}
        for model_type in model_types:
            if not model_type.name in chk_lst:
                if model_type.manufacturer:
                    opt_lst['%s, %s' % (model_type.name, model_type.manufacturer.name)] = model_type.pk
                else:
                    opt_lst[model_type.name] = model_type.pk

        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


@login_required
def model_type_changing_to(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        try:
            bulkUpdModalInputValue = request.POST.get('bulkUpdModalInputValue').strip().split(",")[0].strip()
            # model_type_changed_to = ModelType.objects.get(name=request.POST['bulkUpdModalInputValue'])
            model_type_changed_to = ModelType.objects.get(name=bulkUpdModalInputValue)
        except (KeyError, SubCategory.DoesNotExist) as e:
            messages.info(request, 'the Model / Type given is invalid')
            response = JsonResponse({'Error': 'the Model / Type given is invalid'})
        else:
            updated_instance_lst = {}
            for index, pk in enumerate(instance_selected_pk):
                selected_instance = get_object_or_404(Instance, pk=pk)
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=selected_instance._meta.db_table,
                    db_table_pk=selected_instance.pk,
                    detail='Model / Type was changed to [ ' + model_type_changed_to.name + ' ] from [ ' + selected_instance.model_type.name + ' ]'
                    )
                updated_instance_lst[pk] = index
                selected_instance.model_type = model_type_changed_to
                selected_instance.save()

            # messages.info(request, 'the selected IT Assets were Transferred to ' + model_type_changed_to.name)
            response = JsonResponse(updated_instance_lst)
            
        return response


# --- Re-sub-categorizing to ---

@login_required
def jsonResponse_sub_category_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            if selected_instance.model_type and selected_instance.model_type.sub_category:
                sub_category = selected_instance.model_type.sub_category
                chk_lst[sub_category.name] = sub_category.pk
            else:
                chk_lst[''] = selected_instance.pk

        sub_categories = SubCategory.objects.all()
        opt_lst = {}
        for sub_category in sub_categories:
            if not sub_category.name in chk_lst:
                opt_lst[sub_category.name] = sub_category.pk

        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


@login_required
def re_subcategorizing_to(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        try:
            re_subcategorized_to = SubCategory.objects.get(name=request.POST['bulkUpdModalInputValue'])
        except (KeyError, SubCategory.DoesNotExist) as e:
            messages.info(request, 'the Sub-Category given is invalid')
            response = JsonResponse({'Error': 'the Sub-Category given is invalid'})
        else:
            updated_instance_lst = {}
            for index, pk in enumerate(instance_selected_pk):
                selected_instance = get_object_or_404(Instance, pk=pk)
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=selected_instance._meta.db_table,
                    db_table_pk=selected_instance.pk,
                    detail='Model Type of this IT Assets was re-sub-categorized to [ ' + re_subcategorized_to.name + ' ] from [ ' + str(selected_instance.model_type.sub_category) + ' ]'
                    )
                updated_instance_lst[pk] = index
                selected_instance.model_type.sub_category = re_subcategorized_to
                selected_instance.model_type.save()

            # messages.info(request, 'Model Type of this IT Assets was re-sub-categorized to ' + re_subcategorized_to.name)
            response = JsonResponse(updated_instance_lst)
            
        return response


# --- owner Re-assigning to ---

@login_required
def jsonResponse_owner_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            if selected_instance.owner:
                owner = selected_instance.owner
                chk_lst[owner.username] = owner.pk
            else:
                chk_lst[''] = selected_instance.pk

        # owners = User.objects.filter(email__icontains='org.com')
        owners = User.objects.filter(
            #　the filter will return User objects if their email contains any of the substrings from a list
            reduce(operator.or_, (Q(email__icontains=domain) for domain in get_env('ORG_DOMAIN')))
        )
        opt_lst = {}
        for owner in owners:
            if not owner.username in chk_lst:
                opt_lst['%s ( %s )' % (owner.get_full_name(), owner.username)] = owner.pk
        opt_lst[''] = ''

        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


@login_required
def owner_re_assigning_to(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        owner_re_assigned_to = request.POST.get('bulkUpdModalInputValue').strip(")").split("(")[-1].strip()
        owner_re_assigned_to = get_object_or_404(User, username=owner_re_assigned_to) if owner_re_assigned_to != '' else owner_re_assigned_to
        updated_instance_lst = {}
        for index, pk in enumerate(instance_selected_pk):
            selected_instance = get_object_or_404(Instance, pk=pk)
            if owner_re_assigned_to == '' and selected_instance.owner:
                change_history_detail = 'Returned from [ ' + selected_instance.owner.get_full_name() + ' ]'
                # msg = 'the IT Asset(s) [ ' + selected_instance.serial_number + ' ] was Returned from ' + selected_instance.owner.get_full_name()

                selected_instance.status = 'AVAILABLE'
                selected_instance.owner = None

            elif owner_re_assigned_to != '' and owner_re_assigned_to != selected_instance.owner:
                change_history_detail = 'Re-assigned to [ ' + owner_re_assigned_to.get_full_name() + ' ] from [ ' + (selected_instance.owner.get_full_name() if selected_instance.owner else ' 🈳 ') + ' ]'
                # msg = 'the IT Asset(s) [ ' + selected_instance.serial_number + ' ] was Re-assigned to [ ' + owner_re_assigned_to.get_full_name() + ' ] from [ ' + (selected_instance.owner.get_full_name() if selected_instance.owner else ' 🈳 ') + ' ]'

                selected_instance.status = 'inUSE'
                selected_instance.owner = owner_re_assigned_to

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=selected_instance._meta.db_table,
                db_table_pk=selected_instance.pk,
                detail=change_history_detail
                )
                
            # messages.info(request, msg)

            selected_instance.save()
            updated_instance_lst[pk] = index

        response = JsonResponse(updated_instance_lst)
        return response


# --- branch site Transferring to ---

@login_required
def jsonResponse_branchSite_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            # for branchSite in selected_instance.branchSite_set.all():
            branch_site = selected_instance.branchSite
            chk_lst[branch_site.name] = branch_site.pk

        branchSites = branchSite.objects.all()
        opt_lst = {}
        for branch_site in branchSites:
            if not branch_site.name in chk_lst:
                opt_lst[branch_site.name] = branch_site.pk

        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


@login_required
def branchSite_transferring_to(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        try:
            branchSite_transferred_to = branchSite.objects.get(name=request.POST['bulkUpdModalInputValue'])
        except (KeyError, branchSite.DoesNotExist) as e:
            messages.info(request, 'the Branch Site given is invalid')
            response = JsonResponse({'Error': 'the Branch Site given is invalid'})
        else:
            updated_instance_lst = {}
            for index, pk in enumerate(instance_selected_pk):
                selected_instance = get_object_or_404(Instance, pk=pk)
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=selected_instance._meta.db_table,
                    db_table_pk=selected_instance.pk,
                    detail='Transferred to [ ' + branchSite_transferred_to.name + ' ] from [ ' + selected_instance.branchSite.name + ' ]'
                    )
                updated_instance_lst[pk] = index
                selected_instance.branchSite = branchSite_transferred_to
                selected_instance.save()

            # messages.info(request, 'the selected IT Assets were Transferred to ' + branchSite_transferred_to.name)
            response = JsonResponse(updated_instance_lst)
            
        return response


# --- contract Associating with ---

@login_required
def jsonResponse_contract_lst(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT or not is_staff:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'GET':
        chk_lst = {}
        selected_instances_pk = tuple(request.GET.get('instanceSelectedPk').split(','))
        for index, pk in enumerate(selected_instances_pk):
            selected_instance = Instance.objects.get(pk=pk)
            for contract in selected_instance.contract_set.all():
                chk_lst[contract.briefing] = contract.pk

        contracts = Contract.objects.all()
        opt_lst = {}
        for contract in contracts:
            if not contract.briefing in chk_lst:
                opt_lst[contract.briefing] = contract.get_absolute_url()
        
        response = [opt_lst, chk_lst]
        return JsonResponse(response, safe=False)


@login_required
def contract_associating_with(request):
    is_iT, is_staff = is_iT_staff(request.user)
    if not is_iT or not is_staff:
        messages.warning(request, 'you are NOT authorized iT staff')
        return JsonResponse({"alert_msg": 'you are NOT authorized iT staff', "alert_type": 'danger',})
    
    if request.method == 'POST':
        instance_selected_pk = request.POST.get('instanceSelectedPk').split(',')
        try:
            # contract_associated_with = Contract.objects.filter(briefing__icontains=request.POST['bulkUpdModalInputValue']).first()
            contract_associated_with = Contract.objects.get(briefing=request.POST['bulkUpdModalInputValue'])
        except (KeyError, Contract.DoesNotExist) as e:
            messages.info(request, 'the Contract given is invalid')
            response = JsonResponse({'Error': 'the Contract given is invalid'})
        else:
            updated_instance_lst = {}
            for index, pk in enumerate(instance_selected_pk):
                selected_instance = get_object_or_404(Instance, pk=pk)
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=selected_instance._meta.db_table,
                    db_table_pk=selected_instance.pk,
                    detail='Associated with [ ' + contract_associated_with.briefing + ' ]'
                    )
                updated_instance_lst[pk] = index
                contract_associated_with.assets.add(selected_instance)
                contract_associated_with.save()

            # messages.info(request, 'the selected IT Assets were Associated with [ ' + contract_associated_with.briefing + ' ]')
            response = JsonResponse(updated_instance_lst)
        
        return response
