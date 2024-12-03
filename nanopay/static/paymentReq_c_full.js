import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const paymentReqModal = document.querySelector('#paymentReqModal');

const invoiceItemDivRowEl = paymentReqModal.querySelector('div.modal-body div.row[name="invoice_items"]');
const modalLabel = paymentReqModal.querySelector('#modalLabel');
const modalBtnNext = paymentReqModal.querySelector('#modalBtnNext');
const modalBtnSubmit = paymentReqModal.querySelector('#modalBtnSubmit');

let pK, details, nPE_lst, inputChkResults, modalInputElAll = [], del_scanned_copies; // Array.from(paymentReqModal.querySelector('.modal-body').querySelectorAll('input'));

document.addEventListener('dblclick', e => { // listerning all Double Click events on the Document
    if (e.target.closest('tr') && e.target.closest('tr').querySelector("td > input[type='checkbox']")) {
        const checkBoxEl = e.target.closest('tr').querySelector("td > input[type='checkbox']");
        if (checkBoxEl.name.includes('payment')) {
            pK = checkBoxEl.value;
            // paymentReqModal = document.querySelector('#paymentReqModal').cloneNode(true);
            // document.body.appendChild(paymentReqModal);
            // e.target.appendChild(paymentReqModal);
            bootstrap.Modal.getOrCreateInstance(paymentReqModal).show();
        }
    };
});

if (!paymentReqModal.hasAttribute('shown-bs-modal-event-listener')) {
    paymentReqModal.addEventListener('shown.bs.modal', (e) => {
        if (e.relatedTarget) {pK = e.relatedTarget.id};
        getDetailsAsync();
    });
    paymentReqModal.setAttribute('shown-bs-modal-event-listener', 'true');
}

const all_el_hidden = paymentReqModal.querySelector('.modal-body').querySelectorAll('.d-none');
const all_el_disabled = paymentReqModal.querySelector('.modal-body').querySelectorAll(':disabled');
if (!paymentReqModal.hasAttribute('hidden-bs-modal-event-listener')) {
    paymentReqModal.addEventListener('hidden.bs.modal', e => {
        // e.target.remove();
        while (invoiceItemDivRowEl.querySelectorAll('div.input-group').length > 2) {
            invoiceItemDivRowEl.lastElementChild.remove();
        }
        all_el_disabled.forEach(el => restoreInputEl(el));
        all_el_hidden.forEach(el => el.classList.add('d-none'));
        bootstrap.Modal.getOrCreateInstance(paymentReqModal).dispose();
        document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
    });
    paymentReqModal.setAttribute('hidden-bs-modal-event-listener', 'true');
}

if (!paymentReqModal.hasAttribute('keyup-event-listener')) {
    paymentReqModal.addEventListener('keyup', e => {
        if (!details.hasOwnProperty('status') || (details.status == 'Rej' && details.role == 'vendor')) {
            if (e.ctrlKey && e.key === '.') {
                // if (invoiceItemDivRowEl.querySelectorAll('div.input-group').length < 12) {
                if (invoiceItemDivRowEl.children.length < 5) {
                    // const itms = invoiceItemDivRowEl.querySelectorAll('div.input-group').length;
                    const itms = invoiceItemDivRowEl.children.length;
                    get_invoice_item_input_grp_el(itms+1);
                    // console.log( "KeyboardEvent: key='" + e.key + "' | code='" + e.code + "'");
                }
            } else if (e.ctrlKey && e.key === ',') {
                // if (invoiceItemDivRowEl.querySelectorAll('div.input-group').length > 2) {
                    if (invoiceItemDivRowEl.children.length > 1) {
                    // const lastEl = invoiceItemDivRowEl.lastElementChild;
                    const lastEl = invoiceItemDivRowEl.lastChild;
                    // lastEl.childNodes.forEach(removeEl => {
                    lastEl.querySelectorAll(':required').forEach(removeEl => {
                        modalInputElAll = modalInputElAll.filter(el => {
                            if (el != removeEl) {
                                return true;
                            } else {
                                delete inputChkResults[el.id];
                            }
                        });
                    });
                    lastEl.remove();
                    document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
                }
            }
        } else if (details.role != 'vendor' && (details.status == 'Req' || details.status == 'I') && modalLabel.textContent != 'reject' && modalBtnSubmit.textContent != 'reject') {
            if (e.ctrlKey && e.key === 'Backspace') {
                modalLabel.textContent = 'reject';
                modalInputElAll.forEach(el => restoreInputEl(el));
                modalBtnNext.textContent = 'back';
                // modalBtnNext.classList.remove('disabled');
                modalBtnNext.disabled = false;
                modalBtnSubmit.textContent = 'reject';
                modalBtnSubmit.classList.remove('d-none');
            }
        }
    });
    paymentReqModal.setAttribute('keyup-event-listener', 'true');
}

if (!modalBtnNext.hasAttribute('focus-event-listener')) {
    modalBtnNext.addEventListener('focus', e => {modalInputElAll.forEach(el => {handleInputChkEvents(el, false);});});
    modalBtnNext.setAttribute('focus-event-listener', 'true');
}

if (!modalBtnNext.hasAttribute('click-event-listener')) {
    modalBtnNext.addEventListener('click', e => {
        scannedCopiesUlEl.querySelectorAll('button[id=delScannedCopy]').forEach(btn => {btn.classList.toggle('disabled', e.target.textContent == 'next');});
        
        if (e.target.textContent == 'next'){
            if (Object.values(inputChkResults).every((element, index, array) => {return element == true;})) {
                modalLabel.textContent = 'review & confirm';
                modalInputElAll.forEach(el => restoreInputEl(el));
                e.target.textContent = 'back';
                modalBtnSubmit.classList.remove('d-none'); // modalBtnSubmit.classList.remove('hidden'); modalBtnSubmit.style.display = '';
            }
        } else if (e.target.textContent == 'back') {initModal();}
        document.body.querySelectorAll('div.tooltip.show').forEach(el => {el.remove();}); // const toolTipInstance = bootstrap.Tooltip.getOrCreateInstance(el);
    });
    modalBtnNext.setAttribute('click-event-listener', 'true');
}

if (!modalBtnSubmit.hasAttribute('click-event-listener')) {
    modalBtnSubmit.addEventListener('click', e => {
        const postUpdUri = window.location.origin + '/payment_request/c/';
        const csrftoken = paymentReqModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

        const formData = new FormData();
        formData.append('pK', pK);
        formData.append('role', details.role);

        if (e.target.textContent.toLowerCase().includes('submit')) {
            switch (details.role) {
                case 'vendor':
                    formData.append('status', 'Req');
                    break;
                default:
                    formData.append('status', 'I'); // role is validator or reviewer
                    break;
            }

            const invoice_item = {};
            modalInputElAll.forEach(el => {
                if (el.id.includes('vat') || el.id.includes('amount') || el.id.includes('description')) {
                    if (!invoice_item.hasOwnProperty(el.id.split('_')[1])) {
                        invoice_item[el.id.split('_')[1]] = {};
                    }
                    invoice_item[el.id.split('_')[1]][el.id.split('_')[0]] = el.value;
                    
                } else if (el.id == 'non_payroll_expense') {
                    formData.append('budgetYr', nPE_lst[el.value].split('---')[0]);
                    formData.append('reforecasting', nPE_lst[el.value].split('---')[1]);
                    formData.append(el.id, el.value);
                } else if (el.id == 'budget_category' && el.role == 'switch' && el.type == 'checkbox') {
                    formData.append(el.id, el.checked ? 'O' : 'D'); // Operation or Development Budget
                } else if (el.id == 'budget_system' && el.role == 'switch' && el.type == 'checkbox') {
                    formData.append(el.id, el.checked ? 'P' : 'N'); // PMWeb or Non-PMWeb
                } else if (el.type == 'file') {
                    // el.files.forEach((value, key, array) => formData.append(`scanned_copy_${key}`, value));
                    for (let i = 0; i < el.files.length; i++) {
                        formData.append('scanned_copy', el.files[i]);
                    }
                } else if (el.type == 'radio') {
                    if (el.checked) {formData.append(el.id, el.value);}
                } else {
                    formData.append(el.id, el.value);
                }
            });

            if (Object.entries(invoice_item).length > 0) { // verify if A object is empty 确认 对象 是否 为 空
                formData.append('invoice_item', JSON.stringify(invoice_item));
            }
            
            if (Object.entries(del_scanned_copies).length > 0) {
                formData.append('del_scanned_copies', JSON.stringify(del_scanned_copies));
            }

        } else if (e.target.textContent == 'reject') {
            formData.append('status', 'Rej');
        }

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
            if (details.role != 'vendor') {baseMessagesAlert(json.alert_msg, json.alert_type);}
            baseMessagesAlertPlaceholder.addEventListener('hidden.bs.toast', () => {location.reload();});
        }).catch(error => {error ? console.error('Error:', error) : null;});
    });
    modalBtnSubmit.setAttribute('click-event-listener', 'true');
}

async function getDetailsAsync() {
    try {
        const getUri = window.location.origin + `/json_respone/paymentReq_getLst/?pK=${pK}`;
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            details = json[0];
            nPE_lst = json[1];

            if (new Date().getFullYear() >= new Date(details.pay_day).getFullYear()) {
                initModal(true);
            } else {
                bootstrap.Modal.getOrCreateInstance(paymentReqModal).hide();
                baseMessagesAlert("it's NOT the corresponding budget Year", 'danger');
            }
        } else {
            baseMessagesAlert("the data for Payment Request is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

const scannedCopiesUlEl = paymentReqModal.querySelector('div.modal-body div.row div.col ul');

function initModal(full = false) {
    modalLabel.innerHTML = details.hasOwnProperty('get_status_display') ? `Payment Request <em class="fs-6 d-inline-block">[ ${details.get_status_display} ]</em>` : 'new Payment Request';
    if (modalLabel.querySelector('em')) {
        switch (details.status) {
            case 'A':
                modalLabel.querySelector('em').classList.add('text-success');
                break;
            case 'Rej':
                modalLabel.querySelector('em').classList.add('text-danger');
                break;
            default:
                modalLabel.querySelector('em').classList.add('text-secondary');
                break;
        }
    }

    modalBtnNext.textContent = 'next';
    
    modalBtnSubmit.textContent = details.status == 'Rej' ? 'Re-submit' : 'submit';
    modalBtnSubmit.classList.add('d-none'); // modalBtnSubmit.classList.add('hidden'); modalBtnSubmit.style.display = 'none';

    if (full) {
        inputChkResults = {};
        modalInputElAll.length = 0; // empty Array

        del_scanned_copies = {};

        modalBtnNext.disabled = true;

        const progressBar = paymentReqModal.querySelector('.progress-bar');
        ['bg-danger', 'bg-info'].forEach(cls => progressBar.classList.remove(cls));
        if (details.contract_remaining > 0) {
            progressBar.classList.add('bg-info');
        } else {
            progressBar.classList.add('bg-danger');
        }
        progressBar.style.width = `${details.contract_remaining}%`;
        progressBar.textContent = `${details.contract_remaining}%`;

        let amount, vat, description, invoiceInputEls = [];
        if (details.hasOwnProperty('invoice_item') && Object.keys(details['invoice_item']).length > 0) {
            invoiceItemDivRowEl.innerHTML = '';
            Object.entries(details.invoice_item).forEach((value, key, map) => {
                const invoiceItemInputGrpEl = get_invoice_item_input_grp_el(value[0]);
                invoiceItemInputGrpEl.querySelectorAll(`[id$="_${value[0]}"]`).forEach(el => {
                    el.value = value[1][el.id.split('_')[0]];
                });
            });
        } else {
            amount = paymentReqModal.querySelector('#amount_1');
            amount.value = details.amount;
            vat = paymentReqModal.querySelector('#vat_1');
            vat.value = details.vat ? details.vat : '';
            description = paymentReqModal.querySelector('#description_1');
            description.value = details.description ? details.description : '';
        }
        
        const scanned_copy = paymentReqModal.querySelector('#scanned_copy');
        scanned_copy.value = '';

        invoiceInputEls = modalInputElAll.length > 0 ? [...modalInputElAll, scanned_copy] : [amount, vat, description, scanned_copy];

        if (details.role == 'vendor') { // if (e.type == 'show.bs.modal')
            invoiceInputEls.forEach(el => {
                if (!details.hasOwnProperty('status') || details.status == 'Rej') {
                    get_input_fields_ready(el);
                } else {
                    if (el) {el.disabled = true;}
                }
            });
        } else {
            const nPE = paymentReqModal.querySelector('#non_payroll_expense');
            nPE.value = details.non_payroll_expense;
            
            const radioEls = Array.from(paymentReqModal.querySelectorAll('div.input-group input[type=radio]'));
            const checkboxEls = Array.from(paymentReqModal.querySelectorAll('div.input-group input[type=checkbox][role=switch]'));

            const validateInputEls = details.hasOwnProperty('status') ? [nPE, ...radioEls, ...checkboxEls] : [nPE, ...radioEls, ...checkboxEls, ...invoiceInputEls];
            validateInputEls.forEach(el => {
                if (!details.hasOwnProperty('status') || details.status == 'Req') {
                    get_input_fields_ready(el);

                    if (!el.hasAttribute('change-event-listener')) {
                        if (el.id == 'budget_category') {
                            el.addEventListener('change', e => {
                                const budget_category = e.target.checked ? 'Operation budget / 运营预算' : 'Development budget [开发预算]';
                                const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
                                tooltip.setContent({ '.tooltip-inner': budget_category }); // setContent example
                            });
                        } else if (el.id == 'budget_system') {
                            el.addEventListener('change', e => {
                                const budget_system = e.target.checked ? 'PMWeb' : 'Non-PMWeb';
                                const tooltip = bootstrap.Tooltip.getInstance(e.target); // returns a Tooltip instance
                                tooltip.setContent({ '.tooltip-inner': budget_system }); // setContent example
                            });
                        }
                        el.setAttribute('change-event-listener', 'true');
                    }
                }
                [el.closest('div.row'), el.closest('div.input-group')].forEach(divEl => {
                    if (divEl) {
                        divEl.classList.remove('d-none');
                    }
                });
            });

            const nPEDatalist = paymentReqModal.querySelector('#nPEDatalist');
            nPEDatalist.innerHTML = ''
            Object.keys(nPE_lst).forEach(key => {
                const dataListOpt = document.createElement('option');
                dataListOpt.textContent = key;
                dataListOpt.value = key;
                nPEDatalist.appendChild(dataListOpt);
            });

            const budgetYr = new Date(details.pay_day); // get the Year of the Pay Day set in the Payment Term as the Budget Year 从 Payment Term 的 Pay Day 字段 获取 年份 作为 预算年
            // const budgetYr = new Date(); // get the Year from the current date as the Budget Year 从 当前 日期 获取 年份 作为 预算年
            nPEDatalist.parentElement.querySelector('label em').innerHTML = ` of budget year<span class="bg-secondary-subtle"> ${budgetYr.getFullYear()} </span>:`;

            // modalInputElAll = [...new Set(modalInputElAll)]; // deduplicate Array 数组 去重
        }

        // const scannedCopiesUlEl = paymentReqModal.querySelector('div.modal-body div.row div.col ul');
        scannedCopiesUlEl.innerHTML = '';
        if (details.hasOwnProperty('scanned_copies')) {
            Object.entries(details.scanned_copies).forEach((value, key, map) => {
                const scannedCopiesLiEl = document.createElement('li');
                scannedCopiesLiEl.classList.add('text-break');
                scannedCopiesLiEl.innerHTML = `<a href="${window.location.origin}/digital_copy/${value[0]}/display/" class="text-decoration-none" role="button" target="_blank">${value[1]}</a>`
                // scannedCopiesLiEl.querySelector('button[id=digitalCopyDisplayBtn]').addEventListener('click', e => {window.open(`${window.location.origin}/digital_copy/${value[0]}/display/`, '_blank');}); // open A link in a new tab / window 在新的窗口(标签)打开页面
                if (details.role == 'vendor' && details.status == 'Rej') {
                    scannedCopiesLiEl.innerHTML += [
                        // `<button type="button" id="digitalCopyDisplayBtn" class="btn btn-link text-decoration-none align-items-start">${value[1]}</button>`,
                        `<button type="button" id="delScannedCopy" class="btn btn-link text-decoration-none">`,
                            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>                            
                            </svg>`,
                        `</button>`,
                    ].join('');
                    if (!scannedCopiesLiEl.querySelector('button[id=delScannedCopy]').hasAttribute('click-event-listener')) {
                        scannedCopiesLiEl.querySelector('button[id=delScannedCopy]').addEventListener('click', e => {
                            if (scannedCopiesLiEl.querySelector('s')) {
                                const txtCntnt = scannedCopiesLiEl.querySelector('s').textContent;
                                scannedCopiesLiEl.querySelector('a').innerHTML = `${txtCntnt}`;

                                delete del_scanned_copies[value[0]];
                            } else {
                                const txtCntnt = scannedCopiesLiEl.querySelector('a').textContent;
                                scannedCopiesLiEl.querySelector('a').innerHTML = `<s>${txtCntnt}</s>`;

                                if (!del_scanned_copies.hasOwnProperty(value[0])) {
                                    del_scanned_copies[value[0]] = value[1];
                                }
                            }
                            handleInputChkEvents(scanned_copy);
                            // window.open(`${window.location.origin}/digital_copy/${value[0]}/delete/`, '_blank');
                            
                        }); // open A link in a new tab / window 在新的窗口(标签)打开页面
                        scannedCopiesLiEl.querySelector('button[id=delScannedCopy]').setAttribute('click-event-listener', 'true');
                    }
                }
                scannedCopiesUlEl.appendChild(scannedCopiesLiEl);
            });
        }

        modalInputElAll.forEach(el => {addEventListener_to_modalInputEl(el);});
    } else {
        // modalInputElAll.forEach(el => el.disabled = false);
        modalInputElAll.forEach(el => restoreInputEl(el, true));
    }
}

function get_invoice_item_input_grp_el(ordinal) {
    const invoiceItemInputGrpEl = document.createElement('div');
    // new Map([['class', 'input-group my-1'],]).forEach((attrValue, attrKey, attrMap) => {invoiceItemInputGrpEl.setAttribute(attrKey, attrValue);});
    invoiceItemInputGrpEl.innerHTML = [
        `<div class="input-group my-1">`,
            `<label class="input-group-text" for="amount_${ordinal}">
            <span class="badge text-bg-secondary me-3">${ordinal}</span>
            amount
            </label>`,
            `<input type="number" class="form-control" id="amount_${ordinal}" aria-label="amount" required disabled 
                data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-html="true"
                data-bs-title="Tax-inclusive amount / 含税金额"
            />`,
            `<small class="" style="color: Tomato"></small>`,
            `<select class="form-selec w-auto" id="vat_${ordinal}" required disabled
                data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-html="true"
                data-bs-title="Tax rate / 税率"
            >`,
                `<option value="" selected>VAT ...</option>`,
                `<option value="6%">6</option>`,
                `<option value="11%">11</option>`,
                `<option value="13%">13</option>`,
            `</select>`,
            `<small class="" style="color: Tomato"></small>`,
            `<label class="input-group-text" for="vat_${ordinal}">%</label>`,
        `</div>`,
        `<div class="input-group my-1">`,
            `<label class="input-group-text" for="description_${ordinal}">description</label>`,
            `<input type="text" class="form-control" id="description_${ordinal}" aria-label="description" disabled
                data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-html="true"
                data-bs-title="Description / 描述"
            />`,
            `<small class="" style="color: Tomato"></small>`,
        `</div>`,
    ].join('');
    const tooltipTriggerList = invoiceItemInputGrpEl.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    invoiceItemDivRowEl.appendChild(invoiceItemInputGrpEl);
    if (!details.hasOwnProperty('status') || (details.status == 'Rej' && details.role == 'vendor')) {
        invoiceItemInputGrpEl.querySelectorAll(':disabled').forEach(el => {
            get_input_fields_ready(el);
            addEventListener_to_modalInputEl(el);
        });
    }

    return invoiceItemInputGrpEl;
}

function get_input_fields_ready(el) {
    el.disabled = false;
    modalInputElAll.includes(el) ? null : modalInputElAll.push(el);
    if (el.required) {
        inputChkResults[el.id] = el.value ? true : false;
    }
}

function addEventListener_to_modalInputEl(el) {
    if (!el.hasAttribute('blur-event-listener')) {
        el.addEventListener('blur', e => {handleInputChkEvents(e.target);});
        el.setAttribute('blur-event-listener', 'true');
    }
}

function handleInputChkEvents(inputEl, showAlert = true) {
    if (modalBtnNext.textContent == 'next') {

        const optLst = inputEl.list && inputEl.id == 'non_payroll_expense' ? nPE_lst : null;
        inputChkResults[inputEl.id] = inputChk(inputEl, optLst, null, showAlert);

        if (details.role == "vendor" && details.status == 'Rej' && 
            paymentReqModal.querySelector('#scanned_copy').value == '' && 
            details.hasOwnProperty('scanned_copies') && 
            Object.entries(details.scanned_copies).length > Object.entries(del_scanned_copies).length) {

            inputChkResults['scanned_copy'] = true;
        }
        // modalBtnNext.classList.toggle('disabled', !Object.values(inputChkResults).every((element, index, array) => {return element == true;}));
        const chk = Object.values(inputChkResults).every((element, index, array) => {return element == true;});
        if (chk) {
            modalBtnNext.disabled = false;
        } else {
            modalBtnNext.disabled = true;
        }
    }
}

function restoreInputEl(inputEl, reEnable = false) {
    if (reEnable) {
        inputEl.disabled = false;
    } else {
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => inputEl.classList.remove(m));
        inputEl.disabled = true;
        inputEl.nextElementSibling.textContent = '';
        // inputChkResults.get(`${el.id}`) == modalInputTag ? el.classList.add('border-success') : null;
    }
}