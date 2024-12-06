import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

document.addEventListener('keyup', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'U') {

        const cntrctBlkUpdModal = document.querySelector('#cntrctBlkUpdModal');

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

            
            bootstrap.Modal.getOrCreateInstance(cntrctBlkUpdModal).show();
        }

        if (!cntrctBlkUpdModal.hasAttribute('shown-bs-modal-event-listener')) {
            cntrctBlkUpdModal.addEventListener('shown.bs.modal', (e) => {getDetailsAsync();});
            cntrctBlkUpdModal.setAttribute('shown-bs-modal-event-listener', 'true');
        }

        async function getDetailsAsync() {
            try {
                const getUri = window.location.origin + `/json_respone/contract_getLst/`;
                const json = await getJsonResponseApiData(getUri);
                if (json) {
                    user_lst = json[3];
                    
                    if ((new Date < new Date(details.pay_day) && details.role == 'vendor') || new Date().getFullYear() < new Date(details.pay_day).getFullYear()) {
                        bootstrap.Modal.getOrCreateInstance(paymentReqModal).hide();
                        baseMessagesAlert("It's not yet time scheduled", 'danger');
                    } else {
                        initModal(true);
                    }
                } else {
                    baseMessagesAlert("fetching data for Contract Updating is NOT ready", 'danger');
                }
            } catch (error) {
                console.error('There was a problem with the async operation:', error);
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