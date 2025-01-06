import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

document.addEventListener('click', e => {
    if (e.target.tagName.toLowerCase() == 'svg' && e.target.parentElement.name == 'digital-copy-delete') {
        const digitalCopyDelBtn = e.target.parentElement;

        const digitalCopyDelBtn_innerHTML = digitalCopyDelBtn.innerHTML;

        digitalCopyDelBtn.disabled = true;
        digitalCopyDelBtn.innerHTML = [
            `<span class="spinner-border spinner-border-sm text-danger" aria-hidden="true"></span>`,
            `<span class="visually-hidden" role="status">Loading...</span>`,
        ].join('');

        const digitalCopy_link = digitalCopyDelBtn.parentElement.querySelector('a');
        const digitalCopy_link_innterHTML = digitalCopy_link.innerHTML;
        digitalCopy_link.innerHTML = `<s>${digitalCopy_link.textContent}</s>`;

        
        const alertBtns = baseMessagesAlert('Proceed ?', 'warning', false);

        alertBtns.forEach(btn => btn.addEventListener('click', btnClickEvent => {
            if (btnClickEvent.target.textContent == 'yes') {
                const csrftoken = document.querySelector('input[name=csrfmiddlewaretoken]').value; // get csrftoken

                const postUpdUri = window.location.origin + '/digital_copy/delete/';
                const formData = new FormData();
                formData.append('pK', digitalCopyDelBtn.id);
                
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
                            const digital_copy_name = digitalCopyDelBtn.closest('div').querySelector('a').textContent;
                            digitalCopyDelBtn.closest('div').innerHTML = `<s><small>${digital_copy_name}</small></s>`;
                        } else {

                        }
                        // location.reload();
                    });
                }).catch(error => {error ? console.error('Error:', error) : null;});
            } else {
                digitalCopyDelBtn.disabled = false;
                digitalCopyDelBtn.innerHTML = digitalCopyDelBtn_innerHTML;
                digitalCopy_link.innerHTML = digitalCopy_link_innterHTML;
                /*
                digitalCopyDelBtn.innerHTML = [
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">`,
                        `<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>`,
                    `</svg>`,
                ].join('');
                */
            }
        }))
    }
})