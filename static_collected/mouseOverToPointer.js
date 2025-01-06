'use strict'

document.addEventListener('mouseover', e => {
    if (
        // (e.target.id.includes('instanceOwner') || (e.target.parentElement ? e.target.parentElement.id.includes('instanceOwner') : false)) ||
        // (e.target.closest('td, li') && e.target.closest('td, li').id.includes('instanceOwner')) ||
        // e.target.closest("[id^='instanceOwner']") ||
        // (e.target.id.includes('instanceSubcategory') || (e.target.parentElement ? e.target.parentElement.id.includes('instanceSubcategory') : false)) ||
        // (e.target.closest('td, li') && e.target.closest('td, li').id.includes('instanceSubcategory')) ||
        // e.target.closest("[id^='instanceSubcategory']") ||
        // (e.target.id.includes('instanceModelType') || (e.target.parentElement ? e.target.parentElement.id.includes('instanceModelType') : false)) ||
        // (e.target.closest('td, li') && e.target.closest('td, li').id.includes('instanceModelType')) ||
        // e.target.closest("[id^='instanceModelType']") ||

        // (e.target.closest('td, li') && e.target.closest('td, li').id.includes('instanceInRepair'))
        // e.target.closest("[id^='instanceInRepair']")

        e.target.closest("[id*='Instance']")
    ) {
        e.target.style.cursor = 'pointer';
        e.target.style.color = 'orange'; // 突出显示鼠标悬停目标
        setTimeout(() => { e.target.style.color = "";}, 300); // 短暂延迟后重置颜色
    }
})