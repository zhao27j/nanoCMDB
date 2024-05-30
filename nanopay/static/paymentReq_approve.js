import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

document.addEventListener('click', e => {
    if (e.target.textContent == 'Approve') {

        const approvalBtnEl = e.target.closest('button');
        approvalBtnEl.disabled = true;

        approvalBtnEl.innerHTML = [
            `<span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>`,
            `<span role="status"><small>Approving...</small></span>`,
        ].join('');
        
        const alertBtns = baseMessagesAlert('proceed ?', 'warning', false);

        alertBtns.forEach(btn => btn.addEventListener('click', btnClickEvent => {
            if (btnClickEvent.target.textContent == 'yes') {
                const payment_request_pk = approvalBtnEl.id;
                // const csrftoken = approvalBtnEl.closest('[name=csrfmiddlewaretoken]').value; // get csrftoken
                const csrftoken = approvalBtnEl.previousElementSibling.value;

                const postUpdUri = window.location.origin + '/payment_request/approve/';
                const formData = new FormData();
                formData.append('payment_request', payment_request_pk);
                
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
                            approvalBtnEl.closest('tr').querySelector('td:nth-child(2) a small').innerText = 'Approved';
                            approvalBtnEl.closest('td').innerHTML = `<small>${json.approver}</small>`;
                        } else {
                            approvalBtnEl.disabled = false;
                            approvalBtnEl.innerHTML = `<small>Approve</small>`;
                        }
                        // location.reload();
                    });
                }).catch(error => {error ? console.error('Error:', error) : null;});
            } else {
                approvalBtnEl.disabled = false;
                approvalBtnEl.innerHTML = `<small>Approve</small>`;
            }
        }))
    }
})