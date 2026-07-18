from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('order/create/<slug:category_slug>/', views.order_create, name='order_create'),
    path('client/', views.client_dashboard, name='client_dashboard'),
    path('client/order/<int:order_id>/rate/', views.rate_order, name='rate_order'),
    path('client/order/<int:order_id>/approve-contract/', views.approve_contract, name='approve_contract'),

    path('chat/<int:order_id>/messages/', views.chat_messages, name='chat_messages'),
    path('chat/<int:order_id>/send/', views.chat_send, name='chat_send'),
    path('chat/unread/', views.chat_unread_summary, name='chat_unread_summary'),
    path('chat/my-orders/', views.chat_client_orders, name='chat_client_orders'),
    path('client/chat/', views.client_chat_list, name='client_chat_list'),
    path('client/chat/<int:order_id>/', views.client_chat_thread, name='client_chat_thread'),

    path('master/', views.master_profile, name='master_profile'),
    path('master/orders/', views.master_orders, name='master_orders'),
    path('master/orders/unseen-count/', views.master_orders_unseen_count, name='master_orders_unseen_count'),

    path('admin-panel/orders/', views.admin_orders, name='admin_orders'),
    path('admin-panel/orders/unseen-count/', views.admin_orders_unseen_count, name='admin_orders_unseen_count'),
    path('admin-panel/orders/<int:order_id>/', views.admin_order_detail, name='admin_order_detail'),
    path('admin-panel/orders/<int:order_id>/advance/', views.admin_order_advance, name='admin_order_advance'),
    path('admin-panel/orders/<int:order_id>/assign/', views.admin_order_assign, name='admin_order_assign'),
    path('admin-panel/orders/<int:order_id>/contract/', views.admin_order_contract_upload, name='admin_order_contract_upload'),
    path('admin-panel/orders/<int:order_id>/chat/', views.admin_order_chat, name='admin_order_chat'),
    path('admin-panel/requests/', views.admin_requests, name='admin_requests'),
    path('admin-panel/requests/unseen-count/', views.admin_requests_unseen_count, name='admin_requests_unseen_count'),
    path('admin-panel/requests/<int:user_id>/approve/', views.admin_request_approve, name='admin_request_approve'),
    path('admin-panel/requests/<int:user_id>/reject/', views.admin_request_reject, name='admin_request_reject'),
    path('admin-panel/masters/', views.admin_masters, name='admin_masters'),
    path('admin-panel/clients/', views.admin_clients, name='admin_clients'),
    path('admin-panel/clients/unseen-count/', views.admin_clients_unseen_count, name='admin_clients_unseen_count'),
]
