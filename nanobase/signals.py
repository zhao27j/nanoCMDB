from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver

from .models import UserProfile

@receiver(post_save, sender=User)
def create_userprofile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_userprofile(sender, instance, **kwargs):
    try:
        user_profile = UserProfile.objects.get(user=instance.id)
    except UserProfile.DoesNotExist as e:
        UserProfile.objects.create(user=instance)
    else:
        instance.userprofile.save()