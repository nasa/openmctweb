import { addNotebookEntry, createNewEmbed } from './utils/notebook-entries';
import { getDefaultNotebook, getNotebookSectionAndPage, getDefaultNotebookLink, setDefaultNotebook } from './utils/notebook-storage';
import { NOTEBOOK_DEFAULT } from '@/plugins/notebook/notebook-constants';
import { createNotebookImageDomainObject, DEFAULT_SIZE } from './utils/notebook-image';

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
        createNotebookImageDomainObject(this.openmct, fullSizeImageURL)
            .then(object => {
                const thumbnailImage = { src: thumbnailImageURL || '' };
                const snapshot = {
                    fullSizeImageObjectIdentifier: object.identifier,
                    thumbnailImage
                };
                const embed = createNewEmbed(snapshotMeta, snapshot);
                if (notebookType === NOTEBOOK_DEFAULT) {
                    this._saveToDefaultNoteBook(embed);

                    return;
                }

                this._saveToNotebookSnapshots(embed);
            });
    }

    /**
     * @private
     */
    _saveToDefaultNoteBook(embed) {
        const notebookStorage = getDefaultNotebook();
        this.openmct.objects.get(notebookStorage.identifier)
            .then(async (domainObject) => {
                addNotebookEntry(this.openmct, domainObject, notebookStorage, embed);

                let link = notebookStorage.link;

                // Backwards compatibility fix (old notebook model without link)
                if (!link) {
                    link = await getDefaultNotebookLink(this.openmct, domainObject);
                    notebookStorage.link = link;
                    setDefaultNotebook(this.openmct, notebookStorage);
                }

                const { section, page } = getNotebookSectionAndPage(domainObject, notebookStorage.defaultSectionId, notebookStorage.defaultPageId);
                if (!section || !page) {
                    return;
                }

                const defaultPath = `${domainObject.name} - ${section.name} - ${page.name}`;
                const msg = `Saved to Notebook ${defaultPath}`;
                this._showNotification(msg, link);
            });
    }

    /**
     * @private
     */
    _saveToNotebookSnapshots(embed) {
        this.snapshotContainer.addSnapshot(embed);
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
