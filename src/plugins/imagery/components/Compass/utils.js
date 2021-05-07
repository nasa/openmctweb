/**
 *
 * sums an arbitrary number of absolute rotations
 * (meaning rotations relative to one common direction 0)
 * normalizes the rotation to the range [0, 360)
 *
 * @param  {...number} rotations in degrees
 * @returns {number} normalized sum of all rotations - [0, 360) degrees
 */
export function rotate(...rotations) {
    const rotation = rotations.reduce((a, b) => a + b, 0);

    return normalizeCompassDirection(rotation);
}

export function inRange(degrees, [min, max]) {
    const point = rotate(degrees);

    return min > max
        ? (point >= min && point < 360) || (point <= max && point >= 0)
        : point >= min && point <= max;
}

export function percentOfRange(degrees, [min, max]) {
    let distance = rotate(degrees);
    let minRange = min;
    let maxRange = max;

    if (min > max) {
        if (distance < max) {
            distance += 360;
        }

        maxRange += 360;
    }

    return (distance - minRange) / (maxRange - minRange);
}

function normalizeCompassDirection(degrees) {
    const base = degrees % 360;

    return base >= 0 ? base : 360 + base;
}
