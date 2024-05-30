import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

if (document.querySelector('#disposalRequestApproveBtn')) {
    document.querySelector('#disposalRequestApproveBtn').addEventListener('click', e => {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
        const disposalRequestPk = window.location.href.split('/')[window.location.href.split('/').length - 2];

        const cnfrm = `Do you wnat to Approve this Disposal Request [ Case # ${disposalRequestPk} ]`;
        if (window.confirm(cnfrm)) {
            const formData = new FormData();
            formData.append('disposalRequestPk', disposalRequestPk);
            const postUpdUri = window.location.origin + '/instance/disposal_request_approve/';
            fetch(postUpdUri, {
                method: 'POST',
                headers: {'X-CSRFToken': csrftoken},
                mode: 'same-origin', // Do not send CSRF token to another domain
                body: formData,
            }).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            }).then((result) => {
                // window.location.href = json.url_redirect;
                baseMessagesAlert(`this Disposal Request [ ${disposalRequestPk} ] was Approved`, 'success');
                // console.log(json);
                
            }).catch(error => {console.error('Error:', error)})
        }
    })
}