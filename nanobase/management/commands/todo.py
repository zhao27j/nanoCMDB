import os
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.core.mail import EmailMessage

from django.conf import settings

from django.contrib.auth.models import User

from django.template.loader import get_template

# from django.utils import timezone

from nanopay.models import Contract, PaymentTerm


class Command(BaseCommand):
    help = "Sends email notification to reminder the upcoming tasks "

    """
    def add_arguments(self, parser):
        parser.add_argument("poll_ids", nargs="+", type=int)
    """

    def handle(self, *args, **options):
        # for poll_id in options["poll_ids"]:

        mail_to_list = []

        try:
            expiring_contracts = Contract.objects.filter(endup__range=(date.today(), date.today() + timedelta(weeks=12)))
            for contract in expiring_contracts:
                mail_to_list.append(contract.created_by) if not contract.created_by in mail_to_list else None
        except Contract.DoesNotExist:
            raise CommandError('"%s" contract that is about to expire in next 3 months.' % 'No')

        try:
            upcoming_paymentTerms = PaymentTerm.objects.filter(pay_day__range=(date.today(), date.today() + timedelta(weeks=4)))
            for upcoming_paymentTerm in upcoming_paymentTerms:
                mail_to_list.append(upcoming_paymentTerm.contract.created_by) if not upcoming_paymentTerm.contract.created_by in mail_to_list else None
        except PaymentTerm.DoesNotExist:
            raise CommandError('"%s" upcoming payment term in next 4 weeks.' % 'No')

        if mail_to_list:

            mail_cc_list = []
            for reviewer in User.objects.filter(groups__name='IT Reviewer'):
                mail_cc_list.append(reviewer.email) if not reviewer.email in mail_cc_list else None

            for mail_to in mail_to_list:
                context = {
                    'protocol': 'http',
                    'domain': settings.ALLOWED_HOSTS[0] + ':8000', # 'domain': request.META['HTTP_HOST'] # 10.92.1.85:8000
                    'first_name': mail_to.first_name
                }
                context["expiring_contracts"] = expiring_contracts.filter(created_by=mail_to)
                context["upcoming_paymentTerms"] = upcoming_paymentTerms.filter(contract__created_by=mail_to)

                message = get_template("nanobase/todo_email.html").render(context)
                
                mail = EmailMessage(
                    subject='ITS express - reminder - To-do list',
                    body=message,
                    from_email='nanoMessenger <do-not-reply@tishmanspeyer.com>',
                    # to=[mail_to.email],
                    to=['zhao27j@gmail.com'],
                    cc=mail_cc_list,
                    # reply_to=[EMAIL_ADMIN],
                    # connection=
                )
                mail.content_subtype = "html"
                is_sent = mail.send()

            self.stdout.write(
                self.style.SUCCESS('Successfully email the reminder(s) to "%s"' % mail_to_list)
            )

        else:
            self.stdout.write(
                self.style.WARNING('No upcoming tasks')
            )