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

import MenuAPI from './MenuAPI';
import Menu from './menu';
import { createOpenMct, createMouseEvent, resetApplicationState } from '../../utils/testing';

describe ('The Menu API', () => {
    let openmct;
    let element;
    let menuAPI;
    let actionsArray;
    let x;
    let y;
    let result;
    let onDestroy;

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.display = 'block';
        appHolder.style.width = '1920px';
        appHolder.style.height = '1080px';

        openmct = createOpenMct();

        element = document.createElement('div');
        element.style.display = 'block';
        element.style.width = '1920px';
        element.style.height = '1080px';

        openmct.on('start', done);
        openmct.startHeadless(appHolder);

        menuAPI = new MenuAPI(openmct);
        actionsArray = [
            {
                key: 'test-css-class-1',
                name: 'Test Action 1',
                cssClass: 'icon-clock',
                description: 'This is a test action',
                callBack: () => {
                    result = 'Test Action 1 Invoked';
                }
            },
            {
                key: 'test-css-class-2',
                name: 'Test Action 2',
                cssClass: 'icon-clock',
                description: 'This is a test action',
                callBack: () => {
                    result = 'Test Action 2 Invoked';
                }
            }
        ];
        x = 8;
        y = 16;
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    describe("showMenu method", () => {
        it("creates an instance of Menu when invoked", () => {
            menuAPI.showMenu(x, y, actionsArray);

            expect(menuAPI.menuComponent).toBeInstanceOf(Menu);
        });

        describe("creates a menu component", () => {
            let menuComponent;
            let vueComponent;

            beforeEach(() => {
                onDestroy = jasmine.createSpy('onDestroy');

                const menuOptions = {
                    onDestroy
                };

                menuAPI.showMenu(x, y, actionsArray, menuOptions);
                vueComponent = menuAPI.menuComponent.component;
                menuComponent = document.querySelector(".c-menu");

                spyOn(vueComponent, '$destroy');
            });

            it("renders a menu component in the expected x and y coordinates", () => {
                let boundingClientRect = menuComponent.getBoundingClientRect();
                let left = boundingClientRect.left;
                let top = boundingClientRect.top;

                expect(left).toEqual(x);
                expect(top).toEqual(y);
            });

            it("with all the actions passed in", () => {
                expect(menuComponent).toBeDefined();

                let listItems = menuComponent.children[0].children;

                expect(listItems.length).toEqual(actionsArray.length);
            });

            it("with click-able menu items, that will invoke the correct callBacks", () => {
                let listItem1 = menuComponent.children[0].children[0];

                listItem1.click();

                expect(result).toEqual("Test Action 1 Invoked");
            });

            it("dismisses the menu when action is clicked on", () => {
                let listItem1 = menuComponent.children[0].children[0];

                listItem1.click();

                let menu = document.querySelector('.c-menu');

                expect(menu).toBeNull();
            });

            it("invokes the destroy method when menu is dismissed", () => {
                document.body.click();

                expect(vueComponent.$destroy).toHaveBeenCalled();
            });

            it("invokes the onDestroy callback if passed in", () => {
                document.body.click();

                expect(onDestroy).toHaveBeenCalled();
            });
        });
    });

    describe("superMenu method", () => {
        it("creates a superMenu", () => {
            menuAPI.showSuperMenu(x, y, actionsArray);

            const superMenu = document.querySelector('.c-super-menu__menu');

            expect(superMenu).not.toBeNull();
        });

        it("Mouse over a superMenu shows correct description", (done) => {
            menuAPI.showSuperMenu(x, y, actionsArray);

            const superMenu = document.querySelector('.c-super-menu__menu');
            const superMenuItem = superMenu.querySelector('li');
            const mouseOverEvent = createMouseEvent('mouseover');

            superMenuItem.dispatchEvent(mouseOverEvent);
            const itemDescription = document.querySelector('.l-item-description__description');

            setTimeout(() => {
                expect(itemDescription.innerText).toEqual(actionsArray[0].description);
                expect(superMenu).not.toBeNull();
                done();
            }, 300);
        });
    });

    describe("Menu Placements", () => {
        it("default menu position BOTTOM_RIGHT", () => {
            menuAPI.showMenu(x, y, actionsArray);

            const menu = document.querySelector('.c-menu');

            const boundingClientRect = menu.getBoundingClientRect();
            const left = boundingClientRect.left;
            const top = boundingClientRect.top;

            expect(left).toEqual(x);
            expect(top).toEqual(y);
        });

        it("menu position BOTTOM_RIGHT", () => {
            const menuOptions = {
                placement: openmct.menus.menuPlacement.BOTTOM_RIGHT
            };

            menuAPI.showMenu(x, y, actionsArray, menuOptions);

            const menu = document.querySelector('.c-menu');
            const boundingClientRect = menu.getBoundingClientRect();
            const left = boundingClientRect.left;
            const top = boundingClientRect.top;

            expect(left).toEqual(x);
            expect(top).toEqual(y);
        });
    });
});
