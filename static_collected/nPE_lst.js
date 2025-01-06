import { getJsonResponseApiData } from '../../static/getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from '../../static/baseMessagesAlert.js';

'use strict'


if (document.querySelector('#placeholder_nPE_lst')) {
/*
    if (document.querySelector('#dropdownItemPlaceholder_nPE_lst').hasChildNodes()) {
        iniLst(budgetYr);
    } else {
*/
    /*
        const topBarMenuNPEBtn = document.createElement('button');
        new Map([
            ['class', 'dropdown-item'],
            ['type', 'button'],
            ['disabled', 'true'],
        ]).forEach((attrValue, attrKey, attrMap) => {
            topBarMenuNPEBtn.setAttribute(attrKey, attrValue);
        });
        topBarMenuNPEBtn.innerHTML = [
            `<span role="status"><small>Payment Calendar </small></span>`,
            `<span class="spinner-border spinner-border-sm text-secondary" aria-hidden="true"></span>`,
        ].join('');

        document.querySelector('#dropdownItemPlaceholder_nPE_lst').appendChild(topBarMenuNPEBtn);
        topBarMenuNPEBtn.addEventListener('click', e => iniLst(budgetYr));
    */
        const date = new Date();
        const budgetYr = date.getFullYear();
        get_nPE_lst_async(budgetYr);
    /*
        get_nPE_lst_async(budgetYr, topBarMenuNPEBtn);
    }
    */
}

let reforecasting, nPE_lst, budgetYr_lst, reforecasting_lst, allocation_lst, currency_lst, isDirectCost_lst
async function get_nPE_lst_async(budgetYr, topBarMenuNPEBtn = null) {
    try {
        const getUri = window.location.origin + `/json_respone/nonPayrollExpense_getLst/?budgetYr=${budgetYr}`;
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            reforecasting = json[0];
            budgetYr_lst = json[1];
            nPE_lst = new Map(Object.entries(json[2]));
            reforecasting_lst = new Map(Object.entries(json[3]));
            allocation_lst = new Map(Object.entries(json[4]));
            currency_lst = new Map(Object.entries(json[5]));
            isDirectCost_lst = new Map(Object.entries(json[6]));

            // baseMessagesAlert("the data for non Payroll Expense is ready", 'success');

            if (topBarMenuNPEBtn) {
                topBarMenuNPEBtn.disabled = false;
                topBarMenuNPEBtn.querySelector('span.spinner-border').remove();
            } else {
                iniLst(budgetYr);
            }
        } else {
            baseMessagesAlert("the data for non Payroll Expense is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

function iniLst(budgetYr) {
    const pgCntnt = document.querySelector('div#page_content');
    pgCntnt.innerHTML = [
        `<span class="fs-3 m-3">`,
            `non Payroll Expenses in `,
            `<div class="btn-group" role="group" aria-label="Button group with nested dropdown">`,
                `<div class="btn-group" role="group">`,
                    `<button type="button" class="btn btn-link position-relative dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">`,
                        `${budgetYr}`,
                        `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">`,
                            `${reforecasting}`,
                        `</span>`,
                    `</button>`,
                    `<ul class="dropdown-menu" style=""></ul>`,
                `</div>`,
            `</div>`,
        `</span>`,
    ].join('');

    const budgetYrdropdownMenuUl = pgCntnt.querySelector('ul.dropdown-menu');
    budgetYr_lst.forEach((yr) => {
        if (yr != budgetYr) {
            budgetYrdropdownMenuUl.innerHTML += `<li><a class="dropdown-item" href="#">${yr}</a></li>`;
            budgetYrdropdownMenuUl.querySelector('li:last-child').addEventListener('click', e => {get_nPE_lst_async(e.target.innerText);});
        }
    });

    const budgetYrDropdownToggle = pgCntnt.querySelector('button.btn.btn-link.position-relative.dropdown-toggle');
    const budgetYrDropdownToggleInstance = bootstrap.Dropdown.getOrCreateInstance(budgetYrDropdownToggle);
    budgetYrDropdownToggle.addEventListener('mouseover', e => {budgetYrDropdownToggleInstance.show();});
    budgetYrdropdownMenuUl.addEventListener('mouseleave', e => {setTimeout(() => { budgetYrDropdownToggleInstance.hide();}, 100);})

    const accordionFlush = document.createElement('div');
    ['accordion', 'accordion-flush'].forEach(classItm => accordionFlush.classList.add(classItm));
    accordionFlush.id = "accordionFlush";
    pgCntnt.appendChild(accordionFlush);

    const ths = ['', 'Description', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', ];
    const tds = ['nPEs', 'description', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', ];
    // reLst(accordionFlush, nPE_lst, ths, tds);

    if (allocation_lst) {
        // classBy = 'allocation';
        // classLst = allocation_lst;
        allocation_lst.forEach((classValue, classKey, classMap) => {
            reLst(accordionFlush, nPE_lst, ths, tds, 'allocation', classKey);
        });
        baseMessagesAlert('grouped by Allocation', 'success');
    }
}

function reLst(accordion, lst, ths, tds, by = '', byTg = '') {
    const table = document.createElement('table');
    ['table', 'table-striped', 'table-hover', 'fw-light', 'sticky', 'sticky-x'].forEach(classItem => table.classList.add(classItem));

    table.appendChild(document.createElement('thead'));
    table.querySelector('thead').appendChild(document.createElement('tr'));
    ths.forEach(th_txt => {
        const th = document.createElement('th');
        th.innerHTML = `<small>${th_txt}</small>`;
        table.querySelector('thead tr').appendChild(th);
    })

    table.appendChild(document.createElement('tbody'));
    let num = 0, numOfAvailable = 0, numOfRepair = 0;
    lst.forEach((lstValue, lstKey, map) => {
        if (lstValue[by].toLowerCase() == byTg.toLowerCase() && lstValue.is_list) { // the keyword grouping by
            const tr = document.createElement('tr');

            tds.forEach(td_txt => {
                const td = document.createElement('td');
                switch (td_txt) {
                    case 'nPEs':
                        const checkbox = document.createElement('input');
                        new Map([
                            ['type', 'checkbox'],
                            ['name', `${td_txt}`],
                            ['id', `nPE${lstKey}`],
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
                            ['href', `${window.location.origin}/instance/${lstKey}/detail/`],
                            ['class', 'text-decoration-none'],
                        ]).forEach((attrValue, attrKey, attrMap) => {
                            serial_numberHref.setAttribute(attrKey, attrValue);
                        })
                        serial_numberHref.innerHTML = `<small>${lstValue[td_txt]}</small>`
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
                            for (var k in lstValue[td_txt]) {
                            // Object.keys(lstValue[td_txt]).forEach(k => {
                                const contractHREF = document.createElement('a');
                                new Map([
                                    ['href', `${window.location.origin}/${td_txt}/${k}/detail/`],
                                    ['class', 'text-decoration-none'],
                                ]).forEach((attrValue, attrKey, attrMap) => {
                                    contractHREF.setAttribute(attrKey, attrValue);
                                })
                                contractHREF.innerHTML = `<small>${lstValue[td_txt][k]}</small>`
                                td.appendChild(contractHREF);
                            }
                        }
                        break;
                    default:
                        td.id = `${td_txt}nPEs${lstKey}`;
                        if (lstValue[td_txt] instanceof Object) {
                            td.innerHTML = `<div><small>${lstValue[td_txt].budget}</small></div>`;
                            td.appendChild(document.createElement('ul'));
                            for (const [key, value] of Object.entries(lstValue[td_txt])) {
                                if (key != 'budget') {
                                    const li = document.createElement('li');
                                    li.innerHTML += `
                                        <a class="text-decoration-none ${value[1]}" href=""
                                            data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true"
                                            data-bs-title="<small>scheduled on ${value[2]}</small>"
                                        >
                                            <small>${lstValue.currency}${value[0]}</small>
                                        </a>
                                    `;
                                    li.querySelector('a').addEventListener('click', e => {window.open(`${window.location.origin}/payment_request/${key}/paper_form/`, '_blank');}); // open A link in a new tab / window 在新的窗口(标签)打开页面
                                    li.addEventListener('dblclick', e => {window.open(`${window.location.origin}/contract/${value[3]}/detail/`, '_blank');}); // open A link in a new tab / window 在新的窗口(标签)打开页面
                                    td.querySelector('ul').appendChild(li);

                                    numOfAvailable++;
                                }
                            }
                        } else {
                            td.innerHTML = `<small>${lstValue[td_txt]}</small>`;
                        }
                        break;
                }
                tr.appendChild(td);
            })
            table.querySelector('tbody').appendChild(tr);
            num++;
        }
    })

    const tableDiv = document.createElement('div');
    ["table-responsive-lg", ].forEach(classItem => tableDiv.classList.add(classItem));
    tableDiv.appendChild(table);

    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');
    const validSelector = byTg.replaceAll(' ', '_').replaceAll('(', '_').replaceAll(')', '_');
    accordionItem.innerHTML = [
        `<h2 class="accordion-header">`,
            `<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordionNPE${validSelector}" aria-expanded="false" aria-controls="${validSelector}">`,
                `<small>`,
                    `<span class="badge rounded-pill text-bg-light ms-3">${byTg.replaceAll('_', ' ')}</span>`,
                    `<span class="badge rounded-pill text-bg-secondary ms-3">${num}</span>`,
                `</small>`,
            `</button>`,
        `</h2>`,
        `<div id="accordionNPE${validSelector}" class="accordion-collapse collapse show" data-bs-parent="#${accordion.id}">`,
            `<div class="accordion-body"></div>`,
        `</div>`,
    ].join('');

    const btnInnerHTMLSmallEl = accordionItem.querySelector('small');
    if (numOfAvailable != 0) {btnInnerHTMLSmallEl.innerHTML += [`<span class="badge rounded-pill text-bg-warning ms-3">${numOfAvailable}</span>`,].join('');}
    if (numOfRepair != 0) {btnInnerHTMLSmallEl.innerHTML += [`<span class="badge rounded-pill text-bg-danger ms-3">${numOfRepair}</span>`,].join('');}

    accordionItem.querySelector('div.accordion-body').appendChild(tableDiv);
    accordion.appendChild(accordionItem);

    const tooltipTriggerList = accordion.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

