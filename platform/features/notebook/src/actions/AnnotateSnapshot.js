/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

/**
 * Module defining viewSnapshot (Originally NewWindowAction). Created by vwoeltje on 11/18/14.
 */
define(
    ["painterro", "zepto"],
    function (Painterro, $) {
        var annotationStruct = {
            title: "Annotate Snapshot",
            template: "annotate-snapshot",
            options: [{
                name: "OK",
                key: "ok",
                description: "save annotation"
            },
            {
                name: "Cancel",
                key: "cancel",
                description: "cancel editing"
            }]
        };

        function AnnotateSnapshot(dialogService, dndService, $rootScope, context) {
            context = context || {};

            // Choose the object to be opened into a new tab
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.dndService = dndService;
            this.$rootScope = $rootScope;
        }

        AnnotateSnapshot.prototype.perform = function ($event, snapshot, embedId, entryId) {

            var DOMAIN_OBJECT = this.domainObject;
            var ROOTSCOPE = this.$rootScope;
            var painterro;
            var save = false;

            var controller = ['$scope', '$timeout', function PainterroController($scope, $timeout) {
                $(document.body).find('.l-dialog .outer-holder').addClass('annotation-dialog');

                // Timeout is necessary because Painterro uses document.getElementById, and mct-include
                // hasn't added the dialog to the DOM yet.
                $timeout(function () {
                    painterro = Painterro({
                        id: 'snap-annotation',
                        activeColor: '#ff0000',
                        activeColorAlpha: 1.0,
                        activeFillColor: '#fff',
                        activeFillColorAlpha: 0.0,
                        backgroundFillColor: '#000',
                        backgroundFillColorAlpha: 0.0,
                        defaultFontSize: 16,
                        defaultLineWidth: 2,
                        defaultTool: 'ellipse',
                        hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
                        translation: {
                            name: 'en',
                            strings: {
                                lineColor: 'Line',
                                fillColor: 'Fill',
                                lineWidth: 'Size',
                                textColor: 'Color',
                                fontSize: 'Size',
                                fontStyle: 'Style',
                                tools: {
                                    undo: 'Undo'
                                }
                            }
                        },
                        saveHandler: function (image, done) {
                            if (save) {
                                if (entryId && embedId) {
                                    var elementPos = DOMAIN_OBJECT.model.entries.map(function (x) {
                                        return x.createdOn;
                                    }).indexOf(entryId);
                                    var entryEmbeds = DOMAIN_OBJECT.model.entries[elementPos].embeds;
                                    var embedPos = entryEmbeds.map(function (x) {
                                        return x.id;
                                    }).indexOf(embedId);

                                    saveSnap(image.asBlob(), embedPos, elementPos, DOMAIN_OBJECT);
                                }else {
                                    ROOTSCOPE.snapshot = {'src': image.asDataURL('image/png'),
                                                        'modified': Date.now()};
                                }
                            }
                            done(true);
                        }
                    }).show(snapshot);

                    $(document.body).find('.ptro-icon-btn').addClass('s-button');
                    $(document.body).find('.ptro-input').addClass('s-button');
                });
            }];

            annotationStruct.model = {'controller': controller};

            function saveNotes(param) {
                if (param === 'ok') {
                    save = true;
                }else {
                    save = false;
                    ROOTSCOPE.snapshot = "annotationCancelled";
                }
                painterro.save();
            }

            function rejectNotes() {
                save = false;
                ROOTSCOPE.snapshot = "annotationCancelled";
                painterro.save();
            }

            function saveSnap(url, embedPos, entryPos, domainObject) {
                var snap = false;

                if (embedPos !== -1 && entryPos !== -1) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(url);
                    reader.onloadend = function () {
                        snap = reader.result;
                        domainObject.useCapability('mutation', function (model) {
                            if (model.entries[entryPos]) {
                                model.entries[entryPos].embeds[embedPos].snapshot = {
                                    'src': snap,
                                    'type': url.type,
                                    'size': url.size,
                                    'modified': Date.now()
                                };
                                model.entries[entryPos].embeds[embedPos].id = Date.now();
                            }
                        });
                    };
                }
            }

            this.dialogService.getUserChoice(annotationStruct)
            .then(saveNotes, rejectNotes);

        };

        return AnnotateSnapshot;
    }
);
