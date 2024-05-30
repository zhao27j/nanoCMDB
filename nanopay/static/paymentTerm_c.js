import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const paymentTermModal = document.querySelector('#paymentTermModal');

let pK, details, plan_lst, inputChkResults;

paymentTermModal.addEventListener('show.bs.modal', (e) => {
    pK = e.relatedTarget.id;
    async function getDetailsAsync() {
        try {
            const getUri = window.location.origin + `/json_respone/paymentTerm_getLst/?pK=${pK}`;
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                details = json[0];
                plan_lst = json[1];
            } else {
                baseMessagesAlert("the data for Payment Term is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
    getDetailsAsync();
});

const modalLabel = paymentTermModal.querySelector('#modalLabel');
const plan = paymentTermModal.querySelector('#plan');
const recurring = paymentTermModal.querySelector('#recurring');
const pay_day = paymentTermModal.querySelector('#pay_day');
const amount = paymentTermModal.querySelector('#amount');

function modalInit(e) {
    modalLabel.textContent = 'new Payment Term';

    modalInputElAll.forEach(modalInputEl => {modalInputEl.disabled = false});
    modalBtnNext.textContent = 'next';
    modalBtnSubmit.classList.add('hidden');  // modalBtnSubmit.style.display = 'none';
    
    if (e.type == 'shown.bs.modal') {
        plan.value = details.plan;
        const planDatalist = paymentTermModal.querySelector('#planDatalist');
        planDatalist.innerHTML = ''
        Object.keys(plan_lst).forEach(key => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = key;
            planDatalist.appendChild(dataListOpt);
        });
        recurring.value = 1;
        const dateObj = new Date(details.pay_day);
        dateObj.setMonth(dateObj.getMonth() + 1)
        pay_day.value = dateObj.toISOString().split('T')[0];
        // pay_day.value = details.pay_day;
        
        amount.value = details.amount;

        const progressBar = paymentTermModal.querySelector('.progress-bar');
        if (details.contract_remaining > 0) {
            progressBar.classList.add('bg-info');
        } else {
            progressBar.classList.add('bg-danger');
        }
        progressBar.style.width = `${details.contract_remaining}%`;
        progressBar.textContent = `${details.contract_remaining}%`;

        inputChkResults = {
            'plan': details.plan ? true : false,
            'recurring': details.recurring ? true : false,
            'pay_day': details.pay_day ? true : false,
            'amount': details.amount ? true : false,
        };
    }

    
}

paymentTermModal.addEventListener('shown.bs.modal', e => {modalInit(e)});

const modalInputElAll = Array.from(paymentTermModal.querySelector('.modal-body').querySelectorAll('input'));
const modalBtnNext = paymentTermModal.querySelector('#modalBtnNext');
const modalBtnSubmit = paymentTermModal.querySelector('#modalBtnSubmit');

modalInputElAll.forEach(m => m.addEventListener('blur', e => {
    const optLst = e.target.list && e.target.id == 'plan' ? plan_lst : null;
    inputChkResults[e.target.id] = inputChk(e.target, optLst);
    modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));

    // recurring.disabled = e.target.id == 'plan' && e.target.value == 'Custom' ? true : false;
    // recurring.value = e.target.id == 'plan' && e.target.value == 'Custom' ? 1 : recurring.value;

    recurring.disabled = plan.value == 'Custom' ? true : false;
    recurring.value = plan.value == 'Custom' ? 1 : recurring.value;
}));

modalBtnNext.addEventListener('focus', e => {modalInputElAll.forEach(m => {
    const optLst = m.list && m.id == 'plan' ? plan_lst : null;
    inputChkResults[m.id] = inputChk(m, optLst);
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
    } else if (e.target.textContent == 'back') {modalInit(e);}
})

modalBtnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/payment_term/c/';
    const csrftoken = paymentTermModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    formData.append('contractPk', pK);
    
    modalInputElAll.forEach(m => {
        if (m.id == 'pay_day') {
            let interval;
            switch (plan.value) {
                case 'Quarterly':
                    interval = 3;
                    break;
                case 'Semi-anually':
                    interval = 6;
                    break;
                case 'Anually':
                    interval = 12;
                    break;
                default:
                    interval = 1;
                    break;
            }
            if (recurring.value > 1) {
                let interval_increase = 0, pay_days = '';
                for (let i = 1; i <= recurring.value; i++ ) {
                    const dateObj = new Date(pay_day.value);
                    dateObj.setMonth(dateObj.getMonth() + interval_increase)
                    pay_days += dateObj.toISOString().split('T')[0] + ',';
                    interval_increase += interval;
                }
                formData.append(m.id, pay_days);
            } else {
                formData.append(m.id, m.value);
            }
        } else if (m.id == 'plan') {
            formData.append(m.id, plan_lst[m.value]);
        } else {
            formData.append(m.id, m.value);
        }
    })

    fetch(postUpdUri, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin', // do not send CSRF token to another domain
        body: formData,
    }).then(response => {
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