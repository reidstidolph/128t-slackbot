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

try {var config = require("./cache/.slackbot-config.json");} // config for slackbot
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
const pidfile =  __dirname + "/cache/.pid.json"; // file to record running process ID
const version = require('./package.json').version; // Slackbot version from package.json

var startingTimeRef = new Date();
var slack = require("./lib/slack.js"); // interacts with Slack
var t128 = require("./lib/t128.js"); // interacts with a 128T router
var healthReport = require("./lib/healthReportGenerator.js"); // creates Slack formatted health reports 
var alarm = require("./lib/alarmReportGenerator.js"); // creates Slack formatted alarm reports
var alarmManager = require ("./lib/alarmManager.js"); // manages alarm state
var Scheduler = require("./lib/Scheduler.js");
var fs = require("fs"); // file system

// modules for handling logs
//
var Logger =  require("./lib/Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), config.logLevel); // set up logger
var logUtils = require("./lib/logUtils.js"); // utilities for dealing with log files
var logFile = __dirname + "/log/128t-slackbot.log"; // log file location
var maxLogSize = 20000000; // 20Mb

// Handling for any exceptions
//
process.on('uncaughtException', function(err) {
    var timestamp = new Date();
    process.stderr.write(`${timestamp.toISOString()} - Caught exception: ${err}\n`);
    process.stderr.write(err.stack);
    process.exit(1);
});

// Set up log file, and file rotatation
//
logUtils.watchFile(logFile, (fileSize)=>{
    logger.log("debug", `Log file is currently ${fileSize} bytes`)
    if (fileSize >= maxLogSize) {
        logger.log("info", `Begin log file rotation.`)
        logUtils.rotate(logFile);
    }
})

// record the slackbot PID, and start time
var procInfo = {"startTime" : startingTimeRef.toJSON(), "pid" : process.pid, "version" : version};
fs.writeFile(pidfile, JSON.stringify(procInfo), { mode: 0o600 }, (e)=>{
    if(e) {
        logger.log("warning", `error writing to ${pidfile}`, e);
    } else {
        logger.log("debug", `pid recorded to ${pidfile}`, procInfo);
    }
});

function handle128TResponse(error, data) {

    if (error) {
        logger.log("error", "Request for 128T data failed:", error);
        config.slack.reportChannels.forEach((channel)=> {
            slack.send("128T may be *OFFLINE*!\nFailure description:```" + error + "```", channel, config.slack.slackUsername);
        });
    } else {
        logger.log("info", "Got 128T router health data. Startint Slack health report generation.")
        var outputData = healthReport(data);
        config.slack.reportChannels.forEach((channel)=> {
            slack.send(outputData, channel, config.slack.slackUsername);
        });
    }
}

function handleAlarms(data) {
    var outputData = alarm(data);
    config.slack.alarmChannels.forEach(function(channel) {
        slack.send(outputData, channel, config.slack.slackUsername);
    });
}

// for each configured health report schedules, set up a new schedule 
config.healthReportSchedules.forEach((schedule)=>{
    var mySchedule = new Scheduler(schedule, ()=>{
        t128.getData("GET", "/router/{router}/node", handle128TResponse);
    });
});

// Handle the alarmReport events emitted by alarmManger.
// 
alarmManager.on("alarmReport", (report)=> {handleAlarms(report);});
