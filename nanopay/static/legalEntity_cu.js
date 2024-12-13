import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
// import {modalInputChk} from './modalInputChk.js';
// import {modalInputChk} from '../static/nanopay/'

'use strict'

// new Legal Entity

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

let legalEntitiesTblTrDblClckd, legalEntityPk, modalLbl, modalInputTag, legalEntity, legalEntityOptLst, projectOptLst, contactOptLst, changeHistory;

const legalEntityModal = document.querySelector('#legalEntityModal');
const legalEntityModalInst = bootstrap.Modal.getOrCreateInstance(legalEntityModal);

//const legalEntitiesTbl = document.querySelector("#legalEntitiesTbl");
const legalEntitiesTbl = document.querySelector("#legalEntitiesAccordion");

document.addEventListener('dblclick', e => {
    if (legalEntitiesTbl && e.target.closest("tr")) {
        legalEntitiesTblTrDblClckd = e.target.closest("tr");
        if (legalEntitiesTblTrDblClckd.querySelector("input[type='checkbox']")) {
            legalEntityPk = legalEntitiesTblTrDblClckd.querySelector("input[type='checkbox']").value;
            legalEntityModalInst.show();
        }
    }
})

if (!legalEntityModal.hasAttribute('show-bs-modal-event-listener')) {
    legalEntityModal.addEventListener('show.bs.modal', (e) => {
        modalInputTag = '';

        let getLstUri = window.location.origin + '/json_response/legalEntity_getLst/';

        if (e.relatedTarget && e.relatedTarget.textContent.toLowerCase().includes('new legal entity')) {
            modalInputTag = 'newLegalEntity';
            legalEntityModal.querySelector("h3.card-title").textContent = 'new Legal Entity'
        } else {
            modalInputTag = 'updLegalEntity';
            legalEntityModal.querySelector("h3.card-title").textContent = 'Legal Entity'
            // getLstUri += `?legalEntityPk=${e.relatedTarget.id}`;
            getLstUri += `?legalEntityPk=${legalEntityPk}`;
        }

        async function getDetailsAsync() {
            try {
                const json = await getJsonResponseApiData(getLstUri);
                if (json) {
                    legalEntity = json[0];
                    legalEntityOptLst = json[1];
                    projectOptLst = json[2];
                    contactOptLst = json[3];
                    // changeHistory = json[4];

                    legalEntityModalInitial(e);
                } else {
                    baseMessagesAlert("data for new / upd Legal Entity is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with Async operation:', error);
            }
        }
        getDetailsAsync();
    })
    legalEntityModal.setAttribute('show-bs-modal-event-listener', 'true');
}

const legalEntityModalInputname = legalEntityModal.querySelector('#legalEntityModalInputname');
const legalEntityModalInputtype = legalEntityModal.querySelector('#legalEntityModalInputtype');
const legalEntityModalInputcode = legalEntityModal.querySelector('#legalEntityModalInputcode');
const legalEntityModalInputprjct = legalEntityModal.querySelector('#legalEntityModalInputprjct');
const legalEntityModalInputdeposit_bank = legalEntityModal.querySelector('#legalEntityModalInputdeposit_bank');
const legalEntityModalInputdeposit_bank_account = legalEntityModal.querySelector('#legalEntityModalInputdeposit_bank_account');
const legalEntityModalInputtax_number = legalEntityModal.querySelector('#legalEntityModalInputtax_number');
const legalEntityModalInputreg_addr = legalEntityModal.querySelector('#legalEntityModalInputreg_addr');
const legalEntityModalInputreg_phone = legalEntityModal.querySelector('#legalEntityModalInputreg_phone');
const legalEntityModalInputpostal_addr = legalEntityModal.querySelector('#legalEntityModalInputpostal_addr');
const legalEntityModalInputcontact = legalEntityModal.querySelector('#legalEntityModalInputcontact');

const legalEntityModalInputAll = legalEntityModal.querySelectorAll('[type="text"]');

const legalEntityModalBtn = legalEntityModal.querySelector('#legalEntityModalBtn');
const legalEntityModalBtnSubmit = legalEntityModal.querySelector('#legalEntityModalBtnSubmit');

// let dblClickedEl = null, dblClickedElInnerHTML, dblClickedInstancePk, instanceSelected, instanceSelectedPk;

const inputChkResults = new Map();

function respondToLegalEntityTypeSwitcher(switchElValue) {
    legalEntityModal.querySelectorAll(".border-danger, .border-success").forEach(el => {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(t => el.classList.remove(t));
        el.nextElementSibling.innerHTML = "";
    })
    legalEntityModalBtn.classList.add('disabled');
    inputChkResults.clear();
    if (switchElValue.checked){
        legalEntityModal.querySelector("p.card-text").innerHTML = '- Internal -';
        [legalEntityModalInputcode, legalEntityModalInputcontact].forEach(i => {
            i.closest("[class^='row']").style.display = 'none';
            i.value = '';
            i.placeholder = '';
        })
        legalEntityModalInputprjct.closest("[class^='row']").style.display = '';

        legalEntityModalInputprjct.placeholder = 'required ...';
        legalEntityModalInputtax_number.placeholder = 'required ...';

        legalEntityModalInputdeposit_bank.placeholder = '';
        legalEntityModalInputdeposit_bank_account.placeholder = '';

        // chkResults = {'type': 'I', 'name': false, 'prjct': false, 'tax_number': false};
        // inputChkResults.set('type', 'noChg');
        
        inputChkResults.set('name', false);
        inputChkResults.set('prjct', false);
        inputChkResults.set('tax_number', false);
    } else {
        legalEntityModal.querySelector("p.card-text").innerHTML = '- External -';
        [legalEntityModalInputcode, legalEntityModalInputcontact].forEach(i => {
            i.closest("[class^='row']").style.display = '';
            i.placeholder = 'required ...';
        })
        legalEntityModalInputprjct.closest("[class^='row']").style.display = 'none';
        legalEntityModalInputprjct.value = '';

        legalEntityModalInputprjct.placeholder = '';
        legalEntityModalInputtax_number.placeholder = '';

        legalEntityModalInputdeposit_bank.placeholder = 'required ...';
        legalEntityModalInputdeposit_bank_account.placeholder = 'required ...';

        // chkResults = {'type': 'E', 'name': false, 'code': false, 'deposit_bank': false, 'deposit_bank_account': false, 'contact': false,};
        // inputChkResults.set('type', 'noChg');
        inputChkResults.set('name', false);
        inputChkResults.set('code', false);
        inputChkResults.set('deposit_bank', false);
        inputChkResults.set('deposit_bank_account', false);
        inputChkResults.set('contact', false);
    }

    legalEntityModalInputname.focus();
    // return chkResults;
}

function legalEntityModalInitial(e) {
    if (modalInputTag == 'updLegalEntity') {
        legalEntityModalInputname.value = legalEntity.name;

        if (e.type.includes('show')) {legalEntity.type == 'I' ? legalEntityModalInputtype.checked = true : legalEntityModalInputtype.checked = false;}

        // legalEntityModalInputtype.value = legalEntity.type;

        legalEntityModalInputtype.checked ? legalEntityModalInputcode.value = "" : legalEntityModalInputcode.value = legalEntity.code;
        legalEntityModalInputtype.checked ? legalEntityModalInputprjct.value = legalEntity.prjct : legalEntityModalInputprjct.value = "";

        legalEntityModalInputdeposit_bank.value = legalEntity.deposit_bank;
        legalEntityModalInputdeposit_bank_account.value = legalEntity.deposit_bank_account;

        legalEntityModalInputtax_number.value = legalEntity.tax_number;

        legalEntityModalInputreg_addr.value = legalEntity.reg_addr;
        legalEntityModalInputreg_phone.value = legalEntity.reg_phone;

        legalEntityModalInputpostal_addr.value = legalEntity.postal_addr;

        legalEntityModalInputtype.checked ? legalEntityModalInputcontact.value = '' : legalEntityModalInputcontact.value = legalEntity.contact;

    } else {
        legalEntityModalInputAll.forEach(modalInput => { modalInput.value = ''; });
    }

    legalEntityModal.querySelectorAll('option').forEach(el =>{el.remove();})
    
    const legalEntityModalInputProjectDatalist = legalEntityModal.querySelector('#legalEntityModalInputProjectDatalist');
    Object.keys(projectOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        legalEntityModalInputProjectDatalist.appendChild(datalistOpt);
    });

    const legalEntityModalInputCntctDatalist = legalEntityModal.querySelector('#legalEntityModalInputCntctDatalist');
    Object.keys(contactOptLst).forEach(key => {
        const datalistOpt = document.createElement('option');
        datalistOpt.textContent = key;
        legalEntityModalInputCntctDatalist.appendChild(datalistOpt);
    });

    respondToLegalEntityTypeSwitcher(legalEntityModalInputtype);

    legalEntityModalInputname.focus();

    // legalEntityModalInputname.value = '';
    legalEntityModalBtn.classList.add('disabled');
    legalEntityModalBtnSubmit.style.display = 'none';
}

/*
legalEntityModal.addEventListener('shown.bs.modal', (e) => {

    Object.keys(changeHistory).forEach(key => {
        const chngdBy = changeHistory[key].split(legalEntity.pk)[0].trim();
        const chngdOn = changeHistory[key].split(legalEntity.pk)[1].trim();

        const legalEntityModalTbl = legalEntityModal.querySelector('table');
        const legalEntityModalTblTd = document.createElement('tr');
        legalEntityModalTblTd.innerHTML = [
            `<td class="text-wrap" style="max-width: 576px"><small>${key}</small></td>`, // column width set 设置列宽
            `<td><small>${chngdBy}</small></td>`,
            `<td><small>${chngdOn}</small></td>`,
        ].join('');
        legalEntityModalTbl.appendChild(legalEntityModalTblTd);
    });
}, {});
*/

if (!legalEntityModal.hasAttribute('change-event-listener')) {
    legalEntityModal.querySelector("input[type='checkbox']").addEventListener('change', e => {
        legalEntityModalInitial(e);
        respondToLegalEntityTypeSwitcher(e.target);

        if (modalInputTag == 'updLegalEntity') {
            (legalEntity.type == 'I' && legalEntityModalInputtype.checked) || (legalEntity.type == 'E' && !legalEntityModalInputtype.checked) ? inputChkResults.set('type', 'noChg') : inputChkResults.set('type', 'upd');
        }
    });
    legalEntityModal.setAttribute('change-event-listener', 'true');
}

if (!legalEntityModalBtn.hasAttribute('click-event-listener')) {
    legalEntityModalBtn.addEventListener('click', e => {
        if (e.target.textContent.toLowerCase() == 'next') {
            if (Array.from(inputChkResults.values()).every((element, index, array) => {return element != false;}) && !Array.from(inputChkResults.values()).every((element, index, array) => {return element == 'noChg';})) {
                legalEntityModal.querySelectorAll(".border-danger, .border-success").forEach(el => {
                    ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(t => el.classList.remove(t));
                    el.nextElementSibling.innerHTML = "";
                })
                legalEntityModal.querySelector("textarea[type='text']").disabled = true;
                legalEntityModal.querySelectorAll("input").forEach(el => el.disabled = true);
                e.target.innerHTML = 'back';
                legalEntityModalBtnSubmit.style.display = '';
                inputChkResults.forEach((value, key, map) => {
                    if (value == 'new' || value == 'upd') {
                        legalEntityModal.querySelector(`#legalEntityModalInput${key}`).classList.add("border-success");
                    /*
                        if (key == 'type') {
                            legalEntityModalInputtype.checked ? formData.append('type', 'I') : formData.append('type', 'E');
                        } else {
                            formData.append(`${key}`, legalEntityModal.querySelector(`#legalEntityModalInput${key}`).value);
                        }
                    */
                    }
                });
            }
        } else if (e.target.textContent.toLowerCase() == 'back') {
            legalEntityModal.querySelector("textarea[type='text']").disabled = false;
            legalEntityModal.querySelectorAll("input").forEach(el => el.disabled = false);
            e.target.innerHTML = 'next';
            legalEntityModalBtnSubmit.style.display = 'none';
        }
    });
    legalEntityModalBtn.setAttribute('click-event-listener', 'true');
}
if (!legalEntityModalInputname.hasAttribute('blur-event-listener')) {
    legalEntityModalInputname.addEventListener('blur', e => inputChk(e.target, 'name', legalEntity.name, false, legalEntityOptLst, legalEntityModalBtn, true, true));
    legalEntityModalInputname.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputcode.hasAttribute('blur-event-listener')) {
    legalEntityModalInputcode.addEventListener('blur', e => inputChk(e.target, 'code', legalEntity.code, false, null, legalEntityModalBtn, true, true));
    legalEntityModalInputcode.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputprjct.hasAttribute('blur-event-listener')) {
    legalEntityModalInputprjct.addEventListener('blur', e => inputChk(e.target, 'prjct', legalEntity.prjct, true, projectOptLst, legalEntityModalBtn, false, true));
    legalEntityModalInputprjct.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputtax_number.hasAttribute('blur-event-listener')) {
    legalEntityModalInputtax_number.addEventListener('blur', e => {if (legalEntityModalInputtype.checked) { inputChk(e.target, 'tax_number', legalEntity.tax_number, false, null, legalEntityModalBtn, true, true);}});
    legalEntityModalInputtax_number.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputdeposit_bank.hasAttribute('blur-event-listener')) {
    legalEntityModalInputdeposit_bank.addEventListener('blur', e => {if (!legalEntityModalInputtype.checked) { inputChk(e.target, 'deposit_bank', legalEntity.deposit_bank, false, null, legalEntityModalBtn, true, true);}});
    legalEntityModalInputdeposit_bank.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputdeposit_bank_account.hasAttribute('blur-event-listener')) {
    legalEntityModalInputdeposit_bank_account.addEventListener('blur', e => {if (!legalEntityModalInputtype.checked) { inputChk(e.target, 'deposit_bank_account', legalEntity.deposit_bank_account, false, null, legalEntityModalBtn, true, true);}});
    legalEntityModalInputdeposit_bank_account.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalInputcontact.hasAttribute('blur-event-listener')) {
    legalEntityModalInputcontact.addEventListener('blur', e => {if (!legalEntityModalInputtype.checked) { inputChk(e.target, 'contact', legalEntity.contact, true, contactOptLst, legalEntityModalBtn, false, true);}});
    legalEntityModalInputcontact.setAttribute('blur-event-listener', 'true');
}

if (!legalEntityModalBtn.hasAttribute('focus-event-listener')) {
    legalEntityModalBtn.addEventListener('focus', e => {

        inputChk(legalEntityModalInputname, 'name', legalEntity.name, false, legalEntityOptLst, legalEntityModalBtn, true, true);
        
        if (legalEntityModal.querySelector("input[type='checkbox']").checked) {
            inputChk(legalEntityModalInputprjct, 'prjct', legalEntity.prjct, true, projectOptLst, legalEntityModalBtn, false, true);

            inputChk(legalEntityModalInputcode, 'code', legalEntity.code, false, null, legalEntityModalBtn, true, false); // Not required

            inputChk(legalEntityModalInputdeposit_bank, 'deposit_bank', legalEntity.deposit_bank, false, null, legalEntityModalBtn, true, false); // Not required
            inputChk(legalEntityModalInputdeposit_bank_account, 'deposit_bank_account', legalEntity.deposit_bank_account, false, null, legalEntityModalBtn, true, false); // Not required

            inputChk(legalEntityModalInputtax_number, 'tax_number', legalEntity.tax_number, false, null, legalEntityModalBtn, true, true);

            inputChk(legalEntityModalInputcontact, 'contact', legalEntity.contact, false, contactOptLst, legalEntityModalBtn, false, false); // Not required
        } else {
            inputChk(legalEntityModalInputprjct, 'prjct', legalEntity.prjct, false, projectOptLst, legalEntityModalBtn, false, false); // Not required

            inputChk(legalEntityModalInputcode, 'code', legalEntity.code, false, null, legalEntityModalBtn, true, true);

            inputChk(legalEntityModalInputdeposit_bank, 'deposit_bank', legalEntity.deposit_bank, false, null, legalEntityModalBtn, true, true);
            inputChk(legalEntityModalInputdeposit_bank_account, 'deposit_bank_account', legalEntity.deposit_bank_account, false, null, legalEntityModalBtn, true, true);

            inputChk(legalEntityModalInputtax_number, 'tax_number', legalEntity.tax_number, false, null, legalEntityModalBtn, true, false); // Not required
            
            inputChk(legalEntityModalInputcontact, 'contact', legalEntity.contact, true, contactOptLst, legalEntityModalBtn, false, true);
        }
        inputChk(legalEntityModalInputreg_addr, 'reg_addr', legalEntity.reg_addr, false, null, legalEntityModalBtn, true, false); // Not required
        inputChk(legalEntityModalInputreg_phone, 'reg_phone', legalEntity.reg_phone, false, null, legalEntityModalBtn, true, false); // Not required
        inputChk(legalEntityModalInputpostal_addr, 'postal_addr', legalEntity.postal_addr, false, null, legalEntityModalBtn, true, false); // Not required

        // e.target.classList.toggle('disabled', !Array.from(inputChkResults.values()).every((element, index, array) => {return element != false;}));
        /*
        if (e.key == 'Enter'){
            if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
                legalEntityModalBtn.classList.remove('disabled');
            } else {
                legalEntityModalBtn.classList.add('disabled');
                e.stopPropagation();
                e.preventDefault();
                baseMessagesAlert("something Invalid", 'warning');
            }
        }
        */
    });
    legalEntityModalBtn.setAttribute('focus-event-listener', 'true');
}

function inputChk(inputEl, inputLbl, orig, isOptLst, optLst, btn, isAlphanumeric, reqd ) {
    orig = orig == undefined ? '' : orig;

    let inputValue = inputEl.value.trim(), inputChkAlert, inputChkAlertType, inputChkResult;

    if (isAlphanumeric) {inputValue = inputEl.value.trim().replaceAll(/[`~!@#$%^&*()+=\[\]\\{}|;':",./<>?·~！@#￥%……&*（）——+=【】、{}|；‘：“，。、《》？]/g,'');}
    
    inputEl.value = inputValue;

    modalInputTag == 'updLegalEntity' ? inputChkAlert = 'upd' : inputChkAlert = 'new';
    modalInputTag == 'updLegalEntity' ? inputChkResult = 'upd' : inputChkResult = 'new';
    
    if (inputValue != orig || (reqd && orig == '')) {
        if (inputChkResult && reqd && inputValue == '') {
            inputChkAlert = `the given ${inputLbl} [ ${inputValue} ] is Empty`;
            inputChkResult = false;
        }

        if (inputChkResult && isOptLst && optLst && !(inputValue in optLst)) {
            inputChkAlert = `the given ${inputLbl} [ ${inputValue} ] does NOT exist in the Option List`;
            inputChkResult = false;
        } else if (inputChkResult && !isOptLst && optLst && (inputValue in optLst)) {
            inputChkAlert = `the given ${inputLbl} [ ${inputValue} ] does Exist in the System`;
            inputChkResult = false;
        }
    } else {
        inputChkResult = 'noChg';
        inputChkAlert = inputChkResult;
    }

    ['text-danger', 'border-bottom', 'border-danger'].forEach(t => inputEl.classList.toggle(t, !inputChkResult));
    ['border-success'].forEach(t => inputEl.classList.toggle(t, inputChkResult));

    // inputChkResult ? inputEl.nextElementSibling.innerHTML = "" : inputEl.nextElementSibling.innerHTML = inputChkAlert;
    inputEl.nextElementSibling.innerHTML = inputChkAlert;

    /*
    setTimeout(() => {
        ['text-danger', 'border-bottom', 'border-danger'].forEach(t => inputEl.classList.remove(t));
        inputEl.nextElementSibling.innerHTML = "";
    }, 3000); // clear Alert in 3000ms
    */

    inputChkResults.set(inputLbl, inputChkResult);
    btn.classList.toggle(
        'disabled', !Array.from(inputChkResults.values()).every((element, index, array) => {return element != false;}) || Array.from(inputChkResults.values()).every((element, index, array) => {return element == 'noChg';})
    );
    

    return inputChkResult;
}

if (!legalEntityModalBtnSubmit.hasAttribute('click-event-listener')) {
    legalEntityModalBtnSubmit.addEventListener('click', e => {
        const csrftoken = legalEntityModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
        
        const formData = new FormData();
        if (modalInputTag == 'updLegalEntity') {formData.append('pk', legalEntity.pk);}
        if (modalInputTag == 'newLegalEntity') {legalEntityModalInputtype.checked ? formData.append('type', 'I') : formData.append('type', 'E');}
        inputChkResults.forEach((value, key, map) => {
            if (value == 'new' || value == 'upd') {
                if (key == 'type') {
                    legalEntityModalInputtype.checked ? formData.append('type', 'I') : formData.append('type', 'E');
                } else {
                    formData.append(`${key}`, legalEntityModal.querySelector(`#legalEntityModalInput${key}`).value);
                }
            }
        });

        fetch(window.location.origin + '/legal_entity/cu/', {
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
            legalEntityModalInst.hide();
            // bootstrap.Modal.getInstance(legalEntityModal).hide();
            // bootstrap.Modal.getInstance(legalEntityModal).dispose();

            // location.reload(true);

            baseMessagesAlert(json.chg_log, 'info');

            if (modalInputTag == 'updLegalEntity') {
                inputChkResults.forEach((value, key, map) => {
                    if (value == 'upd') {
                        if (key == 'type') {
                            legalEntityModalInputtype.checked ? legalEntitiesTblTrDblClckd.querySelector(`#legalEntitiesTblTd${key}`).textContent = 'Internal' : legalEntitiesTblTrDblClckd.querySelector(`#legalEntitiesTblTd${key}`).textContent = 'External';
                        // } else if (key != 'contact' && key != 'postal_addr') {
                        } else if (legalEntitiesTblTrDblClckd.querySelector(`#legalEntitiesTblTd${key}`)) {
                            legalEntitiesTblTrDblClckd.querySelector(`#legalEntitiesTblTd${key}`).textContent = legalEntityModal.querySelector(`#legalEntityModalInput${key}`).value;
                        }
                    }
                });
        /*
            } else if (modalInputTag == 'newLegalEntity') {
                const legalEntitiesTblTr = document.createElement('tr');
                inputChkResults.forEach((value, key, map) => {
                    if (value == 'new') {
                        document.createElement('td').in

                    }

                });
                legalEntitiesTbl.appendChild(document.createElement('tr'));
        */
            }

        }).catch(error => {console.error('Error:', error);});
    });
    legalEntityModalBtnSubmit.setAttribute('click-event-listener', 'true');
}

if (!legalEntityModal.hasAttribute('hidden-bs-modal-event-listener')) {
    legalEntityModal.addEventListener('hidden.bs.modal', e => {
        legalEntityModal.querySelectorAll(".border-danger, .border-success").forEach(el => {
            ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(t => el.classList.remove(t));
            el.nextElementSibling.innerHTML = "";
        })

        legalEntityModal.querySelector("textarea[type='text']").disabled = false;
        legalEntityModal.querySelectorAll("input").forEach(el => el.disabled = false);
        legalEntityModalBtn.innerHTML = 'next';
        legalEntityModalBtnSubmit.style.display = 'none';

        // legalEntityModal.querySelector('#legalEntityModalForm').reset();
    });
    legalEntityModal.setAttribute('hidden-bs-modal-event-listener', 'true');
}

/*
const legalEntityModalNext = document.querySelector('#legalEntityModalNext');
const legalEntityModalNextInstance = bootstrap.Modal.getOrCreateInstance('#legalEntityModalNext');
// const legalEntityModalForm = legalEntityModal.querySelector('#legalEntityModalForm');
const legalEntityModalNextTbl = legalEntityModalNext.querySelector('table');

let legalEntityModalInputnameValue, isDefaultHostname;

legalEntityModalNext.addEventListener('shown.bs.modal', () => {
    legalEntityModalNext.querySelector('#newModelTypeValueModalNext').innerHTML = legalEntityModalInputcode.value;
    legalEntityModalNext.querySelector('#newBranchSiteValueModalNext').innerHTML = legalEntityModalInputdeposit_bank.value;
    legalEntityModalNext.querySelector('#newContractValueModalNext').innerHTML = legalEntityModalInputdeposit_bank_account.value;

    legalEntityModalNextTbl.replaceChildren();        // legalEntityModalNextTbl.innerHTML = '';

    const legalEntityModalNextTblTh = document.createElement('tr');
    legalEntityModalNextTblTh.innerHTML = [
        `<th><small>Serial #</small></th>`,
        `<th><small>Hostname</small></th>`,
        `<th><small>Status</small></th>`,
        `<th><small>Owner</small></th>`
    ].join('');
    legalEntityModalNextTbl.appendChild(legalEntityModalNextTblTh);

    legalEntityModalInputnameValue = legalEntityModalInputname.value.toUpperCase().replaceAll(' ', '').split(',').filter((element, index, array) => array.indexOf(element) === index)
    formData.append('serial_number', legalEntityModalInputnameValue);

    legalEntityModalInputnameValue.forEach(i => {
        const legalEntityModalNextTblTd = document.createElement('tr');
        legalEntityModalNextTblTd.innerHTML = [
            `<td><small>${i}</small></td>`,
            `<td><small>TS-${i}</small></td>`,
            `<td><small>${legalEntityModalInputprjct.value == '' ? 'Available' : 'in Use'}</small></td>`,
            `<td><small>${legalEntityModalInputprjct.value == '' ? '🈳' : legalEntityModalInputprjct.value}</small></td>`
        ].join('');
        legalEntityModalNextTbl.appendChild(legalEntityModalNextTblTd);
    })
})

legalEntityModalNext.querySelector("input[type='checkbox']:checked").addEventListener('change', e => {
    let i = 0, legalEntityModalNextTblTr = legalEntityModalNextTbl.querySelector('tr');
    while(legalEntityModalNextTblTr.nextElementSibling) {
        legalEntityModalNextTblTr = legalEntityModalNextTblTr.nextElementSibling;
        e.target.checked ? legalEntityModalNextTblTr.querySelector('td:nth-child(2)').innerHTML = `<small>TS-${legalEntityModalInputnameValue[i]}</small>` : legalEntityModalNextTblTr.querySelector('td:nth-child(2)').innerHTML = `<small></small>`
    
        i++;
    }
    formData.append('isDefaultHostname', e.target.checked);
})

legalEntityModalNext.querySelector('#legalEntityModalNextBtnSubmit').addEventListener('click', e => {
    // if (e.key = 'Enter') {
        
        
    // }
})
*/