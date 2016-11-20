/*jslint node: true */
"use strict";

var https = require("https");
var http = require("http");
var url = require("url");

function makeRestRequest(method, resource, args, onResponse) {
    // todo: validate inputs
    var restBody = "";
    var restHeaders = {};
    var restRequestOptions;
    var restRequest;

    function handleRestResponse(response) {
        var data;
        // set up a receiver for response data
        //console.log(response);
        // console.log(response.headers);
        //console.log(response.headers["content-type"]);
        if (response.headers["content-type"].search(/application\/json/i) === 0) {
            //console.log("JSON data");
            response.on("data", function(responseData) {
                data = JSON.parse(responseData);
                onResponse(response, data);
            })  
        } else onResponse(response, data);
    }

    //console.log("Preparing REST request for: " + resource);
    //console.log(args);
    
    
    // got a request body. Need to indicate this in the headers
    if (args.body) {
        restBody = args.body;
        restHeaders = {
            "Content-Type" : "application/json",
            "Content-Length" : Buffer.byteLength(restBody, "utf8")
        };
    }

    // got new or updated headers. merege them with defaults
    if (args.headers) {
        for (var header in args.headers) { restHeaders[header] = args.headers[header]; }
    }

    restRequestOptions = {
        host : url.parse(resource).hostname,
        path : url.parse(resource).path,
        method : method,
        headers : restHeaders
    }

    if (url.parse(resource).port) {
        restRequestOptions.port = url.parse(url).port;
    }

    if (url.parse(resource).protocol === "https:") {
        //console.log("making HTTPS request.");
        // allow for self-signed certs in 128T routers
        restRequestOptions.rejectUnauthorized = false,
        restRequest = https.request(restRequestOptions, handleRestResponse);
    } else if (url.parse(resource).protocol === "http:") {
        //console.log("making HTTP request.");
        restRequest = http.request(restRequestOptions, handleRestResponse);
    }
    //console.log(restBody);
    restRequest.write(restBody);
    restRequest.end();
    restRequest.on("error", function(e) {
        console.error(e);
    });
}

module.exports = {
    request : makeRestRequest
}