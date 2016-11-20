/*jslint node: true */
"use strict";
//
// This module exports a prototype function that
// to be used as a template for creating Slack
// attachment messages.
//
//

function SlackMessage(){
	// initialized values
	var reportHeader = {
		"fallback": "default header fallback",
		"color": "#00adef",
		"pretext": "default main title",
		"author_name": "default header title",
		"author_icon": ""
	};

	var reportFooter = {
		"fallback": "default footer fallback",
		"color": "#00adef",
		"footer": "default footer title",
		"footer_icon": "",
		"ts": 0
	};

	this.attachments = [
		reportHeader,
		reportFooter
	]
	return this;
}

// prototype to add a new attachments to the message array
SlackMessage.prototype.pushAttachment = function(newAttachmentData) {
	// initialize attachment data
	console.log(newAttachmentData);
	var outputAttachment = {
		"title" : "default title", 
		"fallback" : "default fallback",
		"color" : "#373a36",
		"fields" : []
	};

	if (newAttachmentData.title) {
		outputAttachment.title = newAttachmentData.title;
	}

	if (newAttachmentData.fallback) {
		outputAttachment.fallback = newAttachmentData.fallback;
	}
	console.log(typeof(newAttachmentData.fields));
	if (typeof(newAttachmentData.fields) === "object") {
		outputAttachment.fields = newAttachmentData.fields;
	}
	// splice the field into the fields array, at the second to last position
	this.attachments.splice((this.attachments.length - 1),0,outputAttachment);
}

SlackMessage.prototype.setMainTitle = function(newMainTitle) {
	if (typeof(newMainTitle) === "string") {
		this.attachments[0].author_name = newMainTitle;
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

module.exports = SlackMessage;