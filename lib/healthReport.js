/*jslint node: true */
"use strict";
//
// This module exports a function that takes
// in 128T alarm data, and returns a Slack formatted
// string.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var config = require("../slackbot-config.json");
//var reportTemplate = require("../templates/healthReport.json");
var SlackAttachmentTemplate = require("../templates/slackAttachment.js");
var SlackAttachmentFieldTemplate = require("../templates/slackAttachmentField.js");
var t128 = require("../lib/t128-router.js");

module.exports = function (data) {
	// initialize vars
	var outputString = "empty";
	var report = 
		{
			"attachments": [
			       {
			            "fallback": "todo",
			            "color": "#00adef",
			            "pretext": "",
			            "author_name": "128T Router Health Report",
			            "author_icon": "http://i.imgur.com/oT7ZCR4.png"
					}
				]
			};
	
	var nodedata = [];

	// validate input
	if (typeof(data) != "object" || data.isArray === false) {
		return new Error("Invalid inputs for healthReport.");
	} else nodedata = data

	// set up report slack attachment. 1 attachment per node
	nodedata.forEach(function(node){
		var slackAttachment = new SlackAttachmentTemplate;
		slackAttachment.title = "Node: " + node.name;
		slackAttachment.color = "#373a36";
		slackAttachment.fallback = "todo";
		slackAttachment.fields[1] = new SlackAttachmentFieldTemplate;
		slackAttachment.fields[1].title = "Host CPU";
		slackAttachment.fields[2] = new SlackAttachmentFieldTemplate;
		slackAttachment.fields[2].title = "Data Plane CPU";
		slackAttachment.fields[3] = new SlackAttachmentFieldTemplate;
		slackAttachment.fields[3].title = "Memory";
		slackAttachment.fields[4] = new SlackAttachmentFieldTemplate;
		slackAttachment.fields[4].title = "Disk";
		slackAttachment.fields[5] = new SlackAttachmentFieldTemplate;
		slackAttachment.fields[5].title = "Traffic";
		slackAttachment.fields[5].short = false;

		// calculate and return host CPU string
		// expects 128T machine CPU array
		function getAttachmentHostCPU(hostCore){
			var hostCPUString = ""
			var cpuSumUtilization = 0
			hostCore.forEach(function(core){
				cpuSumUtilization += core.utilization;
			})
			var averageCPUUtilization = cpuSumUtilization / hostCore.length;
			hostCPUString = averageCPUUtilization + "%";
			return hostCPUString;
		}

		// calculate and set up data plane CPU
		// expects 128T packetProcessing CPU array
		function getAttachmentDataCPU(dataCore){
			var dataCPUString = ""
			var dataSumUtilization = 0
			dataCore.forEach(function(dataCore){
				dataSumUtilization += dataCore.utilization;
			})
			var averageDataCPUUtilization = dataSumUtilization / dataCore.length;
			dataCPUString = averageDataCPUUtilization + "%";
			return dataCPUString;
		}

		// calculate and set up mem
		// expects 128T node memory object
		function getAttachmentMem(memory){
			var memString = ""
			var memUsedPercentage = (memory.usage / memory.capacity * 100).toFixed(1);
			var gigabytesCapacity = (memory.capacity / 1000000000).toFixed(0);
			memString = memUsedPercentage + "% of " + gigabytesCapacity + "G";
			return memString;
		}

		// calculate and set up disk
		// expects 128T node disk array 
		function getAttachmentDisk(disk){
			var diskString = ""
			var diskUsedPercentage = (disk.usage / disk.capacity * 100).toFixed(1);
			var gigabytesCapacity = (disk.capacity / 1000000000).toFixed(0);
			diskString = diskUsedPercentage + "% of " + gigabytesCapacity + "G";
			return diskString;
		}

		// calculate and set up traffic
		// expects 128T node object
		function getAttachmentTraffic(nodeData){
			var trafficString = "";
			var unit = "";
			var bandwidth = 0;
			var bitsPerSecond = (nodeData.averageBandwidth * 8).toFixed(0);
			if (bitsPerSecond >= 1000000000) {
				//bandwidth in gigabits
				var unit = "Gb/s";
				bandwidth = bitsPerSecond / 1000000000;
			}
			if (bitsPerSecond < 1000000000 && bitsPerSecond >= 100000) {
				//bandwidth in megabits
				var unit = "Mb/s";
				bandwidth = bitsPerSecond / 100000;
			}
			if (bitsPerSecond < 100000 && bitsPerSecond >= 1000) {
				//bandwidth in kilobits
				var unit = "Kb/s";
				bandwidth = bitsPerSecond / 1000;
			}
			if (bitsPerSecond < 1000) {
				//bandwidth in bits
				var unit = "b/s";
				bandwidth = bitsPerSecond * 1;
			}
			trafficString = bandwidth.toFixed(1) + unit + ", " + nodeData.sessions + " active sessions";
			return trafficString;
		}

		slackAttachment.fields[1].value = getAttachmentHostCPU(node.cpu.machine);
		slackAttachment.fields[2].value = getAttachmentDataCPU(node.cpu.packetProcessing);
		slackAttachment.fields[3].value = getAttachmentMem(node.memory);
		slackAttachment.fields[4].value = getAttachmentDisk(node.disk[0]);
		slackAttachment.fields[5].value = getAttachmentTraffic(node);
		// push attachment into report attachments array
		report.attachments.push(slackAttachment);
	})

	// set router name
	report.attachments[0].pretext = t128.routerName;
	var time = (Date.now() / 1000).toFixed(0);
	report.attachments.push(
		{
			"fallback": "Health Report",
			"color": "#00adef",
                        "footer": "Health Report",
                        "footer_icon": "http://imgur.com/qI8nL1X.png",
                        "ts": time
		}
	);
	return report;
}
