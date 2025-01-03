# Generated by Django 5.0.5 on 2024-11-18 10:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nanopay', '0008_alter_paymentrequest_status'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='paymentrequest',
            name='vat',
        ),
        migrations.AlterField(
            model_name='paymentrequest',
            name='amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, verbose_name='Amount'),
        ),
        migrations.CreateModel(
            name='invoice_item',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, verbose_name='Amount')),
                ('vat', models.CharField(blank=True, max_length=255, null=True, verbose_name='Value Added Tax')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Description')),
                ('nmbr', models.CharField(blank=True, max_length=255, null=True, verbose_name='Invoice Number')),
                ('date', models.DateField(blank=True, null=True, verbose_name='Invoice Date')),
                ('payment_request', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='nanopay.paymentrequest', verbose_name='Payment Request')),
            ],
        ),
    ]
