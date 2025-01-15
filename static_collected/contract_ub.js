import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'
const contracts = {};

document.addEventListener('keyup', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'U') {

        const cntrctBUModal = document.querySelector('#cntrctBUModal');
        const modalLabel = cntrctBUModal.querySelector('#cntrctBUModalLabel');
        const modalBtnNext = cntrctBUModal.querySelector('#cntrctBUModalBtnNext');
        const modalBtnSubmit = cntrctBUModal.querySelector('#cntrctBUModalBtnSubmit');

        const modalSelect = cntrctBUModal.querySelector('select');

        async function getDetailsAsync() {
            try {
                const getUri = Object.keys(contracts).length > 1 ? window.location.origin + `/json_respone/contract_getLst/` : window.location.origin + `/json_respone/contract_getLst/?pK=${Object.keys(contracts)[0]}`;

                const json = await getJsonResponseApiData(getUri);
                if (json) {
                    briefing_lst = json[2];
                    type_lst = json[3];
                    user_lst = json[4];
                    details = json[5];

                    initModal(true);

                } else {
                    baseMessagesAlert("fetching data for Contract Updating is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with the async operation:', error);
            }
        }

        function initModal(full = false) {
            modalLabel.textContent = 'contract info Upd';
            modalSelect.disabled = false;
            modalBtnNext.textContent = 'next';
            // modalBtnSubmit.textContent = 'submit';
            modalBtnSubmit.classList.add('d-none'); // modalBtnSubmit.classList.add('hidden'); modalBtnSubmit.style.display = 'none';

            if (full) {
                
            } else {
                restoreInputEl(inputEl, true);
            }
        }

        const selectedChkbxEls = document.querySelectorAll("table tr input[type='checkbox']:checked");
        
        if (selectedChkbxEls.length > 0) {
            selectedChkbxEls.forEach(el => {
                if (el.parentElement.tagName == "TD") {
                    contracts[el.value] = {};
                    contracts[el.value]['parentElement'] = el.parentElement;
                    contracts[el.value]['innerHTML'] = el.parentElement.innerHTML;

                    el.disabled = true;

                    el.parentElement.innerHTML = [
                        `<span class="spinner-border spinner-border-sm text-secondary" aria-hidden="true"></span>`,
                        `<span class="visually-hidden" role="status">Loading...</span>`,
                    ].join('');
                }
            });
        } else if (window.location.pathname.includes('contract/') && window.location.pathname.includes('detail/')) {
            const pK = window.location.pathname.split('/contract/')[1].split('/detail/')[0];
            contracts[pK] = {};
            contracts[pK]['parentElement'] = false;
            contracts[pK]['innerHTML'] = false;
        }

        if (Object.entries(contracts).length > 0) {bootstrap.Modal.getOrCreateInstance(cntrctBUModal).show();}

        if (!cntrctBUModal.hasAttribute('shown-bs-modal-event-listener')) {
            cntrctBUModal.addEventListener('shown.bs.modal', e => {getDetailsAsync();});
            cntrctBUModal.setAttribute('shown-bs-modal-event-listener', 'true');
        }

        if (!cntrctBUModal.hasAttribute('hidden-bs-modal-event-listener')) {
            cntrctBUModal.addEventListener('hidden.bs.modal', e => {
                cntrctBUModal.querySelectorAll('div.modal-body input').forEach(el => {
                    restoreInputEl(el);
                    el.value = '';
                    el.disabled = false;
                });
                bootstrap.Modal.getOrCreateInstance(cntrctBUModal).dispose();
                Object.keys(contracts).forEach(key => {
                    if (contracts[key]['innerHTML']) {contracts[key]['parentElement'].innerHTML = contracts[key]['innerHTML'];}
                    delete contracts[key];
                });
                document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
            });
            cntrctBUModal.setAttribute('hidden-bs-modal-event-listener', 'true');
        }

        let briefing_lst, type_lst, user_lst, details, inputEl = cntrctBUModal.querySelector('div.modal-body input:not(.d-none)');
        if (!modalSelect.hasAttribute('change-event-listener')) {
            modalSelect.addEventListener('change', e => {
                cntrctBUModal.querySelectorAll('div.modal-body input').forEach(el => {
                    el.disabled = true;
                    el.classList.add('d-none');
                    if (el.name.includes(e.target.value)) {
                        el.disabled = false;
                        el.classList.remove('d-none');
                        el.value = '';
                        el.placeholder = '';
                        inputEl = el;
                    }
                });
                const dataList = cntrctBUModal.querySelector('datalist[id$="_dataList"]');
                dataList.innerHTML = '';
                let dataListOpt = false;
                if (e.target.value == 'created_by') {
                    dataListOpt = Object.keys(user_lst);
                    inputEl.placeholder = details.created_by;
                } else if (e.target.value == 'type') {
                    dataListOpt = Object.values(type_lst);
                    inputEl.placeholder = details.type_display;
                } else if (e.target.value == 'briefing') {
                    inputEl.value = details.briefing;
                }
                if (dataListOpt) {
                    dataListOpt.forEach(opt => {
                        const dataListOpt = document.createElement('option');
                        dataListOpt.textContent = opt;
                        dataListOpt.value = opt;
                        dataList.appendChild(dataListOpt);
                    });
                }
            });
            modalSelect.setAttribute('change-event-listener', 'true');
        }

        if (!modalBtnNext.hasAttribute('click-event-listener')) {
            modalBtnNext.addEventListener('click', e => {
                // const optLst = inputEl.id == 'created_by' ? user_lst : null;
                let chkResult = true;
                if (modalSelect.value == 'created_by') {
                    chkResult = inputChk(inputEl, user_lst, null, true);
                } else if (modalSelect.value == 'type') {
                    chkResult = inputChk(inputEl, type_lst, null, true);
                } else if (modalSelect.value == 'briefing') {
                    if (inputEl.value.trim() in briefing_lst) {
                        baseMessagesAlert(`given Contract briefing [ ${inputEl.value} ] already exists`, 'warning');
                        chkResult = false;
                    }
                } else if (inputEl.type == 'date') {
                    if (modalSelect.value == 'endup' && inputEl.value == '') {
                        chkResult = true;
                    } else {
                        chkResult = inputChk(inputEl, null, null, true);
                        if (chkResult) {
                            if (modalSelect.value == 'endup' && new Date(inputEl.value) <= new Date(details.startup)) {
                                chkResult = false;
                                baseMessagesAlert(`given End date [ ${inputEl.value} ] is earlier than or equal to Start date [ ${details.startup} ] `, 'warning');
                            } else if (modalSelect.value == 'startup' && new Date(inputEl.value) >= new Date(details.endup)) {
                                chkResult = false;
                                baseMessagesAlert(`given Start date [ ${inputEl.value} ] is later than or equal to End date [ ${details.endup} ] `, 'warning');
                            }
                        }
                    }
                } else {
                    chkResult = inputChk(inputEl, null, null, true);
                }

                if (e.target.textContent == 'next' && chkResult) {
                    modalLabel.textContent = 'review & confirm';
                    modalSelect.disabled = true;
                    restoreInputEl(inputEl);
                    e.target.textContent = 'back';
                    modalBtnSubmit.classList.remove('d-none'); // modalBtnSubmit.classList.remove('hidden'); modalBtnSubmit.style.display = '';
                } else if (e.target.textContent == 'back') {
                    initModal();
                }
                document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
            });
            modalBtnNext.setAttribute('click-event-listener', 'true');
        }

        function restoreInputEl(inputEl, reEnable = false) {
            if (reEnable) {
                inputEl.disabled = false;
            } else {
                ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => inputEl.classList.remove(m));
                inputEl.disabled = true;
                inputEl.nextElementSibling.textContent = '';
                // inputChkResults.get(`${el.id}`) == modalInputTag ? el.classList.add('border-success') : null;
            }
        }
        
        // const alertBtns = baseMessagesAlert('Proceed ?', 'warning', false);
        if (!modalBtnSubmit.hasAttribute('click-event-listener')) {
            modalBtnSubmit.addEventListener('click', e => {
                const csrftoken = cntrctBUModal.querySelector('input[name=csrfmiddlewaretoken]').value; // get csrftoken

                const postUpdUri = window.location.origin + '/contract/ub/';

                const formData = new FormData();
                formData.append('pKs', Object.keys(contracts));

                if (modalSelect.value == 'created_by') {
                    formData.append(`${modalSelect.value}`, user_lst[inputEl.value]);
                } else if (modalSelect.value == 'type') {
                    formData.append(`${modalSelect.value}`, Object.keys(type_lst).find(key => type_lst[key] == inputEl.value));
                } else {
                    formData.append(`${modalSelect.value}`, inputEl.value.trim());
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
                    baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {location.reload();});
                }).catch(error => {error ? console.error('Error:', error) : null;});
            });
            modalBtnSubmit.setAttribute('click-event-listener', 'true');
        }
    }
})