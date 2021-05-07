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
    '../lib/eventHelpers',
    '../lib/extend',
    'lodash'
], function (
    eventHelpers,
    extend,
    _
) {

    /**
     * Generic type for model controllers.  Should be extended to build a form
     * for a specific model.
     */
    function PlotModelFormController($scope, openmct, attrs) {
        this.$scope = $scope;
        this.openmct = openmct;
        this.attrs = attrs;

        if (this.isReady()) {
            this.initializeScope();
        } else {
            this.$scope.$watch(this.isReady.bind(this), function (isReady) {
                if (isReady) {
                    this.initializeScope();
                }
            }.bind(this));
        }
    }

    PlotModelFormController.extend = extend;
    eventHelpers.extend(PlotModelFormController.prototype);

    PlotModelFormController.prototype.isReady = function () {
        return Boolean(this.$scope.formDomainObject)
            && Boolean(this.$scope.$eval(this.attrs.formModel));
    };

    /**
     * Initialize scope is called when the formDomainObject has been set.
     * This may be deferred until after the controller construction in cases
     * where the object has not yet loaded.
     */
    PlotModelFormController.prototype.initializeScope = function () {
        this.domainObject = this.$scope.formDomainObject;
        this.model = this.$scope.$eval(this.attrs.formModel);

        this.unlisten = this.openmct.objects.observe(
            this.domainObject,
            '*',
            this.updateDomainObject.bind(this)
        );

        this.$scope.form = {};
        this.$scope.validation = {};

        this.listenTo(this.$scope, '$destroy', this.destroy, this);
        this.initialize();
        this.initForm();
    };

    PlotModelFormController.prototype.updateDomainObject = function (domainObject) {
        this.domainObject = domainObject;
    };

    PlotModelFormController.prototype.destroy = function () {
        this.stopListening();
        this.model.stopListening(this.$scope);
        this.unlisten();
    };

    PlotModelFormController.prototype.fields = [];

    /** override for custom initializer **/
    PlotModelFormController.prototype.initialize = function () {

    };

    PlotModelFormController.prototype.initForm = function () {
        this.fields.forEach(function (field) {
            this.linkFields(
                field.modelProp,
                field.formProp,
                field.coerce,
                field.validate,
                field.objectPath
            );
        }, this);
    };

    PlotModelFormController.prototype.linkFields = function (
        prop,
        formProp,
        coerce,
        validate,
        objectPath
    ) {
        if (!formProp) {
            formProp = prop;
        }

        const formPath = 'form.' + formProp;
        let self = this;

        if (!coerce) {
            coerce = function (v) {
                return v;
            };
        }

        if (!validate) {
            validate = function () {
                return true;
            };
        }

        if (objectPath && (typeof objectPath !== "function")) {
            const staticObjectPath = objectPath;
            objectPath = function () {
                return staticObjectPath;
            };
        }

        this.listenTo(this.model, 'change:' + prop, function (newVal, oldVal) {
            if (!_.isEqual(coerce(_.get(self.$scope, formPath)), coerce(newVal))) {
                _.set(self.$scope, formPath, coerce(newVal));
            }
        });
        this.model.listenTo(this.$scope, 'change:' + formPath, (newVal, oldVal) => {
            const validationResult = validate(newVal, this.model);
            if (validationResult === true) {
                delete this.$scope.validation[formProp];
            } else {
                this.$scope.validation[formProp] = validationResult;

                return;
            }

            if (_.isEqual(coerce(newVal), coerce(this.model.get(prop)))) {
                return; // Don't trigger excessive mutations.
            }

            if (!_.isEqual(coerce(newVal), coerce(oldVal))) {
                this.model.set(prop, coerce(newVal));
                if (objectPath) {
                    this.openmct.objects.mutate(
                        this.domainObject,
                        objectPath(this.domainObject, this.model),
                        coerce(newVal)
                    );
                }
            }
        });
        _.set(this.$scope, formPath, coerce(this.model.get(prop)));
    };

    return PlotModelFormController;
});

