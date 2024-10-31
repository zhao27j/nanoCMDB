# Generated by Django 5.0.5 on 2024-10-31 09:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nanobase', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='changehistory',
            name='db_table_name',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='db_table_name'),
        ),
        migrations.AlterField(
            model_name='changehistory',
            name='db_table_pk',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='db_table_pk'),
        ),
        migrations.AlterField(
            model_name='subcategory',
            name='name',
            field=models.CharField(max_length=255, unique=True, verbose_name='Sub-Category'),
        ),
        migrations.AlterField(
            model_name='uploadedfile',
            name='db_table_name',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='db_table_name'),
        ),
        migrations.AlterField(
            model_name='uploadedfile',
            name='db_table_pk',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='db_table_pk'),
        ),
        migrations.AlterField(
            model_name='userdept',
            name='name',
            field=models.CharField(max_length=255, unique=True, verbose_name='Department'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='postal_addr',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Postal Address'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Title'),
        ),
    ]
