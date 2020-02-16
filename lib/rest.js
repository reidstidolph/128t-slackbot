/*jshint node: true */
"use strict";

//
// This module exports a function that takes
// handles sending REST requests, and receiving
// their responses.
//
//

var https = require("https");
var http = require("http");
var url = require("url");
var slackbotConfig = require("../cache/.slackbot-config.json"); // load config, to get global loglevel
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), slackbotConfig.logLevel); // set up logger

function makeRestRequest(method, resource, args, onComplete) {

    logger.log("debug", `Starting REST request with Method=${method} for Resource=${resource}`);
    var restBody = "";
    var restHeaders = {};
    var restRequestOptions;
    var restRequest;

    function handleRestResponse(response) {

        var data;
        var chunkedData = "";
        // due to different events being emitted in different NodeJS
        // versions ("close", "finish", "end"), and confusion about which
        // events will be fired...implementing a variable and function
        // to indicate callback was fired, and ensure it only fires once.
        var callbackFired = false;
        function fireCallback(){
            if (callbackFired === false) {
                callbackFired = true;
                logger.log("debug", "REST request completed");
                onComplete(null, response, data);
            }
        }

        function parseFinalResults(results){
            if (response.headers["content-type"].search(/application\/json/i) === 0) {
                logger.log("debug", "REST response data indicates it is JSON. Parsing as JSON.");
                // make sure object isn't already an object
                if (typeof results === "object") {
                    logger.log("debug", "Data already parsed into object");
                    data = results;
                    // else it is a string, then parse to an object
                } else if (typeof results === "string"){
                    logger.log("debug", "Parsing as JSON.");
                    try {
                        data = JSON.parse(results);
                    } catch(err) {
                        // something is terribly wrong...bail out.
                        logger.log("emergency", results);
                        logger.log("emergency", "ERROR: Cannot parse JSON returned from REST resource.");
                        logger.log("emergency", "ERROR: " + err);
                        process.exit(1);
                    }
                }
            } else {
                logger.log("info", "REST response indicates it does not contain JSON.");
                //process.exit(1);
            }
        }

        response.setEncoding("utf8");
        // set up a event receivers for response data
        response.on("data", (responseData)=> {
            logger.log("debug", "REST request receiving data");
            chunkedData += responseData;
        });

        response.on("end", ()=> {
            parseFinalResults(chunkedData);
            fireCallback();
        });

        response.on("close", ()=> {
            parseFinalResults(chunkedData);
            fireCallback();
        });

        response.on("finish", ()=> {
            parseFinalResults(chunkedData);
            fireCallback();
        });
    }

    // got a request body. Need to indicate this in the request headers
    if (args.body) {
        restBody = args.body;
        logger.log("debug", `Setting up request body (body contents not logged as it may contain usernames/passwords)`);
        restHeaders = {
            "Content-Type" : "application/json",
            "Content-Length" : Buffer.byteLength(restBody, "utf8")
        };
    }

    // got new or updated headers. merege them with defaults
    if (args.headers) {
        logger.log("debug", "Updating REST request headers");
        for (var header in args.headers) { restHeaders[header] = args.headers[header]; }
    }

    // set up HTTP(S) request options
    restRequestOptions = {
        host : url.parse(resource).hostname,
        path : url.parse(resource).path,
        method : method,
        headers : restHeaders
    };

    // if URL contains a port, set it in the options
    if (url.parse(resource).port) {
        restRequestOptions.port = url.parse(resource).port;
        logger.log("debug", `Setting REST request port to ${restRequestOptions.port}`);
    }

    // determine if request is HTTP or HTTPS
    if (url.parse(resource).protocol === "https:") {
        restRequestOptions.rejectUnauthorized = false;
        logger.log("debug", "Setting request for HTTPS");
        restRequest = https.request(restRequestOptions, handleRestResponse);
    } else if (url.parse(resource).protocol === "http:") {
        logger.log("debug", "Setting request for HTTPS");
        restRequest = http.request(restRequestOptions, handleRestResponse);
    }

    // Launch the request
    logger.log("debug", "Sending REST request");
    restRequest.write(restBody);
    restRequest.end();

    // If the request emits and error, fire callback with error
    restRequest.on("error", function(error) {
        logger.log("debug", "REST request failed:", error);
        onComplete(error);
    });
}

module.exports = { request : makeRestRequest };
