from django import template

register = template.Library()

@register.filter(name='grouped_by_sub_category')
def grouped_by_sub_category(instance_list, sub_category):
    try:
        filtered_queryset = instance_list.filter(sub_category=sub_category)
        return filtered_queryset if filtered_queryset else None
    except Exception as e:
        return False
