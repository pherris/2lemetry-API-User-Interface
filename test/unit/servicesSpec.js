'use strict';

/* jasmine specs for services go here */

describe('service', function () {
    beforeEach(module('2lemetryApiV2.services'));

    describe('version', function () {
        it('should return current version', inject(function (version) {
            expect(version).toEqual('0.0.1');
        }));
    });

    describe('PersistedData', function () {
        //mock out localstorage
        beforeEach(function () {
            var store = {};

            spyOn(localStorage, 'getItem').andCallFake(function (key) {
                return store[key] ? store[key] : null; //localstorage returns null, not undefined if object is not present
            });
            spyOn(localStorage, 'setItem').andCallFake(function (key, value) {
                return store[key] = value + '';
            });
            spyOn(localStorage, 'removeItem').andCallFake(function (key) {
                return delete store[key];
            });
            spyOn(localStorage, "clear").andCallFake(function () {
                store = {};
            });
        });

        it('should have the proper getters and setters', inject(['PersistedData', function (PersistedData) {
            expect(typeof PersistedData.setDataSet).toBe("function");
            expect(typeof PersistedData.getDataSet).toBe("function");
        }]));

        it('should take an object and store it with the timestamp it was created', inject(['PersistedData', function (PersistedData) {
            localStorage.clear();
            PersistedData.setDataSet("test", { "storedObject": true });
            expect(PersistedData.getDataSet("test").created).toBeGreaterThan((new Date().getTime()) - 200);
        }]));

        it('should not return objects older than three hours', inject(['PersistedData', function (PersistedData) {
            localStorage.clear();

            PersistedData.setDataSet("test", {
                "storedObject": true,
                created: (new Date().getTime() - (1000 * 60 * 60 * 3 + 200))
            });

            expect(PersistedData.getDataSet("test")).toBe(null);
        }]));

    })
})
;
