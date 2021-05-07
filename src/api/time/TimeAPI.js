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

define(['EventEmitter'], function (EventEmitter) {

    /**
     * The public API for setting and querying the temporal state of the
     * application. The concept of time is integral to Open MCT, and at least
     * one {@link TimeSystem}, as well as some default time bounds must be
     * registered and enabled via {@link TimeAPI.addTimeSystem} and
     * {@link TimeAPI.timeSystem} respectively for Open MCT to work.
     *
     * Time-sensitive views will typically respond to changes to bounds or other
     * properties of the time conductor and update the data displayed based on
     * the temporal state of the application. The current time bounds are also
     * used in queries for historical data.
     *
     * The TimeAPI extends the EventEmitter class. A number of events are
     * fired when properties of the time conductor change, which are documented
     * below.
     *
     * @interface
     * @memberof module:openmct
     */
    function TimeAPI() {
        EventEmitter.call(this);

        //The Time System
        this.system = undefined;
        //The Time Of Interest
        this.toi = undefined;

        this.boundsVal = {
            start: undefined,
            end: undefined
        };

        this.timeSystems = new Map();
        this.clocks = new Map();
        this.activeClock = undefined;
        this.offsets = undefined;

        this.tick = this.tick.bind(this);

    }

    TimeAPI.prototype = Object.create(EventEmitter.prototype);

    /**
     * A TimeSystem provides meaning to the values returned by the TimeAPI. Open
     * MCT supports multiple different types of time values, although all are
     * intrinsically represented by numbers, the meaning of those numbers can
     * differ depending on context.
     *
     * A default time system is provided by Open MCT in the form of the {@link UTCTimeSystem},
     * which represents integer values as ms in the Unix epoch. An example of
     * another time system might be "sols" for a Martian mission. TimeSystems do
     * not address the issue of converting between time systems.
     *
     * @typedef {object} TimeSystem
     * @property {string} key A unique identifier
     * @property {string} name A human-readable descriptor
     * @property {string} [cssClass] Specify a css class defining an icon for
     * this time system. This will be visible next to the time system in the
     * menu in the Time Conductor
     * @property {string} timeFormat The key of a format to use when displaying
     * discrete timestamps from this time system
     * @property {string} [durationFormat] The key of a format to use when
     * displaying a duration or relative span of time in this time system.
     */

    /**
     * Register a new time system. Once registered it can activated using
     * {@link TimeAPI.timeSystem}, and can be referenced via its key in [Time Conductor configuration](@link https://github.com/nasa/openmct/blob/master/API.md#time-conductor).
     * @memberof module:openmct.TimeAPI#
     * @param {TimeSystem} timeSystem A time system object.
     */
    TimeAPI.prototype.addTimeSystem = function (timeSystem) {
        this.timeSystems.set(timeSystem.key, timeSystem);
    };

    /**
     * @returns {TimeSystem[]}
     */
    TimeAPI.prototype.getAllTimeSystems = function () {
        return Array.from(this.timeSystems.values());
    };

    /**
     * Clocks provide a timing source that is used to
     * automatically update the time bounds of the data displayed in Open MCT.
     *
     * @typedef {object} Clock
     * @memberof openmct.timeAPI
     * @property {string} key A unique identifier
     * @property {string} name A human-readable name. The name will be used to
     * represent this clock in the Time Conductor UI
     * @property {string} description A longer description, ideally identifying
     * what the clock ticks on.
     * @property {function} currentValue Returns the last value generated by a tick, or a default value
     * if no ticking has yet occurred
     * @see {LocalClock}
     */

    /**
     * Register a new Clock.
     * @memberof module:openmct.TimeAPI#
     * @param {Clock} clock
     */
    TimeAPI.prototype.addClock = function (clock) {
        this.clocks.set(clock.key, clock);
    };

    /**
     * @memberof module:openmct.TimeAPI#
     * @returns {Clock[]}
     * @memberof module:openmct.TimeAPI#
     */
    TimeAPI.prototype.getAllClocks = function () {
        return Array.from(this.clocks.values());
    };

    /**
     * Validate the given bounds. This can be used for pre-validation of bounds,
     * for example by views validating user inputs.
     * @param {TimeBounds} bounds The start and end time of the conductor.
     * @returns {string | true} A validation error, or true if valid
     * @memberof module:openmct.TimeAPI#
     * @method validateBounds
     */
    TimeAPI.prototype.validateBounds = function (bounds) {
        if ((bounds.start === undefined)
            || (bounds.end === undefined)
            || isNaN(bounds.start)
            || isNaN(bounds.end)
        ) {
            return "Start and end must be specified as integer values";
        } else if (bounds.start > bounds.end) {
            return "Specified start date exceeds end bound";
        }

        return true;
    };

    /**
     * Validate the given offsets. This can be used for pre-validation of
     * offsets, for example by views validating user inputs.
     * @param {ClockOffsets} offsets The start and end offsets from a 'now' value.
     * @returns {string | true} A validation error, or true if valid
     * @memberof module:openmct.TimeAPI#
     * @method validateBounds
     */
    TimeAPI.prototype.validateOffsets = function (offsets) {
        if ((offsets.start === undefined)
            || (offsets.end === undefined)
            || isNaN(offsets.start)
            || isNaN(offsets.end)
        ) {
            return "Start and end offsets must be specified as integer values";
        } else if (offsets.start >= offsets.end) {
            return "Specified start offset must be < end offset";
        }

        return true;
    };

    /**
     * @typedef {Object} TimeBounds
     * @property {number} start The start time displayed by the time conductor
     * in ms since epoch. Epoch determined by currently active time system
     * @property {number} end The end time displayed by the time conductor in ms
     * since epoch.
     * @memberof module:openmct.TimeAPI~
     */

    /**
     * Get or set the start and end time of the time conductor. Basic validation
     * of bounds is performed.
     *
     * @param {module:openmct.TimeAPI~TimeConductorBounds} newBounds
     * @throws {Error} Validation error
     * @fires module:openmct.TimeAPI~bounds
     * @returns {module:openmct.TimeAPI~TimeConductorBounds}
     * @memberof module:openmct.TimeAPI#
     * @method bounds
     */
    TimeAPI.prototype.bounds = function (newBounds) {
        if (arguments.length > 0) {
            const validationResult = this.validateBounds(newBounds);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }

            //Create a copy to avoid direct mutation of conductor bounds
            this.boundsVal = JSON.parse(JSON.stringify(newBounds));
            /**
             * The start time, end time, or both have been updated.
             * @event bounds
             * @memberof module:openmct.TimeAPI~
             * @property {TimeConductorBounds} bounds The newly updated bounds
             * @property {boolean} [tick] `true` if the bounds update was due to
             * a "tick" event (ie. was an automatic update), false otherwise.
             */
            this.emit('bounds', this.boundsVal, false);

            // If a bounds change results in a TOI outside of the current
            // bounds, unset it
            if (this.toi < newBounds.start || this.toi > newBounds.end) {
                this.timeOfInterest(undefined);
            }
        }

        //Return a copy to prevent direct mutation of time conductor bounds.
        return JSON.parse(JSON.stringify(this.boundsVal));
    };

    /**
     * Get or set the time system of the TimeAPI.
     * @param {TimeSystem | string} timeSystem
     * @param {module:openmct.TimeAPI~TimeConductorBounds} bounds
     * @fires module:openmct.TimeAPI~timeSystem
     * @returns {TimeSystem} The currently applied time system
     * @memberof module:openmct.TimeAPI#
     * @method timeSystem
     */
    TimeAPI.prototype.timeSystem = function (timeSystemOrKey, bounds) {
        if (arguments.length >= 1) {
            if (arguments.length === 1 && !this.activeClock) {
                throw new Error(
                    "Must specify bounds when changing time system without "
                    + "an active clock."
                );
            }

            let timeSystem;

            if (timeSystemOrKey === undefined) {
                throw "Please provide a time system";
            }

            if (typeof timeSystemOrKey === 'string') {
                timeSystem = this.timeSystems.get(timeSystemOrKey);

                if (timeSystem === undefined) {
                    throw "Unknown time system " + timeSystemOrKey + ". Has it been registered with 'addTimeSystem'?";
                }
            } else if (typeof timeSystemOrKey === 'object') {
                timeSystem = timeSystemOrKey;

                if (!this.timeSystems.has(timeSystem.key)) {
                    throw "Unknown time system " + timeSystem.key + ". Has it been registered with 'addTimeSystem'?";
                }
            } else {
                throw "Attempt to set invalid time system in Time API. Please provide a previously registered time system object or key";
            }

            this.system = timeSystem;

            /**
             * The time system used by the time
             * conductor has changed. A change in Time System will always be
             * followed by a bounds event specifying new query bounds.
             *
             * @event module:openmct.TimeAPI~timeSystem
             * @property {TimeSystem} The value of the currently applied
             * Time System
             * */
            this.emit('timeSystem', this.system);
            if (bounds) {
                this.bounds(bounds);
            }

        }

        return this.system;
    };

    /**
     * Get or set the Time of Interest. The Time of Interest is a single point
     * in time, and constitutes the temporal focus of application views. It can
     * be manipulated by the user from the time conductor or from other views.
     * The time of interest can effectively be unset by assigning a value of
     * 'undefined'.
     * @fires module:openmct.TimeAPI~timeOfInterest
     * @param newTOI
     * @returns {number} the current time of interest
     * @memberof module:openmct.TimeAPI#
     * @method timeOfInterest
     */
    TimeAPI.prototype.timeOfInterest = function (newTOI) {
        if (arguments.length > 0) {
            this.toi = newTOI;
            /**
             * The Time of Interest has moved.
             * @event timeOfInterest
             * @memberof module:openmct.TimeAPI~
             * @property {number} Current time of interest
             */
            this.emit('timeOfInterest', this.toi);
        }

        return this.toi;
    };

    /**
     * Update bounds based on provided time and current offsets
     * @private
     * @param {number} timestamp A time from which boudns will be calculated
     * using current offsets.
     */
    TimeAPI.prototype.tick = function (timestamp) {
        const newBounds = {
            start: timestamp + this.offsets.start,
            end: timestamp + this.offsets.end
        };

        this.boundsVal = newBounds;
        this.emit('bounds', this.boundsVal, true);

        // If a bounds change results in a TOI outside of the current
        // bounds, unset it
        if (this.toi < newBounds.start || this.toi > newBounds.end) {
            this.timeOfInterest(undefined);
        }
    };

    /**
     * Set the active clock. Tick source will be immediately subscribed to
     * and ticking will begin. Offsets from 'now' must also be provided. A clock
     * can be unset by calling {@link stopClock}.
     *
     * @param {Clock || string} The clock to activate, or its key
     * @param {ClockOffsets} offsets on each tick these will be used to calculate
     * the start and end bounds. This maintains a sliding time window of a fixed
     * width that automatically updates.
     * @fires module:openmct.TimeAPI~clock
     * @return {Clock} the currently active clock;
     */
    TimeAPI.prototype.clock = function (keyOrClock, offsets) {
        if (arguments.length === 2) {
            let clock;

            if (typeof keyOrClock === 'string') {
                clock = this.clocks.get(keyOrClock);
                if (clock === undefined) {
                    throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
                }
            } else if (typeof keyOrClock === 'object') {
                clock = keyOrClock;
                if (!this.clocks.has(clock.key)) {
                    throw "Unknown clock '" + keyOrClock.key + "'. Has it been registered with 'addClock'?";
                }
            }

            const previousClock = this.activeClock;
            if (previousClock !== undefined) {
                previousClock.off("tick", this.tick);
            }

            this.activeClock = clock;

            /**
             * The active clock has changed. Clock can be unset by calling {@link stopClock}
             * @event clock
             * @memberof module:openmct.TimeAPI~
             * @property {Clock} clock The newly activated clock, or undefined
             * if the system is no longer following a clock source
             */
            this.emit("clock", this.activeClock);

            if (this.activeClock !== undefined) {
                this.clockOffsets(offsets);
                this.activeClock.on("tick", this.tick);
            }

        } else if (arguments.length === 1) {
            throw "When setting the clock, clock offsets must also be provided";
        }

        return this.activeClock;
    };

    /**
     * Clock offsets are used to calculate temporal bounds when the system is
     * ticking on a clock source.
     *
     * @typedef {object} ClockOffsets
     * @property {number} start A time span relative to the current value of the
     * ticking clock, from which start bounds will be calculated. This value must
     * be < 0. When a clock is active, bounds will be calculated automatically
     * based on the value provided by the clock, and the defined clock offsets.
     * @property {number} end A time span relative to the current value of the
     * ticking clock, from which end bounds will be calculated. This value must
     * be >= 0.
     */
    /**
     * Get or set the currently applied clock offsets. If no parameter is provided,
     * the current value will be returned. If provided, the new value will be
     * used as the new clock offsets.
     * @param {ClockOffsets} offsets
     * @returns {ClockOffsets}
     */
    TimeAPI.prototype.clockOffsets = function (offsets) {
        if (arguments.length > 0) {

            const validationResult = this.validateOffsets(offsets);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }

            this.offsets = offsets;

            const currentValue = this.activeClock.currentValue();
            const newBounds = {
                start: currentValue + offsets.start,
                end: currentValue + offsets.end
            };

            this.bounds(newBounds);

            /**
             * Event that is triggered when clock offsets change.
             * @event clockOffsets
             * @memberof module:openmct.TimeAPI~
             * @property {ClockOffsets} clockOffsets The newly activated clock
             * offsets.
             */
            this.emit("clockOffsets", offsets);
        }

        return this.offsets;
    };

    /**
     * Stop the currently active clock from ticking, and unset it. This will
     * revert all views to showing a static time frame defined by the current
     * bounds.
     */
    TimeAPI.prototype.stopClock = function () {
        if (this.activeClock) {
            this.clock(undefined, undefined);
        }
    };

    return TimeAPI;
});
