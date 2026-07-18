from django.contrib.auth.models import AbstractUser
from django.db import models


class Category(models.Model):
    slug = models.SlugField(primary_key=True)
    name = models.CharField(max_length=60)
    icon = models.CharField(max_length=10, default='🔧')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Mijoz'),
        ('master', 'Usta'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, unique=True)

    # Master-specific fields
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='masters'
    )
    bio = models.TextField(blank=True)
    experience = models.PositiveIntegerField(null=True, blank=True)
    photo = models.ImageField(upload_to='master_photos/', null=True, blank=True)
    contract_signed = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.name_or_username} ({self.get_role_display()})'

    @property
    def name_or_username(self):
        return self.get_full_name() or self.username

    @property
    def rating(self):
        agg = self.assigned_orders.filter(rating__isnull=False).aggregate(models.Avg('rating'))
        val = agg['rating__avg']
        return round(val, 1) if val else 0

    @property
    def reviews_count(self):
        return self.assigned_orders.filter(rating__isnull=False).count()


class Order(models.Model):
    STAGE_CHOICES = [
        (0, 'Buyurtma yuborildi'),
        (1, "Admin ko'rib chiqmoqda"),
        (2, 'Shartnoma tuzildi'),
        (3, 'Ish yakunlandi'),
    ]

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    master = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_orders'
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='orders')

    client_name = models.CharField(max_length=120)
    client_phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    stage = models.PositiveSmallIntegerField(choices=STAGE_CHOICES, default=0)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    review = models.TextField(blank=True)
    is_seen_by_admin = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.category} — {self.client_name}'

    @property
    def stage_label(self):
        return dict(self.STAGE_CHOICES)[self.stage]


class Message(models.Model):
    SENDER_CHOICES = [
        ('client', 'Mijoz'),
        ('admin', 'Admin'),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
