'use strict'

const checkBoxes = document.querySelectorAll("tbody > tr > td > input[type='checkbox']");
let lastChecked;

function handleCheck( e ) {
    let inBetween =  false;
    if( e.shiftKey && this.checked ) {
        checkBoxes.forEach( checkBox => {
            if( checkBox === this || checkBox === lastChecked ) {
                inBetween = !inBetween;
            }
            if( inBetween ) {
                checkBox.checked = true;
                // checkBox.checked = !checkBox.checked;
            }
        });
    }
    lastChecked = this;
};

checkBoxes.forEach( checkBox => checkBox.addEventListener( 'click', handleCheck ) );


// document.querySelectorAll('input[type="checkbox"]')

document.addEventListener('keyup', e => {
    //if (!e.isComposing && e.ctrlKey && e.key.toLocaleLowerCase() == 'k') {
    // if (e.ctrlKey && e.key.toLocaleLowerCase() == 'k') {
    // if (e.key.toLocaleLowerCase() == '/') {
    // if (e.key == '/') {
    if (e.ctrlKey && e.key === "/") {
        const searchInputEl = document.querySelector("input[type='search']")
        searchInputEl.focus();
        searchInputEl.value = '';
    }
})

const bulkUpdBtns = Array.from(document.querySelectorAll('li > button.dropdown-item[data-bs-target="#bulkUpdModal"]'));
bulkUpdBtns.push(document.querySelector('li > button.dropdown-item[data-bs-target="#configCUDModal"]'));

document.querySelectorAll("button.nav-link.dropdown-toggle[role='button'][data-bs-toggle='dropdown']").forEach(el => {
    const dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(el);
    el.addEventListener('mouseover', e => {
        dropdownInstance.show();

        bulkUpdBtns.forEach(btn => {
            if (btn) {
                btn.disabled = document.querySelectorAll('input[type="checkbox"][name="instance"]:checked').length == 0;
            }
        });
        /*
        if (document.querySelectorAll('input[type="checkbox"][name="instance"]:checked').length > 0 || (window.location.href.includes('instance') && window.location.href.includes('detail'))) {
            bulkUpdBtns.forEach(btn => {btn.disabled = false;});
        } else {
            bulkUpdBtns.forEach(btn => {btn.disabled = true;});
        }
        */
    });
    el.nextElementSibling.addEventListener('mouseleave', e =>{setTimeout(() => { dropdownInstance.hide();}, 100);});
    el.parentElement.addEventListener('mouseleave', e => {setTimeout(() => {dropdownInstance.hide();}, 200);});
})

document.addEventListener('DOMContentLoaded', e => {
    const activeTabId = localStorage.getItem('activeTabId'); // get the active tab ID from localStorage
    if (activeTabId) { // if there is an active tab ID stored, show it
        const tabBtn = document.querySelector(`button[id="${activeTabId}"]`);
        if (tabBtn) {
            bootstrap.Tab.getOrCreateInstance(tabBtn).show();
            // tabBtn.click(); // Show the active tab
        }
    }

    // Store the active tab ID in localStorage when a tab is clicked
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabBtn => {
        tabBtn.addEventListener('click', e => {localStorage.setItem('activeTabId', e.delegateTarget.id);});
    });
});

document.addEventListener('change', e => {
    if (e.target.type == 'checkbox' && e.target.id == 'left-up-corner-checkbox') {
        e.target.closest('table').querySelector('tbody').querySelectorAll('input[type="checkbox"]').forEach(el =>{
            el.checked = e.target.checked ? true : false;
        });
    }
});

/*
let bulkBtns = Array.from(document.querySelectorAll("button.dropdown-item[data-bs-target='#bulkUpdModal'][data-bs-toggle='modal']"));
bulkBtns = bulkBtns.concat(Array.from(document.querySelectorAll("button.dropdown-item[data-bs-target='#configCUDModal'][data-bs-toggle='modal']")))
document.querySelectorAll("input[type='checkbox']").forEach(el => {

})
*/

/*
if (document.querySelector("input.form-control[type='search']")) {
    const searchInputHelper = [
        `<ul>`,
            `<li>press / key to get Search</li>`,
            `<li>use , (comma) as keyword separator</li>`,
        `</ul>`,
    ].join('');

    new Map([
        ['data-bs-toggle', 'tooltip'],
        ['data-bs-placement', 'bottom'],
        ['data-bs-custom-class', 'custom-tooltip'],
        ['data-bs-html', 'true'],
        ['data-bs-title', searchInputHelper],
    ]).forEach((attrValue, attrKey, attrMap) => {
        document.querySelector("input.form-control[type='search']").setAttribute(attrKey, attrValue);
    });

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}
*/

// <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">PR Mgmt</a>
// <li class="nav-item dropdown">