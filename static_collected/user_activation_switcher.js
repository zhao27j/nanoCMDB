import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

// let switchInputEl, alertBtns, userEmail;

document.addEventListener('change', e => {
    if (e.target.type == 'checkbox' && e.target.role == 'switch' && e.target.name == 'userprofile') {
        const switchInputEl = e.target;
        const userName = e.target.closest('tr').querySelector('td:nth-child(2)').querySelector('small').textContent;
        const userEmail = e.target.closest('tr').querySelector('td:nth-child(3)').querySelector('small').textContent;
        
        const msg = e.target.checked ? `activate the user account for [ ${userName} ] ?` : `deactivate the user account for [ ${userName} ] ?` ;
        
        const alertBtns = baseMessagesAlert(msg, 'warning', false);
        alertBtns.forEach(btn => btn.addEventListener('click', btnClickEvent => {
            if (btnClickEvent.target.textContent == 'yes') {
                const postUpdUri = window.location.origin + '/user/crud/';
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

                const formData = new FormData();
                formData.append('email', userEmail.trim());
                formData.append('lock_or_unlock', true);

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
                    if (document.querySelector('#userLstSwitch')) {
                        document.querySelector('#userLstSwitch').nextElementSibling.innerText = new Date();
                    }
                }).catch(error => {console.error('Error:', error);});
            } else {
                switchInputEl.checked = !switchInputEl.checked;
            }
        }));
    }
})