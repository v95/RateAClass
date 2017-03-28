(function() {
    'use strict';

    var app = angular.module('rc.controllers.main', ['ui.router', 'angularMoment']);
    
    app.config([
    '$stateProvider', 
    function($stateProvider) {
        $stateProvider.state('home', {
            parent: "root",
            url: '/home', 
            views: {
                "container@": {
                    templateUrl: 'internal/home', 
                    controller: 'MainCtrl',
                }
            },   
            resolve: {
                getPostPromise: ['postService', function(postService) {
                    //return postService.getExcel();
                }]
            }
        });
    }]);
    app.controller('MainCtrl', [
    '$scope', 
    'postService',
    'mainService',
    '$compile',
    '$log',
    function($scope, postService, mainService, $compile, $log) {
        $scope.current_search = false;
        $scope.rootPage = true;
        $scope.search = function() {
            if ($scope.searchschool.length == 0) {
                $("#searchschool").detach().prependTo($("form#search-school"));
                $("#searchschool").removeClass("header-search");
                $("a.section").show();
                $scope.current_search = false;
                $("div.container.search").remove();
                $("div.container.home").show();
                $("#searchschool").focus();
            } else {
                if (!$scope.current_search) {
                    var header_links = angular.element(document.querySelector('#header-links'));
                    $("#searchschool").detach().prependTo(header_links).focus();
                    $("#searchschool").addClass("header-search");


                    var gc = angular.element(document.querySelector('.global-container'));
                    angular.element(document).find(".global-container").prepend(angular.element('<div class="container search"></div>'));
                    $("div.container.home").hide();

                    $scope.current_search = true;
                }
                $("a.section").hide();

                $("div.container.search").html("");
                mainService.getSchools($scope.searchschool);
                mainService.schools.forEach(function(item) {
                    angular.element(document).find("div.container.search").append($compile('<a class="school-result" href="/school/' + item.unique + '"><div class="info-section"><h2>' + item.name + '</h2><span>' + item.location + '</span></div><div class="link-section"><i class="fa fa-chevron-right"></i></div></a>')($scope));
                });
            }
        }
    }]);
})();