'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function () {

    beforeEach(function () {
        browser().navigateTo('../../app/index.html');
    });


    it('should automatically redirect to /authenticate when location hash/fragment is empty', function () {
        expect(browser().location().url()).toBe("/authenticate");
    });


    describe('authenticate', function () {

        beforeEach(function () {
            browser().navigateTo('#/authenticate');
        });

        it('should render authentication screen when user navigates to /authenticate', function () {
            expect(element('[ng-view] h2:first').text()).
                toMatch(/M2M Authentication/);
        });

        it('should indicate that you are not authenticated and have no data', function () {
            expect(element('[ng-view] h3:first').text()).
                toMatch(/Not Authorized/);
            expect(element('[ng-view] li:first').text()).
                toMatch(/License Usage:  \//);
            //TODO: figure out how to access $http in this and the authenticated tests to ensure header is added
            //expect($http.defaults.headers.common['Authorization']).toBeNull();
        });

        it('should indicate that you ARE authenticated', function () {
            //login
            input('username').enter('poc@peoplenetonline.com');
            input('password').enter('pocpass');
            element('button:eq(0)').click();

            sleep(1);

            expect(element('[ng-view] h3:first').text()).not().toMatch(/Not Authorized/);
            expect(element('[ng-view] li:first').text()).
                toMatch(/License Usage: \d[\,\d]* \/ \d[\,\d]*/);

            //TODO: figure out how to access $http in this and not auth tests to ensure header is added
            //expect($http.defaults.headers.common['Authorization']).not().toBeNull();
        });

    });

    describe('listTopics', function () {

        beforeEach(function () {
            browser().navigateTo('#/authenticate');
            //TODO not authenticated
            sleep(5);
            browser().navigateTo('#/listTopics');
        });

        it('should list your topics', function () {
            sleep(1);

            expect(element('[ng-view] #results').text()).
                toMatch(/Results: \d+/);
            console.log(element('[ng-view] p'));
            expect(element('[ng-view] p')).
                toMatch(/.+>.+<\/p>/);
        });
        //TODO tests
//        it('should render view1 when user navigates to /view1', function () {
//            expect(element('[ng-view] p:first').text()).
//                toMatch(/partial for view 1/);
//        });

    });


    describe('Find Accounts', function () {

        beforeEach(function () {
            browser().navigateTo('#/accounts');
        });


        it('should render Account Management when user navigates to /accounts', function () {
            expect(element('[ng-view] h2:first').text()).
                toMatch(/Account Management/);
        });
        //TODO tests that require authentication...

    });
});
