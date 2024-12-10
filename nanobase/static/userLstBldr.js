import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

const userLstSwitch = document.querySelector('#userLstSwitch');
userLstSwitch.nextElementSibling.innerText = new Date();
const spinnerEl = document.createElement('div');
new Map([
    ['class', 'spinner-border spinner-border-sm text-secondary'],
    ['role', 'status'],
]).forEach((attrValue, attrKey, attrMap) => {
    spinnerEl.setAttribute(attrKey, attrValue);
});
spinnerEl.innerHTML = [`<span class="visually-hidden">Loading...</span>`,].join('');

userLstSwitch.disabled = true;
userLstSwitch.parentNode.insertBefore(spinnerEl, userLstSwitch);
getUserLstAsync(userLstSwitch);

let usersLst;

async function getUserLstAsync(trgr = null, pgLstUpd = null) {
    const getUri = pgLstUpd ? window.location.origin + `/json_response/users_getLst/?pgLstUpd=${pgLstUpd}`: window.location.origin + '/json_response/users_getLst/';
    try {
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            if (json[0].re_fetch) {
                usersLst = new Map(Object.entries(json[0]));
                userLstSwitch.nextElementSibling.innerText = new Date();
                // num_of = new Map(Object.entries(json[1]));
            }
            trgr.disabled = false;
            trgr.parentElement.querySelector('div.spinner-border').remove();
            if (pgLstUpd) {
                baseMessagesAlert(fltr(usersLst, trgr.checked, [true, false, ]), 'success');    
            }
        } else {
            baseMessagesAlert("the data for User List is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

if (!userLstSwitch.hasAttribute('change-event-listener')) {
    userLstSwitch.addEventListener('change', e => {
        userLstSwitch.disabled = true;
        userLstSwitch.parentNode.insertBefore(spinnerEl, userLstSwitch);
        getUserLstAsync(userLstSwitch, userLstSwitch.nextElementSibling.innerText);
    });
    userLstSwitch.setAttribute('change-event-listener', 'true');
}

function fltr(users, isExt, isActive) {
    const accordionEl = document.querySelector('#accordionUserLst');
    accordionEl.innerHTML = '';

    let msg = isExt ? 'External users filtered out' : 'Internal users filtered out';
    let num_of_type = 0;
    isActive.forEach(opt => {
        const tableEl = document.createElement('table');
        ['table', 'table-striped', 'table-hover', 'fw-light'].forEach(classItem => tableEl.classList.add(classItem));

        const theadEl = document.createElement('thead');
        tableEl.appendChild(theadEl);

        let thLst = ['', 'name', 'email', 'title', 'dept'];

        if (isExt) {['legal_entity', 'cellphone'].forEach(m => thLst.push(m));} else {thLst.push('branch_site');}

        const thTrEl = document.createElement('tr');
        ['text-capitalize', 'fs-6'].forEach(m => thTrEl.classList.add(m));
        
        thLst.forEach(m => {
            const thEl = document.createElement('th');
            // thEl.textContent = m;
            thEl.innerHTML = `<small>${m.replaceAll('_', ' ')}</small>`
            thTrEl.appendChild(thEl);
        });
        theadEl.appendChild(thTrEl);
        
        const tbodyEl = document.createElement('tbody');

        let num_of_status = 0;

        users.forEach((value, key, map) => {
            if (isExt == value['is_ext'] && opt == value['is_active']) {
                num_of_status++;
                const tbodyTrEl = document.createElement('tr');
                thLst.forEach(m => {
                    const tbodyTrTdEl = document.createElement('td');
                    if (m == '') {
                        tbodyTrTdEl.innerHTML = [
                            `<samll>`,
                                `<div class="form-check form-switch">`,
                                    `<input class="form-check-input" type="checkbox" role="switch" name="userprofile" id="" value="${key}"`,
                                    ` data-bs-toggle="tooltip"`,
                                    ` data-bs-placement="top"`,
                                    ` data-bs-custom-class="custom-tooltip"`,
                                    ` data-bs-html="true"`,
                                    ` data-bs-title=${value['is_active'] ? "deactivate" : "activate"}`,
                                    ` />`,
                                    `<label class="form-check-label" for=""></label>`,
                                `</div>`,
                            `</samll>`,
                        ].join('');
                        const tbodyTrInputChk = tbodyTrTdEl.querySelector('input[type=checkbox][role=switch]');

                        tbodyTrInputChk.checked = value['is_active'] ? true : false;

                    } else {
                        tbodyTrTdEl.innerHTML = value[m] == null || value[m] == '' ? '🈳' : `<small>${value[m]}</small>`;
                        
                        if (!isExt && m == 'name') {
                            // tbodyTrTdEl.appendChild(badgeRoundedPillHrefEl);
                            if (value['number_of_contract_created'] > 0) {
                                tbodyTrTdEl.appendChild(badgeBldr(value, '/contracts/user/', value['number_of_contract_created'], '# of contract', ['text-bg-primary', 'text-bg-primary']));
                            }

                            tbodyTrTdEl.appendChild(badgeBldr(value, '/instances/user/', value['number_of_owned_assets'], value['owned_assets'], ['text-bg-secondary', 'text-bg-warning']));
                        }
                    }
                    tbodyTrEl.appendChild(tbodyTrTdEl);
                })
                tbodyEl.appendChild(tbodyTrEl);
            }
            tableEl.appendChild(tbodyEl);
        });
        const accordionItemEl = document.createElement('div');
        accordionItemEl.classList.add('accordion-item');
        accordionItemEl.innerHTML = [
            `<h2 class="accordion-header">`,
                `<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${opt ? 'activeUser' : 'deactiveUser'}" aria-expanded="false" aria-controls="${opt ? 'activeUser' : 'deactiveUser'}">`,
                    // `<small>`,
                        `<span class="badge rounded-pill text-bg-light ms-3">${num_of_status}</span>`,
                        // `<span class="badge rounded-pill text-bg-secondary ms-3">${num_of_status}</span>`,
                    // `</small>`,
                `</button>`,
            `</h2>`,
            `<div id="${opt ? 'activeUser' : 'deactiveUser'}" class="accordion-collapse collapse show" data-bs-parent="#${accordionEl.id}">`,
                `<div class="accordion-body"></div>`,
            `</div>`,
        ].join('');

        accordionItemEl.querySelector('div.accordion-body').appendChild(tableEl);
        accordionEl.appendChild(accordionItemEl);

        num_of_type += num_of_status;
    })
    document.querySelector('h3 em').innerText = isExt ? 'all External users' : 'all Internal users'

    document.querySelector('h3 span.badge').innerText = `${num_of_type}`;
    
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    return msg;
}

function badgeBldr(value, lnk, count, dataBsTitle, clsLst) {
    const badgeRoundedPillHrefEl = document.createElement('a')
    new Map([
        ['href', `${window.location.origin}${lnk}?id=${value['username']}`],
        // ['href', `${window.location.origin}/user_profile/${key}/update/`],
        ['class', 'text-decoration-none'],
    ]).forEach((attrValue, attrKey, attrMap) => {
        badgeRoundedPillHrefEl.setAttribute(attrKey, attrValue);
    });
    // [value['number_of_owned_assets_pc'], value['number_of_owned_assets_other']].forEach((number_of_owned_assets, index, array) => {
    
    // const number_of_owned_assets = value['number_of_owned_assets'];
    // const number_of_owned_assets_pc = value['number_of_owned_assets_pc'];
    // const number_of_owned_assets_other = value['number_of_owned_assets_other'];

    if (Array.isArray(dataBsTitle)) {
        let ulEl ='<ul>';
        dataBsTitle.forEach(dataBsTitleItm => {
            ulEl += `<li>${dataBsTitleItm}</li>`;
        });
        ulEl += '</ul>';
        dataBsTitle = ulEl;
    }

    const badgeRoundedPillSpanEl = document.createElement('span');
    new Map([
        ['class', 'badge rounded-pill mx-1'],
        ['data-bs-toggle', 'tooltip'],
        ['data-bs-placement', 'right'],
        ['data-bs-custom-class', 'custom-tooltip'],
        ['data-bs-html', 'true'],
        ['data-bs-title', dataBsTitle],
        // ['data-bs-title', `${number_of_owned_assets > 1 ? number_of_owned_assets_pc + ' x PC, ' + number_of_owned_assets_other + ' x others' : '# of IT Assets assigned'}`],
        // ['data-bs-title', 'assigned IT Assets'],
    ]).forEach((attrValue, attrKey, attrMap) => {
        badgeRoundedPillSpanEl.setAttribute(attrKey, attrValue);
    });
    badgeRoundedPillSpanEl.classList.add(count == 1 ? clsLst[0] : clsLst[1]);
    badgeRoundedPillSpanEl.textContent = count;

    badgeRoundedPillHrefEl.appendChild(badgeRoundedPillSpanEl);
    // })

    return badgeRoundedPillHrefEl;

}