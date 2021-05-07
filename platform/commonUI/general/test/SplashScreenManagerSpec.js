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
    '../src/SplashScreenManager'
], function (SplashScreenManager) {

    describe('SplashScreenManager', function () {
        var $document,
            splashElement;

        beforeEach(function () {
            $document = jasmine.createSpyObj(
                '$document',
                ['querySelectorAll']
            );

            splashElement = jasmine.createSpyObj(
                'splashElement',
                ['addEventListener']
            );

            splashElement.parentNode = jasmine.createSpyObj(
                'splashParent',
                ['removeChild']
            );

            splashElement.className = 'some-class-name';

            $document.querySelectorAll.and.returnValue([splashElement]);
        });

        describe('when element exists', function () {
            beforeEach(function () {
                $document.querySelectorAll.and.returnValue([splashElement]);

                return new SplashScreenManager([$document]);
            });

            it('adds fade out class', function () {
                expect(splashElement.className).toBe('some-class-name fadeout');
            });

            it('removes the element when the transition ends', function () {
                expect(splashElement.addEventListener)
                    .toHaveBeenCalledWith(
                        'transitionend',
                        jasmine.any(Function)
                    );
                expect(splashElement.parentNode.removeChild)
                    .not
                    .toHaveBeenCalled();

                splashElement.addEventListener.calls.mostRecent().args[1]();
                expect(splashElement.parentNode.removeChild)
                    .toHaveBeenCalledWith(splashElement);
            });
        });

        it('does not error when element doesn\'t exist', function () {
            $document.querySelectorAll.and.returnValue([]);

            function run() {
                return new SplashScreenManager([$document]);
            }

            expect(run).not.toThrow();
        });
    });
});

