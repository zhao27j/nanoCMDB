import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';
import { inputChk } from './inputChk.js';

'use strict'

const configCUDModal = document.querySelector('#configCUDModal');
const configCUDModalInstance = bootstrap.Modal.getOrCreateInstance('#configCUDModal');

let pK, crud, configClass_lst, configPara_lst, details, digital_copies, sub_configs, inputChkResults = {}, instanceSelectedEl;

document.addEventListener('dblclick', e => { // listerning all Double Click events on the Document
    const dblClickedEl = e.target.closest('tr') ? e.target.closest('tr').querySelector("input.form-check-input[type='checkbox'][role='switch'][name='config_is_active']") : false;
    if (dblClickedEl && dblClickedEl.checked && !dblClickedEl.disabled) {
        pK = [];
        pK.push(dblClickedEl.value); // config DB instance pk
        configCUDModalInstance.show();
    } else if (dblClickedEl && !dblClickedEl.checked) {
        baseMessagesAlert("deactivated Config can NOT be updated", 'danger');
    }
});

configCUDModal.addEventListener('shown.bs.modal', (e) => {
    if (e.relatedTarget) {
        crud = e.relatedTarget.name // create_Config, create_Sub_Config
        getDetailsAsync(window.location.origin + `/json_response/config_getLst/`);
        pK = [];
        if (e.relatedTarget.id) {
            pK.push(e.relatedTarget.id); // assets or config DB instance pk
        } else {
            instanceSelectedEl = document.querySelectorAll("td > input[type='checkbox']:checked");
            if (instanceSelectedEl.length > 0) {
                instanceSelectedEl.forEach(i => {pK.push(i.value);});
            }
        }
    } else {
        crud = 'update_Config';
        getDetailsAsync(window.location.origin + `/json_response/config_getLst/?pK=${pK[0]}`);
    }

    async function getDetailsAsync(getUri) {
        try {
            const json = await getJsonResponseApiData(getUri);
            if (json) {
                configClass_lst = json[0];
                configPara_lst = json[1];
                details = json[2];
                digital_copies = json[3];
                sub_configs = json[4];

                if (pK.length > 0) {
                    modalInit(e)
                } else {
                    baseMessagesAlert(`no IT Assets is selected`, 'warning');
                    configCUDModalInstance.hide();
                }
            } else {
                baseMessagesAlert("the data for Config is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
});

// const modalLabel = configCUDModal.querySelector('#modalLabel');

function modalInit(e, full = true) {
    const configClass = configCUDModal.querySelector('#configClass');
    const order = configCUDModal.querySelector('#order');
    const configPara = configCUDModal.querySelector('#configPara');
    const is_secret = configCUDModal.querySelector('#is_secret');
    const comments = configCUDModal.querySelector('#comments');
    const scanned_copy = configCUDModal.querySelector('#scanned_copy');
    if (full) {
        configClass.value = details[configClass.id] ? details[configClass.id] : '';
    
        const configClassDatalist = configCUDModal.querySelector('#configClassDatalist');
        configClassDatalist.innerHTML = ''
        Object.keys(configClass_lst).forEach(key => {
            const dataListOpt = document.createElement('option');
            dataListOpt.textContent = key;
            configClassDatalist.appendChild(dataListOpt);
        });

        order.value = details[order.id] ? details[order.id] : '';
        configPara.value = details[configPara.id] ? details[configPara.id] : '';
        is_secret.checked = details[is_secret.id];
        configPara.type = is_secret.checked == true ? 'password' : 'text';
        comments.value = details[comments.id] ? details[comments.id] : '';
        scanned_copy.classList.toggle('hidden', crud.includes('Sub'));
        scanned_copy.value = '';
    }

    is_secret.addEventListener('change', e => {configPara.type = is_secret.checked == true ? 'password' : 'text';});

    configPara.addEventListener('focus', e => {
        if (configClass.value in configClass_lst) {
            const configParaDatalist = configCUDModal.querySelector('#configParaDatalist');
            configParaDatalist.innerHTML = ''
            Object.keys(configPara_lst[configClass.value]).forEach(key => {
                const dataListOpt = document.createElement('option');
                dataListOpt.textContent = key;
                configParaDatalist.appendChild(dataListOpt);
            });
        }
    });

    configCUDModal.querySelector('#modalLabel').textContent = crud.replaceAll('_', ' '); // create Config, create Sub Config, update Config
    configClass.focus();
    modalBtnNext.textContent = 'next';
    modalBtnSubmit.classList.add('hidden');  // modalBtnSubmit.style.display = 'none';

    modalInputElAll.forEach(modalInputEl => {
        modalInputEl.disabled = crud == 'deleteConfig' ? true : false;
        ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
        modalInputEl.nextElementSibling.textContent = '';
        // inputChkResults.get(`${modalInputEl.id}`) == modalInputTag ? modalInputEl.classList.add('border-success') : null;
    });

    const digitalCopiesUlEl = configCUDModal.querySelector('ul');
    digitalCopiesUlEl.textContent = "";

    const subConfigDivEl = configCUDModal.querySelector('#sub_configs');
    subConfigDivEl.innerHTML = '';

    inputChkResults = {
        // 'configClass': configClass.value ? true : false,
        // 'configPara': configPara.value ? true : false,
        // 'scanned_copy': false,
    };

    if (!crud.includes('create')) {
        configClass.disabled = true;
        configPara.focus();

        Object.entries(digital_copies).forEach((value, key, map) => {
            const digitalCopiesLiEl = document.createElement('li');
            
            digitalCopiesLiEl.classList.add('text-break');
            // digitalCopiesLiEl.textContent = value;
            digitalCopiesLiEl.innerHTML = crud == 'deleteConfig' ? value : [
                // `<a href="${window.location.origin}/digital_copy/${value[0]}/display/" class="text-decoration-none" role="button" target="_blank">${value[1]}</a>`,
                `<button type="button" id="digitalCopyDisplayBtn" class="btn btn-link text-decoration-none">${value[1]}</button>`,
                // `<a href="${window.location.origin}/digital_copy/${value[0]}/delete/" class="text-decoration-none" role="button">`,
                `<button type="button" id="digitalCopyDeleteBtn" class="btn btn-link text-decoration-none">`,
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">`,
                    `<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>`,
                    `</svg>`,
                `</button>`,
                // `</a>`,
            ].join('');
            digitalCopiesLiEl.querySelector('button[id=digitalCopyDisplayBtn]').addEventListener('click', e => {window.open(`${window.location.origin}/digital_copy/${value[0]}/display/`, '_blank');});
            digitalCopiesLiEl.querySelector('button[id=digitalCopyDeleteBtn]').addEventListener('click', e => {window.open(`${window.location.origin}/digital_copy/${value[0]}/delete/`, '_blank');});
            digitalCopiesUlEl.appendChild(digitalCopiesLiEl);
        });

        if (Object.values(sub_configs).length) {
            subConfigDivEl.innerHTML = [
                `<div class="accordion accordion-flush" id="accordionFlushExample">`,
                    `<div class="accordion-item">`,
                        `<h2 class="accordion-header">`,
                            `<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-subConfigs" aria-expanded="false" aria-controls="flush-subConfigs">`,
                                `<b><small>sub Config<small></b>`,
                            `</button>`,
                        `</h2>`,
                        `<div id="flush-subConfigs" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">`,
                            `<div class="accordion-body"></div>`,
                        `</div>`,
                    `</div>`,
                `</div>`,
            ].join('');
            const accordionBodyEl = subConfigDivEl.querySelector('.accordion-body');
            const table = document.createElement('table');
            ['table', 'table-striped', 'table-hover', 'fw-light'].forEach(clsItm => table.classList.add(clsItm));
            table.appendChild(document.createElement('thead'));
            table.querySelector('thead').appendChild(document.createElement('tr'));
            ['', 'class', 'Para', 'by', 'modified', ].forEach(th_txt => {
                const th = document.createElement('th');
                th.innerHTML = `<small>${th_txt}</small>`;
                table.querySelector('thead tr').appendChild(th);
            });
            table.appendChild(document.createElement('tbody'));
            Object.entries(sub_configs).forEach((value, key, map) => {
                const tr = document.createElement('tr');
                ['is_active', 'configClass', 'configPara', 'by', 'on', ].forEach(td_txt => {
                    const td = document.createElement('td');
                    switch (td_txt) {
                        case 'is_active':
                            const checkbox = document.createElement('input');
                            new Map([
                                ['class', 'form-check-input'],
                                ['type', 'checkbox'],
                                ['role', 'switch'],
                                ['name', `config_${td_txt}`],
                                ['id', ``],
                                ['value', `${value[0]}`],
                                // ['checked', value[1][td_txt] ? true : false],
                            ]).forEach((attrValue, attrKey, attrMap) => {
                                checkbox.setAttribute(attrKey, attrValue);
                            });
                            checkbox.checked = value[1][td_txt];

                            td.innerHTML = `<small><div class="form-check form-switch"></div></small>`
                            td.querySelector('small div').appendChild(checkbox);
                            break;
                        case 'configPara':
                            td.innerHTML = value[1]['is_secret'] == true ? '<small>X X X X X X X X</small>' : `<small>${value[1][td_txt]}</small>`;
                            td.querySelector('small').addEventListener('mouseover', e => {e.target.innerText = value[1][td_txt];});
                            td.querySelector('small').addEventListener('mouseleave', e => {e.target.innerText = 'X X X X X X X X';});
                            break;
                        default:
                            td.innerHTML = `<small>${value[1][td_txt]}</small>`;
                            break;
                    }
                    tr.appendChild(td);
                });
                table.querySelector('tbody').appendChild(tr);
            });
            accordionBodyEl.appendChild(table);
        }
    }
}

const inputElAll = Array.from(configCUDModal.querySelector('.modal-body').querySelectorAll('input'));
const modalInputElAll = inputElAll.concat(Array.from(configCUDModal.querySelector('.modal-body').querySelectorAll('textarea')))
const modalBtnNext = configCUDModal.querySelector('#modalBtnNext');
const modalBtnSubmit = configCUDModal.querySelector('#modalBtnSubmit');

let if_some_required_input_is_false, if_all_required_input_is_noChg;

modalInputElAll.forEach(inputEl => inputEl.addEventListener('blur', e => { // Input validation on leaving each of Input elements 在离开每个输入元素时进行输入验证
    const optLst = e.target.list && e.target.id == 'configClass' ? configClass_lst : null;
    inputChkResults[e.target.id] = inputChk(e.target, optLst, details[e.target.id] ? details[e.target.id] : '');
    if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
    if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
    // const if_all_required_input_is_noChg =  (inputChkResults.configClass == 'noChg' && inputChkResults.configPara == 'noChg') ? true : false;
    modalBtnNext.classList.toggle('disabled', if_some_required_input_is_false || if_all_required_input_is_noChg);
}));

/*
modalBtnNext.addEventListener('focus', e => {modalInputElAll.forEach(inputEl => { // Input validation when Next button gets focus 在Next按钮获得焦点时进行输入验证
    const optLst = inputEl.list && inputEl.id == 'configClass' ? configClass_lst : null;
    inputChkResults[inputEl.id] = inputChk(inputEl, optLst, details[inputEl.id] ? details[inputEl.id] : '');
    if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
    if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
    // const if_all_required_input_is_noChg =  (inputChkResults.configClass == 'noChg' && inputChkResults.configPara == 'noChg') ? true : false;
    modalBtnNext.classList.toggle('disabled', crud != 'deleteConfig' && (if_some_required_input_is_false || if_all_required_input_is_noChg));
});});
*/

modalBtnNext.addEventListener('click', e => {
    modalInputElAll.forEach(inputEl => { // Input validation when Next button gets focus 在Next按钮获得焦点时进行输入验证
        const optLst = inputEl.list && inputEl.id == 'configClass' ? configClass_lst : null;
        inputChkResults[inputEl.id] = inputChk(inputEl, optLst, details[inputEl.id] ? details[inputEl.id] : '');
        if_some_required_input_is_false = Object.values(inputChkResults).some((element, index, array) => {return element == false;});
        if_all_required_input_is_noChg = Object.values(inputChkResults).every((element, index, array) => {return element == 'noChg';});
        // const if_all_required_input_is_noChg =  (inputChkResults.configClass == 'noChg' && inputChkResults.configPara == 'noChg') ? true : false;
        modalBtnNext.classList.toggle('disabled', crud != 'deleteConfig' && (if_some_required_input_is_false || if_all_required_input_is_noChg));
    });

    if (e.target.textContent == 'next'){
        if (!(crud != 'deleteConfig' && (if_some_required_input_is_false || if_all_required_input_is_noChg))) {
            configCUDModal.querySelector('#modalLabel').textContent = 'review & confirm';
            modalInputElAll.forEach(modalInputEl => {
                ['text-danger', 'border-bottom', 'border-danger', 'border-success'].forEach(m => modalInputEl.classList.remove(m));
                modalInputEl.disabled = true;
                modalInputEl.nextElementSibling.textContent = '';
                // inputChkResults.get(`${modalInputEl.id}`) == modalInputTag ? modalInputEl.classList.add('border-success') : null;
            });
            configCUDModal.querySelector('ul').querySelectorAll('button').forEach(modalDigitalCopyEl => {modalDigitalCopyEl.disabled = true;}); // disable all Btn under UL 禁用UL下所有按钮
            if (configCUDModal.querySelector('div[id=flush-subConfigs]')) {
                configCUDModal.querySelector('div[id=flush-subConfigs]').querySelectorAll('input').forEach(subConfigSwitcherEl => {
                    subConfigSwitcherEl.disabled = true;
                })
            }
            e.target.textContent = 'back';
            modalBtnSubmit.classList.remove('hidden');  // modalBtnSubmit.style.display = '';
        }
    } else if (e.target.textContent == 'back') {modalInit(e, false);}
})

modalBtnSubmit.addEventListener('click', e => {
    const postUpdUri = window.location.origin + '/config/cud/';
    const csrftoken = configCUDModal.querySelector('[name=csrfmiddlewaretoken]').value; // get csrftoken

    const formData = new FormData();
    formData.append('crud', crud);
    formData.append('pk', pK);
    // formData.append('comments', comments.value);
    
    modalInputElAll.forEach(inputEl => {
        if (inputEl.type == 'file') {
            for (let i = 0; i < inputEl.files.length; i++) {
                formData.append('scanned_copy', inputEl.files[i]);
            }
        } else if (inputEl.type == 'checkbox') {
            formData.append(inputEl.id, inputEl.checked  ? true : false);
        } else {
            formData.append(inputEl.id, inputEl.value);
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

