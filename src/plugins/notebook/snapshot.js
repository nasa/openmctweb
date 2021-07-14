import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries';
import { getDefaultNotebook, getDefaultNotebookLink, setDefaultNotebook } from './utils/notebook-storage';
import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';
import { createNotebookImageDomainObject, saveNotebookImageDomainObject, updateNamespaceOfDomainObject, DEFAULT_SIZE } from './utils/notebook-image';

import SnapshotContainer from './snapshot-container';

export default class Snapshot {
    constructor(openmct) {
        this.openmct = openmct;
        this.snapshotContainer = new SnapshotContainer(openmct);

        this.capture = this.capture.bind(this);
        this._saveSnapShot = this._saveSnapShot.bind(this);
    }

    capture(snapshotMeta, notebookType, domElement) {
        const exportImageService = this.openmct.$injector.get('exportImageService');

        const options = {
            className: 's-status-taking-snapshot',
            thumbnailSize: DEFAULT_SIZE
        };
        exportImageService.exportPNGtoSRC(domElement, options)
            .then(function ({blob, thumbnail}) {
                const reader = new window.FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    this._saveSnapShot(notebookType, reader.result, thumbnail, snapshotMeta);
                }.bind(this);
            }.bind(this));
    }

    /**
     * @private
     */
    _saveSnapShot(notebookType, fullSizeImageURL, thumbnailImageURL, snapshotMeta) {
        const object = createNotebookImageDomainObject(fullSizeImageURL);
        const thumbnailImage = { src: thumbnailImageURL || '' };
        const snapshot = {
            fullSizeImageObjectIdentifier: object.identifier,
            thumbnailImage
        };
        const embed = createNewEmbed(snapshotMeta, snapshot);
        if (notebookType === NOTEBOOK_DEFAULT) {
            const notebookStorage = getDefaultNotebook();

            this._saveToDefaultNoteBook(notebookStorage, embed);
            const notebookImageDomainObject = updateNamespaceOfDomainObject(object, notebookStorage.notebookMeta.identifier.namespace);
            saveNotebookImageDomainObject(this.openmct, notebookImageDomainObject);

            return;
        }

        this._saveToNotebookSnapshots(object, embed);
    }

    /**
     * @private
     */
    _saveToDefaultNoteBook(notebookStorage, embed) {
        this.openmct.objects.get(notebookStorage.notebookMeta.identifier)
            .then(async (domainObject) => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, embed);

                let link = notebookStorage.notebookMeta.link;

                // Backwards compatibility fix (old notebook model without link)
                if (!link) {
                    link = await getDefaultNotebookLink(this.openmct, domainObject);
                    notebookStorage.notebookMeta.link = link;
                    setDefaultNotebook(this.openmct, notebookStorage);
                }

                const defaultPath = `${domainObject.name} - ${notebookStorage.section.name} - ${notebookStorage.page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this._showNotification(msg, link);
            });
    }

    /**
     * @private
     */
    _saveToNotebookSnapshots(notebookImageDomainObject, embed) {
        this.snapshotContainer.addSnapshot(notebookImageDomainObject, embed);
    }

    _showNotification(msg, url) {
        const options = {
            autoDismissTimeout: 30000,
            link: {
                cssClass: '',
                text: 'click to view',
                onClick: this._navigateToNotebook(url)
            }
        };

        this.openmct.notifications.info(msg, options);
    }

    _navigateToNotebook(url = null) {
        if (!url) {
            return () => {};
        }

        return () => {
            window.location.href = window.location.origin + url;
        };
    }
}
