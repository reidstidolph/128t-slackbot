/*jshint node: true */
"use strict";

//
// This module exports a functions that initializes
// a 128T Router. This means it authenticates, gets
// tokens, caches tokens, and gets config.
// 
// This function takes a single callback for input,
// and calls it onece it is done.
//
// The callback will contain:
//     an error (if one occurs)
//     returned token
//     config
//

var fs = require("fs");
var rest = require("./rest.js");
var tokenFile = "./cache/.token.json";
var slackbotConfig = require("../slackbot-config.json");
var token;
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), slackbotConfig.logLevel); // set up logger

// This function updates cached token
function setToken (newToken) {
	logger.log("info", "Recording new token to disk.");
    token = newToken.token;
    fs.writeFile(tokenFile, JSON.stringify(newToken), (err)=> {
    	if (err) {
    		logger.log("warning", "Unable to write token to disk: ", err);
    	}
	});
}

// Authenticate and get token function
// retry parameter takes a boolean to indicate if the authentication
// request is the result of a retry. This prevents a logic loop.
function doAuthenticate(retry, initModuleCallback) {
	// set up our REST request data
    var requestArgs = {
        body : JSON.stringify({
    		password : slackbotConfig.t128Control.password,
    		username : slackbotConfig.t128Control.username
        }),
        headers: { "Content-Type": "application/json" }
    };

    var restResource = slackbotConfig.t128Control.api + "/login";
    // make REST request to get token
    rest.request("POST", restResource, requestArgs, (error, response, tokenData)=> {

		if (error) {
			// request to auth failed.
			// run callback with request error.
			logger.log("error", "Authenticate request failed:", error);
			initModuleCallback(error, null, null);

		} else if (response.statusCode != 200) {
			// login rejected. 
			// run the callback with a new error
			logger.log("error", `Authenticate request rejected: ${response.statusCode} ${response.statusMessage}`);
			initModuleCallback(new Error(`authentication rejected: ${response.statusCode} ${response.statusMessage}`), null, null);

		} else {
			// login succeeded. 
			// set token and proceed.
			setToken(tokenData);
			// Authenticated with token cached. Get config.
			getConfig(retry, initModuleCallback);
		}
    });
}

// a function to get config
function getConfig(retry, initModuleCallback) {
	// set up our REST request data
    var requestArgs = {
        headers: {"Authorization": "Bearer " + token}
    };

    var restResource = slackbotConfig.t128Control.api + "/config/getJSON?source=running";
    // make REST request to get token
    rest.request("GET", restResource, requestArgs, (error, response, configData)=> {

    	if (error) {
			// request for config failed.
			// run callback with request error.
			logger.log("warning", "Request for config failed:", error);
			initModuleCallback(error, null, null);

		} else if (response.statusCode != 200) {
			// config request rejected.
			// login failed. run the callback with an error
			if (retry === false) {
				// attempt to get a new token
				logger.log("warning", `First config request rejected: ${response.statusCode} ${response.statusMessage}...retrying.`);
				doAuthenticate(true, initModuleCallback);
			} else if (retry === true) {
				// already got a new token, and it still fails. run callback with error.
				logger.log("error", "Retry attempt to become authenticated rejected. Giving up.");
				initModuleCallback(new Error(`config request rejected: ${response.statusCode} ${response.statusMessage}`), null, null);
			}

		} else {
			// get config succeeded.
			// proceed with callback.
			logger.log("debug", "Initialization succeeded.");
			initModuleCallback(null, token, configData);
		}
    });
}

//
// function exported by this module.
// This function takes a single callback for input,
// and calls it onece it is done.
//
// The callback will contain:
//     an error (if one occurs)
//     returned token
//     config
//

function init(initComplete) {

	// Begin the initilization process by seeing if a cached token exists.
	// If it doesn't, go get one first with doAuthenticate().
	logger.log("info", "Beginning init by checking disk for token");
	fs.readFile(tokenFile, "utf-8", (error, data)=> {
		if (error) {
			// something wrong with token file.
			// doesn't exist or is corrupt
			// go get a new token
			logger.log("debug", "Error accessing disk: ", error);
			logger.log("info", "Error getting token from disk. Must athenticate to get a new one.");
	        doAuthenticate(false, initComplete);
	    } else {
	    	// got token from file
	    	logger.log("info", "Token found on disk. Getting config.");
		    token = JSON.parse(data).token;
		    getConfig(false, initComplete);
	    }
	});
}

module.exports = init;