from django import template
from django.contrib.auth.models import Group

from nanoassets.models import Config

register = template.Library()


@register.filter(name='has_group')
def has_group(user, group_name):
    try:
        group = Group.objects.get(name=group_name)
        return True if group in user.groups.all() else False
    except:
        return False


@register.filter(name='grouped_by_sub_category')
def grouped_by_sub_category(instance_list, sub_category):
    try:
        instance_list_grouped_by_sub_category = instance_list.filter(model_type__sub_category=sub_category)
        for obj in instance_list_grouped_by_sub_category:
                obj.configs = Config.objects.filter(db_table_name=obj._meta.db_table, db_table_pk=obj.pk).order_by("-on") # add vakue to querySet | 往 querySet 里增加数据
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