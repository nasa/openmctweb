<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div class="form-control autocomplete">
    <input v-model="field"
           class="autocompleteInput"
           type="text"
           @change="filterOptions(field)"
           @click="inputClicked()"
           @keydown="keyDown($event)"
    >
    <span class="icon-arrow-down"
          @click="arrowClicked()"
    ></span>
    <div v-show="hideOptions"
         class="autocompleteOptions"
         @blur="hideOptions = true"
    >
        <ul>
            <li v-for="opt in filteredOptions"
                :key="opt.optionId"
                :class="{'optionPreSelected': optionIndex === opt.optionId}"
                @click="fillInput(opt.name)"
                @mouseover="optionMouseover(opt.optionId)"
            >
                <span class="optionText">{{ opt.name }}</span>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
const key = {
    down: 40,
    up: 38,
    enter: 13
};

export default {
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            hideOptions: true,
            filteredOptions: [],
            optionIndex: 0,
            field: ''
        };
    },
    mounted() {
        this.options = this.model.options;
        this.autocompleteInputElement = this.$el.getElementsByClassName('autocompleteInput')[0];
        if (this.options[0].name) {
        // If "options" include name, value pair
            this.optionNames = this.options.map((opt) => {
                return opt.name;
            });
        } else {
        // If options is only an array of string.
            this.optionNames = this.options;
        }
    },
    methods: {
        fillInputWithIndexedOption() {
            if (this.filteredOptions[this.optionIndex]) {
                this.ngModel[this.field] = this.filteredOptions[this.optionIndex].name;
            }
        },

        decrementOptionIndex() {
            if (this.optionIndex === 0) {
                this.optionIndex = this.filteredOptions.length;
            }

            this.optionIndex--;
            this.fillInputWithIndexedOption();
        },

        incrementOptionIndex() {
            if (this.optionIndex === this.filteredOptions.length - 1) {
                this.optionIndex = -1;
            }

            this.optionIndex++;
            this.fillInputWithIndexedOption();
        },

        fillInputWithString(string) {
            this.hideOptions = true;
            this.ngModel[this.field] = string;
        },

        showOptions(string) {
            this.hideOptions = false;
            this.filterOptions(string);
            this.optionIndex = 0;
        },
        keyDown($event) {
            if (this.filteredOptions) {
                let keyCode = $event.keyCode;
                switch (keyCode) {
                case key.down:
                    this.incrementOptionIndex();
                    break;
                case key.up:
                    $event.preventDefault(); // Prevents cursor jumping back and forth
                    this.decrementOptionIndex();
                    break;
                case key.enter:
                    if (this.filteredOptions[this.optionIndex]) {
                        this.fillInputWithString(this.filteredOptions[this.optionIndex].name);
                    }
                }
            }
        },

        filterOptions() {
            this.hideOptions = false;
            this.filteredOptions = this.optionNames.filter((option) => {
                return option.toLowerCase().indexOf(this.field.toLowerCase()) >= 0;
            }).map((option, index) => {
                return {
                    optionId: index,
                    name: option
                };
            });
        },

        inputClicked() {
            this.autocompleteInputElement.select();
            this.showOptions(this.autocompleteInputElement.value);
        },

        arrowClicked() {
            this.autocompleteInputElement.select();
            this.showOptions('');
        },

        fillInput(string) {
            this.fillInputWithString(string);
        },

        optionMouseover(optionId) {
            this.optionIndex = optionId;
        }
    }
};
</script>
