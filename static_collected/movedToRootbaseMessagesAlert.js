// page level Alert msg
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

export {baseMessagesAlertPlaceholder, baseMessagesAlert};