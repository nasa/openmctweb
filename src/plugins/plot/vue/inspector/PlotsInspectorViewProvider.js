
import PlotOptions from "./PlotOptions.vue";
import Vue from 'vue';

export default function PlotsInspectorViewProvider(openmct) {
    return {
        key: 'plots-inspector',
        name: 'Plots Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let parent = selection[0].length > 1 && selection[0][1].context.item;
            let object = selection[0][0].context.item;

            return parent
                && parent.type === 'time-strip'
                && object
                && object.type === 'telemetry.plot.overlay';
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            PlotOptions: PlotOptions
                        },
                        provide: {
                            openmct,
                            domainObject: openmct.selection.get()[0][0].context.item
                        },
                        template: '<plot-options></plot-options>'
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
