import {formsValidation} from './formsValidation.js';
import {baseMessagesAlertPlaceholder, baseMessagesAlert} from './baseMessagesAlert.js';

(() => {
    'use strict'

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // hostname Upd input validation
    const hostnameUpdModal = document.getElementById('hostnameUpdModal');
    const hostnameUpdModalInput = document.getElementById('hostnameUpdModalInput');

    hostnameUpdModal.addEventListener('shown.bs.modal', () => hostnameUpdModalInput.focus());

    hostnameUpdModalInput.addEventListener('focusout', (e) => hostnameCheck(e));
    hostnameUpdModalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            hostnameCheck(e);
        }
    });

    function hostnameCheck(e) {
        const hostnameInvalidSpan = document.querySelector('#hostnameInvalidSpan');
        const hostnameUpdBtn = document.querySelector('#hostnameUpdBtn');
        const hostnameListDataSet = hostnameUpdModal.dataset.hostnameList;
        const hostnameList = hostnameListDataSet.replace(/[\[\]']/g, '').split(', ');

        if (hostnameUpdModalInput.value.trim() === '' || hostnameList.includes(hostnameUpdModalInput.value.trim())) {
            hostnameInvalidSpan.innerHTML = `the given Hostname [ ${hostnameUpdModalInput.value} ] is Empty or already Existing`;
            hostnameInvalidSpan.className = 'invalid-feedback';

            hostnameUpdBtn.classList.add('disabled');

            hostnameUpdModalInput.setCustomValidity(`the given Hostname [ ${hostnameUpdModalInput.value} ] is Empty or already Existing`);
            hostnameUpdModalInput.value = '';
            hostnameUpdModalInput.focus();
            
        } else {
            hostnameInvalidSpan.innerHTML = "";
            hostnameUpdModalInput.setCustomValidity("");
            hostnameUpdBtn.classList.remove('disabled');
        }

    }
})()