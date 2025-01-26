"""
Django settings for nanocmdb project.

Generated by 'django-admin startproject' using Django 4.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""
import os

import environ

from pathlib import Path

# from django.urls import reverse

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = "django-insecure-l=$7bc+(lkaf)!^550d5z6ggeu4t+z9gja(@x!9-93%@!(h46("
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-l=$7bc+(lkaf)!^550d5z6ggeu4t+z9gja(@x!9-93%@!(h46(')

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = False
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 't', 'y', 'yes') # Get OS environment variable & Convert String to a boolean 

ALLOWED_HOSTS = ['nanocmdb.tishmanspeyercn.com', '210.13.96.28', '10.92.1.85', '127.0.0.1', 'localhost']

CSRF_TRUSTED_ORIGINS = ['https://nanocmdb.tishmanspeyercn.com']

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "nanobase.apps.NanobaseConfig",
    "nanoassets.apps.NanoassetsConfig",
    "nanopay.apps.NanopayConfig",

    'import_export',
    # 'smart_selects',
    # 'cities_light',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "nanocmdb.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / 'templates'],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            'libraries':{
                'auth_extras': 'templatetags.auth_extras',
            }
        },
    },
]

WSGI_APPLICATION = "nanocmdb.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator", },
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator", },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

# TIME_ZONE = "UTC"
TIME_ZONE = "Asia/Shanghai"

USE_I18N = True

USE_TZ = False


# MEDIA_ROOT = ""
# MEDIA_URL = "media/"

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'static_collected/')

STATICFILES_DIRS = [
    BASE_DIR / "static",
    # "/var/www/static/",
]

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Redirect to home URL after login (Default redirects to /accounts/profile/)
# LOGIN_REDIRECT_URL = '/nanoassets/my_instances/'


# Import_Export
IMPORT_EXPORT_SKIP_ADMIN_CONFIRM = False
IMPORT_EXPORT_USE_TRANSACTIONS = True

env = environ.Env()
environ.Env.read_env()

# Sending Email

# from django.core.mail import send_mail
# from django.conf import settings
# send_mail( subject='A cool subject', message='A stunning message', from_email=settings.EMAIL_HOST_USER, recipient_list=['juzhao@org.com'])
# send_mail('A cool subject', 'A stunning message', settings.EMAIL_HOST_USER, [settings.RECIPIENT_ADDRESS])

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = 465
EMAIL_USE_SSL = True
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True

EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')


# if you’re using a reverse proxy like Nginx, This ensures Django recognizes the SSL connection.
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# To ensure all traffic is over HTTPS
# SECURE_SSL_REDIRECT = True

LOGGING = {
    "version": 1,  # the dictConfig format version
    "disable_existing_loggers": False,  # retain the default loggers

    "handlers": {
        "file": {
            "class": "logging.FileHandler",
            "filename": "general.log",
            "formatter": "verbose",
            # "level": "DEBUG",
        },
    },

    "loggers": {
        "": {
            # "level": "DEBUG",
            "handlers": ["file"],
        },
    },

    "formatters": {
        "verbose": {
            "format": "{name} {levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
}