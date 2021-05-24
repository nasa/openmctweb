import StatusAPI from './StatusAPI.js';
import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe("The Status API", () => {
    let statusAPI;
    let openmct;
    let identifier;
    let status;
    let status2;
    let callback;

    beforeEach(() => {
        openmct = createOpenMct();
        statusAPI = new StatusAPI(openmct);
        identifier = {
            namespace: "test-namespace",
            key: "test-key"
        };
        status = "test-status";
        status2 = 'test-status-deux';
        callback = jasmine.createSpy('callback', (statusUpdate) => statusUpdate);
    });

    afterEach(async () => {
        await resetApplicationState(openmct);
    });

    describe("set function", () => {
        it("sets status for identifier", () => {
            statusAPI.set(identifier, status);

            let resultingStatus = statusAPI.get(identifier);

            expect(resultingStatus).toEqual(status);
        });
    });

    describe("get function", () => {
        it("returns status for identifier", () => {
            statusAPI.set(identifier, status2);

            let resultingStatus = statusAPI.get(identifier);

            expect(resultingStatus).toEqual(status2);
        });
    });

    describe("delete function", () => {
        it("deletes status for identifier", () => {
            statusAPI.set(identifier, status);

            let resultingStatus = statusAPI.get(identifier);
            expect(resultingStatus).toEqual(status);

            statusAPI.delete(identifier);
            resultingStatus = statusAPI.get(identifier);

            expect(resultingStatus).toBeUndefined();
        });
    });

    describe("observe function", () => {

        it("allows callbacks to be attached to status set and delete events", () => {
            let unsubscribe = statusAPI.observe(identifier, callback);
            statusAPI.set(identifier, status);

            expect(callback).toHaveBeenCalledWith(status);

            statusAPI.delete(identifier);

            expect(callback).toHaveBeenCalledWith(undefined);
            unsubscribe();
        });

        it("returns a unsubscribe function", () => {
            let unsubscribe = statusAPI.observe(identifier, callback);
            unsubscribe();

            statusAPI.set(identifier, status);

            expect(callback).toHaveBeenCalledTimes(0);
        });
    });
});
