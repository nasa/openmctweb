/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    () => {

        /**
         * Supports mode-specific time conductor behavior.
         *
         * @constructor
         * @memberof platform.features.conductor
         * @param {TimeConductorMetadata} metadata
         */
        class TimeConductorMode {
          constructor(metadata, conductor, timeSystems) {
            this.conductor = conductor;

            this.mdata = metadata;
            this.deltasVal = undefined;
            this.source = undefined;
            this.sourceUnlisten = undefined;
            this.systems = timeSystems;
            this.availableSources = undefined;
            this.changeTimeSystem = this.changeTimeSystem.bind(this);
            this.tick = this.tick.bind(this);

            //Set the time system initially
            if (conductor.timeSystem()) {
                this.changeTimeSystem(conductor.timeSystem());
            }

            //Listen for subsequent changes to time system
            conductor.on('timeSystem', this.changeTimeSystem);

            if (metadata.key === 'fixed') {
                //Fixed automatically supports all time systems
                this.availableSystems = timeSystems;
            } else {
                this.availableSystems = timeSystems.filter( (timeSystem) => {
                    //Only include time systems that have tick sources that
                    // support the current mode
                    return timeSystem.tickSources().some( (tickSource) => {
                        return metadata.key === tickSource.metadata.mode;
                    });
                });
            }
        }

        /**
         * Get or set the currently selected time system
         * @param timeSystem
         * @returns {TimeSystem} the currently selected time system
         */
        changeTimeSystem(timeSystem) {
            // On time system change, apply default deltas
            let defaults = timeSystem.defaults() || {
                    bounds: {
                        start: 0,
                        end: 0
                    },
                    deltas: {
                        start: 0,
                        end: 0
                    }
                };

            this.conductor.bounds(defaults.bounds);
            this.deltas(defaults.deltas);

            // Tick sources are mode-specific, so restrict tick sources to only those supported by the current mode.
            let key = this.mdata.key;
            let tickSources = timeSystem.tickSources();
            if (tickSources) {
                this.availableSources = tickSources.filter( (source) => {
                    return source.metadata.mode === key;
                });
            }

            // Set an appropriate tick source from the new time system
            this.tickSource(this.availableTickSources(timeSystem)[0]);
        };

        /**
         * @returns {ModeMetadata}
         */
        metadata() {
            return this.mdata;
        };

        availableTimeSystems() {
            return this.availableSystems;
        };

        /**
         * Tick sources are mode-specific. This returns a filtered list of the tick sources available in the currently selected mode
         * @param timeSystem
         * @returns {Array.<T>}
         */
        availableTickSources(timeSystem) {
            return this.availableSources;
        };

        /**
         * Get or set tick source. Setting tick source will also start
         * listening to it and unlisten from any existing tick source
         * @param tickSource
         * @returns {TickSource}
         */
        tickSource(tickSource) {
            if (arguments.length > 0) {
                if (this.sourceUnlisten) {
                    this.sourceUnlisten();
                }
                this.source = tickSource;
                if (tickSource) {
                    this.sourceUnlisten = tickSource.listen(this.tick);
                    //Now following a tick source
                    this.conductor.follow(true);
                } else {
                    this.conductor.follow(false);
                }
            }
            return this.source;
        };

        /**
         * @private
         */
        destroy() {
            this.conductor.off('timeSystem', this.changeTimeSystem);

            if (this.sourceUnlisten) {
                this.sourceUnlisten();
            }
        };

        /**
         * @private
         * @param {number} time some value that is valid in the current TimeSystem
         */
        tick(time) {
            let deltas = this.deltas();
            let startTime = time;
            let endTime = time;

            if (deltas) {
                startTime = time - deltas.start;
                endTime = time + deltas.end;
            }
            this.conductor.bounds({
                start: startTime,
                end: endTime
            });
        };

        /**
         * Get or set the current value for the deltas used by this time system.
         * On change, the new deltas will be used to calculate and set the
         * bounds on the time conductor.
         * @param deltas
         * @returns {TimeSystemDeltas}
         */
        deltas(deltas) {
            if (arguments.length !== 0) {
                var bounds = this.calculateBoundsFromDeltas(deltas);
                this.deltasVal = deltas;
                if (this.metadata().key !== 'fixed') {
                    this.conductor.bounds(bounds);
                }
            }
            return this.deltasVal;
        };

        /**
         * @param deltas
         * @returns {TimeConductorBounds}
         */
        calculateBoundsFromDeltas(deltas) {
            let oldEnd = this.conductor.bounds().end;

            if (this.deltasVal && this.deltasVal.end !== undefined) {
                //Calculate the previous raw end value (without delta)
                oldEnd = oldEnd - this.deltasVal.end;
            }

            var bounds = {
                start: oldEnd - deltas.start,
                end: oldEnd + deltas.end
            };
            return bounds;
        };

        /**
         * @typedef {Object} ZoomLevel
         * @property {TimeConductorBounds} bounds The calculated bounds based on the zoom level
         * @property {TimeConductorDeltas} deltas The calculated deltas based on the zoom level
         */
        /**
         * Calculates bounds and deltas based on provided timeSpan. Collectively
         * the bounds and deltas will constitute the new zoom level.
         * @param {number} timeSpan time duration in ms.
         * @return {ZoomLevel} The new zoom bounds and delta calculated for the provided time span
         */
        calculateZoom(timeSpan) {
            let zoom = {};

            // If a tick source is defined, then the concept of 'now' is
            // important. Calculate zoom based on 'now'.
            if (this.tickSource()) {
                zoom.deltas = {
                    start: timeSpan,
                    end: this.deltasVal.end
                };
                zoom.bounds = this.calculateBoundsFromDeltas(zoom.deltas);
                // Calculate bounds based on deltas;
            } else {
                let bounds = this.conductor.bounds();
                let center = bounds.start + ((bounds.end - bounds.start)) / 2;
                bounds.start = center - timeSpan / 2;
                bounds.end = center + timeSpan / 2;
                zoom.bounds = bounds;
            }

            return zoom;
        };
      }
        return TimeConductorMode;
    }
);
