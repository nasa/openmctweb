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
    function DOMObserver(element) {
        this.element = element;
        this.observers = [];
    }

    DOMObserver.prototype.when = function (latchFunction) {
        return new Promise(function (resolve, reject) {
            //Test latch function at least once
            if (latchFunction()) {
                resolve();
            } else {
                //Latch condition not true yet, create observer on DOM and test again on change.
                const config = {
                    attributes: true,
                    childList: true,
                    subtree: true
                };
                const observer = new MutationObserver(function () {
                    if (latchFunction()) {
                        resolve();
                    }
                });
                observer.observe(this.element, config);
                this.observers.push(observer);
            }
        }.bind(this));
    };

    DOMObserver.prototype.destroy = function () {
        this.observers.forEach(function (observer) {
            observer.disconnect();
        }.bind(this));
    };

    return DOMObserver;
});
