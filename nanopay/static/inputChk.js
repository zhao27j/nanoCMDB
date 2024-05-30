import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

const inputChk = (inputEl, optLst = null, orig = null) => {

    let chkAlert, chkAlertType, inputChkResult = true
    
    if (orig != null && orig == inputEl.value) {
        chkAlert = `${inputEl.id} -> no changes`;
        inputChkResult = 'noChg';
    }

    if (inputEl.type == 'checkbox') {
        if (orig == inputEl.checked) {
            chkAlert = `${inputEl.id} -> no changes`;
            inputChkResult = 'noChg';
        }
    }

    if (inputEl.required && inputEl.type == 'select-multiple') {
        if (inputEl.selectedOptions.length == 0) {
            chkAlert = `the given ${inputEl.id.replaceAll('_', ' ')} [ ${inputEl.value.trim()} ] is Unselected`;
            inputChkResult = false;
        }
    }

    if (inputEl.required) {
        if (inputEl.value.trim() == '') {
            chkAlert = `the given ${inputEl.id.replaceAll('_', ' ')} [ ${inputEl.value.trim()} ] is Empty`;
            inputChkResult = false;
        }
    }

    if (inputEl.type == 'number' && inputEl.value < 0) {
        inputEl.value = Math.abs(inputEl.value);
    }

    if (inputEl.type == 'number' && inputEl.value == '0') {
        chkAlert = `the given ${inputEl.id.replaceAll('_', ' ')} [ ${inputEl.value.trim()} ] is Invalid`;
        inputChkResult = false;
    }

    if (optLst && !(inputEl.value.trim() in optLst)) {
        chkAlert = `the given ${inputEl.id.replaceAll('_', ' ')} [ ${inputEl.value.trim()} ] does NOT exist in the Option List`;
        inputChkResult = false;
    }

    ['text-danger', 'border-bottom', 'border-danger'].forEach(t => inputEl.classList.toggle(t, !inputChkResult));
    ['border-success'].forEach(t => inputEl.classList.toggle(t, inputChkResult));

    // const alertEl = inputEl.nextElementSibling.closest('small') ? inputEl.nextElementSibling : inputEl.closest('div.col').querySelector('small');
    // inputChkResult == true && alertEl ? alertEl.innerHTML = "" : alertEl.innerHTML = chkAlert;

    inputChkResult != true ? baseMessagesAlert(chkAlert, 'warning') : null;

    return inputChkResult;
}

export { inputChk };