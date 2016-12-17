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
var config = require("../slackbot-config.json");
// set up a resourceMonitor to watch for alarms
var ResourceMonitor = require("./ResourceMonitor.js");
var alarmMon = new ResourceMonitor("/router/{router}/alarm", "GET", config.timers.alarmPollInterval);

// handle events emitted from the alarmMonitor
//

// cleared alarm events
alarmMon.on("cleared", function(event){
    console.log("cleared event fired!");

    event.forEach((alarm)=> {
    	alarm.severity="CLEARED";
    });
    console.log(event);
    alarmManager.emit("alarmReport", event);
});

// active alarm events
alarmMon.on("active", function(event){
    console.log("active event fired!");
    console.log(event);
    alarmManager.emit("alarmReport", event);
});

// errors for when alarmMon is failing to get alarms
alarmMon.on("error", function(error){
    process.stdout.write(`Failed to get alarms: ${error}\n`);
});

// start the alarmMon
alarmMon.start();

// exports the alarm report emitting alarmManager
module.exports = alarmManager;