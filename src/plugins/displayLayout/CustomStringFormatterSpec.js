import CustomStringFormatter from './CustomStringFormatter';
import { createOpenMct, resetApplicationState } from 'utils/testing';

const CUSTOM_FORMATS = [
    {
        key: 'sclk',
        format: (value) => 2 * value
    },
    {
        key: 'lts',
        format: (value) => 3 * value
    }
];

const valueMetadata = {
    key: "sin",
    name: "Sine",
    unit: "Hz",
    formatString: "%0.2f",
    hints: {
        range: 1,
        priority: 3
    },
    source: "sin"
};

const datum = {
    name: "1 Sine Wave Generator",
    utc: 1603930354000,
    yesterday: 1603843954000,
    sin: 0.587785209686822,
    cos: -0.8090170253297632
};

describe('CustomStringFormatter', function () {
    let element;
    let child;
    let openmct;
    let customStringFormatter;

    beforeEach((done) => {
        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);
        CUSTOM_FORMATS.forEach(openmct.telemetry.addFormat.bind({openmct}));
        openmct.on('start', done);
        openmct.startHeadless();

        spyOn(openmct.telemetry, 'getFormatter');
        openmct.telemetry.getFormatter.and.callFake((key) => CUSTOM_FORMATS.find(d => d.key === key));

        customStringFormatter = new CustomStringFormatter(openmct, valueMetadata);
    });

    afterEach(async () => {
        await resetApplicationState(openmct);
    });

    it('adds custom format sclk', () => {
        const format = openmct.telemetry.getFormatter('sclk');
        expect(format.key).toEqual('sclk');
    });

    it('adds custom format lts', () => {
        const format = openmct.telemetry.getFormatter('lts');
        expect(format.key).toEqual('lts');
    });

    it('returns correct value for custom format sclk', () => {
        customStringFormatter.setFormat('&sclk');
        const value = customStringFormatter.format(datum, valueMetadata);
        expect(datum.sin * 2).toEqual(value);
    });

    it('returns correct value for custom format lts', () => {
        customStringFormatter.setFormat('&lts');
        const value = customStringFormatter.format(datum, valueMetadata);
        expect(datum.sin * 3).toEqual(value);
    });
});
