/*jshint node: true */
"use strict";

//
// This module exports a prototype function that
// to be used as a template for creating Slack
// attachment messages.
//
//

var config = require("../cache/.slackbot-config.json");

class SlackMessage {

	// class constructor
	//
	//
	constructor(){
		// initialized values
		this.attachments = [
			{
				"fallback"    : "default header fallback",
				"color"       : config.slack.colors.defaultAlt,
				"pretext"     : "default main title",
				"author_name" : "default header title",
				"author_icon" : ""
			},
			{
				"fallback"    : "default footer fallback",
				"color"       : config.slack.colors.defaultAlt,
				"footer"      : "default footer title",
				"footer_icon" : "",
				"ts"          : 0
			}
		];
	}

	// class methods
	//
	//
	pushAttachment(newAttachmentData) {
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

	setMainTitle(newMainTitle) {
		if (typeof(newMainTitle) === "string") {
			this.attachments[0].pretext = newMainTitle;
		}
	}

	setHeaderTitle(newTitle) {
		if (typeof(newTitle) === "string") {
			this.attachments[0].author_name = newTitle;
		}
	}

	setHeaderIcon(newIcon) {
		if (typeof(newIcon) === "string") {
			this.attachments[0].author_icon = newIcon;
		}
	}

	setHeaderFallback(newFallback) {
		if (typeof(newFallback) === "string") {
			this.attachments[0].fallback = newFallback;
		}
	}

	setFooterTitle(newFooterTitle) {
		if (typeof(newFooterTitle) === "string") {
			this.attachments[this.attachments.length - 1].footer = newFooterTitle;
		}
	}

	setFooterIcon(newFooterIcon) {
		if (typeof(newFooterIcon) === "string") {
			this.attachments[this.attachments.length - 1].footer_icon = newFooterIcon;
		}
	}

	setFooterFallback(newFooterFallback) {
		if (typeof(newFooterFallback) === "string") {
			this.attachments[this.attachments.length - 1].fallback = newFooterFallback;
		}
	}

	setTimeStamp(newTimeStamp) {
		var time;
		if (newTimeStamp instanceof Date) {
			time = (newTimeStamp / 1000).toFixed(0);
			this.attachments[this.attachments.length - 1].ts = time;
		} else {
			time = (Date.now() / 1000).toFixed(0);
			this.attachments[this.attachments.length - 1].ts = time;
		}
	}

	setHeaderColor(hexColor) {
		if (typeof(hexColor) === "string") {
			this.attachments[0].color = hexColor;
		}
	}

	setFooterColor(hexColor) {
		if (typeof(hexColor) === "string") {
			this.attachments[this.attachments.length - 1].color = hexColor;
		}
	}
}

module.exports = SlackMessage;
