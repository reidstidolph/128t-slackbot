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
var t128 = require("./lib/t128-router.js");
var healthReport = require("./lib/healthReport.js");
var alarm = require("./lib/alarm.js");
var testHealthReport = require("./templates/healthReport.json");
var testAlarm = require("./templates/alarm.json");

slack.send(testHealthReport);
slack.send(testAlarm);
// needs update
