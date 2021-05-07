import CopyToNotebookAction from './actions/CopyToNotebookAction';
import Notebook from './components/Notebook.vue';
import NotebookSnapshotIndicator from './components/NotebookSnapshotIndicator.vue';
import SnapshotContainer from './snapshot-container';
import Vue from 'vue';

let installed = false;

export default function NotebookPlugin() {
    return function install(openmct) {
        if (installed) {
            return;
        }

        installed = true;

        openmct.actions.register(new CopyToNotebookAction(openmct));

        const notebookType = {
            name: 'Notebook',
            description: 'Create and save timestamped notes with embedded object snapshots.',
            creatable: true,
            cssClass: 'icon-notebook',
            initialize: domainObject => {
                domainObject.configuration = {
                    defaultSort: 'oldest',
                    entries: {},
                    pageTitle: 'Page',
                    sections: [],
                    sectionTitle: 'Section',
                    type: 'General'
                };
            },
            form: [
                {
                    key: 'defaultSort',
                    name: 'Entry Sorting',
                    control: 'select',
                    options: [
                        {
                            name: 'Newest First',
                            value: "newest"
                        },
                        {
                            name: 'Oldest First',
                            value: "oldest"
                        }
                    ],
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "defaultSort"
                    ]
                },
                {
                    key: 'type',
                    name: 'Note book Type',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "type"
                    ]
                },
                {
                    key: 'sectionTitle',
                    name: 'Section Title',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "sectionTitle"
                    ]
                },
                {
                    key: 'pageTitle',
                    name: 'Page Title',
                    control: 'textfield',
                    cssClass: 'l-inline',
                    property: [
                        "configuration",
                        "pageTitle"
                    ]
                }
            ]
        };
        openmct.types.addType('notebook', notebookType);

        const snapshotContainer = new SnapshotContainer(openmct);
        const notebookSnapshotIndicator = new Vue ({
            components: {
                NotebookSnapshotIndicator
            },
            provide: {
                openmct,
                snapshotContainer
            },
            template: '<NotebookSnapshotIndicator></NotebookSnapshotIndicator>'
        });
        const indicator = {
            element: notebookSnapshotIndicator.$mount().$el,
            key: 'notebook-snapshot-indicator'
        };

        openmct.indicators.add(indicator);

        openmct.objectViews.addProvider({
            key: 'notebook-vue',
            name: 'Notebook View',
            cssClass: 'icon-notebook',
            canView: function (domainObject) {
                return domainObject.type === 'notebook';
            },
            view: function (domainObject) {
                let component;

                return {
                    show(container) {
                        component = new Vue({
                            el: container,
                            components: {
                                Notebook
                            },
                            provide: {
                                openmct,
                                domainObject,
                                snapshotContainer
                            },
                            template: '<Notebook></Notebook>'
                        });
                    },
                    destroy() {
                        component.$destroy();
                    }
                };
            }
        });
    };
}
