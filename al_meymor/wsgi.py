"""
WSGI config for al_meymor project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'al_meymor.settings')

application = get_wsgi_application()

if os.environ.get('VERCEL'):
    # Vercel has no release/build-time migrate step, and the default sqlite
    # fallback lives in /tmp (wiped on every cold start), so make sure the
    # schema + seed data exist before serving the first request.
    from django.core.management import call_command

    call_command('migrate', '--noinput', verbosity=0)
    call_command('seed', verbosity=0)
