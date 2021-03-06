/*jshint node: true */
"use strict";

//
// This module exports a function that takes
// in 128T node data, and returns a Slack formatted
// string for a health report.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var SlackMessage = require("./SlackMessage.js");
var SlackHealthAttachment = require("./SlackHealthAttachment.js");
var SlackHealthField = require("./SlackAttachmentField.js");
var t128 = require("./t128.js");
var version = require("../package.json").version;
var config = require("../cache/.slackbot-config.json");

//
//
// functions for use in this module
//
//

// calculate and return host CPU string
// expects 128T machine CPU array
function getAttachmentHostCPU(hostCore){
	if (Array.isArray(hostCore) && hostCore.length > 0) {
		var hostCPUString = "";
		var cpuSumUtilization = 0;
		var averageCPUUtilization = 0;

		hostCore.forEach((core)=> {
			cpuSumUtilization += core.utilization;
		});
		averageCPUUtilization = (cpuSumUtilization / hostCore.length).toFixed(1);
		hostCPUString = `${averageCPUUtilization}%`;
		return hostCPUString;
	} else return "unavailable";
}

// calculate and set up data plane CPU
// expects 128T packetProcessing CPU array
function getAttachmentDataCPU(dataCore){
	if (Array.isArray(dataCore) && dataCore.length > 0) {
		var dataCPUString = "";
		var dataSumUtilization = 0;
		var averageDataCPUUtilization = 0;

		dataCore.forEach((dataCore)=> {
			dataSumUtilization += dataCore.utilization;
		});
		averageDataCPUUtilization = dataSumUtilization / dataCore.length;
		dataCPUString = `${averageDataCPUUtilization}%`;
		return dataCPUString;
	} else return "unavailable";
}

// calculate and set up mem
// expects 128T node memory object
function getAttachmentMem(memory){
	if (memory.usage && memory.capacity) {
		var memString = "";
		var memUsedPercentage = (memory.usage / memory.capacity * 100).toFixed(1);
		var gigabytesCapacity = (memory.capacity / 1000000000).toFixed(0);
		memString = `${memUsedPercentage}% of ${gigabytesCapacity}G`;
		return memString;	
	} else return "unavailable";
}

// calculate and set up disk
// expects 128T node disk array 
function getAttachmentDisk(disk){
	if (Array.isArray(disk) && disk.length > 0) {
		var diskString = "";
		var diskUsedPercentage = (disk[0].usage / disk[0].capacity * 100).toFixed(1);
		var gigabytesCapacity = (disk[0].capacity / 1000000000).toFixed(0);
		diskString = `${diskUsedPercentage}% of ${gigabytesCapacity}G`;
		return diskString;
	} else return "unavailable";
}

// calculate and set up traffic
// expects 128T node object
function getBandwidth(bits){

	var unit = "";
	var bandwidth = 0;
	var bitsPerSecond = (bits * 8).toFixed(0);
	if (bitsPerSecond >= 1000000000) {
		//bandwidth in gigabits
		unit = "Gb/s";
		bandwidth = bitsPerSecond / 1000000000;
	}
	if (bitsPerSecond < 1000000000 && bitsPerSecond >= 100000) {
		//bandwidth in megabits
		unit = "Mb/s";
		bandwidth = bitsPerSecond / 100000;
	}
	if (bitsPerSecond < 100000 && bitsPerSecond >= 1000) {
		//bandwidth in kilobits
		unit = "Kb/s";
		bandwidth = bitsPerSecond / 1000;
	}
	if (bitsPerSecond < 1000) {
		//bandwidth in bits
		unit = "b/s";
		bandwidth = bitsPerSecond * 1;
	}
	return bandwidth.toFixed(1) + unit;
}

//
//
// module export takes in node data, and returns a Slack
// formatted health report
//
//

module.exports = (data)=> {
	
	// initialize vars
	var healthReport = new SlackMessage();
	var nodedata = [];
	var totalTrafficSlackAttachment = {
		title : "Traffic Summary",
		color : config.slack.colors.default,
		fallback : "Traffic Summary",
		fields : [{
			short : true,
			title : "Sessions",
			value : ""
		},
		{
			short : true,
			title : "Bandwidth",
			value : ""
		}]
	};
	var totalRouterTraffic = {totalBps : 0, sessions : 0};

	// validate input
	if (typeof(data) != "object" || data.isArray === false) {
		return new Error("Invalid inputs for healthReport.");
	} else nodedata = data;

	// set report main title
	healthReport.setMainTitle(`${t128.routerName} is ONLINE`);
	
	// set report header data
	healthReport.setHeaderTitle("128T Router Health Report");
	healthReport.setHeaderIcon("http://i.imgur.com/oT7ZCR4.png");
	healthReport.setHeaderFallback(`${t128.routerName} is ONLINE`);
	
	// set report footer data
	healthReport.setFooterTitle(`Health Report - v${version}`);
	healthReport.setFooterIcon("http://imgur.com/qI8nL1X.png");
	healthReport.setFooterFallback("Health Report");
	
	// set timestamp
	healthReport.setTimeStamp(Date.now());

	// set up report slack attachment. 1 attachment per node
	nodedata.forEach((node)=> {
		// initialize vars
		var hostCpu;
		var dataCpu;
		var memory;
		var disk;
		//var traffic;
		var slackAttachment = new SlackHealthAttachment(node);

		// calculate KPI data strings
		hostCpu = getAttachmentHostCPU(node.cpu.machine);
		dataCpu = getAttachmentDataCPU(node.cpu.packetProcessing);
		memory = getAttachmentMem(node.memory);
		disk = getAttachmentDisk(node.disk);
		//traffic = getAttachmentTraffic(node);

		// populate the fields array with node data
		slackAttachment.fields[0] = new SlackHealthField("Host CPU", hostCpu, true);
		slackAttachment.fields[1] = new SlackHealthField("Data Plane CPU", dataCpu, true);
		slackAttachment.fields[2] = new SlackHealthField("Memory", memory, true);
		slackAttachment.fields[3] = new SlackHealthField("Disk", disk, true);
		//slackAttachment.fields[4] = new SlackHealthField("Traffic", traffic, false);

		// add traffic to totalRouterTraffic
		totalRouterTraffic.totalBps += node.averageBandwidth;
		totalRouterTraffic.sessions += node.sessions;

		// push attachment into report attachments array
		healthReport.pushAttachment(slackAttachment);
	});


	totalTrafficSlackAttachment.fields[1].value = getBandwidth(totalRouterTraffic.totalBps);
	totalTrafficSlackAttachment.fields[0].value = totalRouterTraffic.sessions;
	healthReport.pushAttachment(totalTrafficSlackAttachment);

	
	return healthReport;
};
