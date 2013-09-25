'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function () {

    beforeEach(function () {
        browser().navigateTo('../../app/index.html');
    });


    it('should automatically redirect to /authenticate when location hash/fragment is empty', function () {
        expect(browser().location().url()).toBe("/authenticate");
    });


    describe('notAuthenticated', function () {

        beforeEach(function () {
            localStorage.clear();
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
        });

    });

    describe('authenticatd', function () {
        var permissions = {};
        beforeEach(function () {
            this.permissions = {};
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    permissions = JSON.parse(xhr.responseText);
                }
            }
            xhr.open("GET", "/credentials.json", false);
            xhr.send();

            browser().navigateTo('#/authenticate');
        });

        it('should indicate that you ARE authenticated', function () {
            //login
            input('username').enter(permissions.username);
            input('password').enter(permissions.password);
            element('button:eq(0)').click();

            //sleep(1);

            expect(element('[ng-view] h3:first').text()).not().toMatch(/Not Authorized/);
            expect(element('[ng-view] li:first').text()).
                toMatch(/License Usage: \d[\,\d]* \/ \d[\,\d]*/);

            //$http variable modifications are handled in unit tests
            //try to check for localstorage values instead (but ran into probs when expect needs a promise)
//            expect(localStorage.getItem("BearerToken")).toBeDefined();
//            expect(localStorage.getItem("Domain")).toBeDefined();
            //expect($http.defaults.headers.common['Authorization']).not().toBeNull();
        });

    });

    describe('listTopics', function () {

        beforeEach(function () {
            //pulls credentials from localstorage
            browser().navigateTo('#/authenticate');
            browser().navigateTo('#/listTopics');
        });

        it('should list your topics', function () {
            //should have results with count at top
            expect(element('[ng-view] #results').text()).
                toMatch(/Results: \d+/);
            expect(element('[ng-view] .phones li').text()).
                toMatch(/[\.a-z0-9]+[\/]+/);
        });
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
