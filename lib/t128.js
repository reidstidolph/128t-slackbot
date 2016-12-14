/*jshint node: true */
"use strict";

//
// This module exports and object containing functions
// for interacting with a 128T Router.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var rest = require("./rest.js");
var slackbotConfig = require("../slackbot-config.json");
var t128Init = require("./t128Init.js");
// the asyncronous forking logic of this module can be hard to follow.
// creating this global variable to store the callback that should 
// get run on completion of the getRouterData method. This should 
// get over-written on entry into getRouterData.
// 
var getDataCallback = function(error, token, configData){
	process.stdout.write(error);
	process.stdout.write(token);
	process.stdout.write(configData);
};

//
// object literal that gets exported by this module
//

var t128 = {
	token : "",
	routerName: "",
	getData: getRouterData,
	initialized: false
};

//
// private function for sending REST requests to a 128T router.
// This takes in a 128T resource, as shown in swagger.
// Router names will be derived from the routerName 
// in an initialized t128 object.
//

function sendRequest(method, t128resource) {
	// set up our REST request data
	var requestArgs = { headers: {"Authorization": `Bearer ${t128.token}`}};
	var restResource = slackbotConfig.t128Control.api + parseResource(t128resource);

	function reSendRequest() {

		process.stdout.write("retrying...");
		rest.request(method, restResource, requestArgs, (error, response, data)=> {

			if (error) {
				// data request failure.
				// run callback and pass back error.
				getDataCallback(error, null, null);

			} else if (response.statusCode != 200) {
				// re-transmission rejected.
				// run callback and pass back new error.
				getDataCallback(new Error(`data request rejected: ${response.statusCode} ${response.statusMessage}`), null, null);
			} else if (response.statusCode == 200) {
				// resend success!
				// make callback
				getDataCallback(null, data, response);
			}
		});
	}

	rest.request(method, restResource, requestArgs, (error, response, data)=> {

		if (error) {
			// data request failure.
			// run callback and pass back error.
			getDataCallback(error, null, null);

		} else if (response.statusCode != 200) {
			// got an auth challeng...re-init
			process.stdout.write(`data request got ${response.statusCode}: ${response.statusMessage}`);
			t128Init((error, token, config)=> {
				if (error) {
					// could not re-initialize.
					// run callback and pass back error.
					t128.initialized = false;
					getDataCallback(error, null, null);
				} else {
					// set new config
					t128.config = config;
					t128.token = token;
					t128.routerName = data.authority.router[0].name;
					t128.initialized = true;
					// retry the request
					reSendRequest(method, t128resource);
				}				
			});
		} else if (response.statusCode == 200) {
			// request success!
			// make callback
			getDataCallback(null, data, response);
		}
	});
}

//
// private function to parse t128 resources, replacing {router}
// with real router name.
//

function parseResource(resource) {
	var newResource = resource.replace(/{router}/g,t128.routerName);
	return newResource;
}

//
// public function to making requests to via the t128 object.
// If the t128 object is not initialized, it will
// go do initilization.
//

function getRouterData(method, resource, onGetRouterDataComplete) {

	getDataCallback = onGetRouterDataComplete;
	// if not initialized, go try to become initialized
	if (t128.initialized === false) {

		t128Init((error, token, config)=> {
			if (error) {
				// could not become initialized. run callback with error.
				getDataCallback(error, null, null);
			} else {
				// initialized. Set stuff up.
				t128.config = config;
				t128.token = token;
				t128.routerName = config.authority.router[0].name;
				t128.initialized = true;
				//send request.
				sendRequest(method, resource);
			}
		});
	} else {
		// already initialized. send request.
		sendRequest(method, resource);
	}
}

module.exports = t128;