import LadTableSet from './components/LadTableSet.vue';

import Vue from 'vue';

export default class LadTableSetView {
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
                LadTableSet
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                currentView: this
            },
            data: () => {
                return {
                    domainObject: this.domainObject
                };
            },
            template: '<lad-table-set ref="ladTableSet" :domain-object="domainObject"></lad-table-set>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.ladTableSet.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
