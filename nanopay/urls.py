from django.urls import path

from django.views.generic.base import TemplateView

from . import views, views_api


app_name = 'nanopay'

# vendor portal
urlpatterns = [
    path('portal_vendor/', views.portalVendor.as_view(), name='portal-vendor'),

]

# non Payroll Expense
urlpatterns += [
    # path('non_payroll_expenses/', views.NonPayrollExpenseListView.as_view(), name='non-payroll-expense-list'),
    path('npe_lst/', TemplateView.as_view(template_name = 'nanopay/npe_lst.html'), name='npe-lst'),
]

# Legal Entity
urlpatterns += [
    # path('legal_entity/<int:pk>/update/', views.LegalEntityUpdateView.as_view(), name='legal-entity-update'),
    # path('legal_entity/new/', views.LegalEntityCreateView.as_view(), name='legal-entity-new'),
    # path('legal_entity/new/', views.legal_entity_new, name='legal-entity-new'),
    path('legal_entity/<int:pk>/detail/', views.LegalEntityDetailView.as_view(), name='legalentity-detail'),
    path('legal_entities/', views.LegalEntityListView.as_view(), name='legal-entity-list'),
]

# Contract
urlpatterns += [
    path('contracts/user/', views.ContractByUserListView.as_view(), name='user-contract-list'),
    path('contracts/', views.ContractListView.as_view(), name='contract-list'),
    path('contracts/active/', views.ContractActiveListView.as_view(), name='contract-active-list'),
    path('contract/<int:pk>/detail/', views.ContractDetailView.as_view(), name='contract-detail'),
    path('contract/<int:pk>/detail/scanned_copy/', views.contract_detail_scanned_copy, name='contract-detail-scanned-copy'),
    # path('contract/new/', views.ContractCreateView.as_view(), name='contract-new'),
    # path('contract/new/', views.contract_new, name='contract-new'),
]

# Payment Term & Request
urlpatterns += {
    # path('payment_term/<int:pk>/new/', views.payment_term_new, name='payment-term-new'),
    # path('payment_request/<pk>/email_notice/', views.PaymentRequestEmailNotice.as_view(), name='email-notice'),
    path('payment_request/<pk>/paper_form/', views.payment_request_paper_form, name='paper-form'),
    # path('payment_request/<pk>/approved/', views.payment_request_approve, name='payment-request-approved'),
    # path('payment_request/<int:pk>/new/', views.payment_request_new, name='payment-request-new'),
    path('payment_requests/', views.PaymentRequestListView.as_view(), name='payment-request-list'),
    # path('payment_requests/<pk>/detail/', views.PaymentRequestDetailView.as_view(), name='payment-request-detail'),
    # path('payment_requests/<pk>/detail/invoice_scanned_copy/', views.payment_request_detail_invoice_scanned_copy, name='payment-request-detail-invoice-scanned-copy'),
}

# json api
urlpatterns += {
    path('payment_term/c/', views_api.paymentTerm_c, name='payment-term-c'),
    path('json_respone/paymentTerm_getLst/', views_api.jsonResponse_paymentTerm_getLst, name='jsonResponse-paymentTerm-getLst'),

    path('payment_request/approve/', views_api.paymentReq_approve, name='payment-request-approve'),
    path('payment_request/c/', views_api.paymentReq_c, name='payment-request-c'),
    path('json_respone/paymentReq_getLst/', views_api.jsonResponse_paymentReq_getLst, name='jsonResponse-paymentReq-getLst'),
    
    path('payment_request/email_notice/', views_api.paymentReq_email_notice, name='paymentReq-email-notice'),
    path('json_respone/paymentReq_email_notice_getLst/', views_api.jsonResponse_paymentReq_email_notice_getLst, name='jsonResponse-paymentReq-email-notice-getLst'),

    path('json_respone/nonPayrollExpense_getLst/', views_api.jsonResponse_nonPayrollExpense_getLst, name='jsonResponse-nonPayrollExpense-getLst'),

    path('contract/ub/', views_api.contract_ub, name='contract-ub'),
    path('contract/c/', views_api.contract_c, name='contract-c'),
    path('json_respone/contract_getLst/', views_api.jsonResponse_contract_getLst, name='jsonResponse-contract-getLst'),
    path('contract/mail_me_the_assets_list/', views_api.contract_mail_me_the_assets_list, name='contract-mail-me-the-assets-list'),

    path('json_response/legalEntity_getLst/', views_api.jsonResponse_legalEntity_getLst, name='jsonResponse-legalEntity-getLst'),
    path('legal_entity/cu/', views_api.legalEntity_cu, name='legal-entity-cu'),

    path('json_response/legalEntities_getLst/', views_api.jsonResponse_legalEntities_getLst, name='jsonResponse-legalEntities-getLst'),
}