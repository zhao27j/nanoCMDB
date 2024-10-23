import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import {modalInputChk} from './modalInputChk.js';

'use strict'

// new Assets

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

const newAssetsModal = document.querySelector('#newAssetsModal');
// const newAssetsModalInstance = bootstrap.Modal.getOrCreateInstance('#newAssetsModal');

let inputChkResults = {}, serialNumberOptLst, modelTypeOptLst, ownerOptLst, branchSiteOptLst, contractOptLst, orgAbbr

const newAssetsModalInputEls = new Map();

newAssetsModal.addEventListener('show.bs.modal', (e) => {
    async function getDetailsAsync() {
        try {
            const getUri = window.location.origin + '/json_response/new_lst/';
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                serialNumberOptLst = json[0];
                modelTypeOptLst = json[1];
                ownerOptLst = json[2];
                branchSiteOptLst = json[3];
                contractOptLst = json[4];
                orgAbbr = json[5]

                modalInit(e.target);
            } else {
                baseMessagesAlert("the data for new Assets is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
    getDetailsAsync();
});

function modalInit(newAssetsModal) {
    newAssetsModalInputEls.forEach((optLst, el, map) => {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => el.classList.remove(m));
        el.nextElementSibling.textContent = '';
    });

    /*
    const inputElAll = Array.from(newAssetsModal.querySelector('.modal-body').querySelectorAll('input[type="text"]'));
    const modalInputElAll = inputElAll.concat(Array.from(newAssetsModal.querySelector('.modal-body').querySelectorAll('textarea')));
    
    modalInputElAll.forEach(modalInputEl => {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
        modalInputEl.nextElementSibling.textContent = '';
    });
    */

    newAssetsModal.querySelectorAll('option').forEach(el =>{el.remove();})
    
    const newModelTypeModalDatalist = newAssetsModal.querySelector('#newModelTypeModalDatalist');
    Object.keys(modelTypeOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        newModelTypeModalDatalist.appendChild(datalistOpt);
    });

    const newOnwerModalDatalist = newAssetsModal.querySelector('#newOnwerModalDatalist');
    Object.keys(ownerOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        newOnwerModalDatalist.appendChild(datalistOpt);
    });

    const newBranchSiteModalDatalist = newAssetsModal.querySelector('#newBranchSiteModalDatalist');
    Object.keys(branchSiteOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        newBranchSiteModalDatalist.appendChild(datalistOpt);
    });

    const newContractModalDatalist = newAssetsModal.querySelector('#newContractModalDatalist');
    Object.keys(contractOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        newContractModalDatalist.appendChild(datalistOpt);
    });

    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newSerialNumberModalInput'), serialNumberOptLst);
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newModelTypeModalInput'), modelTypeOptLst);
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newOnwerModalInput'), ownerOptLst);
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newBranchSiteModalInput'), branchSiteOptLst);
    newAssetsModalInputEls.set(newAssetsModal.querySelector('#newContractModalInput'), contractOptLst);

    newAssetsModalInputEls.forEach((optLst, el, map) => {el.addEventListener('blur', e => {inputChk(e, optLst);});});

    newSerialNumberModalInput.focus();
    
    newAssetsModalBtn.classList.add('disabled');

    inputChkResults = {
        'Serial #': false,
        'Model / Type': false,
        'Owner': true,
        'Branch Site': false,
        'Contract': false,
    };
}

const newSerialNumberModalInput = newAssetsModal.querySelector('#newSerialNumberModalInput');
const newModelTypeModalInput = newAssetsModal.querySelector('#newModelTypeModalInput');
const newOnwerModalInput = newAssetsModal.querySelector('#newOnwerModalInput');
const newBranchSiteModalInput = newAssetsModal.querySelector('#newBranchSiteModalInput');
const newContractModalInput = newAssetsModal.querySelector('#newContractModalInput');

const newAssetsModalBtn = newAssetsModal.querySelector('#newAssetsModalBtn');

let dblClickedEl = null, dblClickedElInnerHTML, dblClickedInstancePk, instanceSelected, instanceSelectedPk;

// newAssetsModal.addEventListener('shown.bs.modal', () => {}, {});


newAssetsModalBtn.addEventListener('keydown', e => {
    if (e.key == 'Enter'){
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

/*
newSerialNumberModalInput.addEventListener('blur', e => {inputChk(e, 'Serial #', serialNumberOptLst, newAssetsModalBtn);});
newModelTypeModalInput.addEventListener('blur', e => {inputChk(e, 'Model / Type', modelTypeOptLst, newAssetsModalBtn);});
newOnwerModalInput.addEventListener('blur', e => {inputChk(e, 'Owner', ownerOptLst, newAssetsModalBtn);});
newBranchSiteModalInput.addEventListener('blur', e => {inputChk(e, 'Branch Site', branchSiteOptLst, newAssetsModalBtn);});
newContractModalInput.addEventListener('blur', e => {inputChk(e, 'Contract', contractOptLst, newAssetsModalBtn);});
*/

function inputChk(e, optLst) {
    let chkAlert, chkAlertType, inputChkResult = true

    const inputLbl = e.target.closest('div.row').querySelector('label').textContent;
    const btn = newAssetsModalBtn;

    if (inputLbl == 'Serial #') {
        const serialNumberInputValue = e.target.value.replaceAll(' ', '').split(',');

        if (e.target.value.replaceAll(' ', '').split(',').length > 1) {
            newOnwerModalInput.value = '';
            newAssetsModal.querySelector('#newOnwerModalDiv').style.display = "none";
        } else {
            newAssetsModal.querySelector('#newOnwerModalDiv').style.display = "flex";
        }
        
        if (serialNumberInputValue.some((element, index, array) => {return element.trim() == ''})) {
            chkAlert = `one of the given ${inputLbl} [ ${e.target.value.trim()} ] is Empty`;
            inputChkResult = false;
        } else if (serialNumberInputValue.some((element, index, array) => {return element in optLst})) {
            chkAlert = `one of the given ${inputLbl} [ ${e.target.value.trim()} ] does Exist in the System`;
            inputChkResult = false;
        } else if (!serialNumberInputValue.every((element, index, array) => {return /^[a-zA-Z0-9-_]+$/.test(element)})) {
            chkAlert = `one of the given ${inputLbl} [ ${serialNumberInputValue} ] includes the Invalid character(s)`
            inputChkResult = false;
        }
    } else if (optLst && !(e.target.value.trim() in optLst)) {
        chkAlert = `the given ${inputLbl} [ ${e.target.value.trim()} ] does NOT exist in the Option List`;
        inputChkResult = false;
    }

    ['text-danger', 'border-bottom', 'border-danger'].forEach(t => e.target.classList.toggle(t, !inputChkResult));
    ['border-success'].forEach(t => e.target.classList.toggle(t, inputChkResult));

    inputChkResult ? e.target.nextElementSibling.innerHTML = "" : e.target.nextElementSibling.innerHTML = chkAlert;

/*
    if (inputChkResult) {
        chkAlert = `the given ${inputLbl} [ ${e.target.value.trim()} ] is Valid`;
        chkAlertType = 'info';
        newAssetsModal.querySelector("button[type='submit']").classList.remove('disabled');
        
    } else {

        chkAlertType = 'warning';
        newAssetsModal.querySelector("button[type='submit']").classList.add('disabled');
        e.target.value = '';
        e.target.focus();
        e.target.closest("form").addEventListener('submit', event => {
            event.preventDefault();
            event.stopPropagation();
        })
    }

    if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
        btn.classList.remove('disabled');
    } else {
        btn.classList.add('disabled');
    }

    // e.target.setCustomValidity(chkAlert);
    // baseMessagesAlert(chkAlert, chkAlertType);
*/

    inputChkResults[inputLbl] = inputChkResult;
    btn.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
    
    return inputChkResult;
}

const newAssetsModalNext = document.querySelector('#newAssetsModalNext');
const newAssetsModalNextInstance = bootstrap.Modal.getOrCreateInstance('#newAssetsModalNext');
// const newAssetsModalForm = newAssetsModal.querySelector('#newAssetsModalForm');

let newSerialNumberModalInputValue, isDefaultHostname;
const formData = new FormData();

newAssetsModalNext.addEventListener('shown.bs.modal', () => {
    newAssetsModalNext.querySelector('#newModelTypeValueModalNext').innerHTML = newModelTypeModalInput.value;
    newAssetsModalNext.querySelector('#newBranchSiteValueModalNext').innerHTML = newBranchSiteModalInput.value;
    newAssetsModalNext.querySelector('#newContractValueModalNext').innerHTML = newContractModalInput.value;

    formData.append('model_type', newModelTypeModalInput.value.split(',')[0].trim());
    formData.append('owner', newOnwerModalInput.value.trim() == '' ? '' : newOnwerModalInput.value.replaceAll(')', '').split('(')[1].trim());
    formData.append('branchSite', newBranchSiteModalInput.value.trim());
    formData.append('contract', newContractModalInput.value.trim());

    const newAssetsModalNextTbl = newAssetsModalNext.querySelector('table');
    newAssetsModalNextTbl.replaceChildren();    // newAssetsModalNextTbl.innerHTML = '';

    const newAssetsModalNextTblTh = document.createElement('tr');
    newAssetsModalNextTblTh.innerHTML = [
        `<th><small>Serial #</small></th>`,
        `<th><small>Hostname</small></th>`,
        `<th><small>Status</small></th>`,
        `<th><small>Owner</small></th>`
    ].join('');
    newAssetsModalNextTbl.appendChild(newAssetsModalNextTblTh);

    newSerialNumberModalInputValue = newSerialNumberModalInput.value.toUpperCase().replaceAll(' ', '').split(',').filter((element, index, array) => array.indexOf(element) === index)
    formData.append('serial_number', newSerialNumberModalInputValue);

    newSerialNumberModalInputValue.forEach(i => {
        const newAssetsModalNextTblTd = document.createElement('tr');
        newAssetsModalNextTblTd.innerHTML = [
            `<td><small>${i}</small></td>`,
            `<td><small>${orgAbbr}-${i}</small></td>`,
            `<td><small>${newOnwerModalInput.value == '' ? 'Available' : 'in Use'}</small></td>`,
            `<td><small>${newOnwerModalInput.value == '' ? '🈳' : newOnwerModalInput.value}</small></td>`
        ].join('');
        newAssetsModalNextTbl.appendChild(newAssetsModalNextTblTd);
    })
})

newAssetsModalNext.querySelector("input[type='checkbox']:checked").addEventListener('change', e => {
    const newAssetsModalNextTbl = newAssetsModalNext.querySelector('table');
    let i = 0, newAssetsModalNextTblTr = newAssetsModalNextTbl.querySelector('tr');
    while(newAssetsModalNextTblTr.nextElementSibling) {
        newAssetsModalNextTblTr = newAssetsModalNextTblTr.nextElementSibling;
        e.target.checked ? newAssetsModalNextTblTr.querySelector('td:nth-child(2)').innerHTML = `<small>${orgAbbr}-${newSerialNumberModalInputValue[i]}</small>` : newAssetsModalNextTblTr.querySelector('td:nth-child(2)').innerHTML = `<small></small>`
    
        i++;
    }
/*
    while (newAssetsModalNextTbl.querySelector('tr:nth-child(2)')) {newAssetsModalNextTbl.querySelector('tr:nth-child(2)').remove();}

    newSerialNumberModalInputValue.forEach(i => {
        e.target.checked ? isDefaultHostname = `<td><small>${orgAbbr}-${i}</small></td>` : isDefaultHostname = `<td><small></small></td>`;
        const newAssetsModalNextTblTd = document.createElement('tr');
        newAssetsModalNextTblTd.innerHTML = [
            `<td><small>${i}</small></td>`,
            `${isDefaultHostname}`,
            `<td><small>${newOnwerModalInput.value == '' ? 'Available' : 'in Use'}</small></td>`,
            `<td><small>${newOnwerModalInput.value == '' ? '🈳' : newOnwerModalInput.value}</small></td>`
        ].join('');
        newAssetsModalNextTbl.appendChild(newAssetsModalNextTblTd);
    })
*/
    formData.append('isDefaultHostname', e.target.checked);
})

newAssetsModalNext.querySelector('#newAssetsModalNextBtnSubmit').addEventListener('click', e => {
    // if (e.key = 'Enter') {
        const postUpdUri = window.location.origin + '/instance/new/';
        const csrftoken = newAssetsModalNext.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
        fetch(postUpdUri, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            mode: 'same-origin', // Do not send CSRF token to another domain
            body: formData,
        }).then(response => {
            response.json();
        }).then(result => {
            newAssetsModalNextInstance.hide();
            baseMessagesAlert(`the new IT assets [${newSerialNumberModalInputValue} ] were added`, 'info');
        }).catch(error => {console.error('Error:', error)})
    // }
})
