// page level Alert msg

const baseMessagesAlertPlaceholder = document.getElementById('baseMessagesAlertPlaceholder');

const baseMessagesAlert = (msg, type, toastAutoHide = true, hyperLink = {}) => {
    let svg_icon;
    switch (type) {
        case 'success':
            svg_icon = [
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">`,
                    `<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>`,
                `</svg>`,
            ].join('')
            break;
        case 'danger':
            svg_icon = [
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">`,
                    `<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,
                `</svg>`,
            ].join('')
            break;
        case 'warning':
            svg_icon = [
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">`,
                    `<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`,
                `</svg>`,
            ].join('')
            break;
        case 'info':
            svg_icon = [
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">`,
                    `<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>`,
                `</svg>`,
            ].join('')
            break;
        default:
            svg_icon = [
                
            ].join('')
            break;
    }

    const toastDivEl = document.createElement('div');
    new Map([
        ['class', 'toast'],
        ['role', 'alert'],
        ['aria-live', 'assertive'],
        ['aria-atomic', 'true'],
    ]).forEach((value, key, map) => {
        toastDivEl.setAttribute(key, value);
    })
    
    if (hyperLink.size) {
        hyperLink.forEach((link, replacement, map) => {
            msg.replaceAll(replacement, `<a href="${link}">${replacement}</a>`)
        })
    }

    toastDivEl.innerHTML = [
        `<div class="toast-header text-${type}">`,
            `<!--<img src="..." class="rounded me-2" alt="...">-->`,
            `<strong class="me-auto">${svg_icon}</strong>`,
            `<small>${type}</small>`,
            `<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>`,
        `</div>`,
        `<div class="toast-body">`,
            `${msg}`,
            `<div class="mt-2 pt-2 border-top"></div>`,
        `</div>`,
    ].join('');

    let toastBtn, toastBtns = [];
    if (!toastAutoHide) {
        ['no', 'yes'].forEach(n => {
            toastBtn = document.createElement('button');
            new Map([
                ['type', 'button'],
                ['data-bs-dismiss', 'toast'],
            ]).forEach((value, key, map) => {
                toastBtn.setAttribute(key, value);
            });
            ['btn', 'btn-sm', 'm-2'].forEach(m => toastBtn.classList.add(m));
            toastBtn.textContent = n;
            // toastBtn.addEventListener('click', e => {return e.target.textContent})
            n == 'yes' ? toastBtn.classList.add('btn-primary') : toastBtn.classList.add('btn-secondary');
            toastDivEl.querySelector('div.mt-2.pt-2.border-top').appendChild(toastBtn);
            toastDivEl.setAttribute('data-bs-autohide', 'false');
            
            toastBtns.push(toastBtn);
        })
    }

    baseMessagesAlertPlaceholder.appendChild(toastDivEl);

    const baseMsgsToastInstance = bootstrap.Toast.getOrCreateInstance(toastDivEl);

    baseMsgsToastInstance.show();

    return !toastAutoHide ? toastBtns : toastDivEl;
}


/*
const baseMessagesAlertPlaceholder = document.getElementById('baseMessagesAlertPlaceholder');
const baseMessagesAlert = (message, type) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')

    if (baseMessagesAlertPlaceholder.firstChild) {
        // baseMessagesAlertPlaceholder.replaceChild(wrapper, baseMessagesAlertPlaceholder.firstChild);
        setTimeout(() => {
            baseMessagesAlertPlaceholder.removeChild(baseMessagesAlertPlaceholder.firstChild);
        }, 3000); // 3000毫秒 延迟 后 移除 最早的那个 Alert
    }
    baseMessagesAlertPlaceholder.appendChild(wrapper);
}
*/

export {baseMessagesAlertPlaceholder, baseMessagesAlert};