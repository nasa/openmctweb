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
import EventEmitter from 'EventEmitter';
import MenuComponent from './components/Menu.vue';
import SuperMenuComponent from './components/SuperMenu.vue';
import Vue from 'vue';

export const MENU_PLACEMENT = {
    TOP: 'top',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM: 'bottom',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    LEFT: 'left',
    RIGHT: 'right'
};

class Menu extends EventEmitter {
    constructor(options) {
        super();

        this.options = options;
        if (options.onDestroy) {
            this.once('destroy', options.onDestroy);
        }

        this.dismiss = this.dismiss.bind(this);
        this.show = this.show.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.showSuperMenu = this.showSuperMenu.bind(this);
    }

    dismiss() {
        this.emit('destroy');
        document.body.removeChild(this.component.$el);
        document.removeEventListener('click', this.dismiss);
        this.component.$destroy();
    }

    show() {
        this.component.$mount();
        document.body.appendChild(this.component.$el);

        let position = this._calculatePopupPosition(this.component.$el);

        this.component.$el.style.left = `${position.x}px`;
        this.component.$el.style.top = `${position.y}px`;

        document.addEventListener('click', this.dismiss);
    }

    showMenu() {
        this.component = new Vue({
            provide: {
                options: this.options
            },
            components: {
                MenuComponent
            },
            template: '<menu-component />'
        });

        this.show();
    }

    showSuperMenu() {
        this.component = new Vue({
            provide: {
                options: this.options
            },
            components: {
                SuperMenuComponent
            },
            template: '<super-menu-component />'
        });

        this.show();
    }

    /**
     * @private
     */
    _calculatePopupPosition(menuElement) {
        let menuDimensions = menuElement.getBoundingClientRect();

        if (!this.options.placement) {
            this.options.placement = MENU_PLACEMENT.BOTTOM_RIGHT;
        }

        const menuPosition = this._getMenuPositionBasedOnPlacement(menuDimensions);

        return this._preventMenuOverflow(menuPosition, menuDimensions);
    }

    /**
     * @private
     */
    _getMenuPositionBasedOnPlacement(menuDimensions) {
        let eventPosX = this.options.x;
        let eventPosY = this.options.y;

        // Adjust popup menu based on placement
        switch (this.options.placement) {
        case MENU_PLACEMENT.TOP:
            eventPosX = this.options.x - Math.floor(menuDimensions.width / 2);
            eventPosY = this.options.y - menuDimensions.height;
            break;
        case MENU_PLACEMENT.BOTTOM:
            eventPosX = this.options.x - Math.floor(menuDimensions.width / 2);
            break;
        case MENU_PLACEMENT.LEFT:
            eventPosX = this.options.x - menuDimensions.width;
            eventPosY = this.options.y - Math.floor(menuDimensions.height / 2);
            break;
        case MENU_PLACEMENT.RIGHT:
            eventPosY = this.options.y - Math.floor(menuDimensions.height / 2);
            break;
        case MENU_PLACEMENT.TOP_LEFT:
            eventPosX = this.options.x - menuDimensions.width;
            eventPosY = this.options.y - menuDimensions.height;
            break;
        case MENU_PLACEMENT.TOP_RIGHT:
            eventPosY = this.options.y - menuDimensions.height;
            break;
        case MENU_PLACEMENT.BOTTOM_LEFT:
            eventPosX = this.options.x - menuDimensions.width;
            break;
        case MENU_PLACEMENT.BOTTOM_RIGHT:
            break;
        }

        return {
            x: eventPosX,
            y: eventPosY
        };
    }

    /**
     * @private
     */
    _preventMenuOverflow(menuPosition, menuDimensions) {
        let { x: eventPosX, y: eventPosY } = menuPosition;
        let overflowX = (eventPosX + menuDimensions.width) - document.body.clientWidth;
        let overflowY = (eventPosY + menuDimensions.height) - document.body.clientHeight;

        if (overflowX > 0) {
            eventPosX = eventPosX - overflowX;
        }

        if (overflowY > 0) {
            eventPosY = eventPosY - overflowY;
        }

        if (eventPosX < 0) {
            eventPosX = 0;
        }

        if (eventPosY < 0) {
            eventPosY = 0;
        }

        return {
            x: eventPosX,
            y: eventPosY
        };
    }
}

export default Menu;
