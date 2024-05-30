import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

if (document.querySelector('#dropdownItemPlaceholderForSupportedPlusInstanceList')) {
    const dropdownItemBtn = document.createElement('button');
    new Map([
        ['class', 'dropdown-item'],
        ['type', 'button'],
        ['disabled', 'true'],
    ]).forEach((attrValue, attrKey, attrMap) => {
        dropdownItemBtn.setAttribute(attrKey, attrValue);
    });
    dropdownItemBtn.innerHTML = [
        `<span role="status"><small>Supported + </small></span>`,
        `<span class="spinner-border spinner-border-sm text-secondary" aria-hidden="true"></span>`,
    ].join('');

    document.querySelector('#dropdownItemPlaceholderForSupportedPlusInstanceList').appendChild(dropdownItemBtn);

    getAllInstanceLstAsync(dropdownItemBtn);
}

async function getAllInstanceLstAsync(dropdownItemBtn) {
    let instance_lst, owner_lst, status_lst, model_type_lst, sub_category_lst, manufacturer_lst, branchSite_lst, contract_lst;
    let classLst, classBy;

    const getUri = window.location.origin + '/json_response/instance_lst/';
    try {
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            instance_lst = new Map(Object.entries(json[0]));
            status_lst = new Map(Object.entries(json[1]));
            model_type_lst = new Map(Object.entries(json[2]));
            sub_category_lst = new Map(Object.entries(json[3]));
            manufacturer_lst = new Map(Object.entries(json[4]));
            branchSite_lst = new Map(Object.entries(json[5]));
            contract_lst = new Map(Object.entries(json[6]));

            dropdownItemBtn.disabled = false;
            dropdownItemBtn.querySelector('span.spinner-border').remove();

            const grpBy = new Map([
                ['status', status_lst],
                ['sub_category', sub_category_lst],
                ['model_type', model_type_lst],
                ['branchSite', branchSite_lst],
            ]);

            const fltrBy = new Map([
                ['status', 'BuyBack'],
                // ['placeholderSubkey2', 'placeholderValue2'],
            ]);

            const byMenuItmLst = new Map();
            byMenuItmLst.set('grouped by', grpBy);
            byMenuItmLst.set('filtered by', fltrBy);

            dropdownItemBtn.addEventListener('click', event => {
                const clckEvntTrgts = twoTiersdropdownMenuBldr(event, byMenuItmLst);
                clckEvntTrgts.forEach((trgtValue, trgtKey, trgtMap) => {

                    trgtKey.addEventListener('click', e => {
                        accordionFlush.innerHTML = '';
                        const keyWord = e.target.id ? e.target.id : e.target.closest('*[id]').id;
                        let fltrdLst;
                        if (trgtValue == 'filtered by') {
                            fltrdLst = lstFltr(instance_lst, byMenuItmLst.get(trgtValue).get(keyWord));
                            //fltrdLst = lstFltr(new Map(JSON.parse(JSON.stringify([...instance_lst]))), byMenuItmLst.get(trgtValue).get(keyWord));

                            classLst.forEach((classValue, classKey, classMap) => {
                                reLst(accordionFlush, fltrdLst, classBy, classKey);
                            });
                        } else if (trgtValue == 'grouped by') {
                            classBy = keyWord;
                            classLst = byMenuItmLst.get(trgtValue).get(keyWord);
                            classLst.forEach((classValue, classKey, classMap) => {
                                reLst(accordionFlush, instance_lst, classBy, classKey, );
                            });
                            // byMenuItmLst.get(trgtValue).get(keyWord).forEach((lstValue, lstKey, lstMap) => {reLst(accordionFlush, instance_lst, keyWord, lstKey)});
                        }
                        baseMessagesAlert(`${trgtValue} ${e.target.textContent}`, 'success');
                    });
                })
                
                const pgCntnt = document.querySelector('div#page_content');
                pgCntnt.innerHTML = '<h3 class="m-3">Supported IT Assets</h3>';

                const accordionFlush = document.createElement('div');
                ['accordion', 'accordion-flush'].forEach(classItm => accordionFlush.classList.add(classItm));
                accordionFlush.id = "accordionFlush";
                pgCntnt.appendChild(accordionFlush);

                if (sub_category_lst) {
                    classBy = 'sub_category';
                    classLst = sub_category_lst;
                    classLst.forEach((classValue, classKey, classMap) => {
                        reLst(accordionFlush, instance_lst, classBy, classKey);
                    });
                    baseMessagesAlert('grouped by Sub category', 'success');
                }
            });

            // baseMessagesAlert('the data for supported + is ready', 'success');
        } else {
            baseMessagesAlert("the data for supported + is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

function lstFltr(lst, fltrKeyWord) {
    const lstDeepCopy = new Map(JSON.parse(JSON.stringify([...lst])))
    // const lstObjAssigned = new Map([...lst]);
    lstDeepCopy.forEach((lstValue, lstKey, lstMap) => {
        // if ([...lstValue.values()].includes(fltrKeyWord)) {
        if (Object.values(lstValue).includes(fltrKeyWord)) {
            lstValue.is_list = false;
        }   
    })
    return lstDeepCopy;
}

function twoTiersdropdownMenuBldr(e, dropdownItmLst) {
    const clckEvntTrgts = new Map();

    const tier1Btn = e.target.closest('button');
    new Map([
        ['class', 'dropdown-item dropdown-toggle'],
        ['type', 'button'],
        ['data-bs-toggle', 'dropdown'],
        ['aria-expanded', 'false'],
    ]).forEach((attrValue, attrKey, attrMap) => {
        tier1Btn.setAttribute(attrKey, attrValue);   // tier1Btn.innerHTML = `<small>Supported +</small>`;
    });

    const tier1BtnGrp = document.createElement('div');
    ['btn-group', 'dropend', ].forEach(classItm => tier1BtnGrp.classList.add(classItm));

    tier1Btn.parentNode.replaceChild(tier1BtnGrp, tier1Btn);
    tier1BtnGrp.appendChild(tier1Btn);

    const tier1BtnUl = document.createElement('ul');
    tier1BtnUl.classList.add('dropdown-menu');
    tier1BtnGrp.appendChild(tier1BtnUl);

    dropdownItmLst.forEach((dropdownItmValue, dropdownItmKey, dropdownItmMap) => {
        const tier1BtnUlLi = document.createElement('li');
        tier1BtnUl.appendChild(tier1BtnUlLi);
        const tier2BtnGrp = document.createElement('div');
        ['btn-group', 'dropend', ].forEach(classItm => tier2BtnGrp.classList.add(classItm));
        tier1BtnUlLi.appendChild(tier2BtnGrp);

        const tier2Btn = document.createElement('button');
        new Map([
            ['class', 'dropdown-item dropdown-toggle'],
            ['type', 'button'],
            ['data-bs-toggle', 'dropdown'],
            ['aria-expanded', 'false'],
        ]).forEach((attrValue, attrKey, attrMap) => {
            tier2Btn.setAttribute(attrKey, attrValue);
            tier2Btn.innerHTML = `<small>${dropdownItmKey}</small>`
        });
        tier2BtnGrp.appendChild(tier2Btn);

        const tier2BtnUl = document.createElement('ul');
        tier2BtnUl.classList.add('dropdown-menu');
        tier2BtnGrp.appendChild(tier2BtnUl);

        dropdownItmValue.forEach((value, key, map) => {
            const tier2BtnUlLi = document.createElement('li');
            tier2BtnUl.appendChild(tier2BtnUlLi);
            const tier2BtnUlLiHref = document.createElement('a');
            new Map([
                ['class', "dropdown-item"],
                ['href', "#"],
                ['id', key],    // ['name', dropdownItmKey],
            ]).forEach((attrValue, attrKey, attrMap) => {
                tier2BtnUlLiHref.setAttribute(attrKey, attrValue);
                tier2BtnUlLiHref.innerHTML = `<small>${key.replaceAll('_', ' ')}</small>`
            });
            tier2BtnUlLi.appendChild(tier2BtnUlLiHref);

            clckEvntTrgts.set(tier2BtnUlLiHref, dropdownItmKey);
        })

        const tier1BtnInstance = bootstrap.Dropdown.getOrCreateInstance(tier1Btn);
        tier1Btn.addEventListener('mouseover', e => {tier1BtnInstance.show();});
        tier1BtnUl.addEventListener('mouseleave', e => {setTimeout(() => { tier1BtnInstance.hide();}, 300);})

        const tier2BtnInstance = bootstrap.Dropdown.getOrCreateInstance(tier2Btn);
        tier2Btn.addEventListener('mouseover', e => {tier2BtnInstance.show();});
        tier1BtnUlLi.addEventListener('mouseleave', e => {setTimeout(() => { tier2BtnInstance.hide();}, 300);});

        tier2BtnUl.addEventListener('mouseleave', e => {setTimeout(() => { tier1BtnInstance.hide();}, 300);});

        // tier2BtnGrp.addEventListener('mouseleave', e => {setTimeout(() => { tier2BtnInstance.hide();}, 300);});
    })
    return clckEvntTrgts;
}

function reLst(accordion, lst, by, byTg) {

    const table = document.createElement('table');
    ['table', 'table-striped', 'table-hover', 'fw-light'].forEach(classItem => table.classList.add(classItem));

    table.appendChild(document.createElement('thead'));
    table.querySelector('thead').appendChild(document.createElement('tr'));
    ['', 'Serial #', '', 'Model / Type', 'Hostname', 'Status', 'Owner', 'Site', 'Contract', ].forEach(th_txt => {
        const th = document.createElement('th');
        th.innerHTML = `<small>${th_txt}</small>`;
        table.querySelector('thead tr').appendChild(th);
    })

    table.appendChild(document.createElement('tbody'));
    let num = 0, numOfAvailable = 0, numOfRepair = 0;
    lst.forEach((lstValue, lstKey, map) => {
        if (lstValue[by] == byTg && lstValue.is_list) { // the keyword grouping by
            const tr = document.createElement('tr');
            ['instance', 'serial_number', 'inRepair', 'model_type', 'hostname', 'status', 'owner', 'branchSite', 'contract', ].forEach(td_txt => {
                const td = document.createElement('td');
                switch (td_txt) {
                    case 'instance':
                        const checkbox = document.createElement('input');
                        new Map([
                            ['type', 'checkbox'],
                            ['name', `${td_txt}`],
                            ['id', `Instance${lstKey}`],
                            ['value', `${lstKey}`],
                        ]).forEach((attrValue, attrKey, attrMap) => {
                            checkbox.setAttribute(attrKey, attrValue);
                        })
                        td.appendChild(checkbox);
                        break;
                    case 'serial_number':
                        const serial_numberLbl = document.createElement('label');
                        serial_numberLbl.setAttribute('for', `Instance${lstKey}`);
                        const serial_numberHref = document.createElement('a');
                        new Map([
                            // ['href', `${window.location.origin}/instance/${lstKey}/detail/`],
                            ['class', 'text-decoration-none'],
                        ]).forEach((attrValue, attrKey, attrMap) => {
                            serial_numberHref.setAttribute(attrKey, attrValue);
                        })
                        serial_numberHref.innerHTML = `<small>${lstValue[td_txt]}</small>`
                        serial_numberHref.addEventListener('click', e => {window.open(`${window.location.origin}/instance/${lstKey}/detail/`, '_blank');});
                        serial_numberLbl.appendChild(serial_numberHref);
                        td.appendChild(serial_numberLbl);
                        break;
                    case 'inRepair':
                        td.id = `${td_txt}Instance${lstKey}`;
                        if (lstValue['status'] == 'in Repair') {
                            td.innerHTML = [
                                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-exclamation" viewBox="0 0 16 16">`,
                                    `<path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855a.75.75 0 0 0-.124 1.329l4.995 3.178 1.531 2.406a.5.5 0 0 0 .844-.536L6.637 10.07l7.494-7.494-1.895 4.738a.5.5 0 1 0 .928.372l2.8-7Zm-2.54 1.183L5.93 9.363 1.591 6.602l11.833-4.733Z"></path>`,
                                    `<path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1.5a.5.5 0 0 1-1 0V11a.5.5 0 0 1 1 0Zm0 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>`,
                                `</svg>`,
                            ].join('');
                        } else if (lstValue['status'] == 'Available' || lstValue['status'] == 'in Use') {
                            td.innerHTML = [
                                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-wrench-adjustable" viewBox="0 0 16 16">`,
                                    `<path d="M16 4.5a4.492 4.492 0 0 1-1.703 3.526L13 5l2.959-1.11c.027.2.041.403.041.61Z"/>`,
                                    `<path d="M11.5 9c.653 0 1.273-.139 1.833-.39L12 5.5 11 3l3.826-1.53A4.5 4.5 0 0 0 7.29 6.092l-6.116 5.096a2.583 2.583 0 1 0 3.638 3.638L9.908 8.71A4.49 4.49 0 0 0 11.5 9Zm-1.292-4.361-.596.893.809-.27a.25.25 0 0 1 .287.377l-.596.893.809-.27.158.475-1.5.5a.25.25 0 0 1-.287-.376l.596-.893-.809.27a.25.25 0 0 1-.287-.377l.596-.893-.809.27-.158-.475 1.5-.5a.25.25 0 0 1 .287.376ZM3 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>`,
                                `</svg>`,
                            ].join('');
                        }
                        break;
                    case 'status':
                        td.id = `${td_txt}Instance${lstKey}`;
                        td.innerHTML = `<small>${lstValue[td_txt]}</small>`;
                        if (lstValue['disposal_request']) {
                            td.innerHTML += [
                                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-recycle ms-3" viewBox="0 0 16 16">`,
                                   `<path d="M9.302 1.256a1.5 1.5 0 0 0-2.604 0l-1.704 2.98a.5.5 0 0 0 .869.497l1.703-2.981a.5.5 0 0 1 .868 0l2.54 4.444-1.256-.337a.5.5 0 1 0-.26.966l2.415.647a.5.5 0 0 0 .613-.353l.647-2.415a.5.5 0 1 0-.966-.259l-.333 1.242-2.532-4.431zM2.973 7.773l-1.255.337a.5.5 0 1 1-.26-.966l2.416-.647a.5.5 0 0 1 .612.353l.647 2.415a.5.5 0 0 1-.966.259l-.333-1.242-2.545 4.454a.5.5 0 0 0 .434.748H5a.5.5 0 0 1 0 1H1.723A1.5 1.5 0 0 1 .421 12.24l2.552-4.467zm10.89 1.463a.5.5 0 1 0-.868.496l1.716 3.004a.5.5 0 0 1-.434.748h-5.57l.647-.646a.5.5 0 1 0-.708-.707l-1.5 1.5a.498.498 0 0 0 0 .707l1.5 1.5a.5.5 0 1 0 .708-.707l-.647-.647h5.57a1.5 1.5 0 0 0 1.302-2.244l-1.716-3.004z"/>`,
                                `</svg>`,
                            ].join('');
                        }
                        lstValue[td_txt] == 'Available' ? numOfAvailable++ : lstValue[td_txt] == 'in Repair' ? numOfRepair++ : null;
                        break;
                    case 'contract':
                        td.id = `${td_txt}Instance${lstKey}`;
                        if (lstValue[td_txt] == '') {
                            td.innerHTML = `<small>${lstValue[td_txt]}</small>`;
                        } else if (typeof lstValue[td_txt] === 'object') {
                            const contractHREF = document.createElement('a');
                            new Map([
                                // ['href', `${window.location.origin}/${td_txt}/${k}/detail/`],
                                // ['href', `${window.location.origin}${lstValue[td_txt]['get_absolute_url']}`],
                                ['class', 'text-decoration-none'],
                                ['data-bs-toggle', 'tooltip'],
                                ['data-bs-placement', 'top'],
                                ['data-bs-html', 'true'],
                                ['data-bs-title', `<small>${lstValue[td_txt]['get_type_display']}</small>`],
                            ]).forEach((attrValue, attrKey, attrMap) => {
                                contractHREF.setAttribute(attrKey, attrValue);
                            })
                            if (lstValue[td_txt]['get_time_remaining_in_percent'] == 'pay-as-you-go') {
                                contractHREF.innerHTML = `<small>pay-as-you-go</small>`
                            } else {
                                contractHREF.innerHTML = [
                                    `<div class="progress" role="progressbar" aria-label="Info example" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">`,
                                        `<div class="progress-bar bg-info" style="width: ${lstValue[td_txt]['get_time_remaining_in_percent']}%">${lstValue[td_txt]['get_time_remaining_in_percent']}%</div>`,
                                    `</div>`,
                                ].join('');
                            }
                            contractHREF.addEventListener('click', e => {window.open(`${window.location.origin}${lstValue[td_txt]['get_absolute_url']}`, '_blank');});
                            td.appendChild(contractHREF);

                            lstValue[td_txt]['get_time_remaining_in_percent'] <= 0 ? contractHREF.querySelector('div.progress div.progress-bar').classList.replace('bg-info', 'bg-danger') : null;

                            for (var k in lstValue[td_txt]) {
                            // Object.keys(lstValue[td_txt]).forEach(k => {    
                            }
                        }
                        break;
                    default:
                        td.id = `${td_txt}Instance${lstKey}`;
                        td.innerHTML = `<small>${lstValue[td_txt]}</small>`;
                        break;
                }
                tr.appendChild(td);
            })
            table.querySelector('tbody').appendChild(tr);
            num++;
        }
    })
    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');
    accordionItem.innerHTML = [
        `<h2 class="accordion-header">`,
            `<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${byTg.replaceAll(' ', '_')}" aria-expanded="false" aria-controls="${byTg.replaceAll(' ', '_')}">`,
                `<small>`,
                    `<span class="badge rounded-pill text-bg-light ms-3">${byTg.replaceAll('_', ' ')}</span>`,
                    `<span class="badge rounded-pill text-bg-secondary ms-3">${num}</span>`,
                `</small>`,
            `</button>`,
        `</h2>`,
        `<div id="${byTg.replaceAll(' ', '_')}" class="accordion-collapse collapse" data-bs-parent="#${accordion.id}">`,
            `<div class="accordion-body"></div>`,
        `</div>`,
    ].join('');

    const btnInnerHTMLSmallEl = accordionItem.querySelector('small');
    if (numOfAvailable != 0) {btnInnerHTMLSmallEl.innerHTML += [`<span class="badge rounded-pill text-bg-warning ms-3">${numOfAvailable}</span>`,].join('');}
    if (numOfRepair != 0) {btnInnerHTMLSmallEl.innerHTML += [`<span class="badge rounded-pill text-bg-danger ms-3">${numOfRepair}</span>`,].join('');}

    accordionItem.querySelector('div.accordion-body').appendChild(table);
    accordion.appendChild(accordionItem);

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}