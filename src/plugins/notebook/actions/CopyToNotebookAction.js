import { getDefaultNotebook, getNotebookSectionAndPage } from '../utils/notebook-storage';
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
        this.openmct.objects.get(notebookStorage.identifier)
            .then(domainObject => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, null, entryText);

                const { section, page } = getNotebookSectionAndPage(domainObject, notebookStorage.defaultSectionId, notebookStorage.defaultPageId);
                if (!section || !page) {
                    return;
                }

                const defaultPath = `${domainObject.name} - ${section.name} - ${page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this.openmct.notifications.info(msg);
            });
    }

    invoke(objectPath, view = {}) {
        let viewContext = view.getViewContext && view.getViewContext();

        this.copyToNotebook(viewContext.formattedValueForCopy());
    }

    appliesTo(objectPath, view = {}) {
        let viewContext = view.getViewContext && view.getViewContext();

        return viewContext && viewContext.formattedValueForCopy
            && typeof viewContext.formattedValueForCopy === 'function';
    }
}
