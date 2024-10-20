import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

document.addEventListener('click', e => {
    if (e.target.textContent == 'Approve') {

        // const selectedChkboxes = e.target.closest('tbody').querySelectorAll("tbody > tr > td input[type='checkbox']:checked");
        const selectedChkboxes = e.target.closest('table').querySelectorAll("table tr input[type='checkbox']:checked");
        const approvalBtnEls = [];
        const payment_request_pks = [];
        if (selectedChkboxes.length > 0) {
            selectedChkboxes.forEach(el => {
                // Selects every <td> element that is the last <td> element of its parent <tr>
                if (Boolean(el.closest('tr').querySelector('td:last-of-type > button'))) {
                    approvalBtnEls.push(el.closest('tr').querySelector('td:last-of-type > button'));
                    payment_request_pks.push(el.closest('tr').querySelector('td:last-of-type > button').id);
                }
            });
        }

        if (!(payment_request_pks.includes(e.target.closest('button').id))) {
            approvalBtnEls.push(e.target.closest('button'));
            payment_request_pks.push(e.target.closest('button').id);
        }

        // const approvalBtnEl = e.target.closest('button');
        
        approvalBtnEls.forEach(el => {
            el.disabled = true;

            el.innerHTML = [
                `<span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>`,
                `<span role="status"><small>Processing...</small></span>`,
            ].join('');
        })
        
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