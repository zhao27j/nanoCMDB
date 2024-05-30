import { formsValidation } from './modalFormsValidation.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// input validation - Contract Associated with
const contractUpdModal = document.querySelector('#contractUpdModal');
const contractUpdModalInstance = bootstrap.Modal.getOrCreateInstance('#contractUpdModal');
const contractUpdModalForm = document.querySelector('#contractUpdModalForm');
const csrftoken = contractUpdModalForm.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
const contractUpdModalInput = document.querySelector('#contractUpdModalInput');
const contractUpdModalDataList = document.querySelector('#contractUpdModalDataList');
const contractUpdModalBtn = document.querySelector('#contractUpdModalBtn');
// const contractUpdModalInvalidSpan = document.querySelector('#contractUpdModalInvalidSpan');

let contractOptLst, contractChkLst, instanceSelected, instanceSelectedPkPost;

contractUpdModal.addEventListener('show.bs.modal', () => {
    instanceSelectedPkPost = [];
    instanceSelected = document.querySelectorAll("td > input[type='checkbox']:checked");
    if (instanceSelected.length > 0) {

        instanceSelected.forEach( i => {instanceSelectedPkPost.push(i.value);})

        let jsonResponseContractListDataSet = contractUpdModal.dataset.jsonresponseContractList; // 'http://127.0.0.1:8000/json_response/contract_list'
        jsonResponseContractListDataSet += `?instanceSelectedPkPost=${instanceSelectedPkPost}`

        fetch(jsonResponseContractListDataSet
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            }).then(json => {
                contractOptLst = json[0];
                contractChkLst = json[1];
            }).catch(error => {console.error('Error:', error);})

    } /*else {
        baseMessagesAlert(`no IT Assets is selected`, 'warning');
        contractUpdModalInstance.hide();
    }*/
})

contractUpdModal.addEventListener('shown.bs.modal', () => {
    if (instanceSelected.length > 0) {
        if ( contractUpdModalDataList.querySelectorAll('option').length > 0 ) {
            while (contractUpdModalDataList.querySelector('option')) {
                contractUpdModalDataList.removeChild(contractUpdModalDataList.querySelector('option'))
            }
        }

        Object.keys(contractOptLst).forEach(key => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = key;
            contractUpdModalDataList.appendChild(dataListOpt);
        })

        contractUpdModalInput.focus();
        contractUpdModalBtn.classList.add('disabled');
    } else {
        baseMessagesAlert(`no IT Assets is selected`, 'warning');
        contractUpdModalInstance.hide();
    }
}, {});

const contractUpdModalInputCtrl = new AbortController();
contractUpdModalInput.addEventListener('focusout', (e) => {modalInputChk(e, contractOptLst, contractChkLst, contractUpdModal, 'Contract');}, { signal: contractUpdModalInputCtrl.signal });

contractUpdModalForm.addEventListener('submit', (e) => { // listening Form Submission event
    const modalInputChkResult = modalInputChk(e, contractOptLst, contractChkLst, contractUpdModal, 'Contract');
    if (modalInputChkResult) {
        e.preventDefault();
        contractUpdModalInputCtrl.abort(); // remove listener from modal Input element after validation
        contractUpdModalInstance.hide();

        const contractUpdModalInputValue = contractUpdModalInput.value.trim();
        const formData = new FormData();
        formData.append('contract_associated_with', contractUpdModalInputValue);
        formData.append('instanceSelectedPkPost', instanceSelectedPkPost);

        const instanceContractAssociatedWithUriDataSet = contractUpdModal.dataset.instanceContractAssociatedWithUri;
        fetch(instanceContractAssociatedWithUriDataSet, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            mode: 'same-origin', // Do not send CSRF token to another domain
            body: formData,
        }).then(response => {
            response.json();
        }).then(result => {
            baseMessagesAlert(`the selected IT Asset(s) [ ${instanceSelectedPkPost} ] were associated with [ ${contractUpdModalInputValue} ]`, 'success');

            instanceSelected.forEach( i => {
                const instanceAssociatedContract = document.querySelector(`#instanceAssociatedContract${i.id.split('instance')[1]}`);
                if (!instanceAssociatedContract.querySelector('a')) {
                    instanceAssociatedContract.querySelector('small').remove();
                }
                const instanceAssociatedContractHyperLink = instanceAssociatedContract.appendChild(document.createElement('a'));
                instanceAssociatedContractHyperLink.href = window.location.origin + contractOptLst[contractUpdModalInputValue];
                instanceAssociatedContractHyperLink.className = "text-decoration-none";

                instanceAssociatedContractHyperLink.appendChild(document.createElement('small')).innerHTML = contractUpdModalInputValue;

                i.checked = false; // uncheck
            });

            console.log('Success:', result);
        }).catch(error => {console.error('Error:', error)})
    }
});
