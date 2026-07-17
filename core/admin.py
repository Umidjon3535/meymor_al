from django.contrib import admin

from .models import Category, Message, Order, User


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'order']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'phone', 'role', 'category', 'contract_signed']
    list_filter = ['role', 'contract_signed']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['category', 'client_name', 'stage', 'master', 'created_at']
    list_filter = ['stage', 'category']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['order', 'sender', 'created_at']
