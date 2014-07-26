'use strict';

angular.module("UntappdClient",[])
	.factory('UntappdClient', function($q, $http, UNTAPPD_CONFIG){
		var _this = this;

		/**
		* These can be overridden in individual apps
		*/
    var config = angular.extend({
				BASE_URL : 'https://untappd.com',
        API_BASE_URL : 'https://api.untappd.com/v4'
    }, UNTAPPD_CONFIG);

		this.extensionId = chrome.runtime.id;
		this.authenticationUrl =
			config.BASE_URL + '/oauth/authenticate?client_id=' + config.CLIENT_ID +
			'&redirect_url=https://' + this.extensionId + '.chromiumapp.org/login&response_type=token';

		var userInfoUrl = config.API_BASE_URL + "/user/info";
		var friendsUrl = config.API_BASE_URL + "/user/friends/";

		_this.FRIENDLIMIT = 25;
		/**
		* This token also represents the "logged in" state of this access token
		*/
		_this.token = null;

		this.addToken = function(url) {
			var separator = "?";
			var index = url.indexOf("?");
			if (index != -1) {
				separator = "&";
			}
			return url + separator + "access_token=" + _this.token;
		}

		this.friendsUrl = function(userName, offset) {
			return _this.addToken(friendsUrl + userName + "?offset=" + offset + "&limit=" + _this.FRIENDLIMIT);
		}

		this.userUrl = function(userName) {
			return _this.addToken(userInfoUrl + "/" + userName + "?compact=true");
		}

		this.getAuthenticationToken = function() {
			_this.token = "authenticating";
			var deferred = $q.defer();

			// console.log(_this.token);
			// console.log(_this.authenticationUrl);
			chrome.identity.launchWebAuthFlow(
				{'url': _this.authenticationUrl, 'interactive': true},
					function(redirect_url) {
						if (redirect_url == undefined) {
							if (chrome.runtime.lastError) {
									console.error(chrome.runtime.lastError);
							} else {
								console.error("there was an error in authentication");
							}
							_this.token = null;
							deferred.resolve(null);
						} else {
						// console.log(redirect_url);
						var paramPartOfURL = redirect_url.slice(redirect_url.indexOf('#') + 1);
						var returnVal = paramPartOfURL.slice(paramPartOfURL.indexOf('=') + 1);
						// console.log("returning authentication token " + returnVal);
						_this.token = returnVal;
						deferred.resolve(returnVal);
					}
				});
			return deferred.promise;
		}

		this.getLoggedInUserData = function() {
			// console.log("retrieving user data with token " + _this.token);
			if (typeof _this.token === 'undefined') {
				return _this.getLoggedInUserObject();
			}
		}

		this.getLoggedInUserObject = function() {
			var deferred = $q.defer();
			// console.log(userInfoUrl + _this.token);

			$http.post(_this.addToken(_this.userUrl(""))).success(function(data) {
				// console.log(data.response);
				var user = data.response.user;
				deferred.resolve(user);
			}).error(function(data, status, headers, config) {
				if (chrome.runtime.lasterror){
								console.error(chrome.runtime.lasterror.message);
						} else {
							console.error("http error retrieving user with url " + userInfoUrl + ": " + data);
						}
				deferred.reject(data);
			});
			return deferred.promise;
		}

		this.getUserObject = function(userName) {
			var deferred = $q.defer();
			// console.log(_this.userUrl(userName));

			$http.post(_this.userUrl(userName)).success(function(data) {
				// console.log(data.response);
				var user = data.response.user;
				deferred.resolve(user);
			});
			return deferred.promise;
		}

		this.getFriendsObject = function(userName, offset) {
			var deferred = $q.defer();
			console.log(_this.friendsUrl(userName, offset));

			$http.post(_this.friendsUrl(userName, offset)).success(function(data) {
				// console.log(data.response);
				var friends = data.response.items;
				if (data.response.count == _this.FRIENDLIMIT) {
					// if there are 25 friends, attempt to call the api again to get more friends
					_this.getFriendsObject(userName, offset + _this.FRIENDLIMIT)
					.then (function(moreFriends) {
							deferred.resolve(friends.concat(moreFriends));
					});
				} else {
					deferred.resolve(friends);
				}
			}).error(function(data, status, headers, config) {
				if (chrome.runtime.lasterror){
								console.error(chrome.runtime.lasterror.message);
						} else {
							console.error("http error retrieving friends " + data);
						}
				deferred.reject(data);
			});
			return deferred.promise;
		}

		return {
			/**
			 * @ngdoc method
			 * @name UntappdClient.authenticate
			 * This method retrieves an authentication token. It also stores the token
			 * in local memory.
			 *
			 * @return {Promise} The value this promise will be resolved to will be
			 * the authentication token
			 */
			authenticate: function() {
				return _this.getAuthenticationToken();
			},

			/**
			* @ngdoc method
			* @name UntappdClient.setToken
			* This method sets an authentication token manually.
			*/
			setToken: function(token) {
				_this.token = token;
				// console.log("authentication token manually set to " + _this.token);
			},

			/**
			* @ngdoc method
			* @name UntappdClient.logOut
			* Removes the token from local memory and removes the cached auth token
			*/
			logOut: function() {
	    	chrome.identity.removeCachedAuthToken(
          { token: _this.token },
          function() {
          });
				_this.token = null;
			},

			/**
			*	@ngdoc method
			* @name UntappdClient.isLoggedOut
			*
			* @return {Boolean} true if the user is logged in, false if they are logged out
			*/
			isLoggedIn: function() {
				return angular.isDefined(_this.token) && _this.token != null;
			},

			/**
			*	@ngdoc method
			* @name UntappdClient.isAuthenticating
			*
			* @return {Boolean} true if the user is currently authenticating
			*/
			isAuthenticating: function() {
				return _this.token == "authenticating";
			},

			/**
			* @ngdoc method
			* @name UntappdClient.getLoggedInUser
			*
			* @return {Promise} The value this promise will be resolved to will be the
			* logged in user
			*/
			getLoggedInUser: function() {
				return _this.getLoggedInUserObject();
			},

			/**
			* @ngdoc method
			* @name UntappdClient.getUser
			*
			* @return {Promise} The value this promise will be resolved to will be the
			* named user
			*/
			getUser: function(name) {
				console.log("calling getUser for " + name);
				return _this.getUserObject(name);
			},

			/**
			* @ngdoc method
			* @name UntappdClient.getFriends
			*
			* @return {Promise} The value this promise will be the friends
			*/
			getFriends: function(user) {
				return _this.getFriendsObject(user, 0);
			}
		}
	});
