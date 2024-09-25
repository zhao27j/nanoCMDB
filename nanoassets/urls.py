from django.urls import path

from . import views, views_api


app_name = 'nanoassets'

urlpatterns = [
    # path('', views.index, name='index'),
    # path('instance_search_results/', views.InstanceSearchResultsListView.as_view(), name='instance-search-results'),
]


# Disposal

urlpatterns += [
    path('instance_disposal_request_list/', views.InstanceDisposalRequestListView.as_view(), name='instance-disposal-request-list'),
    path('instance_disposal_request_detail/<pk>/', views.InstanceDisposalRequestDetailView.as_view(), name='instance-disposal-request-detail'),
    # path('instance_disposal_request_detail/<pk>/approve/', views.InstanceDisposalRequestApprove, name='instance-disposal-request-approve'),
]


# Assets Instance

urlpatterns += [
    path('', views.InstanceByUserListView.as_view(), name='my-instance-list'),
    path('instances/user/', views.InstanceByUserListView.as_view(), name='user-instance-list'),
    # path('instances_supported/', views.InstanceByTechListView.as_view(), name='supported-instance-list'),
    path('instance/<pk>/detail/', views.InstanceDetailView.as_view(), name='instance-detail'),
    # path('instance/new/', views.InstanceNew, name='instance-new'),
    path('instance/<pk>/hostname_upd/', views.InstanceHostnameUpdate, name='instance-hostname-upd'),
]


# Assets Instance - JSON api

urlpatterns += [
    path('config/is_active/', views_api.config_is_active, name='config-is-active'),
    path('config/cud/', views_api.config_cud, name='config-cud'),
    path('json_response/config_getLst/', views_api.jsonResponse_config_getLst, name='jsonResponse-config-getLst'),

    path('json_response/instance_lst/', views_api.jsonResponse_instance_lst, name='jsonResponse-instance-lst'),

    path('instance/new/', views_api.new, name='instance-new'),
    path('json_response/new_lst/', views_api.jsonResponse_new_lst, name='jsonResponse-new-lst'),

    path('instance/disposal_request_approve/', views_api.disposal_request_approve, name='instance-disposal-request-approve'),
    path('instance/disposal_request/', views_api.disposal_request, name='instance-disposal-request'),
    path('json_response/disposal_lst/', views_api.jsonResponse_disposal_lst, name='jsonResponse-disposal-lst'),
    
    path('instance/in_repair/', views_api.in_repair, name='instance-in-repair'),
    
    path('json_response/model_type_lst/', views_api.jsonResponse_model_type_lst, name='jsonResponse-model-type-lst'),
    path('instance/model_type_changing_to/', views_api.model_type_changing_to, name='instance-model-type-changing-to'),

    path('json_response/sub_category_lst/', views_api.jsonResponse_sub_category_lst, name='jsonResponse-sub-category-lst'),
    path('instance/re_subcategorizing_to/', views_api.re_subcategorizing_to, name='instance-re-subcategorizing-to'),
    
    path('json_response/owner_lst/', views_api.jsonResponse_owner_lst, name='jsonResponse-owner-lst'),
    path('instance/owner_re_assigning_to/', views_api.owner_re_assigning_to, name='instance-owner-reassigning-to'),

    path('json_response/branchSite_lst/', views_api.jsonResponse_branchSite_lst, name='jsonResponse-branchSite-lst'),
    path('instance/branchSite_transferring_to/', views_api.branchSite_transferring_to, name='instance-branchSite-transferring-to'),

    path('json_response/contract_lst/', views_api.jsonResponse_contract_lst, name='jsonResponse-contract-lst'),
    path('instance/contract_associating_with/', views_api.contract_associating_with, name='instance-contract-associating-with'),
]