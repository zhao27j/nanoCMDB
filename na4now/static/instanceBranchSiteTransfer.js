import { formsValidation } from './modalFormsValidation.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// input validation - Branch Site Transferred
const branchSiteUpdModal = document.querySelector('#branchSiteUpdModal');
const branchSiteUpdModalInstance = bootstrap.Modal.getOrCreateInstance('#branchSiteUpdModal');
const branchSiteUpdModalForm = document.querySelector('#branchSiteUpdModalForm');
const csrftoken = branchSiteUpdModalForm.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
const branchSiteUpdModalInput = document.querySelector('#branchSiteUpdModalInput');
const branchSiteUpdModalDataLst = document.querySelector('#branchSiteUpdModalDataLst');
const branchSiteUpdModalBtn = document.querySelector('#branchSiteUpdModalBtn');
// const branchSiteUpdModalInvalidSpan = document.querySelector('#branchSiteUpdModalInvalidSpan');


let branchSiteOptLst, branchSiteChkLst, instanceSelected, instanceSelectedPkPost;

branchSiteUpdModal.addEventListener('show.bs.modal', () => {
    instanceSelectedPkPost = [];
    instanceSelected = document.querySelectorAll("td > input[type='checkbox']:checked");
    if (instanceSelected.length > 0) {

        instanceSelected.forEach( i => {instanceSelectedPkPost.push(i.value);})

        let jsonResponsebranchSiteLstDataSet = branchSiteUpdModal.dataset.jsonresponseBranchsiteLst; // 'http://127.0.0.1:8000/json_response/branchSite_lst'
        jsonResponsebranchSiteLstDataSet += `?instanceSelectedPkPost=${instanceSelectedPkPost}`

        fetch(jsonResponsebranchSiteLstDataSet
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            }).then(json => {
                branchSiteOptLst = json[0];
                branchSiteChkLst = json[1];
            }).catch(error => {console.error('Error:', error);})

    } /*else {
        baseMessagesAlert(`no IT Assets is selected`, 'warning');
        branchSiteUpdModalInstance.hide();
    }*/
})

branchSiteUpdModal.addEventListener('shown.bs.modal', () => {
    if (instanceSelected.length > 0) {
        if ( branchSiteUpdModalDataLst.querySelectorAll('option').length > 0 ) {
            while (branchSiteUpdModalDataLst.querySelector('option')) {
                branchSiteUpdModalDataLst.removeChild(branchSiteUpdModalDataLst.querySelector('option'))
            }
        }

        Object.keys(branchSiteOptLst).forEach(key => {
            const dataLstOpt = document.createElement('option');
            dataLstOpt.textContent = key;
            branchSiteUpdModalDataLst.appendChild(dataLstOpt);
        })

        branchSiteUpdModalInput.focus();
        branchSiteUpdModalBtn.classList.add('disabled');
    } else {
        baseMessagesAlert(`no IT Assets is selected`, 'warning');
        branchSiteUpdModalInstance.hide();
    }
}, {});

const branchSiteUpdModalInputCtrl = new AbortController();

branchSiteUpdModalInput.addEventListener('focusout', (e) => {
    modalInputChk(e, branchSiteOptLst, branchSiteChkLst, branchSiteUpdModal, 'branchSite');
}, { signal: branchSiteUpdModalInputCtrl.signal });


branchSiteUpdModalForm.addEventListener('submit', (e) => { // listening Form Submission event
    const modalInputChkResult = modalInputChk(e, branchSiteOptLst, branchSiteChkLst, branchSiteUpdModal, 'branchSite');
    if (modalInputChkResult) {
        e.preventDefault();
        branchSiteUpdModalInputCtrl.abort(); // remove listener from modal Input element after validation
        branchSiteUpdModalInstance.hide();

        const branchSiteTransferredTo = branchSiteUpdModalInput.value.trim();
        const formData = new FormData();
        formData.append('branchSite_transferred_to', branchSiteTransferredTo);
        formData.append('instanceSelectedPkPost', instanceSelectedPkPost);

        const instanceBranchSiteTransferredToUriDataSet = branchSiteUpdModal.dataset.instanceBranchsiteTransferredToUri;
        fetch(instanceBranchSiteTransferredToUriDataSet, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            mode: 'same-origin', // Do not send CSRF token to another domain
            body: formData,
        }).then(response => {
            response.json();
            
        }).then(result => {
            baseMessagesAlert(`the selected IT Asset(s) [ ${instanceSelectedPkPost} ] were Transferred to [ ${branchSiteTransferredTo} ]`, 'success');

            instanceSelected.forEach( i => {
                const branchSiteDisplay = document.querySelector(`#instanceBranchSite${i.id.split('instance')[1]}`).querySelector('small')
                branchSiteDisplay.innerHTML = branchSiteTransferredTo;

                i.checked = false; // uncheck
            });
    
            console.log('Success:', result);
        }).catch(error => {console.error('Error:', error)})
    }
});
