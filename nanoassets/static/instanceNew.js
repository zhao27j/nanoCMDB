import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// new Assets

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

const newAssetsModal = document.querySelector('#newAssetsModal');
// const newAssetsModalInstance = bootstrap.Modal.getOrCreateInstance('#newAssetsModal');

let orgAbbr;

const inputChkResults = {}, newAssetsModalInputEls = new Map();

newAssetsModal.addEventListener('shown.bs.modal', (e) => {
    if (!(e.relatedTarget.tagName == 'BUTTON' && e.relatedTarget.className == 'btn btn-primary' && e.relatedTarget.textContent == 'back')) {
        async function getDetailsAsync() {
            try {
                const getUri = window.location.origin + '/json_response/new_lst/';
                const json = await getJsonResponseApiData(getUri);
                if (json) {
                    orgAbbr = json[5]
                    modalInit(e.target, json);
                } else {
                    baseMessagesAlert("the data for new Assets is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with the async operation:', error);
            }
        }
        getDetailsAsync();
    }
});

function modalInit(newAssetsModal, optLst) {
    newAssetsModalInputEls.forEach((optLst, el, map) => {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => el.classList.remove(m));
        el.nextElementSibling.textContent = '';
    });

    newAssetsModal.querySelectorAll('option').forEach(el =>{el.remove();})

    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newSerialNumberModalInput'), optLst[0]); // serialNumberOptLst
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newModelTypeModalInput'), optLst[1]); // modelTypeOptLst
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newOnwerModalInput'), optLst[2]); // ownerOptLst
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newBranchSiteModalInput'), optLst[3]); // branchSiteOptLst
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newContractModalInput'), optLst[4]); // contractOptLst

    newAssetsModalInputEls.forEach((optLst, el, map) => {
        el.addEventListener('blur', e => {e.target.value = inputChk(e.target, optLst);});

        if (el.parentElement.querySelector('datalist')) {
            const dataList = el.parentElement.querySelector('datalist');
            Object.keys(optLst).forEach(key => {
                const datalistOpt = document.createElement('option');
                datalistOpt.textContent = key;
                dataList.appendChild(datalistOpt);
            });
        } else {
            el.focus();
        }

        el.value = '';
    });
    
    newAssetsModalBtn.classList.add('disabled');

    newAssetsModal.querySelectorAll('label').forEach(el => {inputChkResults[el.textContent] = el.textContent == 'Owner' ? true : false;});
}

const newAssetsModalBtn = newAssetsModal.querySelector('#newAssetsModalBtn');

newAssetsModalBtn.addEventListener('keydown', e => {
    if (e.key == 'Enter'){
        newAssetsModalInputEls.forEach((optLst, el, map) => {el.value = inputChk(el, optLst);});

        if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
            newAssetsModalBtn.classList.remove('disabled');
        } else {
            newAssetsModalBtn.classList.add('disabled');
            e.stopPropagation();
            e.preventDefault();
            baseMessagesAlert("something Invalid", 'warning');
        }
    }
});

function inputChk(inputEl, optLst) {
    let chkAlert, inputELValue, inputChkResult = true

    const inputLbl = inputEl.closest('div.row').querySelector('label').textContent;
    const btn = newAssetsModalBtn;

    if (inputLbl == 'Serial #') {
        inputELValue = inputEl.value.replaceAll(' ', '').split(',').filter(element => {return element.trim() != ''});

        let existsInst;
        if (inputELValue.every((element, index, array) => {element.trim() == ''})) {
            chkAlert = `given ${inputLbl} [ ${inputELValue} ] is Empty`;
            inputChkResult = false;
        } else if (inputELValue.some((element, index, array) => {return element.trim() == ''})) {
            chkAlert = `one of given ${inputLbl} [ ${inputELValue} ] is Empty`;
            inputChkResult = false;
        } else if (inputELValue.some((element, index, array) => {
            existsInst = element;
            return element.toUpperCase() in optLst
        })) {
            chkAlert = `given ${inputLbl} [ ${existsInst} ] does Exist`;
            inputChkResult = false;
        } else if (!inputELValue.every((element, index, array) => {return /^[a-zA-Z0-9-_]+$/.test(element)})) {
            chkAlert = `one of given ${inputLbl} [ ${inputELValue} ] includes the Invalid character(s)`
            inputChkResult = false;
        } else {
            if (inputELValue.length > 1) {
                newAssetsModal.querySelector('#newOnwerModalInput').value = '';
                newAssetsModal.querySelector('#newOnwerModalDiv').style.display = "none";
            } else {
                newAssetsModal.querySelector('#newOnwerModalDiv').style.display = "flex";
            }
        }
    } else if (optLst && !(inputEl.value in optLst)) {
        chkAlert = `given ${inputLbl} [ ${inputEl.value.trim()} ] does NOT exist in the Option List`;
        inputChkResult = false;
    }

    ['text-danger', 'border-bottom', 'border-danger'].forEach(t => inputEl.classList.toggle(t, !inputChkResult));
    ['border-success'].forEach(t => inputEl.classList.toggle(t, inputChkResult));

    inputChkResult ? inputEl.nextElementSibling.innerHTML = "" : inputEl.nextElementSibling.innerHTML = chkAlert;

    inputChkResults[inputLbl] = inputChkResult;
    btn.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
    
    return inputELValue ? inputELValue : inputEl.value;
}

const newAssetsModalNext = document.querySelector('#newAssetsModalNext');
const newAssetsModalNextInstance = bootstrap.Modal.getOrCreateInstance('#newAssetsModalNext');
// const newAssetsModalForm = newAssetsModal.querySelector('#newAssetsModalForm');

let newSerialNumberModalInputValue;
const newAssetsFormData = new FormData();

newAssetsModalNext.addEventListener('shown.bs.modal', () => {
    newAssetsModalInputEls.forEach((optLst, el, map) => {
        switch (el.id) {
            case 'newSerialNumberModalInput':
                const newAssetsModalNextThead = newAssetsModalNext.querySelector('thead');
                newAssetsModalNextThead.replaceChildren();    // newAssetsModalNextThead.innerHTML = '';
                const newAssetsModalNextTblTh = document.createElement('tr');
                newAssetsModalNextTblTh.innerHTML = [
                    `<th><small>Serial #</small></th>`,
                    `<th><small>Hostname</small></th>`,
                    `<th><small>Status</small></th>`,
                    `<th><small>Owner</small></th>`
                ].join('');
                newAssetsModalNextThead.appendChild(newAssetsModalNextTblTh);

                const newAssetsModalNextTbody = newAssetsModalNext.querySelector('tbody');
                newAssetsModalNextTbody.replaceChildren();    // newAssetsModalNextTbody.innerHTML = '';

                newSerialNumberModalInputValue = newAssetsModal.querySelector('#newSerialNumberModalInput').value.toUpperCase().replaceAll(' ', '').split(',').filter((element, index, array) => array.indexOf(element) === index)
                newAssetsFormData.append('serial_number', newSerialNumberModalInputValue);

                const newOnwerModalInput = newAssetsModal.querySelector('#newOnwerModalInput');
                newSerialNumberModalInputValue.forEach(i => {
                    const newAssetsModalNextTblTd = document.createElement('tr');
                    newAssetsModalNextTblTd.innerHTML = [
                        `<td><small>${i}</small></td>`,
                        `<td><small>${orgAbbr}-${i}</small></td>`,
                        `<td><small>${newOnwerModalInput.value == '' ? 'Available' : 'in Use'}</small></td>`,
                        `<td><small>${newOnwerModalInput.value == '' ? '🈳' : newOnwerModalInput.value}</small></td>`
                    ].join('');
                    newAssetsModalNextTbody.appendChild(newAssetsModalNextTblTd);
                });
                break;
            case 'newModelTypeModalInput':
                newAssetsModalNext.querySelector('#newModelTypeValueModalNext').innerHTML = el.value;
                newAssetsFormData.append('model_type', el.value.split(',')[0].trim());
                break;
            case 'newOnwerModalInput':
                newAssetsFormData.append('owner', el.value.trim() == '' ? '' : el.value.replaceAll(')', '').split('(')[1].trim());
                break;
            case 'newBranchSiteModalInput':
                newAssetsModalNext.querySelector('#newBranchSiteValueModalNext').innerHTML = el.value;
                newAssetsFormData.append('branchSite', el.value.trim());
                break;
            case 'newContractModalInput':
                newAssetsModalNext.querySelector('#newContractValueModalNext').innerHTML = el.value;
                newAssetsFormData.append('contract', optLst[el.value.trim()]);
                break;
            default:
                break;
        }
    });
    
})

newAssetsModalNext.querySelector("input[type='checkbox']:checked").addEventListener('change', e => {
    let i = 0;
    newAssetsModalNext.querySelector('tbody').querySelectorAll('tr').forEach(trEl => {
        trEl.querySelector('td:nth-child(2)').innerHTML = e.target.checked ? `<small>${orgAbbr}-${newSerialNumberModalInputValue[i]}</small>` : `<small></small>`;
        i++;
    });
    newAssetsFormData.append('isDefaultHostname', e.target.checked);
})

newAssetsModalNext.querySelector('#newAssetsModalNextBtnSubmit').addEventListener('click', e => {
    // if (e.key = 'Enter') {
    const postUpdUri = window.location.origin + '/instance/new/';
    const csrftoken = newAssetsModalNext.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
    fetch(postUpdUri, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin', // Do not send CSRF token to another domain
        body: newAssetsFormData,
    }).then(response => {
        response.json();
    }).then(result => {
        newAssetsModalNextInstance.hide();
        baseMessagesAlert(`the new IT assets [${newSerialNumberModalInputValue} ] were added`, 'info');
    }).catch(error => {console.error('Error:', error)});
    // }
});