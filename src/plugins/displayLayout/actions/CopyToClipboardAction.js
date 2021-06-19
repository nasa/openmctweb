import clipboard from '@/utils/clipboard';

export default class CopyToClipboardAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-duplicate';
        this.description = 'Copy value to clipboard';
        this.group = "action";
        this.key = 'copyToClipboard';
        this.name = 'Copy to Clipboard';
        this.priority = 1;
    }

    invoke(objectPath, view = {}) {
        const viewContext = view.getViewContext && view.getViewContext();
        const formattedValue = viewContext.row.rowformattedValueForCopy();

        clipboard.updateClipboard(formattedValue)
            .then(() => {
                this.openmct.notifications.info(`Success : copied '${formattedValue}' to clipboard `);
            })
            .catch(() => {
                this.openmct.notifications.error(`Failed : to copy '${formattedValue}' to clipboard `);
            });
    }

    appliesTo(objectPath, view = {}) {
        const viewContext = view.getViewContext && view.getViewContext();
        const row = viewContext && viewContext.row;
        if (!row) {
            return;
        }

        return row.formattedValueForCopy
            && typeof row.formattedValueForCopy === 'function';
    }
}
