#!/usr/bin/env node
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
var t128 = require("./lib/t128.js");
var healthReport = require("./lib/healthReportGenerator.js");
var alarm = require("./lib/alarmReportGenerator.js");
var alarmManager = require ("./lib/alarmManager.js");
var fs = require("fs");
const log = __dirname + "/log/128t-slackbot.log";

// some basic logging
// todo: set up a log rotation system
var logStream = fs.createWriteStream(log);
process.stdout.write = process.stderr.write = logStream.write.bind(logStream);


// record the slackbot PID
fs.writeFile(__dirname + "/cache/.pidfile", process.pid);


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

function handleAlarms(data) {
    var outputData = alarm(data);
    config.slack.alarmChannels.forEach(function(channel) {
        slack.send(outputData, channel, config.slack.slackUsername);
    })
}

//t128.getData("GET", "/router/{router}/node", handleNodeResponse);


var startingTimeRef = new Date;
const hourInterval = 3600000;
var msToNextHour = hourInterval
                   - ((startingTimeRef.getMinutes() * 60000) 
                   + (startingTimeRef.getSeconds() * 1000) 
                   + startingTimeRef.getMilliseconds());

process.stdout.write(`Setting hourly timer to fire in ${msToNextHour}ms\nthen fire hourly after that.\n`);

setTimeout(()=>{
    t128.getData("GET", "/router/{router}/node", handleNodeResponse);
    setInterval(()=>{
        // basic interval for health report
        t128.getData("GET", "/router/{router}/node", handleNodeResponse);
    }, hourInterval)
}, msToNextHour);

// Handle the alarmReport events emitted by alarmManger.
// 
alarmManager.on("alarmReport", (report)=> {handleAlarms(report);});