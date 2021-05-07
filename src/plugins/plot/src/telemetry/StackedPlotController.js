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

define([], function () {
    function StackedPlotController($scope, openmct, objectService, $element, exportImageService) {
        let tickWidth = 0;
        let composition;
        let currentRequest;
        let unlisten;
        let tickWidthMap = {};

        this.$element = $element;
        this.exportImageService = exportImageService;
        this.$scope = $scope;
        this.cursorGuide = false;

        $scope.telemetryObjects = [];

        function onDomainObjectChange(domainObject) {
            const thisRequest = {
                pending: 0
            };
            const telemetryObjects = $scope.telemetryObjects = [];
            const thisTickWidthMap = {};

            currentRequest = thisRequest;
            $scope.currentRequest = thisRequest;
            tickWidthMap = thisTickWidthMap;

            if (unlisten) {
                unlisten();
                unlisten = undefined;
            }

            function addChild(child) {
                const id = openmct.objects.makeKeyString(child.identifier);
                const legacyObject = openmct.legacyObject(child);

                thisTickWidthMap[id] = 0;
                telemetryObjects.push(legacyObject);
            }

            function removeChild(childIdentifier) {
                const id = openmct.objects.makeKeyString(childIdentifier);
                delete thisTickWidthMap[id];
                const childObj = telemetryObjects.filter(function (c) {
                    return c.getId() === id;
                })[0];
                if (childObj) {
                    const index = telemetryObjects.indexOf(childObj);
                    telemetryObjects.splice(index, 1);
                    $scope.$broadcast('plot:tickWidth', Math.max(...Object.values(tickWidthMap)));
                }
            }

            function compositionReorder(reorderPlan) {
                let oldComposition = telemetryObjects.slice();

                reorderPlan.forEach((reorder) => {
                    telemetryObjects[reorder.newIndex] = oldComposition[reorder.oldIndex];
                });
            }

            thisRequest.pending += 1;

            openmct.objects.get(domainObject.getId())
                .then(function (obj) {
                    thisRequest.pending -= 1;
                    if (thisRequest !== currentRequest) {
                        return;
                    }

                    composition = openmct.composition.get(obj);
                    composition.on('add', addChild);
                    composition.on('remove', removeChild);
                    composition.on('reorder', compositionReorder);
                    composition.load();
                    unlisten = function () {
                        composition.off('add', addChild);
                        composition.off('remove', removeChild);
                        composition.off('reorder', compositionReorder);
                    };
                });
        }

        function onCompositionChange(newComp, oldComp) {
            if (newComp !== oldComp) {

                $scope.telemetryObjects = [];

                objectService.getObjects(newComp).then(function (objects) {
                    newComp.forEach(function (id) {
                        $scope.telemetryObjects.push(objects[id]);
                    });
                });
            }
        }

        $scope.$watch('domainObject', onDomainObjectChange);
        $scope.$watch('domainObject.getModel().composition', onCompositionChange);

        $scope.$on('plot:tickWidth', function ($e, width) {
            const plotId = $e.targetScope.domainObject.getId();
            if (!Object.prototype.hasOwnProperty.call(tickWidthMap, plotId)) {
                return;
            }

            tickWidthMap[plotId] = Math.max(width, tickWidthMap[plotId]);
            const newTickWidth = Math.max(...Object.values(tickWidthMap));
            if (newTickWidth !== tickWidth || width !== tickWidth) {
                tickWidth = newTickWidth;
                $scope.$broadcast('plot:tickWidth', tickWidth);
            }
        });

        $scope.$on('plot:highlight:update', function ($e, point) {
            $scope.$broadcast('plot:highlight:set', point);
        });
    }

    StackedPlotController.prototype.exportJPG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportJPG(this.$element[0], 'stacked-plot.jpg', 'export-plot')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    StackedPlotController.prototype.exportPNG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportPNG(this.$element[0], 'stacked-plot.png', 'export-plot')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    StackedPlotController.prototype.toggleCursorGuide = function ($event) {
        this.cursorGuide = !this.cursorGuide;
        this.$scope.$broadcast('cursorguide', $event);
    };

    StackedPlotController.prototype.toggleGridLines = function ($event) {
        this.gridLines = !this.gridLines;
        this.$scope.$broadcast('toggleGridLines', $event);
    };

    return StackedPlotController;
});
