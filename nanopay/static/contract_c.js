import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const contractCUModal = document.querySelector('#contractCUModal');
const contractCUModalInstance = bootstrap.Modal.getOrCreateInstance('#contractCUModal');

let crud, party_lst, nPE_lst, briefing_lst, inputChkResults = {};

contractCUModal.addEventListener('shown.bs.modal', (e) => {
    if (e.relatedTarget) {
        crud = e.relatedTarget.name // create_Contract
        getDetailsAsync(window.location.origin + `/json_respone/contract_getLst/`);
    }

    async function getDetailsAsync(getUri) {
        try {
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                party_lst = json[0];
                nPE_lst = json[1];
                briefing_lst = json[2];

                modalInit(e, true)
            } else {
                baseMessagesAlert("the data for Config is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
});

function modalInit(e, full = false) {
    if (full) {
        inputAll.forEach(inputEl => {
            inputEl.value = '';
            inputEl.innerHTML = '';
        });

        const selectElAll = contractCUModal.querySelectorAll('select');
        selectElAll.forEach(selectEl => {
            const types = selectEl.id.includes('b') ? ['E', 'I'] : ['I', 'E'];
            types.forEach(type => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = type == 'I' ? 'Internal Entities' : 'External Entities';
                selectEl.appendChild(optgroup);
                Object.entries(party_lst).forEach((value, key, map) => {
                    if (value[1] == type) {
                        const selectOpt = document.createElement('option');
                        selectOpt.innerHTML = `<small>${value[0]}</small>`;
                        selectOpt.value = value[0];
                        selectEl.appendChild(selectOpt);
                    }
                });
            });
        });
        
        contractCUModal.querySelector('#briefingDatalist').innerHTML = '';
        Object.entries(nPE_lst).forEach((value, key, map) => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = value[0];
            contractCUModal.querySelector('#briefingDatalist').appendChild(dataListOpt);
        });
    }

    contractCUModal.querySelector('#modalLabel').textContent = crud.replaceAll('_', ' '); // create Contract
    contractCUModal.querySelector('#party_a_list').focus();
    modalBtnNext.textContent = 'next';
    modalBtnSubmit.classList.add('hidden');  // modalBtnSubmit.style.display = 'none';

    inputAll.forEach(input => {
        input.disabled = false;
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => input.classList.remove(m));
    });
}

const inputElAll = Array.from(contractCUModal.querySelector('.modal-body').querySelectorAll('input'));
const inputAll = inputElAll.concat(Array.from(contractCUModal.querySelector('.modal-body').querySelectorAll('select')));
const modalBtnNext = contractCUModal.querySelector('#modalBtnNext');
const modalBtnSubmit = contractCUModal.querySelector('#modalBtnSubmit');

let if_some_required_input_is_false, if_all_required_input_is_noChg;

inputAll.forEach(inputEl => inputEl.addEventListener('blur', e => { // Input validation on leaving each of Input elements 在离开每个输入元素时进行输入验证
    inputChkResults[e.target.id] = inputChk(e.target);
    if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
    if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
    modalBtnNext.classList.toggle('disabled', if_some_required_input_is_false || if_all_required_input_is_noChg);
}));

modalBtnNext.addEventListener('click', e => {
    inputAll.forEach(inputEl => { // Input validation when Next button gets focus 在Next按钮获得焦点时进行输入验证
        inputChkResults[inputEl.id] = inputChk(inputEl);
        if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
        if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
        modalBtnNext.classList.toggle('disabled', if_some_required_input_is_false || if_all_required_input_is_noChg);
    });

    if (e.target.textContent == 'next'){
        if (!(if_some_required_input_is_false || if_all_required_input_is_noChg)) {
            contractCUModal.querySelector('#modalLabel').textContent = 'review & confirm';
            inputAll.forEach(input => {
                ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => input.classList.remove(m));
                input.disabled = true;
            });
            e.target.textContent = 'back';
            modalBtnSubmit.classList.remove('hidden');  // modalBtnSubmit.style.display = '';
        }
    } else if (e.target.textContent == 'back') {modalInit(e);}
})

modalBtnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/contract/c/';
    const csrftoken = contractCUModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    formData.append('crud', crud);
    
    inputAll.forEach(inputEl => {
        switch (inputEl.type) {
            case 'file':
                for (let i = 0; i < inputEl.files.length; i++) {
                    formData.append('scanned_copy', inputEl.files[i]);
                }
                break;
            case 'select-multiple':
                const selectedOptionValue = []
                Array.from(inputEl.selectedOptions).forEach(selectedOption => {
                    selectedOptionValue.push(selectedOption.value)
                })
                formData.append(inputEl.id, selectedOptionValue);
                break;
            case 'radio':
                if (inputEl.checked) {
                    formData.append(inputEl.id.split('_')[0], inputEl.id.split('_')[1]);
                }
                break;
            default:
                formData.append(inputEl.id, inputEl.value);
                break;
        }
    })

    fetch(postUpdUri, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin', // do not send CSRF token to another domain
        body: formData,
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    }).then(json => {
        baseMessagesAlert(json.alert_msg, json.alert_type);
        // baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {location.reload();});
    }).catch(error => {error ? console.error('Error:', error) : null;});
})