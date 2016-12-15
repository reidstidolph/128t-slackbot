/*jshint node: true */
"use strict";

//
// This module uses the ResourceMonitor, to manage alarms
// and notifications for a 128T router. It's primary function
// is to handle all events from an alarm ResourceMonitor, do 
// suppression and returning of collections of alarms.
//

const EventEmitter = require("events");
class AlarmManager extends EventEmitter{}
var alarmManager = new AlarmManager();

var config = require("../slackbot-config.json");
var ResourceMonitor = require("./ResourceMonitor.js");
var alarmMon = new ResourceMonitor("/router/{router}/alarm", "GET", config.timers.alarmPollInterval);

// handle events emitted from the alarmMonitor
alarmMon.on("cleared", function(event){
    console.log("cleared event fired!");

    event.forEach((alarm)=> {
    	alarm.severity="CLEARED";
    });
    console.log(event);
    alarmManager.emit("alarmReport", event);
});

alarmMon.on("active", function(event){
    console.log("active event fired!");
    console.log(event);
    alarmManager.emit("alarmReport", event);
});

alarmMon.on("error", function(error){
    process.stdout.write(`Failed to get alarms: ${error}\n`);
})

alarmMon.start();

module.exports = alarmManager;