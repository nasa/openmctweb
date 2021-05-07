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

define(function () {
    /**
     * Simple directive that removes the elements pool when used in the
     * inspector region.  Workaround until we have better control of screen
     * regions.
     */
    return function HideElementPoolDirective() {
        return {
            restrict: "A",
            link: function ($scope, $element) {
                let splitter = $element.parent();

                while (splitter[0].tagName !== 'MCT-SPLIT-PANE') {
                    splitter = splitter.parent();
                }

                [
                    '.split-pane-component.pane.bottom',
                    'mct-splitter'
                ].forEach(function (selector) {
                    const element = splitter[0].querySelectorAll(selector)[0];
                    element.style.maxHeight = '0px';
                    element.style.minHeight = '0px';
                });

                splitter[0]
                    .querySelectorAll('.split-pane-component.pane.top')[0]
                    .style
                    .bottom = '0px';
            }
        };
    };
});
