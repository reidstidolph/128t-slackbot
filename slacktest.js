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

var slack = require("./lib/slack.js");
var routerConfig = {};
var t128 = require("./lib/t128-router.js");
var healthReport = require("./lib/healthReport.js");
var alarm = require("./lib/alarm.js");
try	{var config = require("./slackbot-config.json");}
catch(err) {
    console.log("\nError with the 'slackbot-config.json' file.");
    console.log("You may not have set it up correctly.");
    console.log("Make sure the file exists in the root of this");
    console.log("app directory. See the sample-config.json for an"); 
    console.log("example 'slackbot-config.json'. \n\n");
    process.exit(1);
}

var testAlarm = require("./templates/testAlarmData.json");
var alarmOutput = alarm(testAlarm);
slack.send(alarmOutput);

var testNode = require("./templates/testNodeData.json");
var healthReportOutput = healthReport(testNode);
slack.send(healthReportOutput);
