import { getJsonResponseApiData } from './getJsonResponseApiData.js';
// import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'


document.querySelector('.navbar-brand').addEventListener('dblclick', e => {
    if (!window.location.href.includes('accounts')) {
        getLastUpdJsonResponseApiData();
    }
});

window.addEventListener('load', e => {
    if (!window.location.href.includes('accounts')) {
        const lastShow = localStorage.getItem('lastShow');
        const today = new Date().toDateString();

        if (lastShow !== today) {
            getLastUpdJsonResponseApiData(today);
        }
    }
});

function getLastUpdJsonResponseApiData(today = false) {
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

                today ? localStorage.setItem('lastShow', today) : false;
            } else {
                baseMessagesAlert("the data of Last Updated is NOT ready", 'danger');
            }
        } catch (error) {
            console.error('There was a problem with the async operation:', error);
        }
    }
}

function modalInit(lastUpd_lst) {
    const modalDivEl = document.createElement('div');
    modalDivEl.innerHTML = [
        `<div class="modal fade" id="lastUpdModal" tabindex="-1" aria-labelledby="lastUpdModalLabel" aria-hidden="true">`,
            `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">`,
                `<div class="modal-content">`,
                    `<div class="modal-header">`,
                        `<h1 class="modal-title fs-5" id="lastUpdModalLabel">Latest Updated ...</h1>`,
                        `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`,
                    `</div>`,
                    `<div class="modal-body">`,
                        `<table class="table table-striped table-hover fw-light">`,
                            // `<thead><tr><th></th><th>Model Type</th><th>Serial #</th><th>By</th><th>On</th></thead><tbody></tr></tbody>`,
                            `<thead><tr><th width="70%"></th><th>By</th><th>On</th></thead><tbody></tr></tbody>`, // column width set 设置列宽
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
            `<td>`,
                `<small>${lastUpd_lst[key].detail}</small>`,
                // `<a href="${window.location.origin}${lastUpd_lst[key].link}">`,
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">`,
                        `<path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>`,
                        `<path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>`,
                    `</svg>`,
                // `</a>`,
            `</td>`,
            // `<td><small>${lastUpd_lst[key].model_type}</small></td>`,
            // `<td><small>${lastUpd_lst[key].serial_number}</small></td>`,
            `<td><small>${lastUpd_lst[key].by}</small></td>`,
            `<td><small>${lastUpd_lst[key].on}</small></td>`,
        ].join('');
        if (lastUpd_lst[key].link) {
            // const href = trEl.querySelector('a');
            // href.parentElement.replaceChild(href.querySelector('small'), href);
            // const href_svg = trEl.querySelector('svg');
            trEl.querySelector('svg').addEventListener('click', e => {window.open(`${window.location.origin}${lastUpd_lst[key].link}`, '_blank');}); // open A link in a new tab / window 在新的窗口(标签)打开页面
        } else {
            trEl.querySelector('svg').remove();
        }
        tBodyEl.appendChild(trEl);
    });
    const modalInstance = bootstrap.Modal.getOrCreateInstance('#lastUpdModal');
    modalInstance.show();
}