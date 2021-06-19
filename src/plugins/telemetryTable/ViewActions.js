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

const exportCSV = {
    name: 'Export Table Data',
    key: 'export-csv-all',
    description: "Export this view's data",
    cssClass: 'icon-download labeled',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().exportAllDataAsCSV();
    },
    group: 'view'
};

const exportMarkedDataAsCSV = {
    name: 'Export Marked Rows',
    key: 'export-csv-marked',
    description: "Export marked rows as CSV",
    cssClass: 'icon-download labeled',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().exportMarkedDataAsCSV();
    },
    group: 'view'
};

const unmarkAllRows = {
    name: 'Unmark All Rows',
    key: 'unmark-all-rows',
    description: 'Unmark all rows',
    cssClass: 'icon-x labeled',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().unmarkAllRows();
    },
    showInStatusBar: true,
    group: 'view'
};

const pause = {
    name: 'Pause',
    key: 'pause-data',
    description: 'Pause real-time data flow',
    cssClass: 'icon-pause',
    invoke: (objectPath, view) => {
        view.getViewContext().togglePauseByButton();
    },
    showInStatusBar: true,
    group: 'view'
};

const play = {
    name: 'Play',
    key: 'play-data',
    description: 'Continue real-time data flow',
    cssClass: 'c-button pause-play is-paused',
    invoke: (objectPath, view) => {
        view.getViewContext().togglePauseByButton();
    },
    showInStatusBar: true,
    group: 'view'
};

const expandColumns = {
    name: 'Expand Columns',
    key: 'expand-columns',
    description: "Increase column widths to fit currently available data.",
    cssClass: 'icon-arrows-right-left labeled',
    invoke: (objectPath, view) => {
        view.getViewContext().expandColumns();
    },
    showInStatusBar: true,
    group: 'view'
};

const autosizeColumns = {
    name: 'Autosize Columns',
    key: 'autosize-columns',
    description: "Automatically size columns to fit the table into the available space.",
    cssClass: 'icon-expand labeled',
    invoke: (objectPath, view) => {
        view.getViewContext().autosizeColumns();
    },
    showInStatusBar: true,
    group: 'view'
};

const viewActions = [
    exportCSV,
    exportMarkedDataAsCSV,
    unmarkAllRows,
    pause,
    play,
    expandColumns,
    autosizeColumns
];

viewActions.forEach(action => {
    action.appliesTo = (objectPath, view = {}) => {
        const viewContext = view.getViewContext && view.getViewContext();
        if (!viewContext) {
            return false;
        }

        return viewContext.type === 'telemetry-table';
    };
});

export default viewActions;
