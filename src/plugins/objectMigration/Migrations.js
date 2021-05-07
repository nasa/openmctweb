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

define([
    'uuid'
], function (
    uuid
) {
    return function Migrations(openmct) {
        function getColumnNameKeyMap(domainObject) {
            let composition = openmct.composition.get(domainObject);
            if (composition) {
                return composition.load().then(composees => {
                    return composees.reduce((nameKeyMap, composee) => {
                        let metadata = openmct.telemetry.getMetadata(composee);
                        if (metadata !== undefined) {
                            metadata.values().forEach(value => {
                                nameKeyMap[value.name] = value.key;
                            });
                        }

                        return nameKeyMap;
                    }, {});
                });
            } else {
                return Promise.resolve([]);
            }
        }

        function isTelemetry(domainObject) {
            if (openmct.telemetry.isTelemetryObject(domainObject)
                && domainObject.type !== 'summary-widget'
                && domainObject.type !== 'example.imagery') {
                return true;
            } else {
                return false;
            }
        }

        function migrateDisplayLayout(domainObject, childObjects) {
            const DEFAULT_GRID_SIZE = [32, 32];
            let migratedObject = Object.assign({}, domainObject);
            let panels = migratedObject.configuration.layout.panels;
            let items = [];

            Object.keys(panels).forEach(key => {
                let panel = panels[key];
                let childDomainObject = childObjects[key];
                let identifier = undefined;

                if (isTelemetry(childDomainObject)) {
                    // If object is a telemetry point, convert it to a plot and
                    // replace the object in migratedObject composition with the plot.
                    identifier = {
                        key: uuid(),
                        namespace: migratedObject.identifier.namespace
                    };
                    let plotObject = {
                        identifier: identifier,
                        location: childDomainObject.location,
                        name: childDomainObject.name,
                        type: "telemetry.plot.overlay"
                    };
                    let plotType = openmct.types.get('telemetry.plot.overlay');
                    plotType.definition.initialize(plotObject);
                    plotObject.composition.push(childDomainObject.identifier);
                    openmct.objects.mutate(plotObject, 'persisted', Date.now());

                    let keyString = openmct.objects.makeKeyString(childDomainObject.identifier);
                    let clonedComposition = Object.assign([], migratedObject.composition);
                    clonedComposition.forEach((objIdentifier, index) => {
                        if (openmct.objects.makeKeyString(objIdentifier) === keyString) {
                            migratedObject.composition[index] = plotObject.identifier;
                        }
                    });
                }

                items.push({
                    width: panel.dimensions[0],
                    height: panel.dimensions[1],
                    x: panel.position[0],
                    y: panel.position[1],
                    identifier: identifier || childDomainObject.identifier,
                    id: uuid(),
                    type: 'subobject-view',
                    hasFrame: panel.hasFrame
                });
            });

            migratedObject.configuration.items = items;
            migratedObject.configuration.layoutGrid = migratedObject.layoutGrid || DEFAULT_GRID_SIZE;
            delete migratedObject.layoutGrid;
            delete migratedObject.configuration.layout;

            return migratedObject;
        }

        function migrateFixedPositionConfiguration(elements, telemetryObjects, gridSize) {
            const DEFAULT_STROKE = "transparent";
            const DEFAULT_SIZE = "13px";
            const DEFAULT_COLOR = "";
            const DEFAULT_FILL = "";
            let items = [];

            elements.forEach(element => {
                let item = {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    id: uuid()
                };

                if (!element.useGrid) {
                    item.x = Math.round(item.x / gridSize[0]);
                    item.y = Math.round(item.y / gridSize[1]);
                    item.width = Math.round(item.width / gridSize[0]);
                    item.height = Math.round(item.height / gridSize[1]);
                }

                if (element.type === "fixed.telemetry") {
                    item.type = "telemetry-view";
                    item.stroke = element.stroke || DEFAULT_STROKE;
                    item.fill = element.fill || DEFAULT_FILL;
                    item.color = element.color || DEFAULT_COLOR;
                    item.size = element.size || DEFAULT_SIZE;
                    item.identifier = telemetryObjects[element.id].identifier;
                    item.displayMode = element.titled ? 'all' : 'value';
                    item.value = openmct.telemetry.getMetadata(telemetryObjects[element.id]).getDefaultDisplayValue();
                } else if (element.type === 'fixed.box') {
                    item.type = "box-view";
                    item.stroke = element.stroke || DEFAULT_STROKE;
                    item.fill = element.fill || DEFAULT_FILL;
                } else if (element.type === 'fixed.line') {
                    item.type = "line-view";
                    item.x2 = element.x2;
                    item.y2 = element.y2;
                    item.stroke = element.stroke || DEFAULT_STROKE;
                    delete item.height;
                    delete item.width;
                } else if (element.type === 'fixed.text') {
                    item.type = "text-view";
                    item.text = element.text;
                    item.stroke = element.stroke || DEFAULT_STROKE;
                    item.fill = element.fill || DEFAULT_FILL;
                    item.color = element.color || DEFAULT_COLOR;
                    item.size = element.size || DEFAULT_SIZE;
                } else if (element.type === 'fixed.image') {
                    item.type = "image-view";
                    item.url = element.url;
                    item.stroke = element.stroke || DEFAULT_STROKE;
                }

                items.push(item);
            });

            return items;
        }

        return [
            {
                check(domainObject) {
                    return domainObject.type === 'layout'
                        && domainObject.configuration
                        && domainObject.configuration.layout;
                },
                migrate(domainObject) {
                    let childObjects = {};
                    let promises = Object.keys(domainObject.configuration.layout.panels).map(key => {
                        return openmct.objects.get(key)
                            .then(object => {
                                childObjects[key] = object;
                            });
                    });

                    return Promise.all(promises)
                        .then(function () {
                            return migrateDisplayLayout(domainObject, childObjects);
                        });
                }
            },
            {
                check(domainObject) {
                    return domainObject.type === 'telemetry.fixed'
                        && domainObject.configuration
                        && domainObject.configuration['fixed-display'];
                },
                migrate(domainObject) {
                    const DEFAULT_GRID_SIZE = [64, 16];
                    let newLayoutObject = {
                        identifier: domainObject.identifier,
                        location: domainObject.location,
                        name: domainObject.name,
                        type: "layout"
                    };
                    let gridSize = domainObject.layoutGrid || DEFAULT_GRID_SIZE;
                    let layoutType = openmct.types.get('layout');
                    layoutType.definition.initialize(newLayoutObject);
                    newLayoutObject.composition = domainObject.composition;
                    newLayoutObject.configuration.layoutGrid = gridSize;

                    let elements = domainObject.configuration['fixed-display'].elements;
                    let telemetryObjects = {};
                    let promises = elements.map(element => {
                        if (element.id) {
                            return openmct.objects.get(element.id)
                                .then(object => {
                                    telemetryObjects[element.id] = object;
                                });
                        } else {
                            return Promise.resolve(false);
                        }
                    });

                    return Promise.all(promises)
                        .then(function () {
                            newLayoutObject.configuration.items =
                                migrateFixedPositionConfiguration(elements, telemetryObjects, gridSize);

                            return newLayoutObject;
                        });
                }
            },
            {
                check(domainObject) {
                    return domainObject.type === 'table'
                        && domainObject.configuration
                        && domainObject.configuration.table;
                },
                migrate(domainObject) {
                    let currentTableConfiguration = domainObject.configuration.table || {};
                    let currentColumnConfiguration = currentTableConfiguration.columns || {};

                    return getColumnNameKeyMap(domainObject).then(nameKeyMap => {
                        let hiddenColumns = Object.keys(currentColumnConfiguration).filter(columnName => {
                            return currentColumnConfiguration[columnName] === false;
                        }).reduce((hiddenColumnsMap, hiddenColumnName) => {
                            let key = nameKeyMap[hiddenColumnName];
                            hiddenColumnsMap[key] = true;

                            return hiddenColumnsMap;
                        }, {});

                        domainObject.configuration.hiddenColumns = hiddenColumns;
                        delete domainObject.configuration.table;

                        return domainObject;
                    });
                }
            }
        ];
    };
});
