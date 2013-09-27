'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {
    beforeEach(module('2lemetryApiV2.directives'));

    describe('app-version', function () {
        it('should print current version', function () {
            module(function ($provide) {
                $provide.value('version', 'TEST_VER');
            });
            inject(function ($compile, $rootScope) {
                var element = $compile('<span app-version></span>')($rootScope);
                expect(element.text()).toEqual('TEST_VER');
            });
        });
    });

    describe('topicPermissions', function () {
        var html, scope, elem, compiled;
        beforeEach(function () {
            html = '<div topic-permissions permissions="data" topic="key" on-permission-change="saveUpdatedPermissions(permissions)"></div>';
            inject(function($compile, $rootScope) {
                //create a scope (you could just use $rootScope, I suppose)
                scope = $rootScope.$new();

                //get the jqLite or jQuery element
                elem = angular.element(html);

                //compile the element into a function to
                // process the view.
                compiled = $compile(elem);

                //run the compiled view.
                compiled(scope);

                //call digest on the scope!
                scope.$digest();
            });
        });

        it ('should call the controller update method properly based on user input', function () {
            console.log(elem);
            expect(false).toBe(true);

        });
    });
});
