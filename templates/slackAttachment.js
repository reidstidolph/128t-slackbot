/*jslint node: true */
"use strict";
//
// This module exports and function that takes
// in 128T alarm data, and returns a Slack formatted
// string.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var AttachmentTemplate = function(){
	this.fallback;
	this.color;
	this.title;
	this.fields = [];
};

AttachmentTemplate.prototype.fallback = "";
AttachmentTemplate.prototype.color    = "#00adef";
AttachmentTemplate.prototype.title    = "";
AttachmentTemplate.prototype.fields   = [];

module.exports = AttachmentTemplate;