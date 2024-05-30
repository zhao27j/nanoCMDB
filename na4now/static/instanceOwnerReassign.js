import { formsValidation } from './modalFormsValidation.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// owner Upd input validation
const ownerUpdModal = document.querySelector('#ownerUpdModal');
const ownerUpdModalInstance = bootstrap.Modal.getOrCreateInstance('#ownerUpdModal');
const ownerUpdModalForm = document.querySelector('#ownerUpdModalForm');
const csrftoken = ownerUpdModalForm.querySelector('[name=csrfmiddlewaretoken]').value; // get CSRF Token from the related Form element
const ownerUpdModalInput = document.querySelector('#ownerUpdModalInput');
const ownerUpdModalDataList = document.querySelector('#ownerUpdModalDataList');
const ownerUpdModalBtn = document.querySelector('#ownerUpdModalBtn');
// const ownerUpdModalInvalidSpan = document.querySelector('#ownerUpdModalInvalidSpan');

document.addEventListener('mouseover', e => {
    if (e.target.id.includes('instanceOwner') || (e.target.parentElement ? e.target.parentElement.id.includes('instanceOwner') : false)) {
        e.target.style.cursor = 'pointer';
        e.target.style.color = 'orange'; // 突出显示鼠标悬停目标
        setTimeout(() => { e.target.style.color = "";}, 500); // 短暂延迟后重置颜色
    }
})

let dblClickedElIdUniqueCode, dblClickedEl, dblClickedElInnerHTML; // instanceOwnerDataSet looks not required
document.addEventListener('dblclick', e => { // listerning all Double Click events on the Document
    if (e.target.id.includes('instanceOwner') || e.target.parentElement.id.includes('instanceOwner')) {
        dblClickedEl = e.target.id.includes('instanceOwner') ? e.target : e.target.parentElement;
        dblClickedElIdUniqueCode = dblClickedEl.id.split('instanceOwner')[1];
        dblClickedElInnerHTML = dblClickedEl.querySelector('small').innerHTML === '🈳' ? '' : dblClickedEl.querySelector('small').innerHTML;
        // instanceOwnerDataSet = dblClickedEl.dataset.instanceOwner;

        ownerUpdModalInstance.show();
    }
});

let owner_list
const jsonResponseOwnerListDataSet = ownerUpdModal.dataset.jsonresponseOwnerList;
fetch(jsonResponseOwnerListDataSet // 'http://127.0.0.1:8000/json_response/owner_list'
    ).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    }).then(
        json => owner_list = json
    ).catch(error => {console.error('Error:', error);})

// ownerUpdModal.addEventListener('hidden.bs.modal', () => ownerUpdModalInputCtrl.abort()); // remove listener from modal Input element after validation

ownerUpdModal.addEventListener('shown.bs.modal', () => {
    ownerUpdModalInput.focus();
    ownerUpdModalBtn.classList.add('disabled');

    if ( ownerUpdModalDataList.querySelectorAll('option').length == 0 ) {
        Object.keys(owner_list).forEach(key => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = key;
            ownerUpdModalDataList.appendChild(dataListOpt);
        })}
}, {});

const ownerUpdModalInputCtrl = new AbortController();
ownerUpdModalInput.addEventListener('focusout', (e) => ownerChk(e), { signal: ownerUpdModalInputCtrl.signal });
/*
ownerUpdModalInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        ownerChk(e);
    }
});
*/

ownerUpdModalForm.addEventListener('submit', (e) => {

    if (ownerChk(e)) {
        e.preventDefault();
        ownerUpdModalInputCtrl.abort(); // remove listener from modal Input element after validation

        ownerUpdModalInstance.hide();

        if (ownerUpdModalInput.value != '') {
            baseMessagesAlert(`the IT Assets was Re-assigned to [ ${ownerUpdModalInput.value} ] from [ ${dblClickedElInnerHTML == '' ? "🈳" : dblClickedElInnerHTML} ]`, 'success');

            document.querySelector(`#instanceStatus${dblClickedElIdUniqueCode}`).innerHTML = 'in Use';
            dblClickedEl.querySelector('small').innerHTML = ownerUpdModalInput.value.split('(')[0].trim();

            // instanceOwnerDataSet = ownerUpdModalInput.value.split('(')[0].trim();
        } else {
            baseMessagesAlert(`the IT Assets was Returned from [ ${dblClickedElInnerHTML} ]`, 'success');

            document.querySelector(`#instanceStatus${dblClickedElIdUniqueCode}`).innerHTML = 'Available';
            dblClickedEl.querySelector('small').innerHTML = "🈳";

            // instanceOwnerDataSet = ownerUpdModalInput.value.split('(')[0].trim();
        }

        const formData = new FormData();
        formData.append('owner_re_assign_to', ownerUpdModalInput.value);
        // formData.append('csrfmiddlewaretoken', '{{ csrf_token }}');

        const instanceOwnerUpdUriDataSet = dblClickedEl.dataset.instanceOwnerUpdUri;
        fetch(instanceOwnerUpdUriDataSet, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            mode: 'same-origin', // Do not send CSRF token to another domain
            body: formData,
        }).then(response => response.json()
        ).then(result => {
            console.log('Success:', result);
            
        }).catch(error => {console.error('Error:', error)})
    }
});

function ownerChk(e) {
    /* 
    const ownerListDataSet = ownerUpdModal.dataset.ownerList;
    const ownerList = ownerListDataSet.replace(/[\[\]']/g, '').split(', ');
    let owners = [];
    ownerList.forEach(owner => {
        owners.push(owner.split("(")[0].trim());
    });
    */
    // const ownerChg = ownerUpdModalInput.value.trim().split("(")[0].trim();
    const ownerChg = ownerUpdModalInput.value.trim();
    if (ownerChg.split("(")[0].trim() === dblClickedElInnerHTML) {
        // ownerUpdModalInvalidSpan.innerHTML = `the given Owner [ ${ownerChg} ] looks no Change`;
        // ownerUpdModalInvalidSpan.className = 'invalid-feedback';

        baseMessagesAlert(`the given Owner [ ${ownerChg} ] looks no Change`, 'warning');

        ownerUpdModalBtn.classList.add('disabled');

        ownerUpdModalInput.setCustomValidity(`the given Owner [ ${ownerChg} ] looks no Change`);
        ownerUpdModalInput.value = '';
        ownerUpdModalInput.focus();

        e.preventDefault();
        e.stopPropagation();
        return false;

    } else if (ownerChg !== '' && !(ownerChg in owner_list)) {
        // ownerUpdModalInvalidSpan.innerHTML = `the given Owner [ ${ownerChg} ] does NOT exist in the list`;
        // ownerUpdModalInvalidSpan.className = 'invalid-feedback';

        baseMessagesAlert(`the given Owner [ ${ownerChg} ] does NOT exist in the list`, 'warning');

        ownerUpdModalBtn.classList.add('disabled');

        ownerUpdModalInput.setCustomValidity(`the given Owner [ ${ownerChg} ] does NOT exist in the list`);
        ownerUpdModalInput.value = '';
        ownerUpdModalInput.focus();

        e.preventDefault();
        e.stopPropagation();
        return false;

    } else {
        // ownerUpdModalInvalidSpan.innerHTML = "";
        ownerUpdModalInput.setCustomValidity("");
        ownerUpdModalBtn.classList.remove('disabled');

        return true;
    }
}