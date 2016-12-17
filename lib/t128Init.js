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
// the asyncronous forking logic of this module can be hard to follow.
// creating this global variable to store the callback that should 
// get run on completion. This should get over-written on entry into
// the module
var initModuleCallback = function(error, token, configData){
	process.stdout.write(error);
	process.stdout.write(token);
	process.stdout.write(configData);
};

// This function updates cached token
function setToken (newToken) {

    token = newToken.token;
    fs.writeFile(tokenFile, JSON.stringify(newToken), (err)=> {
    	if (err) {} // should probably log this 
	});
}

// Authenticate and get token function
// retry parameter takes a boolean to indicate if the authentication
// request is the result of a retry. This prevents a logic loop.
function doAuthenticate(retry) {
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
			initModuleCallback(error, null, null);

		} else if (response.statusCode != 200) {
			// login rejected. 
			// run the callback with a new error
			initModuleCallback(new Error(`authentication rejected: ${response.statusCode} ${response.statusMessage}`), null, null);

		} else {
			// login succeeded. 
			// set token and proceed.
			setToken(tokenData);
			// Authenticated with token cached. Get config.
			getConfig(retry);
		}
    });
}

// a function to get config
function getConfig(retry) {
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
			initModuleCallback(error, null, null);

		} else if (response.statusCode != 200) {
			// config request rejected.
			// login failed. run the callback with an error
			if (retry === false) {
				// attempt to get a new token
				process.stdout.write(`config request rejected: ${response.statusCode} ${response.statusMessage}...retrying.\n`);
				doAuthenticate(true);
			} else if (retry === true) {
				// already got a new token, and it still fails. run callback with error.
				process.stdout.write("retry failed\n");
				initModuleCallback(new Error(`config request rejected: ${response.statusCode} ${response.statusMessage}`), null, null);
			}

		} else {
			// get config succeeded.
			// proceed with callback.
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

	// set the global callback to be run once finished
	initModuleCallback = initComplete;

	// Begin the initilization process by seeing if a cached token exists.
	// If it doesn't, go get one first with doAuthenticate().
	process.stdout.write("checking disk for token.\n");
	fs.readFile(tokenFile, "utf-8", (error, data)=> {
		if (error) {
			// something wrong with token file.
			// doesn't exist or is corrupt
			// go get a new token
			console.log("token not found...authenticating.");
	        doAuthenticate(false);
	    } else {
	    	// got token from file
		    token = JSON.parse(data).token;
		    getConfig(false);
	    }
	});
}

module.exports = init;