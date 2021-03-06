/*jshint node: true */
"use strict";

//
// This module exports and object containing functions
// for interacting with a 128T Router.
//
// It requires Slack information found in 
// slackbot-config.json
//

var rest = require("./rest.js");
var slackbotConfig = require("../cache/.slackbot-config.json");
var t128Init = require("./t128Init.js");
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), slackbotConfig.logLevel); // set up logger

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

function sendRequest(method, t128resource, onRequestComplete) {
	logger.log("notice", `Preparing to request data: ${method} ${t128resource}`);
	// set up our REST request data
	var requestArgs = { headers: {"Authorization": `Bearer ${t128.token}`}};
	var restResource = slackbotConfig.t128Control.api + parseResource(t128resource);

	function reSendRequest() {

		logger.log("warning", `Retrying request for data: ${method} ${t128resource}`);
		rest.request(method, restResource, requestArgs, (error, response, data)=> {

			if (error) {
				// data request failure.
				// run callback and pass back error.
				onRequestComplete(error, null, null);

			} else if (response.statusCode != 200) {
				// re-transmission rejected.
				// run callback and pass back new error.
				onRequestComplete(new Error(`Data request rejected: ${response.statusCode} ${response.statusMessage}`), null, null);
			} else if (response.statusCode == 200) {
				// resend success!
				// make callback
				logger.log("notice", `Retry request for data got: ${response.statusCode}: ${response.statusMessage}`);
				onRequestComplete(null, data, response);
			}
		});
	}

	rest.request(method, restResource, requestArgs, (error, response, data)=> {

		if (error) {
			// data request failure.
			// run callback and pass back error.
			onRequestComplete(error, null, null);

		} else if (response.statusCode != 200) {
			// got an auth challeng...re-init
			logger.log("warning", `Data request got ${response.statusCode}: ${response.statusMessage}. Re-initializing.`);
			t128Init((error, token, config)=> {
				if (error) {
					// could not re-initialize.
					// run callback and pass back error.
					logger.log("error", "Unable to initialize:", error);
					t128.initialized = false;
					onRequestComplete(error, null, null);
				} else {
					// set new config
					t128.config = config;
					t128.token = token;
					t128.routerName = config.authority.router[0].name;
					t128.initialized = true;
					// retry the request
					reSendRequest(method, t128resource);
				}				
			});
		} else if (response.statusCode == 200) {
			// request success!
			// make callback
			logger.log("notice", `Request for data got: ${response.statusCode}: ${response.statusMessage}`);
			logger.log("debug", "Response data:", data);
			onRequestComplete(null, data, response);
		}
	});
}

//
// private function to parse t128 resources, replacing {router}
// with real router name.
//

function parseResource(resource) {
	logger.log("debug", `Parsing resource: ${resource}`);
	var newResource = resource.replace(/{router}/g,t128.routerName);
	logger.log("debug", `Resolved resource is now: ${newResource}`);
	return newResource;
}

//
// public function to making requests to via the t128 object.
// If the t128 object is not initialized, it will
// go do initilization.
//

function getRouterData(method, resource, onGetRouterDataComplete) {
	logger.log("debug", `preparing to ${method} router data from ${resource}`);
	// if not initialized, go try to become initialized
	if (t128.initialized === false) {
		logger.log("debug", "Router data requested, but currently not initialized. Attempting to initialize.");
		t128Init((error, token, config)=> {
			if (error) {
				// could not become initialized. run callback with error.
				logger.log("debug", "Unable to initialize. Giving up.");
				onGetRouterDataComplete(error, null, null);
			} else {
				logger.log("debug", "Initialization successful.");
				// initialized. Set stuff up.
				t128.config = config;
				t128.token = token;
				t128.routerName = config.authority.router[0].name;
				t128.initialized = true;
				logger.log("debug", `RouterName set to ${t128.routerName}. Proceeding to request data.`);
				//send request.
				sendRequest(method, resource, onGetRouterDataComplete);
			}
		});
	} else {
		logger.log("debug", "Initialized. Proceeding to request data.");
		// already initialized. send request.
		sendRequest(method, resource, onGetRouterDataComplete);
	}
}

module.exports = t128;