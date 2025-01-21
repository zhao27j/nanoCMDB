from django.urls import path

from . import views, views_api

app_name = 'nanobase'

urlpatterns = [
    # path('index/', views.index, name='index'),
]


# to do
urlpatterns += [
    path('todo_list/', views.toDoListView.as_view(), name='todo-list'),
]


# search
urlpatterns += [
    path('search_results/', views.SearchResultsListView.as_view(), name='search-results'),
]


urlpatterns += [
    # path('user/new/', views.UserCreateView.as_view(), name='user-new'),
    # path('user/new/', views.user_create, name='user-new'),
    path('user_profile/<int:pk>/update/', views.user_profile_update, name='user-profile-update'),
    path('users/', views.UserListView.as_view(), name='user-list'),
]


# digital copy
urlpatterns += [
    path('digital_copy/<int:pk>/display/', views.get_digital_copy_display, name='digital-copy-display'),
    path('digital_copy/<int:pk>/<db_table_name>/add/', views.get_digital_copy_add, name='digital-copy-add'),
]


# json api
urlpatterns += [
    path('env/crud/', views_api.env_crud, name='env-crud'),
    path('json_response/env_getLst/', views_api.jsonResponse_env_getLst, name='env-getLst'),

    path('json_response/user_getLst/', views_api.jsonResponse_user_getLst, name='user-getLst'),
    
    path('user/crud/', views_api.user_crud, name='user-crud'),

    path('json_response/users_getLst/', views_api.jsonResponse_users_getLst, name='users-getLst'),

    path('json_response/requester_permissions/', views_api.jsonResponse_requester_permissions, name='requester-permissions'),

    path('json_response/last_updated_getLst/', views_api.jsonResponse_lastUpd_getLst, name='last-udpated'),

    path('digital_copy/delete/', views_api.get_digital_copy_delete, name='digital-copy-delete'),
]


# temp - data migrations
urlpatterns += [
    # path('temp_data_migration/', views.data_migration_ActivityHistory_to_ChangeHistory, name='temp-data-migration'),
]