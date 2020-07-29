/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

/*global define*/

define([
    "./src/chart/MCTChartDirective",
    "./src/plot/MCTPlotDirective",
    './src/plot/MCTTicksDirective',
    "./src/telemetry/MCTOverlayPlot",
    "./src/telemetry/PlotController",
    "./src/telemetry/StackedPlotController",
    "./src/inspector/PlotInspector",
    "./src/inspector/PlotOptionsController",
    "./src/inspector/PlotLegendFormController",
    "./src/inspector/PlotYAxisFormController",
    "./src/inspector/PlotSeriesFormController",
    "./src/inspector/HideElementPoolDirective",
    "./src/services/ExportImageService",
    "./src/services/ViewportService",
    './src/PlotViewPolicy',
    "./res/templates/plot-options.html",
    "./res/templates/plot-options-browse.html",
    "./res/templates/plot-options-edit.html",
    "./res/templates/stacked-plot.html",
    "./res/templates/plot.html"
], function (
    MCTChartDirective,
    MCTPlotDirective,
    MCTTicksDirective,
    MCTOverlayPlot,
    PlotController,
    StackedPlotController,
    PlotInspector,
    PlotOptionsController,
    PlotLegendFormController,
    PlotYAxisFormController,
    PlotSeriesFormController,
    HideElementPool,
    ExportImageService,
    ViewportService,
    PlotViewPolicy,
    plotOptionsTemplate,
    plotOptionsBrowseTemplate,
    plotOptionsEditTemplate,
    StackedPlotTemplate,
    PlotTemplate
) {

    var installed = false;

    function PlotPlugin() {
        return function install(openmct) {
            if (installed) {
                return;
            }
            installed = true;

            openmct.legacyRegistry.register("openmct/plot", {
                "name": "Plot view for telemetry, reborn",
                "extensions": {
                    "policies": [
                        {
                            "category": "view",
                            "implementation": PlotViewPolicy,
                            "depends": [
                                "openmct"
                            ]
                        }
                    ],
                    "views": [
                        {
                            "name": "Plot",
                            "key": "plot-single",
                            "cssClass": "icon-telemetry",
                            "template": PlotTemplate,
                            "needs": [
                                "telemetry"
                            ],
                            "delegation": false,
                            "priority": "mandatory"
                        },
                        {
                            "name": "Overlay Plot",
                            "key": "overlayPlot",
                            "cssClass": "icon-plot-overlay",
                            "type": "telemetry.plot.overlay",
                            "template": PlotTemplate,
                            "editable": true
                        },
                        {
                            "name": "Stacked Plot",
                            "key": "stackedPlot",
                            "cssClass": "icon-plot-stacked",
                            "type": "telemetry.plot.stacked",
                            "template": StackedPlotTemplate,
                            "editable": true
                        }
                    ],
                    "directives": [
                        {
                            "key": "mctTicks",
                            "implementation": MCTTicksDirective,
                            "depends": []
                        },
                        {
                            "key": "mctChart",
                            "implementation": MCTChartDirective,
                            "depends": [
                                "$interval",
                                "$log"
                            ]
                        },
                        {
                            "key": "mctPlot",
                            "implementation": MCTPlotDirective,
                            "depends": [],
                            "templateUrl": "templates/mct-plot.html"
                        },
                        {
                            "key": "mctOverlayPlot",
                            "implementation": MCTOverlayPlot,
                            "depends": []
                        },
                        {
                            "key": "hideElementPool",
                            "implementation": HideElementPool,
                            "depends": []
                        }
                    ],
                    "controllers": [
                        {
                            "key": "PlotController",
                            "implementation": PlotController,
                            "depends": [
                                "$scope",
                                "$element",
                                "$location",
                                "formatService",
                                "openmct",
                                "objectService",
                                "exportImageService",
                                "viewportService"
                            ]
                        },
                        {
                            "key": "StackedPlotController",
                            "implementation": StackedPlotController,
                            "depends": [
                                "$scope",
                                "openmct",
                                "objectService",
                                "$element",
                                "exportImageService"
                            ]
                        },
                        {
                            "key": "PlotOptionsController",
                            "implementation": PlotOptionsController,
                            "depends": [
                                "$scope",
                                "openmct",
                                "$timeout"
                            ]
                        },
                        {
                            key: "PlotLegendFormController",
                            implementation: PlotLegendFormController,
                            depends: [
                                "$scope",
                                "openmct",
                                "$attrs"
                            ]
                        },
                        {
                            key: "PlotYAxisFormController",
                            implementation: PlotYAxisFormController,
                            depends: [
                                "$scope",
                                "openmct",
                                "$attrs"
                            ]
                        },
                        {
                            key: "PlotSeriesFormController",
                            implementation: PlotSeriesFormController,
                            depends: [
                                "$scope",
                                "openmct",
                                "$attrs"
                            ]
                        }
                    ],
                    "services": [
                        {
                            "key": "exportImageService",
                            "implementation": ExportImageService,
                            "depends": [
                                "dialogService"
                            ]
                        },
                        {
                            "key": "viewportService",
                            "implementation": ViewportService,
                            "depends": [
                                "openmct"
                            ]
                        }
                    ],
                    "types": [
                        {
                            "key": "telemetry.plot.overlay",
                            "name": "Overlay Plot",
                            "cssClass": "icon-plot-overlay",
                            "description": "Combine multiple telemetry elements and view them together as a plot with common X and Y axes. Can be added to Display Layouts.",
                            "features": "creation",
                            "contains": [
                                {
                                    "has": "telemetry"
                                }
                            ],
                            "model": {
                                composition: [],
                                configuration: {
                                    series: [],
                                    yAxis: {},
                                    xAxis: {}
                                }
                            },
                            "properties": [],
                            "inspector": "plot-options",
                            "priority": 891
                        },
                        {
                            "key": "telemetry.plot.stacked",
                            "name": "Stacked Plot",
                            "cssClass": "icon-plot-stacked",
                            "description": "Combine multiple telemetry elements and view them together as a plot with a common X axis and individual Y axes. Can be added to Display Layouts.",
                            "features": "creation",
                            "contains": [
                                "telemetry.plot.overlay",
                                {"has": "telemetry"}
                            ],
                            "model": {
                                "composition": [],
                                "configuration": {}
                            },
                            "properties": [],
                            "priority": 890
                        }
                    ],
                    "representations": [
                        {
                            "key": "plot-options",
                            "template": plotOptionsTemplate
                        },
                        {
                            "key": "plot-options-browse",
                            "template": plotOptionsBrowseTemplate
                        },
                        {
                            "key": "plot-options-edit",
                            "template": plotOptionsEditTemplate
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable("openmct/plot");
        };
    }

    return PlotPlugin;
});
