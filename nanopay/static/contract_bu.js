import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

document.addEventListener('keyup', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'U') {

        const cntrctBUModal = document.querySelector('#cntrctBUModal');
        const modalLabel = cntrctBUModal.querySelector('#cntrctBUModalLabel');
        const modalBtnNext = cntrctBUModal.querySelector('#cntrctBUModalBtnNext');
        const modalBtnSubmit = cntrctBUModal.querySelector('#cntrctBUModalBtnSubmit');

        const selectEl = cntrctBUModal.querySelector('select');

        const selectedChkbxEls = document.querySelectorAll("table tr input[type='checkbox']:checked");
        const contracts = {};
        if (selectedChkbxEls.length > 0) {
            selectedChkbxEls.forEach(el => {
                if (el.parentElement.tagName == "TD") {
                    contracts[el.id] = {};
                    contracts[el.id]['innerHTML'] = el.parentElement.innerHTML;
                    contracts[el.id]['pk'] = el.value;

                    el.disabled = true;

                    el.parentElement.innerHTML = [
                        `<span class="spinner-border spinner-border-sm text-secondary" aria-hidden="true"></span>`,
                        `<span class="visually-hidden" role="status">Loading...</span>`,
                    ].join('');
                }
            });

            
            bootstrap.Modal.getOrCreateInstance(cntrctBUModal).show();
        }

        if (!cntrctBUModal.hasAttribute('shown-bs-modal-event-listener')) {
            cntrctBUModal.addEventListener('shown.bs.modal', e => {getDetailsAsync();});
            cntrctBUModal.setAttribute('shown-bs-modal-event-listener', 'true');
        }

        let user_lst;

        async function getDetailsAsync() {
            try {
                const getUri = window.location.origin + `/json_respone/contract_getLst/`;
                const json = await getJsonResponseApiData(getUri);
                if (json) {
                    user_lst = json[3];

                    initModal(true);

                } else {
                    baseMessagesAlert("fetching data for Contract Updating is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with the async operation:', error);
            }
        }

        function initModal(full = false) {
            modalLabel.textContent = 'contract Upd';
            modalBtnNext.textContent = 'next';

            modalBtnSubmit.textContent = 'submit';
            modalBtnSubmit.classList.add('d-none'); // modalBtnSubmit.classList.add('hidden'); modalBtnSubmit.style.display = 'none';

            if (full) {
                const dataList = cntrctBUModal.querySelector('#created_byDatalist');
                dataList.innerHTML = ''
                Object.keys(user_lst).forEach(key => {
                    const dataListOpt = document.createElement('option');
                    dataListOpt.textContent = key;
                    dataListOpt.value = key;
                    dataList.appendChild(dataListOpt);
                });

                if (!selectEl.hasAttribute('change-event-listener')) {
                    selectEl.addEventListener('change', e => {
                        cntrctBUModal.querySelectorAll('div.modal-body input').forEach(el => {
                            el.disabled = true;
                            el.classList.add('d-none');
                            if (e.target.value.includes(el.name)) {
                                el.disabled = false;
                                el.classList.remove('d-none');
                            }
                        });

                    });
                    selectEl.setAttribute('change-event-listener', 'true');
                }

                if (!modalBtnNext.hasAttribute('click-event-listener')) {
                    modalBtnNext.addEventListener('click', e => {
                        const inputEl = cntrctBUModal.querySelector('div.modal-body input:not(.d-none)');
                        const optLst = inputEl.id == 'created_by' ? user_lst : null;

                        if (e.target.textContent == 'next' && inputChk(inputEl, optLst, null, true)) {
                            modalLabel.textContent = 'review & confirm';
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

            } else {

            }
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
        
        const alertBtns = baseMessagesAlert('Proceed ?', 'warning', false);

        alertBtns.forEach(btn => btn.addEventListener('click', btnClickEvent => {
            if (btnClickEvent.target.textContent == 'yes') {
                // const payment_request_pk = approvalBtnEl.id;
                // const csrftoken = approvalBtnEl.previousElementSibling.value;
                const csrftoken = document.querySelector('input[name=csrfmiddlewaretoken]').value; // get csrftoken

                const postUpdUri = window.location.origin + '/payment_request/approve/';
                const formData = new FormData();
                formData.append('payment_request_pks', payment_request_pks);
                
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
                        if (json.alert_type == 'success') {
                            approvalBtnEls.forEach(el => {
                                el.closest('tr').querySelector('td:nth-child(2) a small').innerText = 'Approved';
                                el.closest('td').innerHTML = `<small>${json.approver}</small>`;
                            });
                            selectedChkboxes.forEach(el => {
                                el.checked = false;
                            })
                        } else {
                            approvalBtnEls.forEach(el => {
                                el.disabled = false;
                                el.innerHTML = `<small>Approve</small>`;
                            });
                        }
                        // location.reload();
                    });
                }).catch(error => {error ? console.error('Error:', error) : null;});
            } else {
                approvalBtnEls.forEach(el => {
                    el.disabled = false;
                    el.innerHTML = `<small>Approve</small>`;
                });
            }
        }))
    }
})