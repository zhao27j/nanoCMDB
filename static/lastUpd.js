import { getJsonResponseApiData } from './getJsonResponseApiData.js';
// import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'

// let lastUpd_lst;
window.addEventListener('load', e => {
    if (!window.location.href.includes('accounts')) {
        const lastShow = localStorage.getItem('lastShow');
        const today = new Date().toDateString();

        if (lastShow !== today) {

            getDetailsAsync(window.location.origin + `/json_response/last_updated_getLst/`);

            async function getDetailsAsync(getUri) {
                try {
                    const json = await getJsonResponseApiData(getUri);
                    if (json) {
                        const signed_in_as_iT = json[0];
                        const lastUpd_lst = json[1];

                        if (signed_in_as_iT && lastUpd_lst) {
                            modalInit(lastUpd_lst);
                        }

                        localStorage.setItem('lastShow', today);
                    } else {
                        baseMessagesAlert("the data of Last Update is NOT ready", 'danger');
                    }
                } catch (error) {
                    console.error('There was a problem with the async operation:', error);
                }
            }
        }
    }
});

function modalInit(lastUpd_lst) {
    const modalDivEl = document.createElement('div');
    modalDivEl.innerHTML = [
        `<div class="modal fade" id="lastUpdModal" tabindex="-1" aria-labelledby="lastUpdModalLabel" aria-hidden="true">`,
            `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">`,
                `<div class="modal-content">`,
                    `<div class="modal-header">`,
                        `<h1 class="modal-title fs-5" id="lastUpdModalLabel">IT Assets Latest Updated ...</h1>`,
                        `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`,
                    `</div>`,
                    `<div class="modal-body">`,
                        `<table class="table table-striped table-hover fw-light">`,
                            `<thead><tr><th></th><th>Model Type</th><th>Serial #</th><th>By</th><th>On</th></thead><tbody></tr></tbody>`,
                        `</table>`,
                    `</div>`,
                    `<div class="modal-footer">`,
                        // `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>`,
                        // `<button type="button" class="btn btn-primary">Save changes</button>`,
                    `</div>`,
                `</div>`,
            `</div>`,
        `</div>`,
    ].join('');
    document.body.appendChild(modalDivEl);

    const tBodyEl = modalDivEl.querySelector('tbody');
    Object.keys(lastUpd_lst).toReversed().forEach(key => {
        const trEl = document.createElement('tr');
        trEl.innerHTML = [
            `<td><small>${lastUpd_lst[key].detail}</small></td>`,
            `<td><small>${lastUpd_lst[key].model_type}</small></td>`,
            `<td>`,
                `<a href="${window.location.origin}${lastUpd_lst[key].link}">`,
                    `<small>${lastUpd_lst[key].serial_number}</small>`,
                `</a>`,
            `</td>`,
            `<td><small>${lastUpd_lst[key].by}</small></td>`,
            `<td><small>${lastUpd_lst[key].on}</small></td>`,
        ].join('');
        if (!lastUpd_lst[key].link) {
            const href = trEl.querySelector('a');
            href.parentElement.replaceChild(href.querySelector('small'), href)
        }
        tBodyEl.appendChild(trEl);
    });
    const modalInstance = bootstrap.Modal.getOrCreateInstance('#lastUpdModal');
    modalInstance.show();
}