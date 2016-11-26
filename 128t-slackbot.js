/*jshint node: true */
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

try {var config = require("./slackbot-config.json");}
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
var slack = require("./lib/slack.js");
var routerConfig = {};
var t128 = require("./lib/t128.js");
var healthReport = require("./lib/healthReport.js");
var alarm = require("./lib/alarm.js");


function handleNodeResponse(error, data, response) {

    if (error) {
        process.stdout.write(`Failed with: ${error}\n`);
        config.slack.reportChannels.forEach(function(channel) {
            slack.send("128T may be *OFFLINE*!\nFailure description:```" + error + "```", channel, config.slack.slackUsername);
        })
    } else {
        var outputData = healthReport(data);
        config.slack.reportChannels.forEach(function(channel) {
            slack.send(outputData, channel, config.slack.slackUsername);
        })
    }
}

function handleAlarmResponse(data, response) {

}


t128.getData("GET", "/router/{router}/node", handleNodeResponse);
