import os
import json
from datetime import datetime

from django.conf import settings

from django.http import JsonResponse

from django.utils import timezone

from django.shortcuts import get_object_or_404

from django.core.serializers import serialize
from django.core.exceptions import FieldDoesNotExist

from django.contrib.auth.decorators import user_passes_test #, login_required
from django.contrib.auth.models import User, Group
# from django.contrib import messages

from django.apps import apps
from django.db.models import Q

from nanobase.views import get_env, is_iT_staff, get_Contract_Qty_by_Legal_Entity

from .models import UserProfile, UserDept, ChangeHistory, UploadedFile
# from nanoassets.models import Instance
from nanopay.models import Contract, LegalEntity


@user_passes_test(is_iT_staff)
def get_digital_copy_delete(request, pk=False):
    if request.method == 'POST':

        if pk == False:
            pk = request.POST.get('pk')

        try:
            digital_copy_instance = get_object_or_404(UploadedFile, pk=pk)
        except Exception as e:
            pass
        else:
            digital_copy_path = digital_copy_instance.digital_copy.name

        if os.path.exists(digital_copy_path):
            os.remove(digital_copy_path)
            number_of_objects_deleted, dictionary_with_the_number_of_deletions_per_object_type = digital_copy_instance.delete()

            ChangeHistory.objects.create(
                on=timezone.now(), by=request.user,
                db_table_name=digital_copy_instance.db_table_name, db_table_pk=digital_copy_instance.db_table_pk,
                detail='digital Copy [ ' + digital_copy_path + ' ] was deleted'
            )
            
            response = JsonResponse({
                "alert_msg": 'Digital Copy of [ ' + digital_copy_path + ' ] was deleted',
                "alert_type": 'success',
            })
        else:
            response = JsonResponse({
                "alert_msg": 'Digital Copy [ ' + digital_copy_path + ' ] does NOT exist',
                "alert_type": 'danger',
            })

            """
            try:
                digital_copy = open(digital_copy_path, 'rb')
                f = File(digital_copy)
                f.delete(save=True)
                # return FileResponse(digital_copy, content_type='application/pdf')
                return FileResponse(digital_copy)
            except FileNotFoundError as e:
                raise Http404
            """

        if pk == False:
            return response


@user_passes_test(is_iT_staff)
def env_crud(request):
    if request.method == 'POST':
        chg_log = ''

        with open('nanoEnv.json', 'r') as env_json:
            env = json.load(env_json)

        for k, v in request.POST.copy().items():
            if k in env:
                if isinstance(env[k], (tuple, list, set)):
                    v = v.strip(",./").split(',')
                if v != env[k]:
                    chg_log += 'Environmental parameter [ ' + k + ' ] was updated from [ ' + str(env[k]) + ' ] to [ ' + v +' ]'
                    """
                    if isinstance(env[k], (tuple, list, set)):
                        env[k] = v.strip(",./").split(',')
                    else:
                    """
                    env[k] = v

                    ChangeHistory.objects.create(
                        on=timezone.now(), by=request.user,
                        db_table_name='nanoEnv.json',
                        db_table_pk=k,
                        detail=chg_log
                        )
        
        if chg_log != '':
            with open('nanoEnv.json', 'w') as env_json:
                json.dump(env, env_json)

            response = JsonResponse({
                "alert_msg": chg_log,
                "alert_type": 'success',
            })
        else:
            response = JsonResponse({
                "alert_msg": 'no update',
                "alert_type": 'danger',
            })
            
        return response


@user_passes_test(is_iT_staff)
def jsonResponse_env_getLst(request):
    if request.method == 'GET':
        try:
            with open('nanoEnv.json', 'r') as env_json: # opens a file for reading only
                try:
                    env = json.load(env_json) # env_dict = json.loads(env_json)
                except json.decoder.JSONDecodeError as e:
                    pass
                
        except FileNotFoundError as e:
            with open('nanoEnv.json', 'a') as env_json: # open for writing, the file is created if it does not exist
                env = {}
                json.dump(env, env_json)
            
        response = JsonResponse([
            env, 
            {
                'variables_os_environment': os.environ.get('DJANGO_DEBUG'),
                'variables_django_debug': settings.DEBUG,
            },], safe=False)
        
        return response


@user_passes_test(is_iT_staff)
def jsonResponse_lastUpd_getLst(request):
    if request.method == 'GET':

        lastUpd_lst = {}
        # for chg in ChangeHistory.objects.filter(db_table_name__icontains='assets').order_by('-on')[:10]:
        for chg in ChangeHistory.objects.all().order_by('-on')[:35]:

            lastUpd = {}
            # lastUpd['on'] = str(chg.on).split('.')[0]
            lastUpd['on'] = chg.on.strftime("%y-%m-%d %H:%M")
            lastUpd['by'] = chg.by.get_full_name()
            
            for model in apps.get_models():
                if model._meta.db_table == chg.db_table_name:
                    try:
                        model_obj = model.objects.get(pk=chg.db_table_pk)
                        lastUpd['link'] = model_obj.get_absolute_url() if hasattr(model_obj, 'get_absolute_url') else None
                    except Exception as e:
                        pass
            """
            if 'assets' in chg.db_table_name:
                try:
                    inst = Instance.objects.get(pk=chg.db_table_pk)
                    lastUpd['serial_number'] = inst.serial_number
                    lastUpd['model_type'] = inst.model_type.name
                    lastUpd['link'] = inst.get_absolute_url()
                except Instance.DoesNotExist as e:
                    lastUpd['serial_number'] = '🈳'
                    lastUpd['model_type'] = '🈳'
                    lastUpd['link'] = None
                # lastUpd['db_table_name'] = chg.db_table_name
                # lastUpd['db_table_pk'] = chg.db_table_pk
            """
            lastUpd['detail'] = chg.detail

            lastUpd_lst[chg.pk] = lastUpd
                
        response = JsonResponse(lastUpd_lst)
            
        return response
        

@user_passes_test(is_iT_staff)
def jsonResponse_requester_permissions(request):
    if request.method == 'GET':
        requester_permission = {}
        requester_permission['is_activate'] = request.user.is_active
        requester_permission['is_authenticated'] = request.user.is_authenticated
        requester_permission['is_staff'] = request.user.is_staff

        group = Group.objects.get(name='IT China')
        requester_permission['is_iT'] = group in request.user.groups.all()

        response = JsonResponse(requester_permission)
        return response


@user_passes_test(is_iT_staff)
def jsonResponse_users_getLst(request):
    if request.method == 'GET':
        """
        num_of_user = {}
        num_of_user['all'] = User.objects.exclude(username__icontains='admin').count()
        num_of_user['all_active'] = User.objects.exclude(username__icontains='admin').filter(is_active=True).count()
        num_of_user['ext'] = User.objects.exclude(username__icontains='admin').exclude(email__icontains='org.com').count()
        num_of_user['ext_active'] = User.objects.exclude(username__icontains='admin').exclude(email__icontains='org.com').filter(is_active=True).count()
        num_of_user['int'] = User.objects.exclude(username__icontains='admin').filter(email__icontains="org.com").count()
        num_of_user['int_active'] = User.objects.exclude(username__icontains='admin').filter(email__icontains="org.com").filter(is_active=True).count()
        """

        re_fetch = True
        if request.GET.get('pgLstUpd'):
            # pgLstUpd = datetime.strptime(request.GET.get('pgLstUpd'), "%Y-%m-%d %H:%M:%S")
            pgLstUpd = request.GET.get('pgLstUpd')
            # pgLstUpd = pgLstUpd.replace(' (China Standard Time)', '')
            # pgLstUpd = pgLstUpd.replace('0800', '+0800')
            pgLstUpd = datetime.strptime(pgLstUpd, '%m_%d_%Y__%I_%M_%S_%p') # datetime.strptime(pgLstUpd, '%a %b %d %Y %H:%M:%S GMT %z')
            userLstUpd = ChangeHistory.objects.filter(db_table_name='nanobase_userprofile').order_by("-on").first()
            re_fetch = pgLstUpd < userLstUpd.on # pgLstUpd.timestamp() < userLstUpd.on.timestamp()
            
        users_lst = {}
        if not request.GET.get('pgLstUpd') or re_fetch:
            for user in User.objects.exclude(username__icontains='admin'):
                user_lst = {}
                user_lst['username'] = user.username
                user_lst['first_name'] = user.first_name
                user_lst['last_name'] = user.last_name
                user_lst['name'] = user.last_name + ', ' + user.first_name
                user_lst['get_full_name'] = user.get_full_name()
                user_lst['email'] = user.email
                user_lst['is_active'] = user.is_active

                user_lst['number_of_owned_assets'] = user.instance_set.all().count()
                # user_lst['number_of_owned_assets_pc'] = user.instance_set.filter(model_type__sub_category__name__icontains='computer').count()  # 跨多表查询
                # user_lst['number_of_owned_assets_other'] = user.instance_set.exclude(model_type__sub_category__name__icontains='computer').count()    # 跨多表查询
                owned_assets = []
                for instance in user.instance_set.all():
                    # hostname = ' - ' + instance.hostname if instance.hostname else ''
                    owned_assets.append(str(instance.model_type) + ' # ' + instance.serial_number)
                user_lst['owned_assets'] = owned_assets
                
                user_lst['number_of_active_contracts_managed'] = user.contract_set.filter(type__in=['M', 'N', 'R']).count() # user.contract_set.all().count()

                user_lst['branch_site'] = user.instance_set.all().first().branchSite.name if user.instance_set.exists() and user.instance_set.all().first().branchSite else ''
                """
                try:
                    user_lst['branch_site'] = user.instance_set.all().first().branchSite.name
                except Exception as e:
                    # pass

                user_lst['is_ext'] = True if user.username != 'admin' and not 'org.com' in user.email.lower() else False
                # to chk if String contains elements from A list
                """
                user_lst['is_ext'] = True if user.username != 'admin' and not any(ele in user.email.lower() for ele in get_env('ORG_DOMAIN')) else False

                obj, created = UserProfile.objects.get_or_create(user=user)
                user_lst['title'] = user.userprofile.title
                user_lst['dept'] = user.userprofile.dept.name if user.userprofile.dept else ''
                user_lst['work_phone'] = user.userprofile.work_phone
                user_lst['cellphone'] = user.userprofile.cellphone
                if user.userprofile.legal_entity:
                    user_lst['legal_entity'] = user.userprofile.legal_entity.name
                    user_lst['legal_entity_pk'] = user.userprofile.legal_entity.pk
                    user_lst['number_of_legal_entity_related_contracts'] = Contract.objects.filter(Q(party_a_list=user.userprofile.legal_entity) | Q(party_b_list=user.userprofile.legal_entity)).count()
                else:
                    user_lst['legal_entity'] = ''
                user_lst['postal_addr'] = user.userprofile.postal_addr

                # users_lst.append(json.loads(serialize("json", user_lst)))
                # users_lst.append(user_lst)
                users_lst[user.pk] = user_lst
            users_lst['re_fetch'] = re_fetch
        else:
            users_lst['re_fetch'] = re_fetch

        response = [users_lst, ]

    return JsonResponse(response, safe=False)


@user_passes_test(is_iT_staff)
def user_crud(request):
    if request.method == 'POST':
        # user_inst, user_created = User.objects.get_or_create(name=request.POST.get('email'))
        chg_log = ''

        user_inst = User.objects.filter(email=request.POST.get('email'))
        if user_inst.count() > 1:
            chg_log = 'Interrupted - multiple user accounts of ' + request.POST.get('email') + ' were found'
            response = JsonResponse({
                "alert_msg": chg_log,
                "alert_type": 'warning',
            })
            return response
        elif user_inst.count() == 1:
            user_acc = user_inst.first()
            user_created = False
        elif user_inst.count() == 0:
            # username = request.POST.get('email').split('@')[0] if 'org.com' in request.POST.get('email') else request.POST.get('email')
            # to chk if String contains elements from A list
            username = request.POST.get('email').split('@')[0] if any(ele in request.POST.get('email') for ele in get_env('ORG_DOMAIN')) else request.POST.get('email')
            
            user_acc = User.objects.create(username=username,)
            user_created = True

        user_profile, user_profile_created = UserProfile.objects.get_or_create(user=user_acc)

        if request.POST.get('lock_or_unlock'):
            chg_log = 'deactivated' if user_acc.is_active else 'activated'
            chg_log = '1 x User [ ' + user_acc.get_full_name() + ' ] was ' + chg_log
            
            user_acc.is_active = False if user_acc.is_active else True
            user_acc.save()
        else:
            for k, v in request.POST.copy().items():
                try:
                    User._meta.get_field(k)
                    if user_created:    # 若是 新建 用户
                        chg_log = '1 x new User [ ' + user_acc.get_full_name() + ' ] was added'
                        setattr(user_acc, k, v) # 在相应 字段 写入 值
                    else:   # 若是 现存 用户
                        if getattr(user_acc, k):    # 检查 相应 字段 是否 存在
                            from_orig = getattr(user_acc, k)    # 保存 原始 数据
                            try:
                                User._meta.get_field(k).related_fields  # 检查 字段 是否为 外键
                                from_orig = from_orig.name  # 若 字段 为 外键 则 引用 外键 数据 作为 原始 数据
                            except AttributeError as e:
                                pass
                        else: 
                            from_orig = '🈳' # 若 字段 不存在 则将‘🈳’保存为 原始 数据
                        to_target = v if v != '' else '🈳'   # 若 目标值为空字符串 则将 目标值替换为‘🈳’
                        if to_target != from_orig:  # 如果 目标值 不同于 原始值
                            chg_log += 'The ' + k.capitalize() + ' was changed from [ ' + str(from_orig) + ' ] to [ ' + str(to_target) + ' ]; '
                            setattr(user_acc, k, v)
                    
                    user_acc.save()
                    
                except Exception as e: # FieldDoesNotExist as e:
                    try:
                        UserProfile._meta.get_field(k)
                        if not user_created:
                            if getattr(user_profile, k):
                                from_orig = getattr(user_profile, k)
                                try:
                                    UserProfile._meta.get_field(k).related_fields
                                    from_orig = from_orig.name
                                except AttributeError as e:
                                    pass
                            else: 
                                from_orig = '🈳'

                            to_target = v if v != '' else '🈳'
                            chg_log += 'The ' + k.capitalize() + ' was changed from [ ' + str(from_orig) + ' ] to [ ' + str(to_target) + ' ]; '

                        if k == 'dept' and v != '':
                            dept, dept_created = UserDept.objects.get_or_create(name=v.title())
                            if dept_created:
                                ChangeHistory.objects.create(
                                    on=timezone.now(), by=request.user,
                                    db_table_name=dept._meta.db_table,
                                    db_table_pk=dept.pk,
                                    detail='1 x Department is added'
                                )
                            setattr(user_profile, k, dept)
                        elif k == 'legal_entity' and v != '':
                            legal_entity = get_object_or_404(LegalEntity, name=v)
                            setattr(user_profile, k, legal_entity)
                            ChangeHistory.objects.create(
                                on=timezone.now(), by=request.user,
                                db_table_name=legal_entity._meta.db_table,
                                db_table_pk=legal_entity.pk,
                                detail='1 x Contact [ ' + user_acc.get_full_name() + ' ] is added and associated with this Legal Entity'
                            )
                        else:
                            # if UserProfile._meta.get_field(k).get_internal_type() == 'DecimalField':
                                # v = int(v)
                            setattr(user_profile, k, v)
                            
                        user_profile.save()
                            
                    except Exception as e: # FieldDoesNotExist as e:
                        pass

        ChangeHistory.objects.create(
            on=timezone.now(), by=request.user,
            db_table_name=user_profile._meta.db_table,
            db_table_pk=user_profile.pk,
            detail=chg_log
            )
        
    response = JsonResponse({
        "alert_msg": chg_log,
        "alert_type": 'success',
        })
    return response


@user_passes_test(is_iT_staff)
def jsonResponse_user_getLst(request):
    if request.method == 'GET':
        email_domain_lst = get_env('ORG_DOMAIN')
            
        user_selected = {}
        owned_assets_lst = {}
        if request.GET.get('userPk'):
            userSelected = User.objects.get(pk=request.GET.get('userPk'))

            user_selected['username'] = userSelected.username
            user_selected['first_name'] = userSelected.first_name
            user_selected['last_name'] = userSelected.last_name
            user_selected['email'] = userSelected.email

            user_selected['is_active'] = userSelected.is_active

            for instance in userSelected.instance_set.all():
                owned_assets_lst[instance.pk] = instance.model_type.name

            try:
                userSelected.userprofile
            except User.userprofile.RelatedObjectDoesNotExist as e:
                userSelected.save()

            user_selected['title'] = userSelected.userprofile.title if userSelected.userprofile.title != None else ''
            user_selected['dept'] = userSelected.userprofile.dept.name if userSelected.userprofile.dept else ''
            user_selected['cellphone'] = userSelected.userprofile.cellphone if userSelected.userprofile.cellphone != None else ''
            user_selected['work_phone'] = userSelected.userprofile.work_phone if userSelected.userprofile.work_phone != None else ''
            user_selected['postal_addr'] = userSelected.userprofile.postal_addr if userSelected.userprofile.postal_addr != None else ''
            user_selected['legal_entity'] = userSelected.userprofile.legal_entity.name if userSelected.userprofile.legal_entity else ''

        legal_entity_selected = {}
        if request.GET.get('legalEntityPk'):
            legalEntitySelected = LegalEntity.objects.get(pk=request.GET.get('legalEntityPk'))
            legal_entity_selected['pk'] = legalEntitySelected.pk
            legal_entity_selected['name'] = legalEntitySelected.name

            legal_entity_selected['email_domain'] = legalEntitySelected.userprofile_set.all().first().user.email.split('@')[1] if legalEntitySelected.userprofile_set.exists() else ''

        dept_lst = {}
        for user_dept in UserDept.objects.all():
            dept_lst[user_dept.name] = user_dept.pk

        legal_entity_lst = {}
        for legal_entity in LegalEntity.objects.all():
            if legal_entity.type == 'E':
                legal_entity_lst[legal_entity.name] = legal_entity.pk

        user_email_lst = {}
        for user in User.objects.all():
            user_email_lst[user.email] = user.pk

        """
        external_contact_lst = {}
        for external_contact in User.objects.exclude(email__icontains='org.com'):
            if  external_contact.username != 'admin' and not 'org.com' in external_contact.email.lower():
                if hasattr(external_contact, "userprofile"):
                    if not external_contact.userprofile.legal_entity:
                        external_contact_lst['%s - %s' % (external_contact.get_full_name(), external_contact.email)] = external_contact.pk
                else:
                    external_contact_lst['%s - %s' % (external_contact.get_full_name(), external_contact.email)] = external_contact.pk
        """
            # legal_entity = serializers.serialize("json", LegalEntity.objects.filter(pk=request.GET.get('legalEntityPk')))

        response = [dept_lst, legal_entity_lst, user_email_lst, legal_entity_selected, user_selected, owned_assets_lst, email_domain_lst, ]
        return JsonResponse(response, safe=False)