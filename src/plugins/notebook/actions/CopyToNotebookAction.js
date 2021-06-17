import { getDefaultNotebook } from '../utils/notebook-storage';
import { addNotebookEntry } from '../utils/notebook-entries';

export default class CopyToNotebookAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-duplicate';
        this.description = 'Copy value to notebook as an entry';
        this.group = "action";
        this.key = 'copyToNotebook';
        this.name = 'Copy to Notebook';
        this.priority = 1;
    }

    copyToNotebook(entryText) {
        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, null, entryText);

                const defaultPath = `${domainObject.name} - ${notebookStorage.section.name} - ${notebookStorage.page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this.openmct.notifications.info(msg);
            });
    }

    invoke(objectPath, view) {
        const formattedValueForCopy = view.getViewContext.row.formattedValueForCopy;

        this.copyToNotebook(formattedValueForCopy());
    }

    appliesTo(objectPath, view) {
        const viewContext = view.getViewContext && view.getViewContext();
        if (!viewContext || !viewContext.row) {
            return false;
        }

        const formattedValueForCopy = viewContext.row.formattedValueForCopy;

        return formattedValueForCopy && typeof formattedValueForCopy === 'function';
    }
}
