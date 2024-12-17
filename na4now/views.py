from xhtml2pdf import pisa

def html_2_pdf(request, pk):
    html = render_to_string(template_path, context)
    io_bytes = BytesIO()
    # write_to_file = open('uploads/payment_request/paper_form.pdf', 'w+b')
    # result = pisa.CreatePDF(html.encode("UTF-8"), dest=write_to_file)
    # write_to_file.close()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), io_bytes)
    
    if not pdf.err:
        return HttpResponse(io_bytes.getvalue(), content_type='application/pdf')
    else:
        return HttpResponse(pdf.err)

    """
    response = HttpResponse(content_type='application/pdf') # Create a Django response object, and specify content_type as pdf
    response['Content-Disposition'] = 'attachment; filename="paper_form.pdf"'
    pisa_status = pisa.CreatePDF( # create a pdf
       html, 
       dest=response, 
       # dest=BytesIO(),
       # link_callback=link_callback,
       )

    if pisa_status.err: # if error then show some funny view
       return HttpResponse('We had some errors <pre>' + html + '</pre>')
    
    return response
    """


class InstanceOwnerUpdate(LoginRequiredMixin, UpdateView):
    model = Instance
    fields = ['owner']  # fields = '__all__'
    template_name = 'nanoassets/instance_update_owner.html'
    success_url = reverse_lazy('nanoassets:supported-instance-list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        owners = []
        for owner in User.objects.all():
            if owner.username != 'admin' and 'org.com' in owner.email:
                # owners.append(owner)
                owners.append('%s ( %s )' % (owner.get_full_name(), owner.username))
        context['owners'] = owners
        return context

    def form_valid(self, form):
        original_instance = get_object_or_404(Instance, pk=form.instance.pk)
        assign_to = form.cleaned_data['owner'].strip(")").split("(")[-1].strip()

        if assign_to == 'admin':
            form.instance.owner = original_instance.owner
            messages.warning(self.request, 'the IT Assets [ ' + original_instance.serial_number + ' ] can NOT be assigned to ' + assign_to)
        elif assign_to == '' and original_instance.owner == None:
            form.instance.owner = original_instance.owner
            messages.warning(self.request, 'the ownership of IT Assets [ ' + original_instance.serial_number + ' ] got Nothing to change')
        elif assign_to == '' and original_instance.owner:
            form.instance.status = 'AVAILABLE'  # self.object.status = 'AVAILABLE'
            self.object.activityhistory_set.create(
                description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' +
                'Returned from ' + original_instance.owner.username + ' by ' + self.request.user.get_full_name())
            messages.info(self.request, 'the IT Assets [ ' + original_instance.serial_number +
                          ' ] was Returned from ' + original_instance.owner.username)
        else:
            try:
                form.instance.owner = User.objects.get(username=assign_to)
            except User.DoesNotExist:
                form.instance.owner = None

            if not original_instance.owner:
                if not form.instance.owner:
                    form.instance.owner = original_instance.owner
                    messages.warning(self.request, 'the IT Assets [ ' + original_instance.serial_number + ' ] can NOT be assigned to ' + assign_to)
                elif assign_to == "":
                    form.instance.owner = original_instance.owner
                    messages.warning(self.request, 'the ownership of IT Assets [ ' + original_instance.serial_number + ' ] got Nothing to change')
                else:
                    form.instance.status = 'inUSE'  # self.object.status = 'inUSE'
                    self.object.activityhistory_set.create(
                        description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Assigned to ' + form.instance.owner.username + ' from ' + (original_instance.owner.username if original_instance.owner else ' 🈳 ') + ' by ' + self.request.user.get_full_name())
                    messages.info(self.request, 'the IT Assets [' + original_instance.serial_number + '] was Assign to ' +
                                form.instance.owner.username + ' from ' + (original_instance.owner.username if original_instance.owner else ' 🈳 '))
            else:
                if not form.instance.owner:
                    form.instance.owner = original_instance.owner
                    messages.warning(
                        self.request, 'the IT Assets [ ' + original_instance.serial_number + ' ] can NOT be assigned to ' + assign_to)
                elif assign_to == original_instance.owner.username:
                    form.instance.owner = original_instance.owner
                    messages.warning(
                        self.request, 'the ownership of IT Assets [ ' + original_instance.serial_number + ' ] got Nothing to change')
                else:
                    form.instance.status = 'inUSE'  # self.object.status = 'inUSE'
                    self.object.activityhistory_set.create(
                        description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Assigned to ' + form.instance.owner.username + ' from ' + (original_instance.owner.username if original_instance.owner else ' 🈳 ') + ' by ' + self.request.user.get_full_name())
                    messages.info(self.request, 'the IT Assets [' + original_instance.serial_number + '] was Assign to ' +
                                form.instance.owner.username + ' from ' + (original_instance.owner.username if original_instance.owner else ' 🈳 '))

        # url_back = self.request.META.get('HTTP_REFERER')
        
        return super().form_valid(form)


@login_required
def InstanceOwnerUpdate(request, pk):
    owner_list = []
    for owner in User.objects.all():
        if owner.username != 'admin' and 'org.com' in owner.email:
            owner_list.append('%s ( %s )' % (owner.get_full_name(), owner.username))

    instance = get_object_or_404(Instance, pk=pk)

    if request.method == 'POST': # if this is a POST request then process the Form data
        form = InstnaceOwnerUpdateForm(request.POST) # create a form instance and populate it with data from the request (binding):
        if form.is_valid(): # check if the form is valid:
            # process the data in form.cleaned_data as required
            re_assign_to = form.cleaned_data.get('owner').strip(")").split("(")[-1].strip().lower()
            re_assign_to = get_object_or_404(User, username=re_assign_to) if re_assign_to != '' else re_assign_to
            if re_assign_to == '' and instance.owner:

                # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Returned from [ ' + instance.owner.get_full_name() + ' ] by ' + request.user.get_full_name())
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=instance._meta.db_table,
                    db_table_pk=instance.pk,
                    detail='Returned from [ ' + instance.owner.get_full_name() + ' ]'
                    )

                messages.info(request, 'the IT Assets [ ' + instance.serial_number + ' ] was Returned from ' + instance.owner.username)

                instance.status = 'AVAILABLE'
                instance.owner = None
                instance.save()

                return redirect('nanoassets:instance-detail', pk=instance.pk)
            
            elif re_assign_to != '' and re_assign_to != instance.owner:

                # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Re-assigned to [ ' + re_assign_to.get_full_name() + ' ] from [ ' + (instance.owner.get_full_name() if instance.owner else ' 🈳 ') + ' ] by ' + request.user.get_full_name())
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=instance._meta.db_table,
                    db_table_pk=instance.pk,
                    detail='Re-assigned to [ ' + re_assign_to.get_full_name() + ' ] from [ ' + (instance.owner.get_full_name() if instance.owner else ' 🈳 ') + ' ]'
                    )
                
                messages.info(request, 'the IT Assets [ ' + instance.serial_number + ' ] was Re-assigned to ' +
                                re_assign_to.get_full_name() + ' from ' + (instance.owner.get_full_name() if instance.owner else ' 🈳 '))

                instance.status = 'inUSE'
                instance.owner = re_assign_to
                instance.save()

                return redirect('nanoassets:instance-detail', pk=instance.pk)

            else:
                messages.warning(request, 'the ownership of IT Assets [ ' + instance.serial_number + ' ] got Nothing to change')

    else: # if this is a GET (or any other method) create the default form.
        form = InstnaceOwnerUpdateForm(initial={})

    return render(request, 'nanoassets/instance_update_owner.html', {
        'form': form,
        'owner_list': owner_list,
        'instance': instance,
        })


@login_required
def InstanceOwnerUpdate(request, pk):
    if request.method == 'POST':
        previous_url = request.META.get('HTTP_REFERER')
        re_assign_to = request.POST.get('owner_re_assign_to').strip(")").split("(")[-1].strip()
        if re_assign_to == 'admin':
            messages.warning(request, 'IT Assets can NOT be re-assignedd to Admin account')
            return redirect(previous_url)

        if re_assign_to == '' or User.objects.filter(username=re_assign_to) :
            re_assign_to = get_object_or_404(User, username=re_assign_to) if re_assign_to != '' else re_assign_to
            instance = get_object_or_404(Instance, pk=pk)
            if re_assign_to == '' and instance.owner:
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=instance._meta.db_table,
                    db_table_pk=instance.pk,
                    detail='Returned from [ ' + instance.owner.get_full_name() + ' ]'
                    )

                messages.info(request, 'the IT Assets [ ' + instance.serial_number + ' ] was Returned from ' + instance.owner.username)

                instance.status = 'AVAILABLE'
                instance.owner = None
                instance.save()

                return redirect(previous_url)
            
            elif re_assign_to != '' and re_assign_to != instance.owner:
                
                ChangeHistory.objects.create(
                    on=timezone.now(),
                    by=request.user,
                    db_table_name=instance._meta.db_table,
                    db_table_pk=instance.pk,
                    detail='Re-assigned to [ ' + re_assign_to.get_full_name() + ' ] from [ ' + (instance.owner.get_full_name() if instance.owner else ' 🈳 ') + ' ]'
                    )
                
                messages.info(request, 'the IT Assets [ ' + instance.serial_number + ' ] was Re-assigned to ' +
                                re_assign_to.get_full_name() + ' from ' + (instance.owner.get_full_name() if instance.owner else ' 🈳 '))

                instance.status = 'inUSE'
                instance.owner = re_assign_to
                instance.save()

                return redirect(previous_url)

            else:
                messages.warning(request, 'the ownership of IT Assets [ ' + instance.serial_number + ' ] got Nothing to change')
                return redirect('nanoassets:instance-detail', pk=instance.pk)

        else:
            messages.warning(request, 'the new Owner given [ ' + re_assign_to + ' ] does NOT exist')
            return redirect(previous_url)


@login_required
def InstanceHostnameUpdate(request, pk):
    instance = get_object_or_404(Instance, pk=pk)
    if request.method == 'POST':
        form = InstanceHostnameUpdateForm(request.POST)
        if form.is_valid():
            new_hostname = form.cleaned_data.get('hostname').strip()

            # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Hostname of IT Assets [ ' + instance.serial_number + ' ] was updated from [ ' + instance.hostname + ' ] to [ ' + new_hostname + ' ] by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Hostname of IT Assets [ ' + instance.serial_number + ' ] was updated from [ ' + instance.hostname + ' ] to [ ' + new_hostname + ' ]'
                )
            
            messages.info(request, 'Hostname of IT Assets [ ' + instance.serial_number + 
                ' ] was updated from [ ' + instance.hostname + ' ] to [ ' + new_hostname + ' ]')

            instance.hostname = new_hostname

            instance.save()

            return redirect('nanoassets:instance-detail', pk=instance.pk)

    else: # if this is a GET (or any other method) create the default form.
        form = InstanceHostnameUpdateForm(initial={
            'hostname': 'TS-' + instance.serial_number,
        })

    return render(request, 'nanoassets/instance_update_hostname.html', {
        'form': form,
        'instance': instance,
        })


@login_required
def InstanceSubcategoryUpdate(request, pk):
    if request.method == 'POST':
        previous_url = request.META.get('HTTP_REFERER')

        instance = Instance.objects.get(pk=pk)
        if not instance.model_type or instance.model_type.name.strip() == '' or not ModelType.objects.get(name=instance.model_type.name):
            messages.warning(request, 'please Assign a Model Type to this IT Assets first')
            return redirect(previous_url)
        
        re_subcategorize_to = request.POST.get('re_subcategorize_to').strip()
        if instance.model_type.sub_category and re_subcategorize_to == instance.model_type.sub_category.name:
            messages.warning(request, 'the Sub Category given [ ' + re_subcategorize_to + ' ] is the same as the orginal')
            return redirect(previous_url)

        if re_subcategorize_to != '' and SubCategory.objects.filter(name=re_subcategorize_to):
            sub_category = SubCategory.objects.get(name=re_subcategorize_to)
            model_type = ModelType.objects.get(name=instance.model_type.name)

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Model Type of this IT Assets was re-sub-categorized to [ ' + re_subcategorize_to + ' ] from [ ' + str(instance.model_type.sub_category) + ' ]'
                )

            messages.info(request, 'Model Type of this IT Assets was re-sub-categorized to [ ' + re_subcategorize_to + ' ] from [ ' + str(instance.model_type.sub_category) + ' ]')

            model_type.sub_category = sub_category
            model_type.save()

            return redirect(previous_url)

        else:
            messages.warning(request, 'the Sub Category given [ ' + re_subcategorize_to + ' ] is invalid')
            return redirect(previous_url)


@login_required
def InstanceModelTypeUpdate(request, pk):
    if request.method == 'POST':
        previous_url = request.META.get('HTTP_REFERER')
        instance = Instance.objects.get(pk=pk)
        
        change_model_type_to = request.POST.get('change_model_type_to').split("-")[-1].strip()
        if instance.model_type and change_model_type_to == instance.model_type.name:
            messages.warning(request, 'the Model / Type given [ ' + change_model_type_to + ' ] is the same as the orginal')
            return redirect(previous_url)

        if change_model_type_to != '' and ModelType.objects.filter(name=change_model_type_to):
            model_type = ModelType.objects.get(name=change_model_type_to)

            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Model Type of this IT Assets was changed to [ ' + request.POST.get('change_model_type_to').strip() + ' ] from [ ' + str(instance.model_type) + ' ]'
                )

            messages.info(request, 'Model Type of this IT Assets was changed to [ ' + request.POST.get('change_model_type_to').strip() + ' ] from [ ' + str(instance.model_type) + ' ]')

            instance.model_type = model_type
            instance.save()

            return redirect(previous_url)

        else:
            messages.warning(request, 'the Sub Category given [ ' + request.POST.get('change_model_type_to').strip() + ' ] is invalid')
            return redirect(previous_url)


@login_required
def InstanceInRepair(request, pk):
    # 测试 组 权限 user.groups.filter(name__in=['group1', 'group2']).exists()
    if request.user.groups.filter(name='IT China').exists:
        instance = get_object_or_404(Instance, pk=pk)
        if instance.status != 'inREPAIR':
            instance.status = 'inREPAIR'
            # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Sent to repair by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Sent to repair'
                )
            
            messages.info(request, instance.serial_number + ' (' + instance.model_type.name + ') ' + "was sent to repair")
        elif instance.status == 'inREPAIR' and instance.owner:
            instance.status = 'inUSE'
            # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Got back from repairing by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Got back from repairing'
                )
            
            messages.info(request, instance.serial_number + ' (' + instance.model_type.name + ') ' + "was Repaired")
        elif instance.status == 'inREPAIR' and not instance.owner:
            instance.status = 'AVAILABLE'
            # instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Got back from repairing by ' + request.user.get_full_name())
            
            ChangeHistory.objects.create(
                on=timezone.now(),
                by=request.user,
                db_table_name=instance._meta.db_table,
                db_table_pk=instance.pk,
                detail='Got back from repairing'
                )
            
            messages.info(request, instance.serial_number + ' (' + instance.model_type.name + ') ' + "was Repaired")

        instance.save()

    return redirect('nanoassets:supported-instance-list')


@login_required
def InstanceBulkUpd(request):
    if request.method == 'POST':
        if request.POST.getlist('instance'):
            if 'scrapping-request' in request.POST or 'branchsite-transfer' in request.POST:
                for selected_instance_pk in request.POST.getlist('instance'):
                    selected_instance = get_object_or_404(Instance, pk=selected_instance_pk)
                    if selected_instance.status != 'AVAILABLE':
                        messages.warning(request, "only Available IT Assets can be Transferred or Scrapped")
                        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
                    elif selected_instance.scrap_request:
                        messages.warning(request, "looks this IT Assets has been requested for Scrapping")
                        return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面

            if 'scrapping-request' in request.POST:
                new_scrap_request = ScrapRequest.objects.create(requested_by=request.user)
                new_scrap_request.save()

                for selected_instance_pk in request.POST.getlist('instance'):
                    selected_instance = get_object_or_404(Instance, pk=selected_instance_pk)
                    selected_instance.scrap_request = new_scrap_request
                    selected_instance.save()

                IT_reviewer_emails = []
                for reviewer in User.objects.filter(groups__name='IT Reviewer'):
                    IT_reviewer_emails.append(reviewer.email)

                message = get_template("nanoassets/instance_scrapping_request_email.html").render({
                    'protocol': 'http',
                    'domain': '127.0.0.1:8000',
                    'new_scrap_request': new_scrap_request,
                })
                mail = EmailMessage(
                    subject='iTS expr - Pl approve - scrapping IT assets requested by ' + new_scrap_request.requested_by.get_full_name(),
                    body=message,
                    from_email='nanoMsngr <do-not-reply@org.com>',
                    to=IT_reviewer_emails,
                    cc=[request.user.email],
                    # reply_to=[EMAIL_ADMIN],
                    # connection=
                )
                mail.content_subtype = "html"
                mail.send()
                messages.success(request, "the notification email with the request detail is sent")

                return redirect('nanoassets:instance-scrapping-request-list')

            elif 'branchsite-transfer' in request.POST:
                try:
                    branchsite_selected = branchSite.objects.get(name=request.POST['branchsite_selected'])
                except (KeyError, branchSite.DoesNotExist):
                    messages.info(request, 'distination Site given is invalid')
                else:
                    for selected_instance_pk in request.POST.getlist('instance'):
                        selected_instance = get_object_or_404(Instance, pk=selected_instance_pk)
                        # selected_instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Transferred to ' + request.POST['branchsite_selected'] + ' from ' + selected_instance.branchSite.name + ' by ' + request.user.get_full_name())
                        
                        ChangeHistory.objects.create(
                            on=timezone.now(),
                            by=request.user,
                            db_table_name=selected_instance._meta.db_table,
                            db_table_pk=selected_instance.pk,
                            detail='Transferred to ' + request.POST['branchsite_selected'] + ' from ' + selected_instance.branchSite.name
                            )
                        
                        selected_instance.branchSite = get_object_or_404(branchSite, name=request.POST['branchsite_selected'])
                        
                        selected_instance.save()

                    messages.info(request, 'the selected IT Assets were Transferred to ' + request.POST['branchsite_selected'])

                # return redirect('nanoassets:supported-instance-list')
            elif 'contract-associate' in request.POST:
                try:
                    contract_selected = Contract.objects.get(briefing=request.POST['contract_selected'])
                except (KeyError, Contract.DoesNotExist):
                    messages.info(request, 'Contract given is invalid')
                else:
                    for selected_instance_pk in request.POST.getlist('instance'):
                        selected_instance = get_object_or_404(Instance, pk=selected_instance_pk)
                        contract_selected.assets.add(selected_instance)
                        # contract_selected.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Associated with the IT Assets [ ' + selected_instance.serial_number + ' ] by ' + request.user.get_full_name())
                        
                        ChangeHistory.objects.create(
                            on=timezone.now(),
                            by=request.user,
                            db_table_name=contract_selected._meta.db_table,
                            db_table_pk=contract_selected.pk,
                            detail='Associated with the IT Assets [ ' + selected_instance.serial_number + ' ]'
                            )
                        
                        contract_selected.save()

                        # selected_instance.activityhistory_set.create(description='[ ' + timezone.now().strftime("%Y-%m-%d %H:%M:%S") + ' ] ' + 'Associated with the Contract [ ' + contract_selected.briefing + ' ] by ' + request.user.get_full_name())
                        
                        ChangeHistory.objects.create(
                            on=timezone.now(),
                            by=request.user,
                            db_table_name=selected_instance._meta.db_table,
                            db_table_pk=selected_instance.pk,
                            detail='Associated with the Contract [ ' + contract_selected.briefing + ' ]'
                            )
                        
                        selected_instance.save()

                    messages.info(request, 'the selected IT Assets were Associated with the Contract [ ' + request.POST['contract_selected'] + ' ]')
                    
            return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面
        else:
            messages.info(request, "no IT Assets were selected")
            # return redirect('nanoassets:supported-instance-list')
            return redirect(request.META.get('HTTP_REFERER')) # 重定向 至 前一个 页面


@login_required
def InstanceDisposalRequestApprove(request, pk):
    if request.method == 'POST':
        disposalRequest = get_object_or_404(disposalRequest, pk=pk)
        disposalRequest.status = 'A'
        disposalRequest.approved_by = request.user
        disposalRequest.approved_on = timezone.now()
        disposalRequest.save()

        for dispoasedInstance in disposalRequest.instance_set.all():
            if disposalRequest.type == 'S':
                dispoasedInstance.status = 'SCRAPPED'
            elif disposalRequest.type == 'R':
                dispoasedInstance.status = 'reUSE'
            elif dispoasedInstance.type == 'B':
                dispoasedInstance.status = 'buyBACK'
                
            dispoasedInstance.save()

        IT_reviewer_emails = []
        for reviewer in User.objects.filter(groups__name='IT Reviewer'):
            IT_reviewer_emails.append(reviewer.email)

        message = get_template("nanoassets/instance_Disposal_request_approved_email.html").render({
            'protocol': 'http',
            'domain': '127.0.0.1:8000',
            # 'instances': request.POST.getlist('instance'),
            'disposalRequest': disposalRequest,
        })
        mail = EmailMessage(
            subject='iTS expr - Pl notice - Disposal Request is approved by ' + disposalRequest.approved_by.get_full_name(),
            body=message,
            from_email='nanoMsngr <do-not-reply@org.com>',
            to=[disposalRequest.requested_by.email],
            cc=IT_reviewer_emails,
            # reply_to=[EMAIL_ADMIN],
            # connection=
        )
        mail.content_subtype = "html"
        mail.send()
        messages.success(
            request, "the notification email with the apprival decision is sent.")

        return redirect('nanoassets:instance-Disposal-request-list')
