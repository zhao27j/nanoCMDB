# Generated by Django 5.1.3 on 2025-01-23 10:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nanobase', '0003_alter_userprofile_work_phone'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='cellphone',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Cellphone'),
        ),
    ]
