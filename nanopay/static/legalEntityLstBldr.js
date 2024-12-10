import { getJsonResponseApiData } from './getJsonResponseApiData.js';
import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

let legalEntities, legalEntityTypes, legalEntityPrjcts, legalEntitiesCntcts, legalEntityCntrctQty;

async function getLegalEntityAsync(grpByTrgr) {
    const getUri = window.location.origin + '/json_response/legalEntities_getLst/';
    try {
        const json = await getJsonResponseApiData(getUri);
        if (json) {
            const usersLst = new Map(Object.entries(json[0]));
            // num_of = new Map(Object.entries(json[1]));
            legalEntities = json[0];
            legalEntityTypes = new Map(Object.entries(json[1]));
            legalEntityPrjcts = new Map(Object.entries(json[2]));
            legalEntityPrjcts.set("None", null);
            legalEntitiesCntcts = new Map(Object.entries(json[3]));
            legalEntityCntrctQty = new Map(Object.entries(json[4]));

            const legalEntitiesAccordion = document.querySelector("#legalEntitiesAccordion");

            if (grpByTrgr == 'prjct') {
                baseMessagesAlert(reGrp(legalEntitiesAccordion, 'prjct', ['name', 'type', 'code']), 'success')
            } else {
                baseMessagesAlert(reGrp(legalEntitiesAccordion, 'type', ['name', 'prjct', 'code']), 'success')
            }
            // trgr.disabled = false;
            // trgr.parentElement.querySelector('div.spinner-border').remove();
            
        } else {
            baseMessagesAlert("the data for Legal Entity List is NOT ready", 'danger');
        }
    } catch (error) {
        console.error('There was a problem with the async operation:', error);
    }
}

document.querySelector("#legalEntitiesBtnByPrjct").addEventListener('click', e => getLegalEntityAsync('prjct'));
document.querySelector("#legalEntitiesBtnByType").addEventListener('click', e => getLegalEntityAsync('type'));

function reGrp(accordionEl, grpByTag, cols) {
    // if (grpByTag == 'Type') {tableTh = 'Project';} else if (grpByTag == 'Project') {tableTh = 'Type';}

    accordionEl.innerHTML = "";

    const grpBy = grpByTag == 'prjct' ? legalEntityPrjcts : grpByTag == 'type' ? legalEntityTypes : null;
    
    grpBy.forEach((valueBy, keyBy, mapBy) => {
        const accordionItem = document.createElement('div');
        accordionItem.classList.add("accordion-item");
        const accordionElItemHeaderBtnTxt = grpByTag == 'prjct' ? legalEntityPrjcts.get(`${keyBy}`) : grpByTag == 'type' ? legalEntityTypes.get(`${keyBy}`) : keyBy;
        accordionItem.innerHTML = [
            `<h2 class="accordion-header">`,
                `<button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapse${keyBy}" aria-expanded="true" aria-controls="panelsStayOpen-collapse${keyBy}" style="height: 0px;">`,
                    `${accordionElItemHeaderBtnTxt}`,
                `</button>`,
            `</h2>`,
            `<div id="panelsStayOpen-collapse${keyBy}" class="accordion-collapse collapse show">`,
                `<div class="accordion-body" id="accordionElBody${keyBy}"></div>`,
            `</div>`,
        ].join('');
        
        accordionEl.appendChild(accordionItem);
        const accordionElItemHeaderBtn = accordionItem.querySelector('button');
        const accordionElBody = accordionItem.querySelector(`#accordionElBody${keyBy}`);

        const tableEl = document.createElement('table');
        tableEl.id = `${legalEntities}Tbl`;
        // ['table', 'table-striped', 'table-hover', 'fw-light'].forEach(element => tableEl.classList.add(element));
        tableEl.classList.add('table', 'table-striped', 'table-hover', 'fw-light');
        accordionElBody.appendChild(tableEl);

        const tableTheadEl = document.createElement('thead');
        let tableTrEl = document.createElement('tr');
        tableTrEl.innerHTML = '<th></th>';
        cols.forEach(col => {
            const tabelThEl = document.createElement('th');
            const tabelThEltextContent = col == 'prjct' ? 'Project' : col;
            tabelThEl.innerHTML = `<small class="text-capitalize">${tabelThEltextContent}</small>`;
            tableTrEl.appendChild(tabelThEl);
        })
        tableTheadEl.appendChild(tableTrEl);
        tableEl.appendChild(tableTheadEl);

        const tableTbodyEl = document.createElement('tbody');
        tableEl.appendChild(tableTbodyEl);

        let counterBy = 0;
        legalEntities.forEach(row => {
            if (row.fields[`${grpByTag}`] == keyBy || legalEntityPrjcts.get(`${row.fields[grpByTag]}`) == grpBy.get(`${keyBy}`)) {
                tableTrEl = document.createElement('tr');
                tableTrEl.innerHTML = `<td><input type="checkbox" name="legal_entity_${row.pk}" id="${legalEntities}TblTd${row.pk}" value="${row.pk}" /></td>`;
                cols.forEach(col => {
                    const tabelTdEl = document.createElement('td');
                    const smallEl = document.createElement('small');
                    smallEl.id = `${legalEntities}TblTd${col}`;
                    if (col == 'prjct') {
                        legalEntityPrjcts.get(`${row.fields[col]}`) ? smallEl.textContent = legalEntityPrjcts.get(`${row.fields[col]}`) : smallEl.textContent = '🈳';
                    } else {
                        smallEl.textContent = col =='type' ? legalEntityTypes.get(`${row.fields[col]}`) : row.fields[`${col}`];
                    }
                    if (col == 'name') {
                        const hyperLink = document.createElement('a');
                        hyperLink.href = window.location.origin + `/legal_entity/${row.pk}/detail/`;
                        hyperLink.className = "text-decoration-none";

                        hyperLink.appendChild(smallEl);
                        tabelTdEl.appendChild(hyperLink)

                        if (legalEntityCntrctQty.get(`${row.pk}`)) {
                            const qty = legalEntityCntrctQty.get(`${row.pk}`)
                            const hyperLinkSVG = document.createElement('a');
                            hyperLinkSVG.innerHTML = [
                                `<span class="badge rounded-pill bg-primary mx-2" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="# of contract">`,
                                    `${qty}`,
                                    `<span class="visually-hidden">Contract signed with</span>`,
                                `</span>`,
                            ].join('');
                            tabelTdEl.appendChild(hyperLinkSVG);
                        }

                        if (legalEntitiesCntcts.get(`${row.pk}`)) {
                            const hyperLinkSVG = document.createElement('a');
                            hyperLinkSVG.innerHTML = [
                                ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">`,
                                    `<path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>`,
                                `</svg>`,
                            ].join('');
                            tabelTdEl.appendChild(hyperLinkSVG);
                        }
                    } else {
                        tabelTdEl.appendChild(smallEl);
                    }
                    tableTrEl.appendChild(tabelTdEl);
                })
                tableTbodyEl.appendChild(tableTrEl);
                counterBy++;
            }
        })
        const accordionElItemHeaderBtnbadge = document.createElement('span');
        accordionElItemHeaderBtnbadge.classList.add("badge", "rounded-pill", "text-bg-secondary", "m-3");
        accordionElItemHeaderBtnbadge.textContent = counterBy;
        accordionElItemHeaderBtn.appendChild(accordionElItemHeaderBtnbadge);
    })
    return `re-grouped by ${grpByTag}`;
}