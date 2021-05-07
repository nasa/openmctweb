export function coerce(value, coerceFunc) {
    if (coerceFunc) {
        return coerceFunc(value);
    }

    return value;
}

export function validate(value, model, validateFunc) {
    if (validateFunc) {
        return validateFunc(value, model);
    }

    return true;
}

export function objectPath(path) {
    if (path) {
        if (typeof path !== "function") {
            const staticObjectPath = path;

            return function (object, model) {
                return staticObjectPath;
            };
        }

        return path;
    }
}
