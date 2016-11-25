/*jshint node: true */
"use strict";
// constructor function for creating health report slack
// message attachments
//
var config = require("../slackbot-config.json");

function SlackHealthAttachment(node){
	// defaults
	this.title = "Node: " + node.name || "default";
	this.fallback = "Node: " + node.name || "default";
	this.color = config.slack.colors.default;
	this.fields = [];

}

module.exports = SlackHealthAttachment;