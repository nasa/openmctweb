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

define(
    [
        "../../MCT",
        "../../../platform/commonUI/general/src/directives/MCTIndicators"
    ],
    function (
        MCT,
        MCTIndicators
    ) {
        xdescribe("The Indicator API", function () {
            let openmct;
            let directive;
            let holderElement;

            beforeEach(function () {
                openmct = new MCT();
                directive = new MCTIndicators(openmct);
                holderElement = document.createElement('div');
            });

            describe("The simple indicator", function () {
                let simpleIndicator;

                beforeEach(function () {
                    simpleIndicator = openmct.indicators.simpleIndicator();
                    openmct.indicators.add(simpleIndicator);
                    renderIndicators();
                });

                it("applies the set icon class", function () {
                    simpleIndicator.iconClass('testIconClass');

                    expect(getIconElement().classList.contains('testIconClass')).toBe(true);

                    simpleIndicator.iconClass('anotherIconClass');
                    expect(getIconElement().classList.contains('testIconClass')).toBe(false);
                    expect(getIconElement().classList.contains('anotherIconClass')).toBe(true);
                });

                it("applies the set status class", function () {
                    simpleIndicator.statusClass('testStatusClass');

                    expect(getIconElement().classList.contains('testStatusClass')).toBe(true);
                    simpleIndicator.statusClass('anotherStatusClass');
                    expect(getIconElement().classList.contains('testStatusClass')).toBe(false);
                    expect(getIconElement().classList.contains('anotherStatusClass')).toBe(true);
                });

                it("displays the set text", function () {
                    simpleIndicator.text('some test text');
                    expect(getTextElement().textContent.trim()).toEqual('some test text');
                });

                it("sets the indicator's title", function () {
                    simpleIndicator.description('a test description');
                    expect(getIndicatorElement().getAttribute('title')).toEqual('a test description');
                });

                it("Hides indicator icon if no text is set", function () {
                    simpleIndicator.text('');
                    expect(getIndicatorElement().classList.contains('hidden')).toBe(true);
                });

                function getIconElement() {
                    return holderElement.querySelector('.ls-indicator');
                }

                function getIndicatorElement() {
                    return holderElement.querySelector('.ls-indicator');
                }

                function getTextElement() {
                    return holderElement.querySelector('.indicator-text');
                }
            });

            it("Supports registration of a completely custom indicator", function () {
                const customIndicator = document.createElement('div');
                customIndicator.classList.add('customIndicator');
                customIndicator.textContent = 'A custom indicator';

                openmct.indicators.add({element: customIndicator});
                renderIndicators();

                expect(holderElement.querySelector('.customIndicator').textContent.trim()).toEqual('A custom indicator');
            });

            function renderIndicators() {
                directive.link({}, holderElement);
            }

        });
    });
