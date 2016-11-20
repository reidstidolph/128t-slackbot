/*jslint node: true */
"use strict";
//
// This NodeJS application that uses a 128T Router and
// outgoing Slack webhooks, to post router information
// to Slack.
//
// It accesses the 128T REST API for to retreive
//data, and sends data to Slack.
//
// Configuration of this app is done using
// ./t128-slackbot-config.json
//

var config = require("./slackbot-config.json");
var slack = require("./lib/slack.js");
var routerConfig = {};
var t128 = require("./lib/t128-router.js");
var healthReport = require("./lib/healthReport.js");
var alarm = require("./lib/alarm.js");

function handleNodeResponse(data, response) {
    var outputData = healthReport(data);
    slack.send(outputData);
}

function handleAlarmResponse(data, response) {
    console.log(typeof(data));
    var outputString = data[0].severity + " ALARM!:  " + data[0].message;
    console.log(outputString);
    //slack.send(outputString);
}

//t128.getData("GET", "/router/{router}/node", handle128tResponse);

t128.initialize();
t128.event.on("initialized", function() {
    t128.getData("GET", "/router/{router}/node", handleNodeResponse);
    //t128.getData("GET", "/router/{router}/alarm", handleAlarmResponse);
});
t128.event.on("error", function(e){console.log(e)});
