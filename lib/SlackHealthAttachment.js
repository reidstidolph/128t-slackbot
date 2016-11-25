/*jshint node: true */
"use strict";

// module exports a simple class for producing Slack
// message attachments for health reports
//

var config = require("../slackbot-config.json");

class SlackHealthAttachment {

	constructor(node) {
		// defaults
		this.title = "Node: " + node.name || "default";
		this.fallback = "Node: " + node.name || "default";
		this.color = config.slack.colors.default;
		this.fields = [];

	}
}

module.exports = SlackHealthAttachment;