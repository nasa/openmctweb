export function getValidatedPlan(domainObject) {
    let body = domainObject.selectFile.body;
    let json = {};
    if (typeof body === 'string') {
        try {
            json = JSON.parse(body);
        } catch (e) {
            return json;
        }
    } else {
        json = body;
    }

    return json;
}
