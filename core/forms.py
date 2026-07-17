from django import forms

from .models import Category, Order, User


class RegisterForm(forms.Form):
    ROLE_CHOICES = [('client', 'Mijoz'), ('master', 'Usta')]

    role = forms.ChoiceField(choices=ROLE_CHOICES, widget=forms.RadioSelect)
    name = forms.CharField(max_length=120, label='Ism familiya')
    phone = forms.CharField(max_length=20, label='Telefon raqam')
    password = forms.CharField(widget=forms.PasswordInput, label='Parol')
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(), required=False, label="Yo'nalish"
    )

    def clean_phone(self):
        phone = self.cleaned_data['phone'].strip()
        if User.objects.filter(phone=phone).exists():
            raise forms.ValidationError("Bu telefon raqam allaqachon ro'yxatdan o'tgan")
        return phone

    def clean_password(self):
        password = self.cleaned_data['password']
        if len(password) < 8:
            raise forms.ValidationError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if password.isdigit():
            raise forms.ValidationError("Parol faqat raqamlardan iborat bo'lmasligi kerak")
        return password

    def clean(self):
        cleaned = super().clean()
        if cleaned.get('role') == 'master' and not cleaned.get('category'):
            self.add_error('category', "Usta uchun yo'nalish tanlash shart")
        return cleaned


class LoginForm(forms.Form):
    phone = forms.CharField(max_length=20, label='Telefon raqam')
    password = forms.CharField(widget=forms.PasswordInput, label='Parol')


class OrderForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ['client_name', 'client_phone', 'address', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'client_name': 'Ismingiz',
            'client_phone': 'Telefon raqamingiz',
            'address': 'Manzil',
            'description': "Izoh (ixtiyoriy)",
        }


class MasterProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'category', 'experience', 'bio', 'photo']
        labels = {
            'first_name': 'Ism familiya',
            'category': "Yo'nalish",
            'experience': 'Tajriba (necha yil)',
            'bio': "O'zingiz haqingizda",
            'photo': 'Profil rasmi',
        }
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4}),
        }


class RatingForm(forms.Form):
    rating = forms.IntegerField(min_value=1, max_value=5)
    review = forms.CharField(widget=forms.Textarea, required=False)
