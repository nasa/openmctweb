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
<div ref="historyButton"
     class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
>
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
        <button
            class="c-button--menu c-history-button icon-history"
            @click.prevent.stop="showHistoryMenu"
        >
            <span class="c-button__label">History</span>
        </button>
    </div>
</div>
</template>

<script>
const DEFAULT_DURATION_FORMATTER = 'duration';
const LOCAL_STORAGE_HISTORY_KEY_FIXED = 'tcHistory';
const LOCAL_STORAGE_HISTORY_KEY_REALTIME = 'tcHistoryRealtime';
const DEFAULT_RECORDS = 10;
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

export default {
    inject: ['openmct', 'configuration'],
    props: {
        bounds: {
            type: Object,
            required: true
        },
        offsets: {
            type: Object,
            required: false,
            default: () => {}
        },
        timeSystem: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            /**
             * previous bounds entries available for easy re-use
             * @realtimeHistory array of timespans
             * @timespans {start, end} number representing timestamp
             */
            realtimeHistory: {},
            /**
             * previous bounds entries available for easy re-use
             * @fixedHistory array of timespans
             * @timespans {start, end} number representing timestamp
             */
            fixedHistory: {},
            presets: []
        };
    },
    computed: {
        currentHistory() {
            return this.mode + 'History';
        },
        isFixed() {
            return this.openmct.time.clock() === undefined;
        },
        historyForCurrentTimeSystem() {
            const history = this[this.currentHistory][this.timeSystem.key];

            return history;
        },
        storageKey() {
            let key = LOCAL_STORAGE_HISTORY_KEY_FIXED;
            if (this.mode !== 'fixed') {
                key = LOCAL_STORAGE_HISTORY_KEY_REALTIME;
            }

            return key;
        }
    },
    watch: {
        bounds: {
            handler() {
                // only for fixed time since we track offsets for realtime
                if (this.isFixed) {
                    this.addTimespan();
                }
            },
            deep: true
        },
        offsets: {
            handler() {
                this.addTimespan();
            },
            deep: true
        },
        timeSystem: {
            handler(ts) {
                this.loadConfiguration();
                this.addTimespan();
            },
            deep: true
        },
        mode: function () {
            this.getHistoryFromLocalStorage();
            this.initializeHistoryIfNoHistory();
            this.loadConfiguration();
        }
    },
    mounted() {
        this.getHistoryFromLocalStorage();
        this.initializeHistoryIfNoHistory();
    },
    methods: {
        getHistoryMenuItems() {
            const history = this.historyForCurrentTimeSystem.map(timespan => {
                let name;
                let startTime = this.formatTime(timespan.start);
                let description = `${startTime} - ${this.formatTime(timespan.end)}`;

                if (this.timeSystem.isUTCBased && !this.openmct.time.clock()) {
                    name = `${startTime} ${this.getDuration(timespan.end - timespan.start)}`;
                } else {
                    name = description;
                }

                return {
                    cssClass: 'icon-history',
                    name,
                    description,
                    callBack: () => this.selectTimespan(timespan)
                };
            });

            history.unshift({
                cssClass: 'c-menu__section-hint',
                description: 'Past timeframes, ordered by latest first',
                isDisabled: true,
                name: 'Past timeframes, ordered by latest first',
                callBack: () => {}
            });

            return history;
        },
        getPresetMenuItems() {
            return this.presets.map(preset => {
                return {
                    cssClass: 'icon-clock',
                    name: preset.label,
                    description: preset.label,
                    callBack: () => this.selectPresetBounds(preset.bounds)
                };
            });
        },
        getDuration(numericDuration) {
            let result;
            let age;

            if (numericDuration > ONE_DAY - 1) {
                age = this.normalizeAge((numericDuration / ONE_DAY).toFixed(2));
                result = `+ ${age} day`;

                if (age !== 1) {
                    result += 's';
                }
            } else if (numericDuration > ONE_HOUR - 1) {
                age = this.normalizeAge((numericDuration / ONE_HOUR).toFixed(2));
                result = `+ ${age} hour`;

                if (age !== 1) {
                    result += 's';
                }
            } else {
                age = this.normalizeAge((numericDuration / ONE_MINUTE).toFixed(2));
                result = `+ ${age} min`;

                if (age !== 1) {
                    result += 's';
                }
            }

            return result;
        },
        normalizeAge(num) {
            const hundredtized = num * 100;
            const isWhole = hundredtized % 100 === 0;

            return isWhole ? hundredtized / 100 : num;
        },
        getHistoryFromLocalStorage() {
            const localStorageHistory = localStorage.getItem(this.storageKey);
            const history = localStorageHistory ? JSON.parse(localStorageHistory) : undefined;
            this[this.currentHistory] = history;
        },
        initializeHistoryIfNoHistory() {
            if (!this[this.currentHistory]) {
                this[this.currentHistory] = {};
                this.persistHistoryToLocalStorage();
            }
        },
        persistHistoryToLocalStorage() {
            localStorage.setItem(this.storageKey, JSON.stringify(this[this.currentHistory]));
        },
        addTimespan() {
            const key = this.timeSystem.key;
            let [...currentHistory] = this[this.currentHistory][key] || [];
            const timespan = {
                start: this.isFixed ? this.bounds.start : this.offsets.start,
                end: this.isFixed ? this.bounds.end : this.offsets.end
            };

            // no dupes
            currentHistory = currentHistory.filter(ts => !(ts.start === timespan.start && ts.end === timespan.end));
            currentHistory.unshift(timespan); // add to front

            if (currentHistory.length > this.records) {
                currentHistory.length = this.records;
            }

            this.$set(this[this.currentHistory], key, currentHistory);
            this.persistHistoryToLocalStorage();
        },
        selectTimespan(timespan) {
            if (this.isFixed) {
                this.openmct.time.bounds(timespan);
            } else {
                this.openmct.time.clockOffsets(timespan);
            }
        },
        selectPresetBounds(bounds) {
            const start = typeof bounds.start === 'function' ? bounds.start() : bounds.start;
            const end = typeof bounds.end === 'function' ? bounds.end() : bounds.end;

            this.selectTimespan({
                start,
                end
            });
        },
        loadConfiguration() {
            const configurations = this.configuration.menuOptions
                .filter(option => option.timeSystem === this.timeSystem.key);

            this.presets = this.loadPresets(configurations);
            this.records = this.loadRecords(configurations);
        },
        loadPresets(configurations) {
            const configuration = configurations.find(option => {
                return option.presets && option.name.toLowerCase() === this.mode;
            });
            const presets = configuration ? configuration.presets : [];

            return presets;
        },
        loadRecords(configurations) {
            const configuration = configurations.find(option => option.records);
            const records = configuration ? configuration.records : DEFAULT_RECORDS;

            return records;
        },
        formatTime(time) {
            let format = this.timeSystem.timeFormat;
            let isNegativeOffset = false;

            if (!this.isFixed) {
                if (time < 0) {
                    isNegativeOffset = true;
                }

                time = Math.abs(time);

                format = this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER;
            }

            const formatter = this.openmct.telemetry.getValueFormatter({
                format: format
            }).formatter;

            return (isNegativeOffset ? '-' : '') + formatter.format(time);
        },
        showHistoryMenu() {
            const elementBoundingClientRect = this.$refs.historyButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y;

            const menuOptions = {
                menuClass: 'c-conductor__history-menu',
                placement: this.openmct.menus.menuPlacement.TOP_RIGHT
            };

            const menuActions = [];

            const presets = this.getPresetMenuItems();
            if (presets.length) {
                menuActions.push(presets);
            }

            const history = this.getHistoryMenuItems();
            menuActions.push(history);

            this.openmct.menus.showMenu(x, y, menuActions, menuOptions);
        }
    }
};
</script>
