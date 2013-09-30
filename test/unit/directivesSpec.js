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
            inject(function ($compile, $rootScope) {
                //create a scope (you could just use $rootScope, I suppose)
                scope = $rootScope.$new();

                scope.key = "domain/topic";
                scope.data = ["pub", "get"];

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

        //TODO figure out how to test this - only testing checkboxes, but output seems to be HTML that doesnt clearly reflect the change
        it('should call the controller update method properly based on user input', function () {
            //console.log(elem);
            //expect(false).toBe(true);

        });
        //TODO: directive is changing the scope value 'perms' but I am not seeing that in this test
        it('should set the right perms object', function () {
            //expect(scope.perms.pub).toBe(true);

        });
    });
});
