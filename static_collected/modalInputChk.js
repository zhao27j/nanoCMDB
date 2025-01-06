import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

let chkResult, chkAlert;
export function modalInputChk(e, optLst, chkLst, modalEl, modalInputTag) {
    const modalInput = modalEl.querySelector("input[type='text']");
    const modalInputValue = modalInput.value.trim();
    
    // if ( (modalInputTag != 'owner' || modalInputValue != '') && !(modalInputValue in optLst) || modalInputValue in chkLst ) {    
    chkResult = true;
    if (modalInputTag == 'status' && modalInputValue in optLst) {
        const chkLstValues = Object.values(chkLst);
        if (
            // modalInputValue == 'Scraping' && ['inUSE', 'inREPAIR', 'SCRAPPED', 'scrappingRequested', 'buyBACK', 'reUSE'].some(i => chkLstValues.includes(i))
            modalInputValue == 'Scraping' && ['inUSE', 'inREPAIR', 'SCRAPPED', 'scrappingRequested', 'buyBACK'].some(i => chkLstValues.includes(i))
        ) {
            chkResult = false;
            chkAlert = "only Available IT assets could be applied for Scrapping";
        }
        else if (
            (modalInputValue == 'Reusing' || modalInputValue == 'Buying back') && ['inUSE', 'inREPAIR', 'AVAILABLE', 'scrappingRequested', 'buyBACK', 'reUSE'].some(i => chkLstValues.includes(i))
        ) {
            chkResult = false;
            chkAlert = "only Scrapped IT assets could be applied for Resuing / Buying back";
        }
        const chkLstKeys = Object.keys(chkLst);
        chkLstKeys.forEach(i => {
            if (document.querySelector(`#${modalInputTag}Instance${i}`).querySelector('svg')) {
                chkResult = false;
                chkAlert = "some IT Assets selected are in process for Disposal";
            }
        })
    } else if (!(modalInputValue in optLst) || modalInputValue in chkLst) {
        chkResult = false;
        chkAlert = `the given ${modalInputTag} [ ${modalInputValue} ] does NOT exist in the Option List, Or has been applied on one of the IT Assets selected`;
    }

    ['text-danger', 'border-bottom', 'border-danger'].forEach(t => modalInput.classList.toggle(t, !chkResult));
    ['border-success'].forEach(t => modalInput.classList.toggle(t, chkResult));

    chkResult ? modalInput.nextElementSibling.innerHTML = "" : modalInput.nextElementSibling.innerHTML = chkAlert;

    if (chkResult) {
        baseMessagesAlert(`the given ${modalInputTag} [ ${modalInputValue} ] is Valid`, 'info');
        modalEl.querySelector("button[type='submit']").classList.remove('disabled');
        modalInput.setCustomValidity("");
        return true;
    } else {
        baseMessagesAlert(chkAlert, 'warning');
        modalEl.querySelector("button[type='submit']").classList.add('disabled');
        modalInput.setCustomValidity(chkAlert);
        modalInput.value = '';
        // modalInput.focus();
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
}