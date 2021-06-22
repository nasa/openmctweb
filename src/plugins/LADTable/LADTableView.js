import LadTable from './components/LADTable.vue';

import Vue from 'vue';

export default class LADTableView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                LadTable
            },
            provide: {
                openmct: this.openmct,
                currentView: this
            },
            data: () => {
                return {
                    domainObject: this.domainObject,
                    objectPath: this.objectPath
                };
            },
            template: '<lad-table ref="ladTable" :domain-object="domainObject" :object-path="objectPath"></lad-table>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.ladTable.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
