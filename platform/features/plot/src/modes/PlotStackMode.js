/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define(
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStackGroup"],
    (SubPlot, PlotPalette, PlotPanZoomStackGroup) => {

        /**
         * Handles plotting in Stacked mode. In stacked mode, there
         * is one sub-plot for each plotted object.
         * @memberof platform/features/plot
         * @constructor
         * @implements {platform/features/plot.PlotModeHandler}
         * @param {DomainObject[]} the domain objects to be plotted
         */
        class PlotStackMode {
          constructor(telemetryObjects, subPlotFactory) {

            this.panZoomStackGroup =
                new PlotPanZoomStackGroup(telemetryObjects.length);

            this.subplots = telemetryObjects.map( (telemetryObject, i) => {
                    return subPlotFactory.createSubPlot(
                        [telemetryObject],
                        self.panZoomStackGroup.getPanZoomStack(i)
                    );
                });
        }

        plotTelemetryTo(subplot, prepared, index) {
            let buffer = prepared.getLineBuffers()[index];

            // Track the domain offset, used to bias domain values
            // to minimize loss of precision when converted to 32-bit
            // floating point values for display.
            subplot.setDomainOffset(prepared.getDomainOffset());

            // Draw the buffers. Always use the 0th color, because there
            // is one line per plot.
            subplot.getDrawingObject().lines = [{
                buffer: buffer.getBuffer(),
                color: PlotPalette.getFloatColor(0),
                points: buffer.getLength()
            }];
        };

        plotTelemetry(prepared) {
            // Fit to the boundaries of the data, but don't
            // override any user-initiated pan-zoom changes.
            this.panZoomStackGroup.setBasePanZoom(
                prepared.getOrigin(),
                prepared.getDimensions()
            );

            this.subplots.forEach( (subplot, index) => {
                self.plotTelemetryTo(subplot, prepared, index);
            });
        };

        getSubPlots() {
            return this.subplots;
        };

        isZoomed() {
            return this.panZoomStackGroup.getDepth() > 1;
        };

        stepBackPanZoom() {
            this.panZoomStackGroup.popPanZoom();
            this.subplots.forEach( (subplot) => {
                subplot.update();
            });
        };

        unzoom() {
            this.panZoomStackGroup.clearPanZoom();
            this.subplots.forEach( (subplot) => {
                subplot.update();
            });
        };
      }
        return PlotStackMode;
    }
);
