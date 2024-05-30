import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const paymentReqModal = document.querySelector('#paymentReqModal');

let pK, details, nPE_lst, inputChkResults;

paymentReqModal.addEventListener('show.bs.modal', (e) => {
    pK = e.relatedTarget.id;
    async function getDetailsAsync() {
        try {
            const getUri = window.location.origin + `/json_respone/paymentReq_getLst/?pK=${pK}`;
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                details = json[0];
                nPE_lst = json[1];
            } else {
                baseMessagesAlert("the data for Payment Request is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
    getDetailsAsync();
});

const modalLabel = paymentReqModal.querySelector('#modalLabel');
const amount = paymentReqModal.querySelector('#amount');
const nPE = paymentReqModal.querySelector('#non_payroll_expense');

const scanned_copy = paymentReqModal.querySelector('#scanned_copy');

paymentReqModal.querySelector('input[id=budget_category][type=checkbox][role=switch]').addEventListener('change', e => {
    const budget_category = e.target.checked ? 'Operation budget [运营预算]' : 'Development budget [开发预算]';
    const tooltipTriggerList = paymentReqModal.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => {
            // const tooltip = new bootstrap.Tooltip(tooltipTriggerEl);
            const tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl); // Returns a Bootstrap tooltip instance
            tooltip.setContent({ '.tooltip-inner': budget_category }); // setContent example
        }
    );
});

function initModal(e) {
    modalLabel.textContent = 'new Payment Request';
    
    modalInputElAll.forEach(modalInputEl => {modalInputEl.disabled = false});
    modalBtnNext.textContent = 'next';
    modalBtnSubmit.classList.add('hidden');  // modalBtnSubmit.style.display = 'none';
    
    if (e.type == 'shown.bs.modal') {
        amount.value = details.amount;
        nPE.value = details.nPE;
        const nPEDatalist = paymentReqModal.querySelector('#nPEDatalist');
        nPEDatalist.innerHTML = ''
        Object.keys(nPE_lst).forEach(key => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = key;
            nPEDatalist.appendChild(dataListOpt);
        });
        const budgetYr = new Date(details.pay_day); // get the Year of the Pay Day set in the Payment Term as the Budget Year 从 Payment Term 的 Pay Day 字段 获取 年份 作为 预算年
        // const budgetYr = new Date(); // get the Year from the current date as the Budget Year 从 当前 日期 获取 年份 作为 预算年
        nPEDatalist.parentElement.querySelector('label em').innerText = ` of current budget year ${budgetYr.getFullYear()}`;
        scanned_copy.value = '';
        const progressBar = paymentReqModal.querySelector('.progress-bar');
        if (details.contract_remaining > 0) {
            progressBar.classList.add('bg-info');
        } else {
            progressBar.classList.add('bg-danger');
        }
        progressBar.style.width = `${details.contract_remaining}%`;
        progressBar.textContent = `${details.contract_remaining}%`;

        inputChkResults = {
            'amount': amount.value ? true : false,
            'non_payroll_expense': nPE.value ? true : false,
            'scanned_copy': false,
        };
    }
}

paymentReqModal.addEventListener('shown.bs.modal', e => {initModal(e)});

const modalInputElAll = Array.from(paymentReqModal.querySelector('.modal-body').querySelectorAll('input'));
const modalBtnNext = paymentReqModal.querySelector('#modalBtnNext');
const modalBtnSubmit = paymentReqModal.querySelector('#modalBtnSubmit');
modalInputElAll.forEach(modalInputEl => modalInputEl.addEventListener('blur', e => {
    const optLst = e.target.list && e.target.id == 'non_payroll_expense' ? nPE_lst : null;
    inputChkResults[e.target.id] = inputChk(e.target, optLst);
    modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
}));
modalBtnNext.addEventListener('focus', e => {modalInputElAll.forEach(modalInputEl => {
    const optLst = modalInputEl.list && modalInputEl.id == 'non_payroll_expense' ? nPE_lst : null;
    inputChkResults[modalInputEl.id] = inputChk(modalInputEl, optLst);
    modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
});});
modalBtnNext.addEventListener('click', e => {
    if (e.target.textContent == 'next'){
        if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
            modalLabel.textContent = 'review & confirm';
            modalInputElAll.forEach(modalInputEl => {
                ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
                modalInputEl.disabled = true;
                modalInputEl.nextElementSibling.textContent = '';
                // inputChkResults.get(`${modalInputEl.id}`) == modalInputTag ? modalInputEl.classList.add('border-success') : null;
            });
            e.target.textContent = 'back';
            modalBtnSubmit.classList.remove('hidden');  // modalBtnSubmit.style.display = '';
        }
    } else if (e.target.textContent == 'back') {initModal(e);}
})

modalBtnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/payment_request/c/';
    const csrftoken = paymentReqModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    formData.append('payment_term', pK);
    
    modalInputElAll.forEach(modalInputEl => {
        if (modalInputEl.type == 'file') {
            // modalInputEl.files.forEach((value, key, array) => formData.append(`scanned_copy_${key}`, value));
            for (let i = 0; i < modalInputEl.files.length; i++) {
                formData.append('scanned_copy', modalInputEl.files[i]);
            }
        } else if (modalInputEl.id == 'non_payroll_expense') {
            formData.append('budgetYr', nPE_lst[modalInputEl.value].split('---')[0]);
            formData.append('reforecasting', nPE_lst[modalInputEl.value].split('---')[1]);
            formData.append(modalInputEl.id, modalInputEl.value);
        } else if (modalInputEl.id == 'budget_category' && modalInputEl.role == 'switch' && modalInputEl.type == 'checkbox') {
            formData.append(modalInputEl.id, modalInputEl.checked ? 'O' : 'D');
        } else {
            formData.append(modalInputEl.id, modalInputEl.value);
        }
    })

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
            location.reload();
        });
    }).catch(error => {error ? console.error('Error:', error) : null;});
})