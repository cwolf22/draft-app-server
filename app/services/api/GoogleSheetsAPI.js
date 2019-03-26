import config from '../../config'
const GoogleSpreadsheet = require('google-spreadsheet');

export default class GooglesheetsAPI {
    constructor() {
        this.credentials = config.secrets.GSHEETS;
    }

    authorize(sheetsId) {
        return new Promise((resolve, reject) => {
            console.log('[google] - authorizing...');
            const doc = new GoogleSpreadsheet(sheetsId);
            doc.useServiceAccountAuth(this.credentials, (err) => {
                if (err) reject(err);
                resolve(doc);
            });
        })
    }

    getRows(doc, tab) { 
        return new Promise((resolve, reject) => {
            console.log(`[google] - getting row data for tab: ${tab}`)
            doc.getRows(tab, {}, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        })
    }
}