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
import AutoflowTabularPlugin from './AutoflowTabularPlugin';
import AutoflowTabularConstants from './AutoflowTabularConstants';
import $ from 'zepto';
import DOMObserver from './dom-observer';
import {
    createOpenMct,
    resetApplicationState,
    spyOnBuiltins
} from 'utils/testing';

describe("AutoflowTabularPlugin", () => {
    let testType;
    let testObject;
    let mockmct;

    beforeEach(() => {
        testType = "some-type";
        testObject = { type: testType };
        mockmct = createOpenMct();
        spyOn(mockmct.composition, 'get');
        spyOn(mockmct.objectViews, 'addProvider');
        spyOn(mockmct.telemetry, 'getMetadata');
        spyOn(mockmct.telemetry, 'getValueFormatter');
        spyOn(mockmct.telemetry, 'limitEvaluator');
        spyOn(mockmct.telemetry, 'request');
        spyOn(mockmct.telemetry, 'subscribe');

        const plugin = new AutoflowTabularPlugin({ type: testType });
        plugin(mockmct);
    });

    afterEach(() => {
        resetApplicationState(mockmct);
    });

    it("installs a view provider", () => {
        expect(mockmct.objectViews.addProvider).toHaveBeenCalled();
    });

    describe("installs a view provider which", () => {
        let provider;

        beforeEach(() => {
            provider =
                mockmct.objectViews.addProvider.calls.mostRecent().args[0];
        });

        it("applies its view to the type from options", () => {
            expect(provider.canView(testObject, [])).toBe(true);
        });

        it("does not apply to other types", () => {
            expect(provider.canView({ type: 'foo' }, [])).toBe(false);
        });

        describe("provides a view which", () => {
            let testKeys;
            let testChildren;
            let testContainer;
            let testHistories;
            let mockComposition;
            let mockMetadata;
            let mockEvaluator;
            let mockUnsubscribes;
            let callbacks;
            let view;
            let domObserver;

            function waitsForChange() {
                return new Promise(function (resolve) {
                    window.requestAnimationFrame(resolve);
                });
            }

            function emitEvent(mockEmitter, type, event) {
                mockEmitter.on.calls.all().forEach((call) => {
                    if (call.args[0] === type) {
                        call.args[1](event);
                    }
                });
            }

            beforeEach((done) => {
                callbacks = {};

                spyOnBuiltins(['requestAnimationFrame']);
                window.requestAnimationFrame.and.callFake((callBack) => {
                    callBack();
                });

                testObject = { type: 'some-type' };
                testKeys = ['abc', 'def', 'xyz'];
                testChildren = testKeys.map((key) => {
                    return {
                        identifier: {
                            namespace: "test",
                            key: key
                        },
                        name: "Object " + key
                    };
                });
                testContainer = $('<div>')[0];
                domObserver = new DOMObserver(testContainer);

                testHistories = testKeys.reduce((histories, key, index) => {
                    histories[key] = {
                        key: key,
                        range: index + 10,
                        domain: key + index
                    };

                    return histories;
                }, {});

                mockComposition =
                    jasmine.createSpyObj('composition', ['load', 'on', 'off']);
                mockMetadata =
                    jasmine.createSpyObj('metadata', ['valuesForHints']);

                mockEvaluator = jasmine.createSpyObj('evaluator', ['evaluate']);
                mockUnsubscribes = testKeys.reduce((map, key) => {
                    map[key] = jasmine.createSpy('unsubscribe-' + key);

                    return map;
                }, {});

                mockmct.composition.get.and.returnValue(mockComposition);
                mockComposition.load.and.callFake(() => {
                    testChildren.forEach(emitEvent.bind(null, mockComposition, 'add'));

                    return Promise.resolve(testChildren);
                });

                mockmct.telemetry.getMetadata.and.returnValue(mockMetadata);
                mockmct.telemetry.getValueFormatter.and.callFake((metadatum) => {
                    const mockFormatter = jasmine.createSpyObj('formatter', ['format']);
                    mockFormatter.format.and.callFake((datum) => {
                        return datum[metadatum.hint];
                    });

                    return mockFormatter;
                });
                mockmct.telemetry.limitEvaluator.and.returnValue(mockEvaluator);
                mockmct.telemetry.subscribe.and.callFake((obj, callback) => {
                    const key = obj.identifier.key;
                    callbacks[key] = callback;

                    return mockUnsubscribes[key];
                });
                mockmct.telemetry.request.and.callFake((obj, request) => {
                    const key = obj.identifier.key;

                    return Promise.resolve([testHistories[key]]);
                });
                mockMetadata.valuesForHints.and.callFake((hints) => {
                    return [{ hint: hints[0] }];
                });

                view = provider.view(testObject);
                view.show(testContainer);

                return done();
            });

            afterEach(() => {
                domObserver.destroy();
            });

            it("populates its container", () => {
                expect(testContainer.children.length > 0).toBe(true);
            });

            describe("when rows have been populated", () => {
                function rowsMatch() {
                    const rows = $(testContainer).find(".l-autoflow-row").length;

                    return rows === testChildren.length;
                }

                it("shows one row per child object", () => {
                    return domObserver.when(rowsMatch);
                });

                // it("adds rows on composition change", () => {
                //     const child = {
                //         identifier: {
                //             namespace: "test",
                //             key: "123"
                //         },
                //         name: "Object 123"
                //     };
                //     testChildren.push(child);
                //     emitEvent(mockComposition, 'add', child);

                //     return domObserver.when(rowsMatch);
                // });

                it("removes rows on composition change", () => {
                    const child = testChildren.pop();
                    emitEvent(mockComposition, 'remove', child.identifier);

                    return domObserver.when(rowsMatch);
                });
            });

            it("removes subscriptions when destroyed", () => {
                testKeys.forEach((key) => {
                    expect(mockUnsubscribes[key]).not.toHaveBeenCalled();
                });
                view.destroy();
                testKeys.forEach((key) => {
                    expect(mockUnsubscribes[key]).toHaveBeenCalled();
                });
            });

            it("provides a button to change column width", () => {
                const initialWidth = AutoflowTabularConstants.INITIAL_COLUMN_WIDTH;
                const nextWidth =
                    initialWidth + AutoflowTabularConstants.COLUMN_WIDTH_STEP;

                expect($(testContainer).find('.l-autoflow-col').css('width'))
                    .toEqual(initialWidth + 'px');

                $(testContainer).find('.change-column-width').click();

                function widthHasChanged() {
                    const width = $(testContainer).find('.l-autoflow-col').css('width');

                    return width !== initialWidth + 'px';
                }

                return domObserver.when(widthHasChanged)
                    .then(() => {
                        expect($(testContainer).find('.l-autoflow-col').css('width'))
                            .toEqual(nextWidth + 'px');
                    });
            });

            it("subscribes to all child objects", () => {
                testKeys.forEach((key) => {
                    expect(callbacks[key]).toEqual(jasmine.any(Function));
                });
            });

            it("displays historical telemetry", () => {
                function rowTextDefined() {
                    return $(testContainer).find(".l-autoflow-item").filter(".r").text() !== "";
                }

                return domObserver.when(rowTextDefined).then(() => {
                    testKeys.forEach((key, index) => {
                        const datum = testHistories[key];
                        const $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                        expect($cell.text()).toEqual(String(datum.range));
                    });
                });
            });

            it("displays incoming telemetry", () => {
                const testData = testKeys.map((key, index) => {
                    return {
                        key: key,
                        range: index * 100,
                        domain: key + index
                    };
                });

                testData.forEach((datum) => {
                    callbacks[datum.key](datum);
                });

                return waitsForChange().then(() => {
                    testData.forEach((datum, index) => {
                        const $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                        expect($cell.text()).toEqual(String(datum.range));
                    });
                });
            });

            it("updates classes for limit violations", () => {
                const testClass = "some-limit-violation";
                mockEvaluator.evaluate.and.returnValue({ cssClass: testClass });
                testKeys.forEach((key) => {
                    callbacks[key]({
                        range: 'foo',
                        domain: 'bar'
                    });
                });

                return waitsForChange().then(() => {
                    testKeys.forEach((datum, index) => {
                        const $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                        expect($cell.hasClass(testClass)).toBe(true);
                    });
                });
            });

            it("automatically flows to new columns", () => {
                const rowHeight = AutoflowTabularConstants.ROW_HEIGHT;
                const sliderHeight = AutoflowTabularConstants.SLIDER_HEIGHT;
                const count = testKeys.length;
                const $container = $(testContainer);
                let promiseChain = Promise.resolve();

                function columnsHaveAutoflowed() {
                    const itemsHeight = $container.find('.l-autoflow-items').height();
                    const availableHeight = itemsHeight - sliderHeight;
                    const availableRows = Math.max(Math.floor(availableHeight / rowHeight), 1);
                    const columns = Math.ceil(count / availableRows);

                    return $container.find('.l-autoflow-col').length === columns;
                }

                $container.find('.abs').css({
                    position: 'absolute',
                    left: '0px',
                    right: '0px',
                    top: '0px',
                    bottom: '0px'
                });
                $container.css({ position: 'absolute' });

                $container.appendTo(document.body);

                function setHeight(height) {
                    $container.css('height', height + 'px');

                    return domObserver.when(columnsHaveAutoflowed);
                }

                for (let height = 0; height < rowHeight * count * 2; height += rowHeight / 2) {
                    // eslint-disable-next-line no-invalid-this
                    promiseChain = promiseChain.then(setHeight.bind(this, height));
                }

                return promiseChain.then(() => {
                    $container.remove();
                });
            });

            it("loads composition exactly once", () => {
                const testObj = testChildren.pop();
                emitEvent(mockComposition, 'remove', testObj.identifier);
                testChildren.push(testObj);
                emitEvent(mockComposition, 'add', testObj);
                expect(mockComposition.load.calls.count()).toEqual(1);
            });
        });
    });
});
