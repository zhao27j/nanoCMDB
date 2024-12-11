import os
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.core.mail import EmailMessage

from django.conf import settings
from django.contrib.auth.models import User
from django.template.loader import get_template
from django.utils import timezone

from nanobase.views import get_env, get_toDo_list

from nanoassets.models import Config, Instance
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
            context_all = {}

            context_all = get_toDo_list(context_all)

            # configs_expiring = Config.objects.filter(expire__range=(date.today(), date.today() + timedelta(weeks=8)))
            for config in context_all['configs_expiring']:
                if not config.by in mail_to_list:
                    mail_to_list.append(config.by)

            # contracts_expiring = Contract.objects.filter(endup__range=(date.today(), date.today() + timedelta(weeks=12)))
            for contract in context_all['contracts_expiring']:
                if not contract.created_by in mail_to_list:
                    mail_to_list.append(contract.created_by)

            # contracts_with_no_peymentTerm = Contract.objects.none()
            # contracts_with_no_assetsInstance = Contract.objects.none()
            # contracts_endup_later_than_today = Contract.objects.filter(endup__gt=(date.today()))
            # for contract in contracts_endup_later_than_today:
                # if not contract.paymentterm_set.all():
                    # contracts_with_no_peymentTerm |= Contract.objects.filter(pk=contract.pk) # merge / 合并 querySet
            for contract in context_all['contracts_with_no_peymentTerm']:
                if not contract.created_by in mail_to_list:
                    mail_to_list.append(contract.created_by)
                # elif not contract.assets.all():
                    # contracts_with_no_assetsInstance |= Contract.objects.filter(pk=contract.pk) # merge / 合并 querySet
            for contract in context_all['contracts_with_no_assetsInstance']:
                if not contract.created_by in mail_to_list:
                    mail_to_list.append(contract.created_by)

            # paymentTerms_upcoming = PaymentTerm.objects.filter(pay_day__range=(date.today(), date.today() + timedelta(weeks=4)))
            for upcoming_paymentTerm in context_all['paymentTerms_upcoming']:
                if not upcoming_paymentTerm.contract.created_by in mail_to_list:
                    mail_to_list.append(upcoming_paymentTerm.contract.created_by)
        
        except Exception as e:
            raise CommandError('"%s"' % e)
        else:
            if mail_to_list:
                context = {
                    'protocol': 'http',
                    'domain': settings.ALLOWED_HOSTS[0] + ':8000', # 'domain': request.META['HTTP_HOST'] # 10.92.1.85:8000
                    'email': 'true'
                }
                mail_cc_list = []
                for reviewer in User.objects.filter(groups__name='IT Reviewer'):
                    if not reviewer.email in mail_cc_list:
                        mail_cc_list.append(reviewer.email)

                for mail_to in mail_to_list:
                    context['first_name'] = mail_to.first_name
                    
                    context["contracts_expiring"] = context_all["contracts_expiring"].filter(created_by=mail_to)
                    context["contracts_with_no_peymentTerm"] = context_all["contracts_with_no_peymentTerm"].filter(created_by=mail_to)
                    context["contracts_with_no_assetsInstance"] = context_all["contracts_with_no_assetsInstance"].filter(created_by=mail_to)
                    context["paymentTerms_upcoming"] = context_all["paymentTerms_upcoming"].filter(contract__created_by=mail_to)

                    context["configs_expiring"] = context_all["configs_expiring"].filter(by=mail_to)
                    for config in context["configs_expiring"]:
                        if 'config' in config.db_table_name:
                            parent_config = Config.objects.get(pk=config.db_table_pk)
                            related_instance_pk = parent_config.db_table_pk
                        else:
                            related_instance_pk = config.db_table_pk

                        config.instance = Instance.objects.get(pk=related_instance_pk) # add Data into querySet / 在 querySet 中 添加 数据

                    message = get_template("nanobase/todo_email.html").render(context)
                    
                    mail = EmailMessage(
                        subject='iTS expr - tasks To do (reminder)',
                        body=message,
                        from_email='nanoMsngr <do-not-reply@' + str(get_env('ORG_DOMAIN')[0]) + '>',
                        # to=[mail_to.email],
                        to=['zhao27j@gmail.com'],
                        cc=mail_cc_list,
                        # reply_to=[EMAIL_ADMIN],
                        # connection=
                    )
                    mail.content_subtype = "html"
                    # is_sent = mail.send()

                self.stdout.write(
                    self.style.SUCCESS('%s - Successfully email the reminder(s) to %s' % (timezone.now().strftime("%c"), mail_to_list))
                )

            else:
                self.stdout.write(
                    self.style.WARNING('%s - No upcoming tasks' % (timezone.now().strftime("%c")))
                )