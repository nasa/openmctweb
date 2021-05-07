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

define([
    '../SummaryWidgetViewPolicy'
], function (
    SummaryWidgetViewPolicy
) {

    describe('SummaryWidgetViewPolicy', function () {
        let policy;
        let domainObject;
        let view;
        beforeEach(function () {
            policy = new SummaryWidgetViewPolicy();
            domainObject = jasmine.createSpyObj('domainObject', [
                'getModel'
            ]);
            domainObject.getModel.and.returnValue({});
            view = {};
        });

        it('returns true for other object types', function () {
            domainObject.getModel.and.returnValue({
                type: 'random'
            });
            expect(policy.allow(view, domainObject)).toBe(true);
        });

        it('allows summary widget view for summary widgets', function () {
            domainObject.getModel.and.returnValue({
                type: 'summary-widget'
            });
            view.key = 'summary-widget-viewer';
            expect(policy.allow(view, domainObject)).toBe(true);
        });

        it('disallows other views for summary widgets', function () {
            domainObject.getModel.and.returnValue({
                type: 'summary-widget'
            });
            view.key = 'other view';
            expect(policy.allow(view, domainObject)).toBe(false);
        });

    });
});
