release: python manage.py migrate --noinput && python manage.py seed
web: gunicorn al_meymor.wsgi --log-file -
