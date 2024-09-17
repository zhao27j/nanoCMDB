import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { formsValidation } from './modalFormsValidation.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// Instance Bulk Update

const bulkUpdModal = document.querySelector('#bulkUpdModal');
const bulkUpdModalInstance = bootstrap.Modal.getOrCreateInstance('#bulkUpdModal');
// const bulkUpdModalForm = document.querySelector('#bulkUpdModalForm');
const bulkUpdModalInput = bulkUpdModal.querySelector('#bulkUpdModalInput');
const bulkUpdModalBtn = bulkUpdModal.querySelector('#bulkUpdModalBtn');

let is_IT_staff = document.querySelector("small span.position-absolute.badge.rounded-pill.bg-danger") ? document.querySelector("small span.position-absolute.badge.rounded-pill.bg-danger").innerText.includes('IT staff') : false;
/*
async function getRequesterPermissionsAsync() {
    const getUri = window.location.origin + '/json_response/requester_permissions/';
    try {
        const json = await getJsonResponseApiData(getUri);
        if (json.is_IT_staff) {
            is_IT_staff = json.is_IT_staff;
            baseMessagesAlert("you're the authorized IT staff", 'info');
        } else {
            baseMessagesAlert("you're NOT the authorized IT staff", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}
getRequesterPermissionsAsync();
*/
let dblClickedEl = null, dblClickedElInnerHTML, dblClickedInstancePk, dblClickedInstanceCase;
let modalLbl, modalInputTag, getLstUri, optLst, chkLst, postUpdUri, instanceSelectedEl, instanceSelectedPk;
document.addEventListener('dblclick', e => { // listerning all Double Click events on the Document
    if (!is_IT_staff) {
        baseMessagesAlert("you're NOT authorized IT staff", 'danger');
        bulkUpdModalInstance.hide();
    } else {
        dblClickedEl = e.target.closest("[id*='Instance']");
        if (dblClickedEl) {
            const statusTdEl = dblClickedEl.closest('tr') ? dblClickedEl.closest('tr').querySelector("[id*='status']") : dblClickedEl.closest('ul').querySelector("[id*='status']");

            if (!((statusTdEl.innerHTML.includes('recycle') && statusTdEl.innerHTML.includes('Available')) || statusTdEl.innerHTML.includes('Scraping'))) {
                dblClickedElInnerHTML = dblClickedEl.querySelector('small').innerHTML === '🈳' ? '' : dblClickedEl.querySelector('small').innerHTML;
                dblClickedInstancePk = dblClickedEl.id.split('Instance')[1];
                dblClickedInstanceCase = dblClickedEl.id.split('Instance')[0];
                switch (dblClickedInstanceCase) {
                    case 'status':
                        if (!dblClickedElInnerHTML.includes('in Use')){
                            modalLbl = 'Apply for disposal ...';
                            modalInputTag = 'status';
                            getLstUri = window.location.origin + '/json_response/disposal_lst/';
                            postUpdUri = window.location.origin + '/instance/disposal_request/';
                            bulkUpdModalInstance.show();
                        } else {
                            baseMessagesAlert(`selected IT Assets is in Use`, 'warning');
                        }
                        break;
                    case 'inRepair':
                        break;
                    case 'subCategory':
                        if (document.querySelector(`#model_typeInstance${dblClickedInstancePk}`).querySelector('small').innerHTML != '') {
                            modalLbl = 'Re-categorize to ...';
                            modalInputTag = 'subCategory';
                            getLstUri = window.location.origin + '/json_response/sub_category_lst/';
                            postUpdUri = window.location.origin + '/instance/re_subcategorizing_to/';
                            bulkUpdModalInstance.show();
                        } else {
                            baseMessagesAlert(`please apply a Model / Type to this IT Assets first`, 'warning');
                            bulkUpdModalInstance.hide();
                        }
                        break;
                    case 'model_type':
                        modalLbl = 'Change to ...';
                        modalInputTag = 'model_type';
                        getLstUri = window.location.origin + '/json_response/model_type_lst/';
                        postUpdUri = window.location.origin + '/instance/model_type_changing_to/';
                        bulkUpdModalInstance.show();
                        break;
                    case 'hostname':
                        break;
                    case 'owner':
                        modalLbl = 'Re-assign to ...';
                        modalInputTag = 'owner';
                        getLstUri = window.location.origin + '/json_response/owner_lst/';
                        postUpdUri = window.location.origin + '/instance/owner_re_assigning_to/';
                        bulkUpdModalInstance.show();
                        break;
                    case 'branchSite':
                        modalLbl = 'Transfer to ...';
                        modalInputTag = 'branchSite';
                        getLstUri = window.location.origin + '/json_response/branchSite_lst/';
                        postUpdUri = window.location.origin + '/instance/branchSite_transferring_to/';
                        bulkUpdModalInstance.show();
                        break;
                    case 'contract':
                        modalLbl = 'Associate with ...';
                        modalInputTag = 'contract';
                        getLstUri = window.location.origin + '/json_response/contract_lst/';
                        postUpdUri = window.location.origin + '/instance/contract_associating_with/';
                        bulkUpdModalInstance.show();
                        break;
                }
            } else {
                baseMessagesAlert(`selected IT Assets is in process for Disposal`, 'warning');
            }
        }
    }
/*
    if (e.target.closest("[id^='instanceOwner']")) {
        dblClickedEl = e.target.closest("[id^='instanceOwner']");
        dblClickedElInnerHTML = dblClickedEl.querySelector('small').innerHTML === '🈳' ? '' : dblClickedEl.querySelector('small').innerHTML; // instanceOwnerDataSet = dblClickedEl.dataset.instanceOwner;
        bulkUpdModalInstance.show();
    }
    else if (e.target.closest("[id^='instanceSubcategory']")) {
        dblClickedEl = e.target.closest("[id^='instanceSubcategory']");
        dblClickedElInnerHTML = dblClickedEl.querySelector('small').innerHTML === '🈳' ? '' : dblClickedEl.querySelector('small').innerHTML;
        if (document.querySelector(`#model_typeInstance${dblClickedEl.id.split('instanceSubcategory')[1]}`).querySelector('small').innerHTML != '') {
            bulkUpdModalInstance.show();
        } else {
            baseMessagesAlert(`please apply a Model / Type to this IT Assets first`, 'warning');
            bulkUpdModalInstance.hide();
        }
    }
    else if (e.target.closest("[id^='instancemodel_type']")) {
        dblClickedEl = e.target.closest("[id^='instancemodel_type']");
        dblClickedElInnerHTML = dblClickedEl.querySelector('small').innerHTML === '🈳' ? '' : dblClickedEl.querySelector('small').innerHTML;
        bulkUpdModalInstance.show();
    }
*/
});

bulkUpdModal.addEventListener('show.bs.modal', (e) => {
    if (e.relatedTarget) {
        dblClickedEl = undefined;
        if (e.relatedTarget.innerHTML.includes('Associate with')) {
            modalLbl = 'Associate with ...';
            modalInputTag = 'contract';
            getLstUri = window.location.origin + '/json_response/contract_lst/';
            postUpdUri = window.location.origin + '/instance/contract_associating_with/';
        }
        else if (e.relatedTarget.innerHTML.includes('Transfer to')) {
            modalLbl = 'Transfer to ...';
            modalInputTag = 'branchSite';
            getLstUri = window.location.origin + '/json_response/branchSite_lst/';
            postUpdUri = window.location.origin + '/instance/branchSite_transferring_to/';
        }
        else if (e.relatedTarget.innerHTML.includes('Apply for Disposal')) {
            modalLbl = 'Apply for disposal ...';
            modalInputTag = 'status';
            getLstUri = window.location.origin + '/json_response/disposal_lst/';
            postUpdUri = window.location.origin + '/instance/disposal_request/';
        }
    }
/*
    else {
        if (dblClickedEl.id.includes('instanceOwner')) {}
        else if (dblClickedEl.id.includes('instanceSubcategory')) {}
        else if (dblClickedEl.id.includes('instancemodel_type')) {}
    }
*/
    instanceSelectedPk = [];
    if (dblClickedEl) {
        instanceSelectedEl = [];
        instanceSelectedEl.push(dblClickedEl);
        instanceSelectedPk.push(dblClickedEl.id.split('Instance')[1]);
    } else {
        instanceSelectedEl = document.querySelectorAll("td > input[type='checkbox']:checked");
        if (instanceSelectedEl.length > 0) {
            instanceSelectedEl.forEach(i => {instanceSelectedPk.push(i.value);})
        }
    }
    bulkUpdModal.querySelector('#bulkUpdModalLabel').innerHTML = modalLbl;
    bulkUpdModal.querySelector('span').innerHTML = instanceSelectedPk.join(', ');    
});

bulkUpdModal.addEventListener('shown.bs.modal', () => {
    if (instanceSelectedPk.length > 0) {
        getLstUri += `?instanceSelectedPk=${instanceSelectedPk}`;
        getOptAndChkLstAsync(getLstUri);
        async function getOptAndChkLstAsync(getLstUri) {
            try {
                const json = await getJsonResponseApiData(getLstUri);
                if (json) {
                    optLst = json[0];
                    chkLst = json[1];
                    // baseMessagesAlert("the data for Bulk Update is ready", 'info');
                    if (instanceSelectedEl.length > 0) {
                        const bulkUpdModalDatalist = bulkUpdModal.querySelector('#bulkUpdModalDatalist');
                        if (bulkUpdModalDatalist.querySelectorAll('option').length > 0 ) {
                            while (bulkUpdModalDatalist.querySelector('option')) {
                                bulkUpdModalDatalist.removeChild(bulkUpdModalDatalist.querySelector('option'))
                            }
                        }
                        Object.keys(optLst).forEach(key => {
                            const dataListOpt = document.createElement('option');
                            dataListOpt.textContent = key;
                            bulkUpdModalDatalist.appendChild(dataListOpt);
                        })
                        bulkUpdModalInput.focus();
                        bulkUpdModalInput.value = '';
                        bulkUpdModalInput.nextElementSibling.innerHTML = '';
                        bulkUpdModalBtn.classList.add('disabled');
                    } else {
                        baseMessagesAlert(`no IT Assets is selected`, 'warning');
                        bulkUpdModalInstance.hide();
                    }
                } else {
                    baseMessagesAlert("the data for Bulk Update is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with the async operation:', error);
            }
        }
    /*
        fetch(getLstUri
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            }).then(json => {
                optLst = json[0];
                chkLst = json[1];
            }).catch(error => {console.error('Error:', error);})
    */
    }
}, {});

// bulkUpdModalForm.addEventListener('submit', (e) => { // listening Form Submission event
bulkUpdModalBtn.addEventListener('click', (e) => { // listening onClick event on Submit btn
    const modalInputChkResult = modalInputChk(e, optLst, chkLst, bulkUpdModal, modalInputTag);
    if (modalInputChkResult) {
        e.preventDefault();
        bulkUpdModalInstance.hide();

        instanceSelectedEl.forEach(i => {
            // const instanceBulkUpdEl = document.querySelector(`#${modalInputTag}Instance${i.id.split('Instance')[1]}`);
            const instanceBulkUpdEl = document.querySelector(`[id="${modalInputTag}Instance${i.id.split('Instance')[1]}"]`);
            if (instanceBulkUpdEl.closest('td')) {
                const spinnerEl = document.createElement('div');
            
                new Map([
                    ['class', 'spinner-border spinner-border-sm text-secondary'],
                    ['role', 'status'],
                ]).forEach((attrValue, attrKey, attrMap) => {
                    spinnerEl.setAttribute(attrKey, attrValue);
                });

                spinnerEl.innerHTML = [
                    `<span class="visually-hidden">Loading...</span>`,
                ].join('');

                instanceBulkUpdEl.closest('td').insertBefore(spinnerEl, instanceBulkUpdEl.closest('td').firstChild);
            }
        })

        const bulkUpdModalInputValue = bulkUpdModalInput.value.trim();
        const formData = new FormData();
        formData.append('bulkUpdModalInputValue', bulkUpdModalInputValue);
        formData.append('instanceSelectedPk', instanceSelectedPk);

        const csrftoken = bulkUpdModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

        fetch(postUpdUri, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            mode: 'same-origin', // Do not send CSRF token to another domain
            body: formData,
        }).then(response => {
            response.json();
        }).then(result => {
            let msgAlert;
            instanceSelectedEl.forEach(i => {
                if (modalInputTag == 'owner') {
                    if (bulkUpdModalInputValue == '') {
                        msgAlert = `the IT Assets [ ${instanceSelectedPk.join(', ')} ] was Returned from [ ${dblClickedElInnerHTML} ]`;
                        document.querySelector(`#statusInstance${i.id.split('Instance')[1]}`).innerHTML = '<small>Available</small>';
                    } else {
                        msgAlert = `the IT Assets [ ${instanceSelectedPk.join(', ')} ] was Re-assigned to [ ${bulkUpdModalInputValue} ] from [ ${dblClickedElInnerHTML == '' ? "🈳" : dblClickedElInnerHTML} ]`;
                        document.querySelector(`#statusInstance${i.id.split('Instance')[1]}`).innerHTML = '<small>in Use</small>';
                    }
                }
                else if (modalInputTag == 'contract') {
                    msgAlert = `the selected IT Assets [ ${instanceSelectedPk.join(', ')} ] were Associated with [ ${bulkUpdModalInputValue} ]`;
                }
                else if (modalInputTag == 'branchSite') {
                    msgAlert = `the selected IT Assets [ ${instanceSelectedPk.join(', ')} ] were Transfered to [ ${bulkUpdModalInputValue} ]`;
                }
                else if (modalInputTag == 'subCategory') {
                    msgAlert = `the selected IT Assets [ ${instanceSelectedPk.join(', ')} ] was re-subCategorized to [ ${bulkUpdModalInputValue} ]`;
                }
                else if (modalInputTag == 'model_type') {
                    msgAlert = `the Model / Type of the selected IT Assets [ ${instanceSelectedPk.join(', ')} ] was Changed to [ ${bulkUpdModalInputValue} ]`;
                }
                else if (modalInputTag == 'status') {
                    msgAlert = `${bulkUpdModalInputValue} request for the selected IT Assets [ ${instanceSelectedPk.join(', ')} ] was sent`;
                }
                const instanceBulkUpdEl = document.querySelector(`#${modalInputTag}Instance${i.id.split('Instance')[1]}`);
                instanceBulkUpdEl.closest('td') ? instanceBulkUpdEl.closest('td').querySelector('div.spinner-border').remove() : null;
                const instanceBulkUpdElHyperLink = instanceBulkUpdEl.querySelector('a');
                if (instanceBulkUpdElHyperLink) {
                    instanceBulkUpdElHyperLink.href = window.location.origin + optLst[bulkUpdModalInputValue];
                    instanceBulkUpdElHyperLink.className = "text-decoration-none";
                }
                const instanceBulkUpdElSmall = instanceBulkUpdEl.querySelector('small');
                if (instanceBulkUpdElSmall) {
                    bulkUpdModalInputValue == '' ? instanceBulkUpdElSmall.innerHTML = "🈳" : instanceBulkUpdElSmall.innerHTML = bulkUpdModalInputValue;
                }
                /*
                if (!instanceBulkUpdEl.querySelector('a')) {instanceBulkUpdEl.querySelector('small').remove();}
                const instanceBulkUpdElHyperLink = instanceBulkUpdEl.appendChild(document.createElement('a'));
                instanceBulkUpdElHyperLink.appendChild(document.createElement('small')).innerHTML = bulkUpdModalInputValue;
                */
                i.checked = false; // uncheck
            });

            baseMessagesAlert(msgAlert, 'success');
            console.log('Success:', result);
        }).catch(error => {console.error('Error:', error)})
    }
});

bulkUpdModalInput.addEventListener('blur', (e) => {modalInputChk(e, optLst, chkLst, bulkUpdModal, modalInputTag);});

/*
const bulkUpdModalInputCtrl = new AbortController();
bulkUpdModalBtn.addEventListener('focus', (e) => {
    modalInputChk(e, optLst, chkLst, bulkUpdModal, modalInputTag);
}, { signal: bulkUpdModalInputCtrl.signal }  // remove listener from modal Input element after validation
);
*/