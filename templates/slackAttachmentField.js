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

var AttachmentTemplateField = function(){
	this.title;
	this.value;
	this.short = true;
};

AttachmentTemplateField.prototype.title = "";
AttachmentTemplateField.prototype.value = "";
AttachmentTemplateField.prototype.short = true;

module.exports = AttachmentTemplateField;