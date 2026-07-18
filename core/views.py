from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from .decorators import role_required
from .forms import LoginForm, MasterProfileForm, OrderForm, RatingForm, RegisterForm
from .models import Category, Message, Order, User


# ---------- Public ----------

def home(request):
    query = request.GET.get('q', '').strip()
    categories = Category.objects.all()
    if query:
        categories = categories.filter(name__icontains=query)

    masters = User.objects.filter(role='master', contract_signed=True).order_by('-id')[:8]
    stats = {
        'masters_count': User.objects.filter(role='master', contract_signed=True).count(),
        'categories_count': Category.objects.count(),
        'completed_orders': Order.objects.filter(stage=3).count(),
    }
    return render(request, 'core/home.html', {
        'categories': categories,
        'masters': masters,
        'query': query,
        'stats': stats,
    })


def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            user = User(
                username=data['phone'],
                phone=data['phone'],
                role=data['role'],
                first_name=data['name'],
                password=make_password(data['password']),
            )
            if data['role'] == 'master':
                user.category = data['category']
                user.contract_signed = False
            user.save()

            if data['role'] == 'master':
                messages.success(request, "Ariza yuborildi. Admin siz bilan bog'lanadi.")
                return redirect('login')

            login(request, user)
            messages.success(request, "Ro'yxatdan muvaffaqiyatli o'tdingiz")
            redirect_cat = request.GET.get('cat')
            if redirect_cat:
                return redirect('order_create', category_slug=redirect_cat)
            return redirect('client_dashboard')
    else:
        form = RegisterForm(initial={'role': request.GET.get('role', 'client')})

    return render(request, 'core/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            phone = form.cleaned_data['phone']
            password = form.cleaned_data['password']
            user = authenticate(request, username=phone, password=password)
            if user is None:
                form.add_error(None, "Telefon raqam yoki parol noto'g'ri")
            elif user.role == 'master' and not user.contract_signed:
                form.add_error(None, "Arizangiz hali admin tomonidan tasdiqlanmagan.")
            else:
                login(request, user)
                if user.role == 'admin':
                    return redirect('admin_orders')
                if user.role == 'master':
                    return redirect('master_profile')
                return redirect('client_dashboard')
    else:
        form = LoginForm()

    return render(request, 'core/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('home')


# ---------- Client ----------

@role_required('client')
def order_create(request, category_slug):
    category = get_object_or_404(Category, slug=category_slug)
    if request.method == 'POST':
        form = OrderForm(request.POST)
        if form.is_valid():
            order = form.save(commit=False)
            order.client = request.user
            order.category = category
            order.save()
            messages.success(request, 'Buyurtma yuborildi ✅')
            return redirect('client_dashboard')
    else:
        form = OrderForm(initial={
            'client_name': request.user.name_or_username,
            'client_phone': request.user.phone,
        })
    return render(request, 'core/order_create.html', {'form': form, 'category': category})


@role_required('client')
def client_dashboard(request):
    orders = Order.objects.filter(client=request.user).select_related('category', 'master')
    return render(request, 'core/client_dashboard.html', {'orders': orders})


@role_required('client')
def rate_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, client=request.user)
    if request.method == 'POST' and order.stage == 3 and not order.rating:
        form = RatingForm(request.POST)
        if form.is_valid():
            order.rating = form.cleaned_data['rating']
            order.review = form.cleaned_data['review']
            order.save()
            messages.success(request, 'Rahmat! Bahoyingiz saqlandi.')
    return redirect('client_dashboard')


# ---------- Chat (shared by client & admin) ----------

def _can_access_order_chat(user, order):
    if user.role == 'admin':
        return True
    if user.role == 'client' and order.client_id == user.id:
        return True
    return False


@login_required
def chat_messages(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    if not _can_access_order_chat(request.user, order):
        return HttpResponseForbidden()
    data = [
        {'sender': m.sender, 'text': m.text, 'time': m.created_at.strftime('%H:%M')}
        for m in order.messages.all()
    ]
    # Opening the thread marks the other side's messages as read.
    other_sender = 'client' if request.user.role == 'admin' else 'admin'
    order.messages.filter(sender=other_sender, is_read=False).update(is_read=True)
    return JsonResponse({'messages': data})


@login_required
def chat_send(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    if not _can_access_order_chat(request.user, order):
        return HttpResponseForbidden()
    if request.method == 'POST':
        text = request.POST.get('text', '').strip()
        if text:
            sender = 'admin' if request.user.role == 'admin' else 'client'
            Message.objects.create(order=order, sender=sender, text=text)
    return JsonResponse({'ok': True})


@role_required('client')
def chat_unread_summary(request):
    orders = Order.objects.filter(client=request.user).select_related('category')
    items = []
    total = 0
    for order in orders:
        count = order.messages.filter(sender='admin', is_read=False).count()
        if count:
            items.append({
                'order_id': order.id,
                'category_name': order.category.name,
                'category_icon': order.category.icon,
                'count': count,
            })
            total += count
    return JsonResponse({'total': total, 'orders': items})


@role_required('client')
def chat_client_orders(request):
    orders = Order.objects.filter(client=request.user).select_related('category')
    data = [
        {
            'order_id': o.id,
            'category_name': o.category.name,
            'category_icon': o.category.icon,
            'stage_label': o.stage_label,
        }
        for o in orders
    ]
    return JsonResponse({'orders': data})


@role_required('client')
def client_chat_list(request):
    orders = Order.objects.filter(client=request.user).select_related('category')
    items = []
    for order in orders:
        unread = order.messages.filter(sender='admin', is_read=False).count()
        last_message = order.messages.last()
        items.append({'order': order, 'unread': unread, 'last_message': last_message})
    return render(request, 'core/client_chat_list.html', {'items': items})


@role_required('client')
def client_chat_thread(request, order_id):
    order = get_object_or_404(Order, id=order_id, client=request.user)
    return render(request, 'core/client_chat_thread.html', {'order': order})


@role_required('admin')
def admin_order_chat(request, order_id):
    order = get_object_or_404(Order.objects.select_related('category', 'master'), id=order_id)
    return render(request, 'core/admin_order_chat.html', {'order': order, 'active_tab': 'orders'})


# ---------- Master ----------

@role_required('master')
def master_profile(request):
    if not request.user.contract_signed:
        messages.error(request, 'Sizning arizangiz hali admin tomonidan tasdiqlanmagan.')
        return redirect('logout')

    if request.method == 'POST':
        form = MasterProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profil saqlandi')
            return redirect('master_profile')
    else:
        form = MasterProfileForm(instance=request.user)

    return render(request, 'core/master_profile.html', {'form': form})


# ---------- Admin panel ----------

@role_required('admin')
def admin_orders(request):
    orders = Order.objects.select_related('category', 'master').all()
    return render(request, 'core/admin_orders.html', {'orders': orders, 'active_tab': 'orders'})


@role_required('admin')
def admin_order_detail(request, order_id):
    order = get_object_or_404(Order.objects.select_related('category', 'master'), id=order_id)
    masters = User.objects.filter(role='master', contract_signed=True, category=order.category)
    return render(request, 'core/admin_order_detail.html', {
        'order': order, 'masters': masters, 'active_tab': 'orders',
    })


@role_required('admin')
def admin_order_advance(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    if order.stage < 3:
        order.stage += 1
        order.save()
        messages.success(request, f'Buyurtma holati: {order.stage_label}')
    return redirect('admin_order_detail', order_id=order.id)


@role_required('admin')
def admin_order_assign(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    if request.method == 'POST':
        master_id = request.POST.get('master_id')
        order.master_id = master_id or None
        order.save()
        messages.success(request, 'Usta biriktirildi')
    return redirect('admin_order_detail', order_id=order.id)


@role_required('admin')
def admin_requests(request):
    requests_qs = User.objects.filter(role='master', contract_signed=False)
    return render(request, 'core/admin_requests.html', {
        'master_requests': requests_qs, 'active_tab': 'requests',
    })


@role_required('admin')
def admin_request_approve(request, user_id):
    user = get_object_or_404(User, id=user_id, role='master')
    user.contract_signed = True
    user.save()
    messages.success(request, 'Usta tasdiqlandi, endi tizimga kira oladi')
    return redirect('admin_requests')


@role_required('admin')
def admin_request_reject(request, user_id):
    user = get_object_or_404(User, id=user_id, role='master')
    user.delete()
    messages.success(request, "So'rov rad etildi")
    return redirect('admin_requests')


@role_required('admin')
def admin_masters(request):
    masters = User.objects.filter(role='master', contract_signed=True)
    return render(request, 'core/admin_masters.html', {'masters': masters, 'active_tab': 'masters'})


@role_required('admin')
def admin_clients(request):
    clients = User.objects.filter(role='client')
    return render(request, 'core/admin_clients.html', {'clients': clients, 'active_tab': 'clients'})
