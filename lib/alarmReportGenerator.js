/*jshint node: true */
"use strict";

//
// This module exports a function that takes
// in 128T alarm data, and returns a Slack formatted
// string.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var SlackMessage = require("./SlackMessage.js");
var SlackAlarmAttachment = require("./SlackAlarmAttachment.js");
var SlackAlarmField = require("./SlackAttachmentField.js");
var t128 = require("./t128.js");
var version = require("../package.json").version;

module.exports = (data)=> {
	var alarmReport = new SlackMessage();
	var alarmData = [];
	// some alarm arrays to group and hold various alarm severities
	var criticalAlarms = [];
	var majorAlarms = [];
	var minorAlarms = [];
	var infoAlarms = [];
	var clearedAlarms = [];
	var otherAlarms = [];

	// validate input
	if (typeof(data) != "object" || data.isArray === false) {
		return new Error("Invalid inputs for alarmReport.");
	} else alarmData = data;

	// set report main title
	alarmReport.setMainTitle(`${t128.routerName} ALARM`);
	// set report header data
	alarmReport.setHeaderTitle("128T Router Alarm Report");
	alarmReport.setHeaderIcon("http://i.imgur.com/XMeBFfv.png");
	alarmReport.setHeaderFallback(`${t128.routerName} ALARM`);
	// set report footer data
	alarmReport.setFooterTitle(`Alarm Report - v${version}`);
	alarmReport.setFooterIcon("http://i.imgur.com/7ehurwP.png");
	alarmReport.setFooterFallback("Alarm Report");

	// set timestamp
	alarmReport.setTimeStamp(Date.now());

	// set up report slack attachment. 1 attachment per alarm severity level
	//
	alarmData.forEach((alarm)=> {
		var title = `Node: ${alarm.node}`;
		var newSlackAlarm = new SlackAlarmField(title, alarm.message);

		switch(alarm.severity) {
			case "CRITICAL":
				criticalAlarms.push(newSlackAlarm);
				break;
			case "MAJOR":
				majorAlarms.push(newSlackAlarm);
				break;
			case "MINOR":
				minorAlarms.push(newSlackAlarm);
				break;
			case "INFO":
				infoAlarms.push(newSlackAlarm);
				break;
			case "CLEARED":
				clearedAlarms.push(newSlackAlarm);
				break;
			default:
				otherAlarms.push(newSlackAlarm);
		}
	});

	if (criticalAlarms.length > 0) {
		var criticalAlarmAttachment = new SlackAlarmAttachment("CRITICAL");
		criticalAlarmAttachment.fields = criticalAlarms;
		alarmReport.pushAttachment(criticalAlarmAttachment);
	}

	if (majorAlarms.length > 0) {
		var majorAlarmAttachment = new SlackAlarmAttachment("MAJOR");
		majorAlarmAttachment.fields = majorAlarms;
		alarmReport.pushAttachment(majorAlarmAttachment);
	}

	if (minorAlarms.length > 0) {
		var minorAlarmAttachment = new SlackAlarmAttachment("MINOR");
		minorAlarmAttachment.fields = minorAlarms;
		alarmReport.pushAttachment(minorAlarmAttachment);
	}

	if (infoAlarms.length > 0) {
		var infoAlarmAttachment = new SlackAlarmAttachment("INFO");
		infoAlarmAttachment.fields = infoAlarms;
		alarmReport.pushAttachment(infoAlarmAttachment);
	}

	if (clearedAlarms.length > 0) {
		var clearedAlarmAttachment = new SlackAlarmAttachment("CLEARED");
		clearedAlarmAttachment.fields = clearedAlarms;
		alarmReport.pushAttachment(clearedAlarmAttachment);
	}

	if (otherAlarms.length > 0) {
		var otherAlarmAttachment = new SlackAlarmAttachment("default");
		otherAlarmAttachment.fields = otherAlarms;
		alarmReport.pushAttachment(otherAlarmAttachment);
	}

	return alarmReport;
};