# Generated by Django 5.0.5 on 2024-10-09 16:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nanoassets', '0004_config_expire'),
    ]

    operations = [
        migrations.AlterField(
            model_name='config',
            name='expire',
            field=models.DateField(blank=True, null=True, verbose_name='Expire'),
        ),
    ]
