const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

/**
 * Nicely formatted tick steps from d3-array.
 */
function tickStep(start, stop, count) {
    const step0 = Math.abs(stop - start) / Math.max(0, count);
    let step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
    const error = step0 / step1;
    if (error >= e10) {
        step1 *= 10;
    } else if (error >= e5) {
        step1 *= 5;
    } else if (error >= e2) {
        step1 *= 2;
    }

    return stop < start ? -step1 : step1;
}

/**
 * Find the precision (number of decimals) of a step.  Used to round
 * ticks to precise values.
 */
function getPrecision(step) {
    const exponential = step.toExponential();
    const i = exponential.indexOf('e');
    if (i === -1) {
        return 0;
    }

    let precision = Math.max(0, -(Number(exponential.slice(i + 1))));

    if (precision > 20) {
        precision = 20;
    }

    return precision;
}

/**
 * Linear tick generation from d3-array.
 */
export function ticks(start, stop, count) {
    const step = tickStep(start, stop, count);
    const precision = getPrecision(step);

    return _.range(
        Math.ceil(start / step) * step,
        Math.floor(stop / step) * step + step / 2, // inclusive
        step
    ).map(function round(tick) {
        return Number(tick.toFixed(precision));
    });
}

export function commonPrefix(a, b) {
    const maxLen = Math.min(a.length, b.length);
    let breakpoint = 0;
    for (let i = 0; i < maxLen; i++) {
        if (a[i] !== b[i]) {
            break;
        }

        if (a[i] === ' ') {
            breakpoint = i + 1;
        }
    }

    return a.slice(0, breakpoint);
}

export function commonSuffix(a, b) {
    const maxLen = Math.min(a.length, b.length);
    let breakpoint = 0;
    for (let i = 0; i <= maxLen; i++) {
        if (a[a.length - i] !== b[b.length - i]) {
            break;
        }

        if ('. '.indexOf(a[a.length - i]) !== -1) {
            breakpoint = i;
        }
    }

    return a.slice(a.length - breakpoint);
}

export function getFormattedTicks(newTicks, format) {
    newTicks = newTicks
        .map(function (tickValue) {
            return {
                value: tickValue,
                text: format(tickValue)
            };
        });

    if (newTicks.length && typeof newTicks[0].text === 'string') {
        const tickText = newTicks.map(function (t) {
            return t.text;
        });
        const prefix = tickText.reduce(commonPrefix);
        const suffix = tickText.reduce(commonSuffix);
        newTicks.forEach(function (t) {
            t.fullText = t.text;
            if (suffix.length) {
                t.text = t.text.slice(prefix.length, -suffix.length);
            } else {
                t.text = t.text.slice(prefix.length);
            }
        });
    }

    return newTicks;
}
