from django.apps import AppConfig


class NanobaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'nanobase'

    def ready(self):
        import nanobase.signals