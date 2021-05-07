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

import Menu, { MENU_PLACEMENT } from './menu.js';

/**
 * Popup Menu options
 * @typedef {Object} MenuOptions
 * @property {String} menuClass Class for popup menu
 * @property {MENU_PLACEMENT} placement Placement for menu relative to click
 * @property {Function} onDestroy callback function: invoked when menu is destroyed
 */

/**
 * Popup Menu Item/action
 * @typedef {Object} Action
 * @property {String} cssClass Class for menu item
 * @property {Boolean} isDisabled adds disable class if true
 * @property {String} name Menu item text
 * @property {String} description Menu item description
 * @property {Function} callBack callback function: invoked when item is clicked
 */

/**
 * The MenuAPI allows the addition of new context menu actions, and for the context menu to be launched from
 * custom HTML elements.
 * @interface MenuAPI
 * @memberof module:openmct
 */

class MenuAPI {
    constructor(openmct) {
        this.openmct = openmct;

        this.menuPlacement = MENU_PLACEMENT;
        this.showMenu = this.showMenu.bind(this);
        this.showSuperMenu = this.showSuperMenu.bind(this);

        this._clearMenuComponent = this._clearMenuComponent.bind(this);
        this._showObjectMenu = this._showObjectMenu.bind(this);
    }

    /**
     * Show popup menu
     * @param {number} x x-coordinates for popup
     * @param {number} y x-coordinates for popup
     * @param {Array.<Action>|Array.<Array.<Action>>} actions collection of actions{@link Action} or collection of groups of actions {@link Action}
     * @param {MenuOptions} [menuOptions] [Optional] The {@link MenuOptions} options for Menu
     */
    showMenu(x, y, actions, menuOptions) {
        this._createMenuComponent(x, y, actions, menuOptions);

        this.menuComponent.showMenu();
    }

    /**
     * Show popup menu with description of item on hover
     * @param {number} x x-coordinates for popup
     * @param {number} y x-coordinates for popup
     * @param {Array.<Action>|Array.<Array.<Action>>} actions collection of actions {@link Action} or collection of groups of actions {@link Action}
     * @param {MenuOptions} [menuOptions] [Optional] The {@link MenuOptions} options for Menu
     */
    showSuperMenu(x, y, actions, menuOptions) {
        this._createMenuComponent(x, y, actions, menuOptions);

        this.menuComponent.showSuperMenu();
    }

    _clearMenuComponent() {
        this.menuComponent = undefined;
        delete this.menuComponent;
    }

    _createMenuComponent(x, y, actions, menuOptions = {}) {
        if (this.menuComponent) {
            this.menuComponent.dismiss();
        }

        let options = {
            x,
            y,
            actions,
            ...menuOptions
        };

        this.menuComponent = new Menu(options);
        this.menuComponent.once('destroy', this._clearMenuComponent);
    }

    _showObjectMenu(objectPath, x, y, actionsToBeIncluded) {
        let applicableActions = this.openmct.actions._groupedAndSortedObjectActions(objectPath, actionsToBeIncluded);

        this.showMenu(x, y, applicableActions);
    }
}
export default MenuAPI;
