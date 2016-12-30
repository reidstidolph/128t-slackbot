/*jshint node: true */
"use strict";

//
// This module uses the ResourceMonitor, to manage alarms
// and notifications for a 128T router. It's primary function
// is to handle all events from an alarm ResourceMonitor, do 
// suppression and returning of collections of alarms.
//

// extend the event emitter to create the alarmManager
const EventEmitter = require("events");
class AlarmManager extends EventEmitter{}
var alarmManager = new AlarmManager();
var config = require("../cache/.slackbot-config.json");
// set up logging
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), config.logLevel); // set up logger
// set up a resourceMonitor to watch for alarms
var ResourceMonitor = require("./ResourceMonitor.js");
var alarmMon = new ResourceMonitor("/router/{router}/alarm", "GET", config.timers.alarmPollInterval);

var routerOnline = null;

// handle events emitted from the alarmMonitor
//

// cleared alarm events
alarmMon.on("cleared", function(event){
    logger.log("notice", "cleared event:", event);

    event.forEach((alarm)=> {
    	alarm.severity="CLEARED";
    });

    alarmManager.emit("alarmReport", event);
});

// active alarm events
alarmMon.on("active", function(event){
    logger.log("notice", "active event:", event);
    alarmManager.emit("alarmReport", event);
});

// errors for when alarmMon is failing to get alarms
alarmMon.on("error", function(error){
	if (routerOnline === true || routerOnline === null) {
		routerOnline = false;
		alarmManager.emit("alarmReport", [{
			category : "Router",
			message : "Failing to retrieve 128T Router data",
			severity : "CRITICAL",
			source : "128T-Slackbot",
			node : "*"
		}]);
	}
    logger.log("critical", `Failed to get alarms: ${error}`);
});

alarmMon.on("success", function(){
	logger.log("debug", "Success getting alarm data");
	if (routerOnline === false) {
		routerOnline = true;
		alarmManager.emit("alarmReport", [{
			category : "Router",
			message : "Getting data from 128T Router again",
			severity : "CLEARED",
			source : "128T-Slackbot",
			node : "*"
		}]);
	}
});

// start the alarmMon
alarmMon.start();

// exports the alarm report emitting alarmManager
module.exports = alarmManager;