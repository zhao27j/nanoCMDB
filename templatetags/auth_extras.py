from django import template
from django.contrib.auth.models import Group

from nanoassets.models import Config
from nanopay.models import LegalEntity, Contract


register = template.Library()

@register.filter(name='has_group')
def has_group(user, group_name):
    try:
        group = Group.objects.get(name=group_name)
        return True if group in user.groups.all() else False
    except:
        return False


@register.filter(name='grouped_by_prjct')
def grouped_by_prjct(contract_list, prjct):
    try:
        contract_list_filtered_by_prjct = Contract.objects.none()
        for contract in contract_list:
            for legalEntity in contract.party_a_list.all():
                if legalEntity.prjct == prjct:
                    contract_list_filtered_by_prjct |= Contract.objects.filter(pk=contract.pk)
            
        # for legalEntity in LegalEntity.objects.filter(prjct=prjct):
        #     contract_list_filtered_by_prjct = contract_list_filtered_by_prjct | Contract.objects.filter(party_a_list=legalEntity) | Contract.objects.filter(party_b_list=legalEntity)
            # contract_list_filtered_by_prjct = contract_list_filtered_by_prjct | legalEntity.objects.contract_set.all()

        if contract_list_filtered_by_prjct: # add Data into querySet / 在 querySet 中 添加 数据
            contract_list_filtered_by_prjct = contract_list_filtered_by_prjct.distinct()

            for contract in contract_list_filtered_by_prjct:
                if contract.paymentterm_set.all():
                    contract.paymentTerm_all = contract.paymentterm_set.all().count()
                    contract.paymentTerm_applied = contract.paymentterm_set.filter(applied_on__isnull=False).count()
        else:
            contract_list_filtered_by_prjct = None
        
        # return contract_list_filtered_by_prjct.distinct() if contract_list_filtered_by_prjct else None
        return contract_list_filtered_by_prjct
    except:
        return False


@register.filter(name='grouped_by_sub_category')
def grouped_by_sub_category(instance_list, sub_category):
    try:
        instance_list_grouped_by_sub_category = instance_list.filter(model_type__sub_category=sub_category)
        for obj in instance_list_grouped_by_sub_category:
            obj.configs = Config.objects.filter(db_table_name=obj._meta.db_table, db_table_pk=obj.pk).order_by("-on") # add Data into querySet / 在 querySet 中 添加 数据
        return instance_list_grouped_by_sub_category if instance_list_grouped_by_sub_category else None
    except:
        return False
    

@register.filter(name='grouped_by_sub_category_subtotal')
def grouped_by_sub_category_subtotal(instance_list, sub_category):
    try:
        instance_list_grouped_by_sub_category_subtotal = instance_list.filter(model_type__sub_category=sub_category).count()
        return instance_list_grouped_by_sub_category_subtotal if instance_list_grouped_by_sub_category_subtotal else None
    except:
        return False
    
@register.filter(name='grouped_by_sub_category_subtotal_available')
def grouped_by_sub_category_subtotal_available(instance_list, sub_category):
    try:
        instance_list_grouped_by_sub_category_subtotal_available = instance_list.filter(model_type__sub_category=sub_category).filter(status='AVAILABLE').count()
        return instance_list_grouped_by_sub_category_subtotal_available if instance_list_grouped_by_sub_category_subtotal_available else None
    except:
        return False
    
@register.filter(name='grouped_by_sub_category_subtotal_in_repair')
def grouped_by_sub_category_subtotal_in_repair(instance_list, sub_category):
    try:
        instance_list_grouped_by_sub_category_subtotal_in_repair = instance_list.filter(model_type__sub_category=sub_category).filter(status='inREPAIR').count()
        return instance_list_grouped_by_sub_category_subtotal_in_repair if instance_list_grouped_by_sub_category_subtotal_in_repair else None
    except:
        return False