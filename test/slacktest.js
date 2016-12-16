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

try {var config = require("../slackbot-config.json");}
catch(err) {
	process.stdout.write(`\n${err}\n`);
    process.stdout.write(`
        Something is wrong with the 'slackbot-config.json'
        file. You may not have set it up correctly. Make
        sure the file exists in the root of this app 
        directory. See the sample-config.json for an 
        example 'slackbot-config.json' file.\n\n`
    );
    process.exit(1);
}
var slack = require("../lib/slack.js");
var routerConfig = {};
var t128 = require("../lib/t128.js");
var healthReport = require("../lib/healthReport.js");
var alarm = require("../lib/alarmReportGenerator.js");

// set up and send dummy alarm data
var testAlarm = require("../templates/testAlarmData.json");
var alarmOutput = alarm(testAlarm);
config.slack.alarmChannels.forEach(function(channel) {
    slack.send(alarmOutput, channel, config.slack.slackUsername);
})

// set up and send dummy health report data
var testNode = require("../templates/testNodeData.json");
var healthReportOutput = healthReport(testNode);

config.slack.reportChannels.forEach(function(channel) {
    slack.send(healthReportOutput, channel, config.slack.slackUsername);
})