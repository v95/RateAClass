(function() {
	"use strict";
    var app = angular.module('rc.services.main', []);

    // authentification...save cookie into local storage
	app.factory('mainService', ['$http', '$window', function($http, $window) {
		var main = {
		    data: [],
		    schools: []
		};
		// save token
		main.getSchools = function(name) {
			return $http.get('/schools/' + name).success(function(data) {
				console.log(data);
	   			angular.copy(data, main.schools);
			});
		};
		return main;
	}]);
})();