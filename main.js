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
const pidfile =  __dirname + "/cache/.pid.json"
const version = require('./package.json').version;

var startingTimeRef = new Date;
var slack = require("./lib/slack.js");
var t128 = require("./lib/t128.js");
var healthReport = require("./lib/healthReportGenerator.js");
var alarm = require("./lib/alarmReportGenerator.js");
var alarmManager = require ("./lib/alarmManager.js");
var fs = require("fs");
var Logger =  require("./lib/Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), config.logLevel); // set up logger

// Handling for any exceptions
//
process.on('uncaughtException', function(err) {
    var timestamp = new Date;
    process.stderr.write(`${timestamp.toISOString()} - Caught exception: ${err}\n`);
    process.stderr.write(err.stack);
    process.exit(1);
});

// record the slackbot PID, and start time
var procInfo = {"startTime" : startingTimeRef.toJSON(), "pid" : process.pid, "version" : version};
fs.writeFile(pidfile, JSON.stringify(procInfo), (e)=>{
    if(e) {
        logger.log("warning", `error writing to ${pidfile}`, e);
    } else {
        logger.log("debug", `pid recorded to ${pidfile}`, procInfo)
    }
});

function handle128TResponse(error, data, response) {

    if (error) {
        logger.log("error", "Request for 128T data failed:", error);
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

t128.getData("GET", "/router/{router}/node", handle128TResponse);



const hourInterval = 3600000;
var msToNextHour = hourInterval
                   - ((startingTimeRef.getMinutes() * 60000) 
                   + (startingTimeRef.getSeconds() * 1000) 
                   + startingTimeRef.getMilliseconds());

logger.log("debug", `Setting hourly timer to fire in ${msToNextHour}ms`);

setTimeout(()=>{
    t128.getData("GET", "/router/{router}/node", handle128TResponse);
    setInterval(()=>{
        // basic interval for health report
        t128.getData("GET", "/router/{router}/node", handle128TResponse);
    }, hourInterval)
}, msToNextHour);

// Handle the alarmReport events emitted by alarmManger.
// 
alarmManager.on("alarmReport", (report)=> {handleAlarms(report);});