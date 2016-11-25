/*jslint node: true */
"use strict";
//
// This module exports and object containing functions
// for interacting with a 128T Router.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//
var events = require("events");
var fs = require("fs");
var rest = require("./rest.js");
var config = require("../slackbot-config.json");
var tokenFile = "./cache/.token.json"
var t128 = {
	token: "",
	routerName: "",
	getData: makeRequest,
	initialize: doInit,
	initialized: false
}

// set up an event emitter in the t128 object
t128.event = new events.EventEmitter();

//
// public function to making requests to via the t128 object.
// If the t128 object is not initialized, it will
// go do initilization.
//

function makeRequest(method, resource, callback) {
	console.log("Preparing to request data from 128T.");
	if (t128.initialized === false) {
		console.log("Initializing first.");
		// initialization complete. do callback
		function gotInitialized() {
			sendRequest(method, resource, callback);
		}
		// go initialize first
		initialize(gotInitialized);
	} else {
		//console.log("token already set up...proceeding");
		sendRequest(method, resource, callback);
	}
}

//
// a function to initialize the t128 object.
// this includes getting a config, and an
// auth token for future requests
//
function doInit () {
	// function for when initilized
	function onInitilized(){
		// done initializing. go do whatever you were doing.
		t128.initialized = true;
		console.log("Initialized!!");
		t128.event.emit("initialized");
	}

	// function to handl auth responses
	function handleAuthResponse (response, data) {
		console.log("initial auth got: " + response.statusCode + " " + response.statusMessage);
		if (response.statusCode != 200) {
			// login failed. Emit event
			t128.event.emit("error", "authentication failed");
		} else {
			// login succeeded. set token
			setToken(data);
			//get config
			getConfig(handleConfigResponse);
		}
	}

	// handles the result of request for config
	function handleConfigResponse (error, response, data) {
		//console.log(data.authority.router);
		// set the router name
		if (response.statusCode != 200) {
			// login failed. Emit event
			t128.event.emit("error", "config request failed. got: " + response.statusCode + " " + response.statusMessage);
			// check to see if we have already refreshed the token
		} else {
			t128.routerName = data.authority.router[0].name;
			onInitilized();
		}
	}

	// callback after reading token file
	function handleTokenFile(err, data) {
		if (err) {
			// something wrong with token file.
			// doesn't exist or is corrupt
			// go get a new token
			console.log("token not found...authenticating.");
	        doAuthenticate(handleAuthResponse);
	    } else {
	    	// got token from file
		    t128.token = JSON.parse(data);
		    getConfig(handleConfigResponse);
	    }
	}

	// check token file on disk, for valid token
	console.log("checking disk for token.");
	fs.readFile(tokenFile, "utf-8", handleTokenFile);
	// read config
}

//
// a function for sending REST requests to a 128T router.
// This takes in a 128T resource, as shown in swagger.
// Router names will be derived from the routerName 
// in an initialized t128 object.
// 
function sendRequest(method, t128resource, callback) {
	if (t128.initialized === false) {
		console.log("Error. MUST be initilized first.");
		process.exit();
	}
	// set up our REST request data
	//console.log("attempting request...");
	var requestArgs;
	var restResource;

	function onResponse(error, response, data) {
		console.log("128T response: " + response.statusCode + " " + response.statusMessage);
        if (response.statusCode === 401) {
        //console.log("reqeust failed!")
        //console.log(data);
            doAuthenticate(function() {
            	//console.log("retrying...");
            	sendRequest(method, callback);
            })
        }
        else if (response.statusCode == 200) {
            callback(data, response);
        }
    }

	if (t128.token.token) {
		requestArgs = {
			headers: {"Authorization": "Bearer " + t128.token.token}
		}
	}

	restResource = config.t128Control.api + parseResource(t128resource);;
	rest.request(method, restResource, requestArgs, onResponse);
}

//
// a function to parse t128 resources, replacing {router}
// with real router name.
//
function parseResource(resource) {
	var newResource = resource.replace(/{router}/g,t128.routerName);
	return newResource;
}

// Authenticate and get token function
function doAuthenticate(callback) {
	// set up our REST request data
	var requestArgs;
	var restResource;

	// make the incoming callback on a response
	function onAuthResponse(error, response, data) {
		callback(response, data);
	}

    requestArgs = {
        body : JSON.stringify({
    		password : config.t128Control.password,
    		username : config.t128Control.username
        }),
        headers: { "Content-Type": "application/json" }
    }

    restResource = config.t128Control.api + "/login"
    // make REST request to get token
    rest.request("POST", restResource, requestArgs, onAuthResponse);
}

// a function to get config
function getConfig(callback) {
	// set up our REST request data
	var requestArgs;
	var restResource;
	console.log("getting config");
	// make the incoming callback on a response
	function onConfigResponse(error, response, data) {
		callback(error, response, data);
	}

    requestArgs = {
        headers: {"Authorization": "Bearer " + t128.token.token}
    };

    restResource = config.t128Control.api + "/config/getJSON?source=running"
    // make REST request to get token
    rest.request("GET", restResource, requestArgs, onConfigResponse);
}

// This function updates our stored token
function setToken (newToken) {
    t128.token = newToken;
    //console.log("updating token...");
    fs.writeFile(tokenFile, JSON.stringify(newToken), function(err) {
	  if (err) {
	  	t128.event.emit("error", "token disk write failed");
	  } else {
	  	//console.log("token updated.");
	  };
	});
}

module.exports = t128;