import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

let env_lst, inputChkResults = {};

const crudEnvModal = document.querySelector('#crudEnvModal');
const crudEnvModalInstance = bootstrap.Modal.getOrCreateInstance('#crudEnvModal');

crudEnvModal.addEventListener('shown.bs.modal', e => {
    getDetailsAsync(window.location.origin + `/json_response/env_getLst/`);

    async function getDetailsAsync(getUri) {
        try {
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                env_lst = json;

                modalInit();

            } else {
                baseMessagesAlert("the JSON of Environmental parameters seems to be missed", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
});

const allInputEl = Array.from(crudEnvModal.querySelector('.modal-body').querySelectorAll('input'));
const allModalInputEl = allInputEl.concat(Array.from(crudEnvModal.querySelector('.modal-body').querySelectorAll('textarea')));
const btnNext = crudEnvModal.querySelector('#btnNext');
const btnSubmit = crudEnvModal.querySelector('#btnSubmit');

function modalInit(refresh = true) {
    
    btnNext.textContent = 'next';
    btnSubmit.classList.add('hidden');

    if (refresh) {
        allModalInputEl.forEach(inputEl => {inputEl.value = '';}); // empty 清空 all input El
        
        allModalInputEl.forEach(inputEl => {
            inputEl.value = Object.keys(env_lst).includes(inputEl.id) ? env_lst[inputEl.id] : '';

        });
    }
    inputChkResults = {};
}

let if_some_required_input_is_false, if_all_required_input_is_noChg;

function inputElValidation(inputEl) {
    // remove non-alpha characters from Input El
    inputEl.value = inputEl.value.trim().replaceAll(/[`~!@#$%^&*()_+=\[\]\\{}|;':"<>? ·~！#￥%……&*（）——+=【】、{}|；‘：“，。、《》？]/g,''); // regExp 正则表达式

    // remove redundant seperator ',' from Input El
    inputEl.value = inputEl.value.split(',').filter(n => n);

    inputChkResults[inputEl.id] = inputChk(inputEl, null, env_lst[inputEl.id] ? env_lst[inputEl.id] : '');
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
    const postUpdUri = window.location.origin + '/env/crud/';
    const csrftoken = crudEnvModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    
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
        /*
        baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {
            location.reload();
        });
        */
    }).catch(error => {error ? console.error('Error:', error) : null;});
})