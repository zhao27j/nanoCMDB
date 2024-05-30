import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken
let clickedEl, instanceSelectedPk, instanceSelectedIsAssigned, instanceSelectedStatus;
document.addEventListener('click', e => { // listerning all Click events on the Document
    if (e.target.closest("[id^='inRepairInstance']")) {
        let cnfrm = undefined;
        clickedEl = e.target.closest("[id^='inRepairInstance']");

        instanceSelectedPk = clickedEl.id.split(`inRepairInstance`)[1];
        instanceSelectedIsAssigned = document.querySelector(`#ownerInstance${instanceSelectedPk}`).querySelector('small').innerHTML != '🈳' ? true : false;
        instanceSelectedStatus = document.querySelector(`#statusInstance${instanceSelectedPk}`);

        const formData = new FormData();
        if (instanceSelectedStatus.innerHTML.includes('in Repair')) {
            if (instanceSelectedIsAssigned) {
                formData.append('instanceSelectedStatus', 'inUSE');
            } else {
                formData.append('instanceSelectedStatus', 'AVAILABLE');
            }
            cnfrm = `Do you really wnat to get this IT Assets [ ${instanceSelectedPk} ] back from Repairing`
        } else if (instanceSelectedStatus.innerHTML.includes('Available') || instanceSelectedStatus.innerHTML.includes('in Use')) {
            formData.append('instanceSelectedStatus', 'inREPAIR');
            cnfrm = `Do you really wnat to send this IT Assets [ ${instanceSelectedPk} ] for Repairing`
        }

        if (cnfrm && window.confirm(cnfrm)) {
            formData.append('instanceSelectedPk', instanceSelectedPk);
            const postUpdUri = window.location.origin + '/instance/in_repair/';
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
            }).then(json => {
                if (json[instanceSelectedPk] == 'inREPAIR') {
                    instanceSelectedStatus.innerHTML = 'in Repair';
                    clickedEl.querySelector('svg').remove();
                    clickedEl.innerHTML = [
                        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-exclamation" viewBox="0 0 16 16">`,
                            `<path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855a.75.75 0 0 0-.124 1.329l4.995 3.178 1.531 2.406a.5.5 0 0 0 .844-.536L6.637 10.07l7.494-7.494-1.895 4.738a.5.5 0 1 0 .928.372l2.8-7Zm-2.54 1.183L5.93 9.363 1.591 6.602l11.833-4.733Z"></path>`,
                            `<path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1.5a.5.5 0 0 1-1 0V11a.5.5 0 0 1 1 0Zm0 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>`,
                        `</svg>`
                    ].join('');
                    baseMessagesAlert(`the selected IT Assets [ ${instanceSelectedPk} ] was sent for Repairing`, 'success');
                } else {
                    if (json[instanceSelectedPk] == 'inUSE') {instanceSelectedStatus.innerHTML = 'in Use';}
                    if (json[instanceSelectedPk] == 'AVAILABLE') {instanceSelectedStatus.innerHTML = 'Available';}

                    clickedEl.querySelector('svg').remove();
                    clickedEl.innerHTML = [
                        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-wrench-adjustable" viewBox="0 0 16 16">`,
                            `<path d="M16 4.5a4.492 4.492 0 0 1-1.703 3.526L13 5l2.959-1.11c.027.2.041.403.041.61Z"/>`,
                            `<path d="M11.5 9c.653 0 1.273-.139 1.833-.39L12 5.5 11 3l3.826-1.53A4.5 4.5 0 0 0 7.29 6.092l-6.116 5.096a2.583 2.583 0 1 0 3.638 3.638L9.908 8.71A4.49 4.49 0 0 0 11.5 9Zm-1.292-4.361-.596.893.809-.27a.25.25 0 0 1 .287.377l-.596.893.809-.27.158.475-1.5.5a.25.25 0 0 1-.287-.376l.596-.893-.809.27a.25.25 0 0 1-.287-.377l.596-.893-.809.27-.158-.475 1.5-.5a.25.25 0 0 1 .287.376ZM3 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>`,
                        `</svg>`
                    ].join('');
                    baseMessagesAlert(`the selected IT Assets [ ${instanceSelectedPk} ] was got back from Repairing`, 'success');
                }
            })
        }
    }
});