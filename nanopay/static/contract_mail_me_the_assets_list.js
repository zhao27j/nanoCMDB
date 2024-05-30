import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'


document.addEventListener('click', e => {
    // if (document.querySelector('div.d-grid.gap-2.d-md-flex.justify-content-md-end button.btn.btn-outline-secondary.me-md-2')) {
    if (e.target.type == 'button' && e.target.innerText == 'mail me the list') {
        const btn = document.querySelector('div.d-grid.gap-2.d-md-flex.justify-content-md-end button.btn.btn-outline-secondary.me-md-2');

        btn.classList.add('disabled'); // 禁用 按钮
        
        let getLstUri = window.location.origin + '/contract/mail_me_the_assets_list/';
        getLstUri += `?contractPk=${btn.id}`;

        if (document.querySelectorAll('input[name="instance"][type="checkbox"]:checked').length > 0) {
            const instance_selected = document.querySelectorAll('input[name="instance"][type="checkbox"]:checked');
            let instance_selected_pk = '';
            instance_selected.forEach(el => {
                instance_selected_pk += el.value + ',';
            });
            getLstUri += `&instancesPk=${instance_selected_pk}`;
        }

        fetch(getLstUri
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            }).then(json => {
                if (json.is_sent) {
                    baseMessagesAlert(`the asset list of ${json.is_sent} + was successfully sent`, 'success');

                } else {
                    baseMessagesAlert(`email was NOT sent !`, 'danger');
                }
                
                setTimeout(() => { btn.classList.remove('disabled');}, 10000); // 3秒后 取消 按钮 禁用
            }).catch(error => {
                error ? console.error('Error:', error) : null;
            });
    }
    
})