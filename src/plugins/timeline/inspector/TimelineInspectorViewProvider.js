
import TimelineOptions from "./TimelineOptions.vue";
import Vue from 'vue';

export default function TimelineInspectorViewProvider(openmct) {
    return {
        key: 'timestrip-inspector',
        name: 'Time Strip Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let object = selection[0][0].context.item;

            return object
                && object.type === 'time-strip';
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            TimelineOptions
                        },
                        provide: {
                            openmct,
                            domainObject: selection[0][0].context.item
                        },
                        template: '<timeline-options></timeline-options>'
                    });
                },
                destroy: function () {
                    if (component) {
                        component.$destroy();
                        component = undefined;
                    }
                }
            };
        },
        priority: function () {
            return 1;
        }
    };
}
