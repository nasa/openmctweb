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
<div
    ref="calendarHolder"
    class="c-ctrl-wrapper c-ctrl-wrapper--menus-up c-datetime-picker__wrapper"
>
    <a
        class="c-icon-button icon-calendar"
        @click="toggle"
    ></a>
    <div
        v-if="open"
        class="c-menu c-menu--mobile-modal c-datetime-picker"
    >
        <div class="c-datetime-picker__close-button">
            <button
                class="c-click-icon icon-x-in-circle"
                @click="toggle"
            ></button>
        </div>
        <div class="c-datetime-picker__pager c-pager l-month-year-pager">
            <div
                class="c-pager__prev c-icon-button icon-arrow-left"
                @click.stop="changeMonth(-1)"
            ></div>
            <div class="c-pager__month-year">
                {{ model.month }} {{ model.year }}
            </div>
            <div
                class="c-pager__next c-icon-button icon-arrow-right"
                @click.stop="changeMonth(1)"
            ></div>
        </div>
        <div class="c-datetime-picker__calendar c-calendar">
            <ul class="c-calendar__row--header l-cal-row">
                <li
                    v-for="day in ['Su','Mo','Tu','We','Th','Fr','Sa']"
                    :key="day"
                >
                    {{ day }}
                </li>
            </ul>
            <ul
                v-for="(row, tableIndex) in table"
                :key="tableIndex"
                class="c-calendar__row--body"
            >
                <li
                    v-for="(cell, rowIndex) in row"
                    :key="rowIndex"
                    :class="{ 'is-in-month': isInCurrentMonth(cell), selected: isSelected(cell) }"
                    @click="select(cell)"
                >
                    <div class="c-calendar__day--prime">
                        {{ cell.day }}
                    </div>
                    <div class="c-calendar__day--sub">
                        {{ cell.dayOfYear }}
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>
</template>

<script>
import moment from 'moment';
import toggleMixin from '../../ui/mixins/toggle-mixin';

const TIME_NAMES = {
    'hours': "Hour",
    'minutes': "Minute",
    'seconds': "Second"
};
const MONTHS = moment.months();
const TIME_OPTIONS = (function makeRanges() {
    let arr = [];
    while (arr.length < 60) {
        arr.push(arr.length);
    }

    return {
        hours: arr.slice(0, 24),
        minutes: arr,
        seconds: arr
    };
}());

export default {
    mixins: [toggleMixin],
    inject: ['openmct'],
    props: {
        defaultDateTime: {
            type: String,
            default: undefined
        },
        formatter: {
            type: Object,
            required: true
        }
    },
    data: function () {
        return {
            picker: {
                year: undefined,
                month: undefined,
                interacted: false
            },
            model: {
                year: undefined,
                month: undefined
            },
            table: undefined,
            date: undefined,
            time: undefined
        };
    },
    mounted: function () {
        this.updateFromModel(this.defaultDateTime);
        this.updateViewForMonth();
    },
    methods: {
        generateTable() {
            let m = moment.utc({
                year: this.picker.year,
                month: this.picker.month
            }).day(0);
            let table = [];
            let row;
            let col;

            for (row = 0; row < 6; row += 1) {
                table.push([]);
                for (col = 0; col < 7; col += 1) {
                    table[row].push({
                        year: m.year(),
                        month: m.month(),
                        day: m.date(),
                        dayOfYear: m.dayOfYear()
                    });
                    m.add(1, 'days'); // Next day!
                }
            }

            return table;
        },

        updateViewForMonth() {
            this.model.month = MONTHS[this.picker.month];
            this.model.year = this.picker.year;
            this.table = this.generateTable();
        },

        updateFromModel(defaultDateTime) {
            let m = moment.utc(defaultDateTime);

            this.date = {
                year: m.year(),
                month: m.month(),
                day: m.date()
            };
            this.time = {
                hours: m.hour(),
                minutes: m.minute(),
                seconds: m.second()
            };

            // Zoom to that date in the picker, but
            // only if the user hasn't interacted with it yet.
            if (!this.picker.interacted) {
                this.picker.year = m.year();
                this.picker.month = m.month();
                this.updateViewForMonth();
            }
        },

        updateFromView() {
            let m = moment.utc({
                year: this.date.year,
                month: this.date.month,
                day: this.date.day,
                hour: this.time.hours,
                minute: this.time.minutes,
                second: this.time.seconds
            });
            this.$emit('date-selected', m.valueOf());
        },

        isInCurrentMonth(cell) {
            return cell.month === this.picker.month;
        },

        isSelected(cell) {
            let date = this.date || {};

            return cell.day === date.day
                && cell.month === date.month
                && cell.year === date.year;
        },

        select(cell) {
            this.date = this.date || {};
            this.date.month = cell.month;
            this.date.year = cell.year;
            this.date.day = cell.day;
            this.updateFromView();
        },

        dateEquals(d1, d2) {
            return d1.year === d2.year
                && d1.month === d2.month
                && d1.day === d2.day;
        },

        changeMonth(delta) {
            this.picker.month += delta;
            if (this.picker.month > 11) {
                this.picker.month = 0;
                this.picker.year += 1;
            }

            if (this.picker.month < 0) {
                this.picker.month = 11;
                this.picker.year -= 1;
            }

            this.picker.interacted = true;
            this.updateViewForMonth();
        },

        nameFor(key) {
            return TIME_NAMES[key];
        },

        optionsFor(key) {
            return TIME_OPTIONS[key];
        }
    }
};
</script>
