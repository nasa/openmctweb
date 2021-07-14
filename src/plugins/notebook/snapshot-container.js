import EventEmitter from 'EventEmitter';
import { EVENT_SNAPSHOTS_UPDATED } from './notebook-constants';
const NOTEBOOK_SNAPSHOT_STORAGE = 'notebook-snapshot-storage';

export const NOTEBOOK_SNAPSHOT_MAX_COUNT = 5;

export default class SnapshotContainer extends EventEmitter {
    constructor(openmct) {
        super();

        if (!SnapshotContainer.instance) {
            SnapshotContainer.instance = this;
        }

        this.openmct = openmct;

        // eslint-disable-next-line
        return SnapshotContainer.instance;
    }

    addSnapshot(notebookImageDomainObject, embedObject) {
        const snapshots = this.getSnapshots();
        if (snapshots.length >= NOTEBOOK_SNAPSHOT_MAX_COUNT) {
            snapshots.pop();
        }

        const snapshotObject = {
            notebookImageDomainObject,
            embedObject
        };

        snapshots.unshift(snapshotObject);

        return this.saveSnapshots(snapshots);
    }

    getSnapshot(id) {
        const snapshots = this.getSnapshots();

        return snapshots.find(s => s.embedObject.id === id);
    }

    getSnapshots() {
        const snapshots = window.localStorage.getItem(NOTEBOOK_SNAPSHOT_STORAGE) || '[]';

        return JSON.parse(snapshots);
    }

    removeSnapshot(id) {
        if (!id) {
            return;
        }

        const snapshots = this.getSnapshots();
        const filteredsnapshots = snapshots.filter(snapshot => snapshot.embedObject.id !== id);

        return this.saveSnapshots(filteredsnapshots);
    }

    removeAllSnapshots() {
        return this.saveSnapshots([]);
    }

    saveSnapshots(snapshots) {
        try {
            window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify(snapshots));
            this.emit(EVENT_SNAPSHOTS_UPDATED, true);

            return true;
        } catch (e) {
            const message = 'Insufficient memory in localstorage to store snapshot, please delete some snapshots and try again!';
            this.openmct.notifications.error(message);

            return false;
        }
    }

    updateSnapshot(snapshot) {
        const snapshots = this.getSnapshots();
        const updatedSnapshots = snapshots.map(s => {
            return s.embedObject.id === snapshot.embedObject.id
                ? snapshot
                : s;
        });

        return this.saveSnapshots(updatedSnapshots);
    }
}
