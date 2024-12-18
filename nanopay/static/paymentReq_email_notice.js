import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const paymentReqEmailNoticeModal = document.querySelector('#paymentReqEmailNoticeModal');

if (!paymentReqEmailNoticeModal.hasAttribute('show-bs-modal-event-listener')) {
    paymentReqEmailNoticeModal.addEventListener('show.bs.modal', e => {getDetailsAsync(e);});
    paymentReqEmailNoticeModal.setAttribute('show-bs-modal-event-listener', 'true');
}

async function getDetailsAsync(e) {
    try {
        const pK = e.relatedTarget.id;
        const getUri = window.location.origin + `/json_respone/paymentReq_email_notice_getLst/?pK=${pK}`;
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            const details =  json[0];
            const contact_lst = json[1]

            initModal(e.target, details, contact_lst);
        } else {
            baseMessagesAlert("fetching data for Payment Request Notice is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

function detailsElBldr(parentElement, header, content) {
    const detailsEl = document.createElement('div');
    detailsEl.classList.add('row');
    detailsEl.innerHTML = [
        `<div class="row my-1">`,
            `<div class="col-5 bg-body-tertiary">${header}</div>`,
            `<div class="col bg-body-tertiary">${content}</div>`,
        `</div>`,
    ].join('');
    parentElement.appendChild(detailsEl);
}

function initModal(modal, details, contact_lst) {
    const formData = new FormData();

    const modalLabel = modal.querySelector('#paymentReqEmailNoticeModalLabel');
    modalLabel.textContent = 'payment request notice';

    const dataList = modal.querySelector('#contactDataList');
    dataList.innerHTML = ''
    Object.keys(contact_lst).forEach((key) => {
        const dataListOpt = document.createElement('option');
        dataListOpt.textContent = key;
        dataListOpt.value = key;
        dataList.appendChild(dataListOpt);
    });

    const modalBodyEl = modal.querySelector('div.modal-body');
    Object.keys(details).forEach((key) => {
        if (key == 'vendor') {
            Object.keys(details[key]).forEach((party_b_key) => {
                detailsElBldr(modalBodyEl, key, party_b_key);
                formData.append(key, party_b_key);
                Object.keys(details[key][party_b_key]).forEach((k) => {
                    detailsElBldr(modalBodyEl, k, details[key][party_b_key][k]);
                    formData.append(k, details[key][party_b_key][k]);
                });
            });
        } else {
            detailsElBldr(modalBodyEl, key, details[key]);
            formData.append(key, details[key]);
        }
    });

    const contactInputEl = modal.querySelector('#contact');
    contactInputEl.value = '';
    if (!contactInputEl.hasAttribute('blur-event-listener')) {
        contactInputEl.addEventListener('blur', () => {
            const chkResult = inputChk(contactInputEl, contact_lst, null, true);
            if (chkResult && !Array.from(modalBodyEl.querySelectorAll('div.row')).some(el => el.textContent.includes(contactInputEl.value))) {
                detailsElBldr(modalBodyEl, 'contact', contactInputEl.value);
                formData.append('contact', contactInputEl.value);
                Object.keys(contact_lst[contactInputEl.value]).forEach((key) => {
                    detailsElBldr(modalBodyEl, key, contact_lst[contactInputEl.value][key]);
                    formData.append(key, contact_lst[contactInputEl.value][key]);
                });
            }
        });
        contactInputEl.setAttribute('blur-event-listener', 'true');
    }

    const csrftoken = modal.querySelector('input[name=csrfmiddlewaretoken]').value; // get csrftoken
    const postUpdUri = window.location.origin + '/payment_request/email_notice/';

    const previewBtnEl = modal.querySelector('#preview');
    const sendBtnEl = modal.querySelector('#send');

    if (!previewBtnEl.hasAttribute('click-event-listener')) {
        previewBtnEl.addEventListener('click', (e) => {
            const chkResult = inputChk(contactInputEl, contact_lst, null, true);
            if (chkResult) {
                // window.open(`${window.location.origin}/payment_request/${value[0]}/email_notice/`, '_blank'); // open A link in a new tab / window 在新的窗口(标签)打开页面
                formData.append('type', e.target.textContent);

                const newTab = window.open('', '_blank');

                fetch(postUpdUri, {
                    method: 'POST',
                    headers: {'X-CSRFToken': csrftoken},
                    mode: 'same-origin', // do not send CSRF token to another domain
                    body: formData,
                }).then(response => {
                    // response.json();
                    if (response.ok) {
                        return response.text();
                    } else {
                        throw new Error(`HTTP error: ${response.status}`);
                    }
                }).then(html => {
                    if (html) {
                        newTab.document.open();
                        newTab.document.write(html);
                        newTab.document.close();
                    }
                }).catch(error => {error ? console.error('Error:', error) : null;});


            }
        });
        previewBtnEl.setAttribute('click-event-listener', 'true');
    }

    if (!sendBtnEl.hasAttribute('click-event-listener')) {
        sendBtnEl.addEventListener('click', (e) => {
            const chkResult = inputChk(contactInputEl, contact_lst, null, true);
            if (chkResult) {
                formData.append('type', e.target.textContent);

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
                    // baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {location.reload();});
                }).catch(error => {error ? console.error('Error:', error) : null;});

                bootstrap.Modal.getOrCreateInstance(paymentReqEmailNoticeModal).hide();
            }
        });
        sendBtnEl.setAttribute('click-event-listener', 'true');
    }
}

if (!paymentReqEmailNoticeModal.hasAttribute('hidden-bs-modal-event-listener')) {
    paymentReqEmailNoticeModal.addEventListener('hidden.bs.modal', e => {
        e.target.querySelectorAll('div.row').forEach(el => {el.remove();});

        bootstrap.Modal.getOrCreateInstance(e.target).dispose();

        document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
    });
    paymentReqEmailNoticeModal.setAttribute('hidden-bs-modal-event-listener', 'true');
}
