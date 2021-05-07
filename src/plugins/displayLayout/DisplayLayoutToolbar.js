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

define(['lodash'], function (_) {
    function DisplayLayoutToolbar(openmct) {
        return {
            name: "Display Layout Toolbar",
            key: "layout",
            description: "A toolbar for objects inside a display layout.",
            forSelection: function (selection) {
                if (!selection || selection.length === 0) {
                    return false;
                }

                let selectionPath = selection[0];
                let selectedObject = selectionPath[0];
                let selectedParent = selectionPath[1];

                // Apply the layout toolbar if the selected object is inside a layout, or the main layout is selected.
                return (selectedParent && selectedParent.context.item && selectedParent.context.item.type === 'layout')
                    || (selectedObject.context.item && selectedObject.context.item.type === 'layout');
            },
            toolbar: function (selectedObjects) {
                const DIALOG_FORM = {
                    'text': {
                        name: "Text Element Properties",
                        sections: [
                            {
                                rows: [
                                    {
                                        key: "text",
                                        control: "textfield",
                                        name: "Text",
                                        required: true
                                    }
                                ]
                            }
                        ]
                    },
                    'image': {
                        name: "Image Properties",
                        sections: [
                            {
                                rows: [
                                    {
                                        key: "url",
                                        control: "textfield",
                                        name: "Image URL",
                                        "cssClass": "l-input-lg",
                                        required: true
                                    }
                                ]
                            }
                        ]
                    }
                };
                const VIEW_TYPES = {
                    'telemetry-view': {
                        value: 'telemetry-view',
                        name: 'Alphanumeric',
                        class: 'icon-alphanumeric'
                    },
                    'telemetry.plot.overlay': {
                        value: 'telemetry.plot.overlay',
                        name: 'Overlay Plot',
                        class: "icon-plot-overlay"
                    },
                    'telemetry.plot.stacked': {
                        value: "telemetry.plot.stacked",
                        name: "Stacked Plot",
                        class: "icon-plot-stacked"
                    },
                    'table': {
                        value: 'table',
                        name: 'Table',
                        class: 'icon-tabular-realtime'
                    }
                };
                const APPLICABLE_VIEWS = {
                    'telemetry-view': [
                        VIEW_TYPES['telemetry.plot.overlay'],
                        VIEW_TYPES['telemetry.plot.stacked'],
                        VIEW_TYPES.table
                    ],
                    'telemetry.plot.overlay': [
                        VIEW_TYPES['telemetry.plot.stacked'],
                        VIEW_TYPES.table,
                        VIEW_TYPES['telemetry-view']
                    ],
                    'telemetry.plot.stacked': [
                        VIEW_TYPES['telemetry.plot.overlay'],
                        VIEW_TYPES.table,
                        VIEW_TYPES['telemetry-view']
                    ],
                    'table': [
                        VIEW_TYPES['telemetry.plot.overlay'],
                        VIEW_TYPES['telemetry.plot.stacked'],
                        VIEW_TYPES['telemetry-view']
                    ],
                    'telemetry-view-multi': [
                        VIEW_TYPES['telemetry.plot.overlay'],
                        VIEW_TYPES['telemetry.plot.stacked'],
                        VIEW_TYPES.table
                    ],
                    'telemetry.plot.overlay-multi': [
                        VIEW_TYPES['telemetry.plot.stacked']
                    ]
                };

                function getUserInput(form) {
                    return openmct.$injector.get('dialogService').getUserInput(form, {});
                }

                function getPath(selectionPath) {
                    return `configuration.items[${selectionPath[0].context.index}]`;
                }

                function getAllOfType(selection, specificType) {
                    return selection.filter(selectionPath => {
                        let type = selectionPath[0].context.layoutItem.type;

                        return type === specificType;
                    });
                }

                function getAllTypes(selection) {
                    return selection.filter(selectionPath => {
                        let type = selectionPath[0].context.layoutItem.type;

                        return type === 'text-view'
                            || type === 'telemetry-view'
                            || type === 'box-view'
                            || type === 'image-view'
                            || type === 'line-view'
                            || type === 'subobject-view';
                    });
                }

                function getAddButton(selection, selectionPath) {
                    if (selection.length === 1) {
                        selectionPath = selectionPath || selection[0];

                        return {
                            control: "menu",
                            domainObject: selectionPath[0].context.item,
                            method: function (option) {
                                let name = option.name.toLowerCase();
                                let form = DIALOG_FORM[name];
                                if (form) {
                                    getUserInput(form)
                                        .then(element => selectionPath[0].context.addElement(name, element));
                                } else {
                                    selectionPath[0].context.addElement(name);
                                }
                            },
                            key: "add",
                            icon: "icon-plus",
                            label: "Add",
                            options: [
                                {
                                    "name": "Box",
                                    "class": "icon-box-round-corners"
                                },
                                {
                                    "name": "Line",
                                    "class": "icon-line-horz"
                                },
                                {
                                    "name": "Text",
                                    "class": "icon-font"
                                },
                                {
                                    "name": "Image",
                                    "class": "icon-image"
                                }
                            ]
                        };
                    }
                }

                function getToggleFrameButton(selectedParent, selection) {
                    return {
                        control: "toggle-button",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath =>
                            selectionPath[0].context.layoutItem.type === 'subobject-view'
                        ),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".hasFrame";
                        },
                        options: [
                            {
                                value: false,
                                icon: 'icon-frame-show',
                                title: "Frame visible"
                            },
                            {
                                value: true,
                                icon: 'icon-frame-hide',
                                title: "Frame hidden"
                            }
                        ]
                    };
                }

                function getRemoveButton(selectedParent, selectionPath, selection) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        icon: "icon-trash",
                        title: "Delete the selected object",
                        method: function () {
                            let removeItem = selectionPath[1].context.removeItem;
                            let prompt = openmct.overlays.dialog({
                                iconClass: 'alert',
                                message: `Warning! This action will remove this item from the Display Layout. Do you want to continue?`,
                                buttons: [
                                    {
                                        label: 'Ok',
                                        emphasis: 'true',
                                        callback: function () {
                                            removeItem(getAllTypes(selection));
                                            prompt.dismiss();
                                        }
                                    },
                                    {
                                        label: 'Cancel',
                                        callback: function () {
                                            prompt.dismiss();
                                        }
                                    }
                                ]
                            });
                        }
                    };
                }

                function getStackOrder(selectedParent, selectionPath) {
                    return {
                        control: "menu",
                        domainObject: selectedParent,
                        icon: "icon-layers",
                        title: "Move the selected object above or below other objects",
                        options: [
                            {
                                name: "Move to Top",
                                value: "top",
                                class: "icon-arrow-double-up"
                            },
                            {
                                name: "Move Up",
                                value: "up",
                                class: "icon-arrow-up"
                            },
                            {
                                name: "Move Down",
                                value: "down",
                                class: "icon-arrow-down"
                            },
                            {
                                name: "Move to Bottom",
                                value: "bottom",
                                class: "icon-arrow-double-down"
                            }
                        ],
                        method: function (option) {
                            selectionPath[1].context.orderItem(option.value, getAllTypes(selectedObjects));
                        }
                    };
                }

                function getXInput(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            applicableSelectedItems: getAllTypes(selection),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".x";
                            },
                            label: "X:",
                            title: "X position"
                        };
                    }
                }

                function getYInput(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            applicableSelectedItems: getAllTypes(selection),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".y";
                            },
                            label: "Y:",
                            title: "Y position"
                        };
                    }
                }

                function getWidthInput(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: 'input',
                            type: 'number',
                            domainObject: selectedParent,
                            applicableSelectedItems: getAllTypes(selection),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".width";
                            },
                            label: 'W:',
                            title: 'Resize object width'
                        };
                    }
                }

                function getHeightInput(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: 'input',
                            type: 'number',
                            domainObject: selectedParent,
                            applicableSelectedItems: getAllTypes(selection),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".height";
                            },
                            label: 'H:',
                            title: 'Resize object height'
                        };
                    }
                }

                function getX2Input(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            applicableSelectedItems: selection.filter(selectionPath => {
                                return selectionPath[0].context.layoutItem.type === 'line-view';
                            }),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".x2";
                            },
                            label: "X2:",
                            title: "X2 position"
                        };
                    }
                }

                function getY2Input(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            applicableSelectedItems: selection.filter(selectionPath => {
                                return selectionPath[0].context.layoutItem.type === 'line-view';
                            }),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".y2";
                            },
                            label: "Y2:",
                            title: "Y2 position"
                        };
                    }
                }

                function getTextButton(selectedParent, selection) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'text-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath);
                        },
                        icon: "icon-pencil",
                        title: "Edit text properties",
                        dialog: DIALOG_FORM.text
                    };
                }

                function getTelemetryValueMenu(selectionPath, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "select-menu",
                            domainObject: selectionPath[1].context.item,
                            applicableSelectedItems: selection.filter(path => {
                                return path[0].context.layoutItem.type === 'telemetry-view';
                            }),
                            property: function (path) {
                                return getPath(path) + ".value";
                            },
                            title: "Set value",
                            options: openmct.telemetry.getMetadata(selectionPath[0].context.item).values().map(value => {
                                return {
                                    name: value.name,
                                    value: value.key
                                };
                            })
                        };
                    }
                }

                function getDisplayModeMenu(selectedParent, selection) {
                    if (selection.length === 1) {
                        return {
                            control: "select-menu",
                            domainObject: selectedParent,
                            applicableSelectedItems: selection.filter(selectionPath => {
                                return selectionPath[0].context.layoutItem.type === 'telemetry-view';
                            }),
                            property: function (selectionPath) {
                                return getPath(selectionPath) + ".displayMode";
                            },
                            title: "Set display mode",
                            options: [
                                {
                                    name: 'Label + Value',
                                    value: 'all'
                                },
                                {
                                    name: "Label only",
                                    value: "label"
                                },
                                {
                                    name: "Value only",
                                    value: "value"
                                }
                            ]
                        };
                    }
                }

                function getDuplicateButton(selectedParent, selectionPath, selection) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        icon: "icon-duplicate",
                        title: "Duplicate the selected object",
                        method: function () {
                            let duplicateItem = selectionPath[1].context.duplicateItem;

                            duplicateItem(selection);
                        }
                    };
                }

                function getPropertyFromPath(object, path) {
                    let splitPath = path.split('.');
                    let property = Object.assign({}, object);

                    while (splitPath.length && property) {
                        property = property[splitPath.shift()];
                    }

                    return property;
                }

                function areAllViews(type, path, selection) {
                    let allTelemetry = true;

                    selection.forEach(selectedItem => {
                        let selectedItemContext = selectedItem[0].context;

                        if (getPropertyFromPath(selectedItemContext, path) !== type) {
                            allTelemetry = false;
                        }
                    });

                    return allTelemetry;
                }

                function getToggleUnitsButton(selectedParent, selection) {
                    let applicableItems = getAllOfType(selection, 'telemetry-view');
                    applicableItems = unitsOnly(applicableItems);
                    if (!applicableItems.length) {
                        return;
                    }

                    return {
                        control: "toggle-button",
                        domainObject: selectedParent,
                        applicableSelectedItems: applicableItems,
                        property: function (selectionPath) {
                            return getPath(selectionPath) + '.showUnits';
                        },
                        options: [
                            {
                                value: true,
                                icon: 'icon-eye-open',
                                title: "Show units"
                            },
                            {
                                value: false,
                                icon: 'icon-eye-disabled',
                                title: "Hide units"
                            }
                        ]
                    };
                }

                function unitsOnly(items) {
                    let results = items.filter((item) => {
                        let currentItem = item[0];
                        let metadata = openmct.telemetry.getMetadata(currentItem.context.item);
                        if (!metadata) {
                            return false;
                        }

                        let hasUnits = metadata
                            .valueMetadatas
                            .filter((metadatum) => metadatum.unit)
                            .length;

                        return hasUnits > 0;
                    });

                    return results;
                }

                function getViewSwitcherMenu(selectedParent, selectionPath, selection) {
                    if (selection.length === 1) {
                        let displayLayoutContext = selectionPath[1].context;
                        let selectedItemContext = selectionPath[0].context;
                        let selectedItemType = selectedItemContext.item.type;

                        if (selectedItemContext.layoutItem.type === 'telemetry-view') {
                            selectedItemType = 'telemetry-view';
                        }

                        let viewOptions = APPLICABLE_VIEWS[selectedItemType];

                        if (viewOptions) {
                            return {
                                control: "menu",
                                domainObject: selectedParent,
                                icon: "icon-object",
                                title: "Switch the way this telemetry is displayed",
                                options: viewOptions,
                                method: function (option) {
                                    displayLayoutContext.switchViewType(selectedItemContext, option.value, selection);
                                }
                            };
                        }
                    } else if (selection.length > 1) {
                        if (areAllViews('telemetry-view', 'layoutItem.type', selection)) {
                            let displayLayoutContext = selectionPath[1].context;

                            return {
                                control: "menu",
                                domainObject: selectedParent,
                                icon: "icon-object",
                                title: "Merge into a telemetry table or plot",
                                options: APPLICABLE_VIEWS['telemetry-view-multi'],
                                method: function (option) {
                                    displayLayoutContext.mergeMultipleTelemetryViews(selection, option.value);
                                }
                            };
                        } else if (areAllViews('telemetry.plot.overlay', 'item.type', selection)) {
                            let displayLayoutContext = selectionPath[1].context;

                            return {
                                control: "menu",
                                domainObject: selectedParent,
                                icon: "icon-object",
                                title: "Merge into a stacked plot",
                                options: APPLICABLE_VIEWS['telemetry.plot.overlay-multi'],
                                method: function (option) {
                                    displayLayoutContext.mergeMultipleOverlayPlots(selection, option.value);
                                }
                            };
                        }
                    }
                }

                function getToggleGridButton(selection, selectionPath) {
                    const ICON_GRID_SHOW = 'icon-grid-on';
                    const ICON_GRID_HIDE = 'icon-grid-off';

                    let displayLayoutContext;

                    if (selection.length === 1 && selectionPath === undefined) {
                        displayLayoutContext = selection[0][0].context;
                    } else {
                        displayLayoutContext = selectionPath[1].context;
                    }

                    return {
                        control: "button",
                        domainObject: displayLayoutContext.item,
                        icon: ICON_GRID_SHOW,
                        method: function () {
                            displayLayoutContext.toggleGrid();

                            this.icon = this.icon === ICON_GRID_SHOW
                                ? ICON_GRID_HIDE
                                : ICON_GRID_SHOW;
                        },
                        secondary: true
                    };
                }

                function getSeparator() {
                    return {
                        control: "separator"
                    };
                }

                function isMainLayoutSelected(selectionPath) {
                    let selectedObject = selectionPath[0].context.item;

                    return selectedObject && selectedObject.type === 'layout'
                        && !selectionPath[0].context.layoutItem;
                }

                if (isMainLayoutSelected(selectedObjects[0])) {
                    return [
                        getToggleGridButton(selectedObjects),
                        getAddButton(selectedObjects)];
                }

                let toolbar = {
                    'add-menu': [],
                    'text': [],
                    'url': [],
                    'viewSwitcher': [],
                    'toggle-frame': [],
                    'display-mode': [],
                    'telemetry-value': [],
                    'style': [],
                    'position': [],
                    'duplicate': [],
                    'unit-toggle': [],
                    'remove': [],
                    'toggle-grid': []
                };

                selectedObjects.forEach(selectionPath => {
                    let selectedParent = selectionPath[1].context.item;
                    let layoutItem = selectionPath[0].context.layoutItem;

                    if (!layoutItem || selectedParent.locked) {
                        return;
                    }

                    if (layoutItem.type === 'subobject-view') {
                        if (toolbar['add-menu'].length === 0 && selectionPath[0].context.item.type === 'layout') {
                            toolbar['add-menu'] = [getAddButton(selectedObjects, selectionPath)];
                        }

                        if (toolbar['toggle-frame'].length === 0) {
                            toolbar['toggle-frame'] = [getToggleFrameButton(selectedParent, selectedObjects)];
                        }

                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getHeightInput(selectedParent, selectedObjects),
                                getWidthInput(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }

                        if (toolbar.viewSwitcher.length === 0) {
                            toolbar.viewSwitcher = [getViewSwitcherMenu(selectedParent, selectionPath, selectedObjects)];
                        }
                    } else if (layoutItem.type === 'telemetry-view') {
                        if (toolbar['display-mode'].length === 0) {
                            toolbar['display-mode'] = [getDisplayModeMenu(selectedParent, selectedObjects)];
                        }

                        if (toolbar['telemetry-value'].length === 0) {
                            toolbar['telemetry-value'] = [getTelemetryValueMenu(selectionPath, selectedObjects)];
                        }

                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getHeightInput(selectedParent, selectedObjects),
                                getWidthInput(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }

                        if (toolbar.viewSwitcher.length === 0) {
                            toolbar.viewSwitcher = [getViewSwitcherMenu(selectedParent, selectionPath, selectedObjects)];
                        }

                        if (toolbar['unit-toggle'].length === 0) {
                            let toggleUnitsButton = getToggleUnitsButton(selectedParent, selectedObjects);
                            if (toggleUnitsButton) {
                                toolbar['unit-toggle'] = [toggleUnitsButton];
                            }
                        }
                    } else if (layoutItem.type === 'text-view') {
                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getHeightInput(selectedParent, selectedObjects),
                                getWidthInput(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.text.length === 0) {
                            toolbar.text = [getTextButton(selectedParent, selectedObjects)];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }
                    } else if (layoutItem.type === 'box-view') {
                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getHeightInput(selectedParent, selectedObjects),
                                getWidthInput(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }
                    } else if (layoutItem.type === 'image-view') {
                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getHeightInput(selectedParent, selectedObjects),
                                getWidthInput(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }
                    } else if (layoutItem.type === 'line-view') {
                        if (toolbar.position.length === 0) {
                            toolbar.position = [
                                getStackOrder(selectedParent, selectionPath),
                                getXInput(selectedParent, selectedObjects),
                                getYInput(selectedParent, selectedObjects),
                                getX2Input(selectedParent, selectedObjects),
                                getY2Input(selectedParent, selectedObjects)
                            ];
                        }

                        if (toolbar.remove.length === 0) {
                            toolbar.remove = [getRemoveButton(selectedParent, selectionPath, selectedObjects)];
                        }
                    }

                    if (toolbar.duplicate.length === 0) {
                        toolbar.duplicate = [getDuplicateButton(selectedParent, selectionPath, selectedObjects)];
                    }

                    if (toolbar['toggle-grid'].length === 0) {
                        toolbar['toggle-grid'] = [getToggleGridButton(selectedObjects, selectionPath)];
                    }
                });

                let toolbarArray = Object.values(toolbar);

                return _.flatten(toolbarArray.reduce((accumulator, group, index) => {
                    group = group.filter(control => control !== undefined);

                    if (group.length > 0) {
                        accumulator.push(group);

                        if (index < toolbarArray.length - 1) {
                            accumulator.push(getSeparator());
                        }
                    }

                    return accumulator;
                }, []));
            }
        };
    }

    return DisplayLayoutToolbar;
});
