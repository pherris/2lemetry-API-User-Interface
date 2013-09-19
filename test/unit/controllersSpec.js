'use strict';

/* jasmine specs for controllers go here */


describe('ListTopicsController', function () {
    var scope;

    beforeEach(module('myApp.controllers'));

    beforeEach(angular.mock.inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();
        $controller('ListTopicsController', {
            $scope: scope,
            m2m: {
                Topics: {
                    get: function () {
                        return {"size": 2, "results": ["randomDomain/firstLevelTopic/secondLevelTopic", "randomDomain/firstLevelTopic/secondLevelTopic"]}
                    }
                }
            }
        });
    }));


    it('should make a REST call and set the results to $scope.topicObject', (function () {
        //spec body
        expect(scope.topicObject.size).toEqual(2);
    }));

    it('should ....', inject(function () {
        //spec body
    }));
});
