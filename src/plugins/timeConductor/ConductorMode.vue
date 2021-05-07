/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
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
<template>
<div ref="modeButton"
     class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
>
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
        <button
            class="c-button--menu c-mode-button"
            @click.prevent.stop="showModesMenu"
        >
            <span class="c-button__label">{{ selectedMode.name }}</span>
        </button>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';

export default {
    mixins: [toggleMixin],
    inject: ['openmct', 'configuration'],
    data: function () {
        let activeClock = this.openmct.time.clock();
        if (activeClock !== undefined) {
            //Create copy of active clock so the time API does not get reactified.
            activeClock = Object.create(activeClock);
        }

        return {
            selectedMode: this.getModeOptionForClock(activeClock),
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            modes: [],
            hoveredMode: {}
        };
    },
    mounted: function () {
        this.loadClocksFromConfiguration();

        this.openmct.time.on('clock', this.setViewFromClock);
    },
    destroyed: function () {
        this.openmct.time.off('clock', this.setViewFromClock);
    },
    methods: {
        showModesMenu() {
            const elementBoundingClientRect = this.$refs.modeButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y;

            const menuOptions = {
                menuClass: 'c-conductor__mode-menu',
                placement: this.openmct.menus.menuPlacement.TOP_RIGHT
            };

            this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
        },

        loadClocksFromConfiguration() {
            let clocks = this.configuration.menuOptions
                .map(menuOption => menuOption.clock)
                .filter(isDefinedAndUnique)
                .map(this.getClock);

            /*
             * Populate the modes menu with metadata from the available clocks
             * "Fixed Mode" is always first, and has no defined clock
             */
            this.modes = [undefined]
                .concat(clocks)
                .map(this.getModeOptionForClock);

            function isDefinedAndUnique(key, index, array) {
                return key !== undefined && array.indexOf(key) === index;
            }
        },

        getModeOptionForClock(clock) {
            if (clock === undefined) {
                const key = 'fixed';

                return {
                    key,
                    name: 'Fixed Timespan',
                    description: 'Query and explore data that falls between two fixed datetimes.',
                    cssClass: 'icon-tabular',
                    callBack: () => this.setOption(key)
                };
            } else {
                const key = clock.key;

                return {
                    key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time "
                    + "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock',
                    callBack: () => this.setOption(key)
                };
            }
        },

        getClock(key) {
            return this.openmct.time.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        },

        setOption(clockKey) {
            if (clockKey === 'fixed') {
                clockKey = undefined;
            }

            let configuration = this.getMatchingConfig({
                clock: clockKey,
                timeSystem: this.openmct.time.timeSystem().key
            });

            if (configuration === undefined) {
                configuration = this.getMatchingConfig({
                    clock: clockKey
                });

                this.openmct.time.timeSystem(configuration.timeSystem, configuration.bounds);
            }

            if (clockKey === undefined) {
                this.openmct.time.stopClock();
            } else {
                this.openmct.time.clock(clockKey, configuration.clockOffsets);
            }
        },

        getMatchingConfig(options) {
            const matchers = {
                clock(config) {
                    return options.clock === config.clock;
                },
                timeSystem(config) {
                    return options.timeSystem === config.timeSystem;
                }
            };

            function configMatches(config) {
                return Object.keys(options).reduce((match, option) => {
                    return match && matchers[option](config);
                }, true);
            }

            return this.configuration.menuOptions.filter(configMatches)[0];
        },

        setViewFromClock(clock) {
            this.selectedMode = this.getModeOptionForClock(clock);
        }
    }
};
</script>
