(function() {
	"use strict";
    var app = angular.module('rc.services.main', []);

    // authentification...save cookie into local storage
	app.factory('mainService', ['$http', '$window', function($http, $window) {
		var main = {
		    data: [],
		    schools: [],
		    school: {}
		};
		// save token
		main.getSchools = function(name) {
			return $http.get('/search/school/' + name).success(function(data) {
	   			angular.copy(data, main.schools);
			});
		};

		main.getSchool = function(unique) {
			return $http.get('/school/' + unique).success(function(data) {
				angular.copy(data, main.school);
			})
		}
		return main;
	}]);
})();