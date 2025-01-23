import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

const crudUserModal = document.querySelector('#crudUserModal');
const crudUserModalInst = bootstrap.Modal.getOrCreateInstance(crudUserModal);

let selectedUserProfileTrEl, userPk;

const userProfileTbl = document.querySelector("#userProfileTbl");
document.addEventListener('dblclick', e => {
    if (userProfileTbl && e.target.closest('tr')) {
        selectedUserProfileTrEl = e.target.closest('tr');
        if (selectedUserProfileTrEl.querySelector("input[type='checkbox']")) {
            userPk = selectedUserProfileTrEl.querySelector("input[type='checkbox']").value;
            getUserDetailsJsonResponseApiData(e);
        }
    }
})

const crudUserModalInputElAll = Array.from(crudUserModal.querySelector('.modal-body').querySelectorAll('input'));
crudUserModalInputElAll.push(crudUserModal.querySelector('.modal-body').querySelector('textarea'));

let modalInputTag, isLESelected, isUserSelected, defaultEmailDomain, deptOptLst, LEOptLst, emailOptLst, LESelected, userSelected, ownedAssetsLst;
const inputChkResults = new Map();

function getUserDetailsJsonResponseApiData(e) {
    isLESelected = false; isUserSelected = false;

    let getLstUri = window.location.origin + '/json_response/user_getLst/';
    modalInputTag = '';
    if (e.relatedTarget && (e.relatedTarget.innerHTML.toLowerCase().includes('new user') || e.relatedTarget.innerHTML.toLowerCase().includes('bi-person-plus'))) {
        modalInputTag = 'new';
        if (e.relatedTarget.name) {
            isLESelected = true;
            getLstUri += `?legalEntityPk=${e.relatedTarget.name}`;
        }
    } else {
        if (e.relatedTarget) {
            selectedUserProfileTrEl = e.relatedTarget.closest('tr');
            userPk = selectedUserProfileTrEl.querySelector("input[type='checkbox']").value;
            if (e.relatedTarget.textContent.toLowerCase().includes('lock')) {
                modalInputTag = 'lock_or_unlock';
            }
        } else {
            modalInputTag = 'alt';
        }
        isUserSelected = true;
        getLstUri += `?userPk=${userPk}`;
    }

    getDetailsAsync(getLstUri);

    async function getDetailsAsync(getUri) {
        try {
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                deptOptLst = json[0];
                LEOptLst = json[1];
                emailOptLst = json[2];
                LESelected = json[3];
                userSelected = json[4];
                ownedAssetsLst = json[5];
                defaultEmailDomain = json[6];

                crudUserModalInitial();
            } else {
                baseMessagesAlert("the data of User Details is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
}

if (!crudUserModal.hasAttribute('show-bs-modal-event-listener')) {
    crudUserModal.addEventListener('show.bs.modal', e => {getUserDetailsJsonResponseApiData(e)});
    crudUserModal.setAttribute('show-bs-modal-event-listener', 'true');
}

// crudUserModal.addEventListener('shown.bs.modal', e => {crudUserModalInitial();}) // Initiate the Modal when showing

const crudUserModalBtnSubmit = crudUserModal.querySelector('#submit');
const crudUserModalBtnOk = crudUserModal.querySelector('#ok');

function crudUserModalInitial() {
    crudUserModalInputElAll.forEach(modalInputEl => {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
        modalInputEl.nextElementSibling.textContent = '';
        modalInputEl.disabled = false;
        modalInputEl.value = '';

        if (modalInputEl.closest('.row').querySelector('datalist')) {
            modalInputEl.closest('.row').querySelector('datalist').querySelectorAll('option').forEach(optionEl => optionEl.remove());
        }

        if (modalInputEl.id == 'dept') {
            Object.keys(deptOptLst).forEach(key => {
                const datalistOpt = document.createElement('option');
                datalistOpt.textContent = key;
                modalInputEl.closest('.row').querySelector('datalist').appendChild(datalistOpt);
            })
        }

        if (modalInputEl.id == 'legal_entity') {
            Object.keys(LEOptLst).forEach(key => {
                const datalistOpt = document.createElement('option');
                datalistOpt.textContent = key;
                modalInputEl.closest('.row').querySelector('datalist').appendChild(datalistOpt);
            })
        }

        inputChkResults.set(modalInputEl.id, false);
        if (modalInputTag == 'new') {
            if (['legal_entity', 'title', 'dept', 'cellphone', 'work_phone', 'postal_addr', ].some((element, index, array) => {return element == modalInputEl.id})) {
                // modalInputEl.disabled = true;
                inputChkResults.set(modalInputEl.id, 'Opt');
            }
            if (isLESelected && modalInputEl.id == 'legal_entity') {
                modalInputEl.value = LESelected.name;
                modalInputEl.disabled = true;
                // inputChkResults.set(modalInputEl.id, modalInputTag);
                // defaultEmailDomain = `@${LESelected.email_domain}`;
                defaultEmailDomain = [`${LESelected.email_domain}`];
            }
            crudUserModal.querySelector('#email').focus();
        } else {
            modalInputEl.value = userSelected[`${modalInputEl.id}`];
            if (modalInputTag == 'alt') {
                if (['email', 'last_name', 'first_name', 'legal_entity'].some((element, index, array) => {return element == modalInputEl.id})) {
                    modalInputEl.disabled = true;
                    inputChkResults.set(modalInputEl.id, 'noChg');
                }
                crudUserModal.querySelector('#title').focus();
            } else if (modalInputTag == 'lock_or_unlock') {
                modalInputEl.disabled = true;
                inputChkResults.set(modalInputEl.id, modalInputTag);
                crudUserModalBtnSubmit.focus();
            }
        }
    });

    const crudUserModalTbody = crudUserModal.querySelector('tbody');
    crudUserModalTbody.innerHTML = '';
    if (ownedAssetsLst) {
        Object.entries(ownedAssetsLst).forEach(([key, value]) => {
            const tableTr = document.createElement('tr');
            tableTr.innerHTML = [
                `<td>${key}</td><td>${value}</td>`,
            ];
            crudUserModalTbody.appendChild(tableTr);
        });
    };

    switch (modalInputTag) {
        case 'lock_or_unlock':
            crudUserModalBtnSubmit.classList.remove('disabled')
            crudUserModal.querySelector("h1.modal-title").textContent = userSelected.is_active ? 'deactivating' : 'activating';
            break;
        // case 'new':
            // break;
        // case 'alt':
            // break;
        default:
            crudUserModalBtnSubmit.classList.add('disabled')
            crudUserModal.querySelector("h1.modal-title").textContent = modalInputTag
            break;
    }

    crudUserModalBtnOk.style.display = 'none';
    crudUserModalBtnSubmit.textContent = 'submit';

    crudUserModalInst.show();
    
    return null;
}

crudUserModalInputElAll.forEach(el => {
    if (!el.hasAttribute('blur-event-listener')) {
        el.addEventListener('blur', e => {inputChk(e.target, crudUserModalBtnSubmit);});
        el.setAttribute('blur-event-listener', 'true');
    }
});

if (!crudUserModalBtnSubmit.hasAttribute('focus-event-listener')) {
    crudUserModalBtnSubmit.addEventListener('focus', e => {crudUserModalInputElAll.forEach(m => inputChk(m, crudUserModalBtnSubmit));});
    crudUserModalBtnSubmit.setAttribute('focus-event-listener', 'true');
}

if (!crudUserModalBtnSubmit.hasAttribute('click-event-listener')) {
    crudUserModalBtnSubmit.addEventListener('click', e => {
        crudUserModalInputElAll.forEach(m => inputChk(m, crudUserModalBtnSubmit));

        if (!e.target.disabled && e.target.textContent == 'submit') {
            if (Array.from(inputChkResults.values()).every((element, index, array) => {return element != false;}) && !Array.from(inputChkResults.values()).every((element, index, array) => {return element == 'noChg';})) {
                crudUserModal.querySelector("h1.modal-title").textContent = 'review & confirm';
                crudUserModalInputElAll.forEach(modalInputEl => {
                    ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
                    modalInputEl.disabled = true;
                    modalInputEl.nextElementSibling.textContent = '';
                    inputChkResults.get(`${modalInputEl.id}`) == modalInputTag ? modalInputEl.classList.add('border-success') : null;
                });
                e.target.textContent = 'back';
                crudUserModalBtnOk.style.display = '';
            }
        } else if (e.target.textContent == 'back') {
            crudUserModal.querySelector("h1.modal-title").textContent = modalInputTag;
            crudUserModalInputElAll.forEach(modalInputEl => {
                if (modalInputTag == 'new' && ['legal_entity', ].some((m, index, array) => {return m == modalInputEl.id})) {
                    
                } else if (modalInputTag == 'alt' && ['email', 'last_name', 'first_name', 'legal_entity', ].some((m, index, array) => {return m == modalInputEl.id})) {

                } else if (modalInputTag == 'lock_or_unlock') {

                } else {
                    modalInputEl.disabled = false
                }
            });
            e.target.textContent = 'submit';
            crudUserModalBtnOk.style.display = 'none';
        }
    });
    crudUserModalBtnSubmit.setAttribute('click-event-listener', 'true');
}

/*
crudUserModalBtnSubmit.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault;
        crudUserModalSubmit(e);
    }
});
*/
function inputChk(inputEl, btn) {
    if (!inputEl.disabled) {
        let inputChkResult = true, inputChkAlert;

        inputEl.value = inputEl.value.trim();

        if (inputEl.closest('.row').querySelector('label').textContent == 'email') {
            inputEl.value = inputEl.value.trim().replaceAll(/[`~!#$%^&*()+=\[\]\\{}|;':",/<>? ·~！#￥%……&*（）——+=【】、{}|；‘：“，。、《》？]/g,''); // regExp 正则表达式

            inputEl.value != '' && !inputEl.value.includes('@') ? inputEl.value += `@${defaultEmailDomain[0]}` : null;
            
            // const legalEntityRowStyle = inputEl.closest('.modal-body').querySelector('#legal_entity').closest('.row').style;
            // if (!inputEl.value.includes(defaultEmailDomain)) {
            if (!defaultEmailDomain.some(domain => inputEl.value.includes(`@${domain}`))) {
                // legalEntityRowStyle.display = '';
                inputEl.closest('.modal-body').querySelector('#legal_entity').disabled = false;
            } else {
                // legalEntityRowStyle.display = 'none';
                inputEl.closest('.modal-body').querySelector('#legal_entity').disabled = true;
                inputChkResults.set('legal_entity', modalInputTag);
                // inputEl.closest('.modal-body').querySelector('#legal_entity').value = '';
            }
        } else if (inputEl.closest('.row').querySelector('label').textContent.includes('phone')) {
            inputEl.value = inputEl.value.trim().replaceAll(/[`~!@$%^&*=\[\]\\{}|;:",./<>?·~！@#￥%……&*（）——=【】、{}|；‘：“，。、《》？]/g,''); // regExp 正则表达式
        } else {
            inputEl.value = inputEl.value.trim().replaceAll(/[`~!@#$%^&*()+=\[\]\\{}|;:",./<>?·~！@#￥%……&*（）——+=【】、{}|；‘：“，。、《》？]/g,''); // regExp 正则表达式
        }

        if (inputChkResult && inputEl.required && inputEl.value == '') {
            // inputChkAlert = `${inputEl.closest('.row').querySelector('label').textContent} is Required`;
            inputChkAlert = `${inputEl.id.replaceAll(/[_]/g, ' ')} is Required`;
            inputChkResult = false;
        }

        switch (inputEl.id) {
            case 'email':
                if (inputChkResult && inputEl.value != '' && (inputEl.value in emailOptLst) && modalInputTag == 'new') {
                    inputChkAlert = `the given Email [ ${inputEl.value} ] already Exists in the system`;
                    inputChkResult = false;
                }
                break;
            case 'last_name':
                break;
            case 'first_name':
                break;
            case 'legal_entity':
                if (inputChkResult && inputEl.value != '' && !(inputEl.value in LEOptLst)) {
                    inputChkAlert = `the given Legal Entity [ ${inputEl.value} ] does NOT exist in the Option List`;
                    inputChkResult = false;
                }
                break;
            case 'title':
                if (inputChkResult && inputEl.value.length > 64) {
                    inputChkAlert = `the given Title [ ${inputEl.value} ] is > 64 characters`;
                    inputChkResult = false;
                }
                break;
            case 'dept':
                break;
            case 'cellphone':
                if (inputChkResult && inputEl.value.length > 32) {
                    inputChkAlert = `the given Mobile Phone # [ ${inputEl.value} ] is > 32 characters`;
                    inputChkResult = false;
                }
                break;
            case 'work_phone':
                if (inputChkResult && inputEl.value.length > 32) {
                    inputChkAlert = `the given Work Phone # [ ${inputEl.value} ] is > 32 characters`;
                    inputChkResult = false;
                }
                break;
            case 'postal_addr':
                if (inputChkResult && inputEl.value.length > 128) {
                    inputChkAlert = `the given Postal Address [ ${inputEl.value} ] is > 128 characters`;
                    inputChkResult = false;
                }
                break;
        }

        if (inputChkResult) {
            switch (modalInputTag) {
                case 'new':
                    inputChkAlert = inputEl.value != '' ? modalInputTag : 'noChg';
                    inputChkResult = inputEl.value != '' ? modalInputTag : 'noChg';
                    break;
                case 'alt':
                    const userSelectedMap = new Map(Object.entries(userSelected));
                    inputChkAlert = inputEl.value != userSelectedMap.get(`${inputEl.id}`) ? modalInputTag : 'noChg';
                    inputChkResult = inputEl.value != userSelectedMap.get(`${inputEl.id}`) ? modalInputTag : 'noChg'
                    break;
                case 'lock_or_unlock':
                  console.log('Mangoes and papayas are $2.79 a pound.');    // Expected output: "Mangoes and papayas are $2.79 a pound."
                  break;
                default:
                  console.log(`Sorry, we are out of ${modalInputTag}.`);
              }
        }

        ['text-danger', 'border-bottom', 'border-danger'].forEach(m => inputEl.classList.toggle(m, !inputChkResult));
        ['border-success'].forEach(m => inputEl.classList.toggle(m, inputChkResult));
        inputEl.nextElementSibling.textContent = inputChkAlert;

        inputChkResults.set(inputEl.id, inputChkResult);
        btn.classList.toggle(
            'disabled', !Array.from(inputChkResults.values()).every((element, index, array) => {return element != false;}) || Array.from(inputChkResults.values()).every((element, index, array) => {return element == 'noChg';})
        );

        return inputChkResult;
    }
}

if (!crudUserModalBtnOk.hasAttribute('click-event-listener')) {
    crudUserModalBtnOk.addEventListener('click', e => {
        const postUpdUri = window.location.origin + '/user/crud/';
        const csrftoken = crudUserModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

        const formData = new FormData();
        if (modalInputTag != 'new') {formData.append('email', userSelected.email);}

        if (modalInputTag == 'lock_or_unlock') {
            formData.append('lock_or_unlock', true);
        } else {
            inputChkResults.forEach((value, key, map) => {
                if (value == modalInputTag) {
                    formData.append(`${key}`, crudUserModal.querySelector(`#${key}`).value);
                }
            });
        }
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
                // location.reload();
            });
            if (document.querySelector('#userLstSwitch')) {
                document.querySelector('#userLstSwitch').nextElementSibling.innerText = new Date();
            }
            /*
            const thLst = new Map();
            let thOrder = 2;
            userProfileTbl.querySelector('thead>tr').querySelectorAll('th:nth-child(n+2)').forEach(el => {
                thLst.set(el.querySelector('small').textContent.replaceAll(' ', '_').toLowerCase(), thOrder);
                thOrder++;
            })

            thLst.forEach(thLstValue, thLstKey, thLstMap => {
                inputChkResults.forEach((inputChkResultsValue, inputChkResultsKey, inputChkResultsMap) => {
                    if (thLstKey == inputChkResultsKey) {
                        selectedUserProfileTrEl.querySelector(`td:nth-child(${thLstKey})`)

                    }
                })
            })
            */
        }).catch(error => {console.error('Error:', error);});
    })
    crudUserModalBtnOk.setAttribute('click-event-listener', 'true');
}