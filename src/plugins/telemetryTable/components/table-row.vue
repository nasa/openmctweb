/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
<tr
    :style="{ top: rowTop }"
    class="noselect"
    :class="[
        rowClass,
        {'is-selected': marked}
    ]"
    v-on="listeners"
>
    <component
        :is="componentList[key]"
        v-for="(title, key) in headers"
        :key="key"
        :column-key="key"
        :style="columnWidths[key] === undefined ? {} : { width: columnWidths[key] + 'px', 'max-width': columnWidths[key] + 'px'}"
        :class="[cellLimitClasses[key], selectableColumns[key] ? 'is-selectable' : '']"
        :object-path="objectPath"
        :row="row"
    />
</tr>
</template>

<script>
import TableCell from './table-cell.vue';

export default {
    components: {
        TableCell
    },
    inject: ['openmct'],
    props: {
        headers: {
            type: Object,
            required: true
        },
        row: {
            type: Object,
            required: true
        },
        columnWidths: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        },
        rowIndex: {
            type: Number,
            required: false,
            default: undefined
        },
        rowOffset: {
            type: Number,
            required: false,
            default: 0
        },
        rowHeight: {
            type: Number,
            required: false,
            default: 0
        },
        marked: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data: function () {
        return {
            rowTop: (this.rowOffset + this.rowIndex) * this.rowHeight + 'px',
            rowClass: this.row.getRowClass(),
            cellLimitClasses: this.row.getCellLimitClasses(),
            componentList: Object.keys(this.headers).reduce((components, header) => {
                components[header] = this.row.getCellComponentName(header) || 'table-cell';

                return components;
            }, {}),
            selectableColumns: Object.keys(this.row.columns).reduce((selectable, columnKeys) => {
                selectable[columnKeys] = this.row.columns[columnKeys].selectable;

                return selectable;
            }, {}),
            actionsViewContext: {
                getViewContext: () => {
                    return {
                        viewHistoricalData: true,
                        viewDatumAction: true,
                        getDatum: this.getDatum
                    };
                }
            }
        };
    },
    computed: {
        listeners() {
            let listenersObject = {
                click: this.markRow
            };

            if (this.row.getContextMenuActions().length) {
                listenersObject.contextmenu = this.showContextMenu;
            }

            return listenersObject;
        }
    },
    // TODO: use computed properties
    watch: {
        rowOffset: 'calculateRowTop',
        row: {
            handler: 'formatRow',
            deep: true
        }
    },
    methods: {
        calculateRowTop: function (rowOffset) {
            this.rowTop = (rowOffset + this.rowIndex) * this.rowHeight + 'px';
        },
        formatRow: function (row) {
            this.rowClass = row.getRowClass();
            this.cellLimitClasses = row.getCellLimitClasses();
        },
        markRow: function (event) {
            let keyCtrlModifier = false;

            if (event.ctrlKey || event.metaKey) {
                keyCtrlModifier = true;
            }

            if (event.shiftKey) {
                this.$emit('markMultipleConcurrent', this.rowIndex);
            } else {
                if (this.marked) {
                    this.$emit('unmark', this.rowIndex, keyCtrlModifier);
                } else {
                    this.$emit('mark', this.rowIndex, keyCtrlModifier);
                }
            }
        },
        selectCell(element, columnKey) {
            if (this.selectableColumns[columnKey]) {
                //TODO: This is a hack. Cannot get parent this way.
                this.openmct.selection.select([{
                    element: element,
                    context: {
                        type: 'table-cell',
                        row: this.row.objectKeyString,
                        column: columnKey
                    }
                }, {
                    element: this.openmct.layout.$refs.browseObject.$el,
                    context: {
                        item: this.openmct.router.path[0]
                    }
                }], false);
                event.stopPropagation();
            }
        },
        getDatum() {
            return this.row.fullDatum;
        },
        showContextMenu: function (event) {
            event.preventDefault();

            this.markRow(event);

            this.row.getContextualDomainObject(this.openmct, this.row.objectKeyString).then(domainObject => {
                let contextualObjectPath = this.objectPath.slice();
                contextualObjectPath.unshift(domainObject);

                let actionsCollection = this.openmct.actions.get(contextualObjectPath, this.actionsViewContext);
                let allActions = actionsCollection.getActionsObject();
                let applicableActions = this.row.getContextMenuActions().map(key => allActions[key]);

                if (applicableActions.length) {
                    this.openmct.menus.showMenu(event.x, event.y, applicableActions);
                }
            });
        }
    }
};
</script>
