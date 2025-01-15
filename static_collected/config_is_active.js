import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

document.addEventListener('change', e => {
    if (e.target.type == 'checkbox' && e.target.role == 'switch' && e.target.name == 'config_is_active') {
        const switchInputEl = e.target;
        switchInputEl.disabled = true;
        // const configClass = e.target.closest('tr').querySelector('td:nth-child(2)').querySelector('small').textContent;
        // const configPara = e.target.closest('tr').querySelector('td:nth-child(3)').querySelector('small').textContent;
        
        const msg = e.target.checked ? `activate this Config ?` : `deactivate this Config ?` ;
        
        const alertBtns = baseMessagesAlert(msg, 'warning', false);
        alertBtns.forEach(btn => btn.addEventListener('click', btnClickEvent => {
            if (btnClickEvent.target.textContent == 'yes') {
                const postUpdUri = window.location.origin + '/config/is_active/';
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

                const formData = new FormData();
                formData.append('pk', switchInputEl.value);
                formData.append('is_active', switchInputEl.checked);

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
                    switchInputEl.disabled = false;
                    switchInputEl.closest('tr').querySelectorAll('td').forEach(td => {
                        if (switchInputEl.checked) {
                            td.querySelector('small').classList.remove('text-decoration-line-through');
                        } else {
                            td.querySelector('small').classList.add('text-decoration-line-through');
                        }
                    });
                }).catch(error => {console.error('Error:', error);});
            } else {
                switchInputEl.disabled = false;
                switchInputEl.checked = !switchInputEl.checked;
            }
        }));
    }
})