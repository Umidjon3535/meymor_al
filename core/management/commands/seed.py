from django.core.management.base import BaseCommand

from core.models import Category, User

CATEGORIES = [
    ('arxitektura', 'Arxitektura', '🏛️', 1),
    ('beton', 'Beton', '🧱', 2),
    ('euroremont', 'Euro remont', '🏠', 3),
    ('mebel', 'Mebel', '🪑', 4),
    ('qurilish', 'Qurilish', '🏗️', 5),
    ('reklama', 'Reklama', '📣', 6),
    ('santexnika', 'Santexnika', '🔧', 7),
    ('travertin', 'Travertin', '🪨', 8),
]


class Command(BaseCommand):
    help = "Al-Meymor uchun boshlang'ich ma'lumotlarni yuklaydi"

    def handle(self, *args, **options):
        for slug, name, icon, order in CATEGORIES:
            Category.objects.update_or_create(
                slug=slug, defaults={'name': name, 'icon': icon, 'order': order}
            )
        self.stdout.write(self.style.SUCCESS(f'{len(CATEGORIES)} ta kategoriya yuklandi'))

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin', phone='admin', password='admin123', role='admin'
            )
            self.stdout.write(self.style.SUCCESS("Admin yaratildi: telefon='admin', parol='admin123'"))
        else:
            self.stdout.write('Admin allaqachon mavjud')
