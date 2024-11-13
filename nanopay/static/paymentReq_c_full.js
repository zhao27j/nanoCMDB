import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const paymentReqModal = document.querySelector('#paymentReqModal');

let pK, details, nPE_lst, status, inputChkResults = {};

const modalInputElAll = []; // Array.from(paymentReqModal.querySelector('.modal-body').querySelectorAll('input'));

const modalBtnNext = paymentReqModal.querySelector('#modalBtnNext');
const modalBtnSubmit = paymentReqModal.querySelector('#modalBtnSubmit');

paymentReqModal.addEventListener('show.bs.modal', (e) => {
    pK = e.relatedTarget.id;
    async function getDetailsAsync() {
        try {
            const getUri = window.location.origin + `/json_respone/paymentReq_getLst/?pK=${pK}`;
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                details = json[0];
                nPE_lst = json[1];

                initModal(true);
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
/*
paymentReqModal.querySelector('input[id=budget_category][type=checkbox][role=switch]').addEventListener('change', e => {
    const budget_category = e.target.checked ? 'Operation budget [运营预算]' : 'Development budget [开发预算]';
    const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
    tooltip.setContent({ '.tooltip-inner': budget_category }); // setContent example
});

paymentReqModal.querySelector('input[id=budget_system][type=checkbox][role=switch]').addEventListener('change', e => {
    const budget_system = e.target.checked ? 'PMWeb' : 'Non-PMWeb';
    const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
    tooltip.setContent({ '.tooltip-inner': budget_system }); // setContent example
});
*/
function initModal(full = false) {
    modalLabel.textContent = 'new Payment Request';
    
    modalBtnNext.textContent = 'next';
    modalBtnSubmit.classList.add('d-none'); // modalBtnSubmit.classList.add('hidden'); modalBtnSubmit.style.display = 'none';

    if (full) {
        const progressBar = paymentReqModal.querySelector('.progress-bar');
        if (details.contract_remaining > 0) {
            progressBar.classList.add('bg-info');
        } else {
            progressBar.classList.add('bg-danger');
        }
        progressBar.style.width = `${details.contract_remaining}%`;
        progressBar.textContent = `${details.contract_remaining}%`;

        const amount = paymentReqModal.querySelector('#amount');
        amount.value = details.amount;
        const vat = paymentReqModal.querySelector('#vat');
        vat.value = details.vat;
        const scanned_copy = paymentReqModal.querySelector('#scanned_copy');

        if (details.role == 'vendor') { // if (e.type == 'show.bs.modal')
            
            scanned_copy.value = '';

            [amount, vat, scanned_copy].forEach(inputEl => {
                inputEl.disabled = false;
                modalInputElAll.push(inputEl);
            });

            paymentReqModal.querySelector('.modal-body').querySelectorAll(':disabled').forEach(el => {
                [el.closest('div.row'), el.closest('div.input-group')].forEach(divEl => {
                    if (divEl) {divEl.classList.add('d-none')}
                });
            });
    
            inputChkResults = {
                'amount': amount.value ? true : false,
                'vat': vat.value && typeof vat.value === 'number' ? true : false,
                'scanned_copy': false,
            };
        } else {
            const nPE = paymentReqModal.querySelector('#non_payroll_expense');
            nPE.value = details.non_payroll_expense;
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

            const radioEls = Array.from(paymentReqModal.querySelectorAll('div.input-group input[type=radio]'));
            const checkboxEls = Array.from(paymentReqModal.querySelectorAll('div.input-group input[type=checkbox][role=switch]'));

            [nPE, ...radioEls, ...checkboxEls].forEach(inputEl => {
                inputEl.disabled = false;
                modalInputElAll.push(inputEl);

                if (inputEl.id == 'budget_category') {
                    inputEl.addEventListener('change', e => {
                        const budget_category = e.target.checked ? 'Operation budget [运营预算]' : 'Development budget [开发预算]';
                        const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
                        tooltip.setContent({ '.tooltip-inner': budget_category }); // setContent example
                    });
                } else if (inputEl.id == 'budget_system') {
                    inputEl.addEventListener('change', e => {
                        const budget_system = e.target.checked ? 'PMWeb' : 'Non-PMWeb';
                        const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
                        tooltip.setContent({ '.tooltip-inner': budget_system }); // setContent example
                    });
                }
            });

            inputChkResults = {
                'non_payroll_expense': nPE.value ? true : false,
            };
        }
    
        modalInputElAll.forEach(el => el.addEventListener('blur', e => {
            const optLst = e.target.list && e.target.id == 'non_payroll_expense' ? nPE_lst : null;
            inputChkResults[e.target.id] = inputChk(e.target, optLst);
            modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
        }));
    } else {
        modalInputElAll.forEach(inputEl => inputEl.disabled = false);
    }
}

// paymentReqModal.addEventListener('shown.bs.modal', e => {initModal(e)});

modalBtnNext.addEventListener('focus', e => {modalInputElAll.forEach(el => {
    const optLst = el.list && el.id == 'non_payroll_expense' ? nPE_lst : null;
    inputChkResults[el.id] = inputChk(el, optLst);
    modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
});});

modalBtnNext.addEventListener('click', e => {
    if (e.target.textContent == 'next'){
        if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
            modalLabel.textContent = 'review & confirm';
            modalInputElAll.forEach(el => {
                ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => el.classList.remove(m));
                el.disabled = true;
                el.nextElementSibling.textContent = '';
                // inputChkResults.get(`${el.id}`) == modalInputTag ? el.classList.add('border-success') : null;
            });
            e.target.textContent = 'back';
            modalBtnSubmit.classList.remove('d-none'); // modalBtnSubmit.classList.remove('hidden'); modalBtnSubmit.style.display = '';
        }
    } else if (e.target.textContent == 'back') {initModal();}
});

modalBtnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/payment_request/c/';
    const csrftoken = paymentReqModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    formData.append('pK', pK);
    formData.append('status', details.status);

    // if (details.status != 'Drafted') {formData.append('payment_request', pK);} else {formData.append('payment_term', pK);}
    
    modalInputElAll.forEach(el => {
        if (el.type == 'file') {
            // el.files.forEach((value, key, array) => formData.append(`scanned_copy_${key}`, value));
            for (let i = 0; i < el.files.length; i++) {
                formData.append('scanned_copy', el.files[i]);
            }
        } else if (el.id == 'non_payroll_expense') {
            formData.append('budgetYr', nPE_lst[el.value].split('---')[0]);
            formData.append('reforecasting', nPE_lst[el.value].split('---')[1]);
            formData.append(el.id, el.value);
        } else if (el.id == 'budget_category' && el.role == 'switch' && el.type == 'checkbox') {
            formData.append(el.id, el.checked ? 'O' : 'D'); // Operation or Development Budget
        } else if (el.id == 'budget_system' && el.role == 'switch' && el.type == 'checkbox') {
            formData.append(el.id, el.checked ? 'P' : 'N'); // PMWeb or Non-PMWeb
        } else if (el.type = 'radio') {
            if (el.checked) {formData.append(el.id, el.value);}
        } else {
            formData.append(el.id, el.value);
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