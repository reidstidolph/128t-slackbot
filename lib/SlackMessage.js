/*jslint node: true */
"use strict";
//
// This module exports a prototype function that
// to be used as a template for creating Slack
// attachment messages.
//
//
var config = require("../slackbot-config.json");

function SlackMessage(){
	// initialized values
	var thisHeader = {
		"fallback": "default header fallback",
		"color": config.slack.colors.defaultAlt,
		"pretext": "default main title",
		"author_name": "default header title",
		"author_icon": ""
	};

	var thisFooter = {
		"fallback": "default footer fallback",
		"color": config.slack.colors.defaultAlt,
		"footer": "default footer title",
		"footer_icon": "",
		"ts": 0
	};

	this.attachments = [
		thisHeader,
		thisFooter
	]
}

// prototype to add a new attachments to the message array
SlackMessage.prototype.pushAttachment = function(newAttachmentData) {
	// initialize attachment data
	var outputAttachment = {"fields" : []};

	outputAttachment.title = newAttachmentData.title || "default title";
	outputAttachment.fallback = newAttachmentData.fallback || "default fallback";
	outputAttachment.color = newAttachmentData.color || config.slack.colors.default;
	
    if (typeof(newAttachmentData.fields) === "object") {
		outputAttachment.fields = newAttachmentData.fields;
	}
	// splice the field into the fields array, at the second to last position
	this.attachments.splice((this.attachments.length - 1),0,outputAttachment);
}

SlackMessage.prototype.setMainTitle = function(newMainTitle) {
	if (typeof(newMainTitle) === "string") {
		this.attachments[0].pretext = newMainTitle;
	}
}

SlackMessage.prototype.setHeaderTitle = function(newTitle) {
	if (typeof(newTitle) === "string") {
		this.attachments[0].author_name = newTitle;
	}
}

SlackMessage.prototype.setHeaderIcon = function(newIcon) {
	if (typeof(newIcon) === "string") {
		this.attachments[0].author_icon = newIcon;
	}
}

SlackMessage.prototype.setHeaderFallback = function(newFallback) {
	if (typeof(newFallback) === "string") {
		this.attachments[0].fallback = newFallback;
	}
}

SlackMessage.prototype.setFooterTitle = function(newFooterTitle) {
	if (typeof(newFooterTitle) === "string") {
		this.attachments[this.attachments.length - 1].footer = newFooterTitle;
	}
}

SlackMessage.prototype.setFooterIcon = function(newFooterIcon) {
	if (typeof(newFooterIcon) === "string") {
		this.attachments[this.attachments.length - 1].footer_icon = newFooterIcon;
	}
}

SlackMessage.prototype.setFooterFallback = function(newFooterFallback) {
	if (typeof(newFooterFallback) === "string") {
		this.attachments[this.attachments.length - 1].fallback = newFooterFallback;
	}
}

SlackMessage.prototype.setTimeStamp = function(newTimeStamp) {
	if (newTimeStamp instanceof Date) {
		var time = (newTimeStamp / 1000).toFixed(0);
		this.attachments[this.attachments.length - 1].ts = time;
	} else {
		var time = (Date.now() / 1000).toFixed(0);
		this.attachments[this.attachments.length - 1].ts = time;
	}
}

SlackMessage.prototype.setHeaderColor = function(hexColor) {
	if (typeof(hexColor) === "string") {
		this.attachments[0].color = hexColor;
	}
}

SlackMessage.prototype.setFooterColor = function(hexColor) {
	if (typeof(hexColor) === "string") {
		this.attachments[this.attachments.length - 1].color = hexColor;
	}
}

module.exports = SlackMessage;
