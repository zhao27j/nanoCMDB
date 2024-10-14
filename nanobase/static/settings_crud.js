import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

let settings_lst, inputChkResults = {};

const crudSettingsModal = document.querySelector('#crudSettingsModal');
const crudSettingsModalInstance = bootstrap.Modal.getOrCreateInstance('#crudSettingsModal');

crudSettingsModal.addEventListener('shown.bs.modal', e => {
    getDetailsAsync(window.location.origin + `/json_response/settings_getLst/`);

    async function getDetailsAsync(getUri) {
        try {
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                settings_lst = json;

                modalInit();

            } else {
                baseMessagesAlert("the data of Settings is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
});

const allInputEl = Array.from(crudSettingsModal.querySelector('.modal-body').querySelectorAll('input'));
const allModalInputEl = allInputEl.concat(Array.from(crudSettingsModal.querySelector('.modal-body').querySelectorAll('textarea')));
const btnNext = crudSettingsModal.querySelector('#btnNext');
const btnSubmit = crudSettingsModal.querySelector('#btnSubmit');

function modalInit(refresh = true) {
    allModalInputEl.forEach(inputEl => {inputEl.value = '';}); // empty 清空 all input El

    btnNext.textContent = 'next';
    btnSubmit.classList.add('hidden');

    const email_domains = crudSettingsModal.querySelector('#email_domains');

    if (refresh) {
        email_domains.value = Object.keys(settings_lst).includes('email_domains') ? settings_lst.email_domains : '';
    }

    inputChkResults = {

    };
}

let if_some_required_input_is_false, if_all_required_input_is_noChg;

function inputElValidation(inputEl) {
    inputChkResults[inputEl.id] = inputChk(inputEl, null, settings_lst[inputEl.id] ? settings_lst[inputEl.id] : '');
    if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
    if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
    // const if_all_required_input_is_noChg =  (inputChkResults.configClass == 'noChg' && inputChkResults.configPara == 'noChg') ? true : false;
    btnNext.classList.toggle('disabled', if_some_required_input_is_false || if_all_required_input_is_noChg);
}

allModalInputEl.forEach(inputEl => inputEl.addEventListener('blur', e => {
    inputElValidation(inputEl);
}));

btnNext.addEventListener('click', e => {
    allModalInputEl.forEach(inputEl => {
        inputElValidation(inputEl);
    });

    if (e.target.textContent == 'next'){
        if (!(if_some_required_input_is_false || if_all_required_input_is_noChg)) {
            e.target.textContent = 'back';
            btnSubmit.classList.remove('hidden');  // btnSubmit.style.display = '';
        }
    } else if (e.target.textContent == 'back') {
        modalInit(false);
    }
});


btnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/settings/crud/';
    const csrftoken = crudSettingsModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    // formData.append('crud', crud);
    // formData.append('pk', pK);
    // formData.append('comments', comments.value);
    
    allModalInputEl.forEach(inputEl => {
        if (inputEl.type == 'file') {
            for (let i = 0; i < inputEl.files.length; i++) {
                formData.append('scanned_copy', inputEl.files[i]);
            }
        } else if (inputEl.type == 'checkbox') {
            formData.append(inputEl.id, inputEl.checked  ? true : false);
        } else {
            formData.append(inputEl.id, inputEl.value);
        }
    });

    fetch(postUpdUri, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin', // do not send CSRF token to another domain
        body: formData,
    }).then(response => {
        // response.json();
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    }).then(json => {
        baseMessagesAlert(json.alert_msg, json.alert_type);
        baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {
            location.reload();
        });
    }).catch(error => {error ? console.error('Error:', error) : null;});
})