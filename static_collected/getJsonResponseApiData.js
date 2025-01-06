import { baseMessagesAlertPlaceholder, baseMessagesAlert } from './baseMessagesAlert.js';

'use strict'


export function getJsonResponseApiData(uri) {

    return fetch(uri
    ).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    }).catch(error => {
        error ? console.error('Error:', error) : null;
        error ? baseMessagesAlert(`Error:, ${error}`, 'danger') : null;

    })

}

// export { getRequesterPermissions };