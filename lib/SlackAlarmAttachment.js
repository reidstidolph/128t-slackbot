/*jshint node: true */
"use strict";

// constructor function for creating alarm slack
// message attachments
//

var config = require("../slackbot-config.json");

class SlackAlarmAttachment {

	constructor(severity) {
		// defaults
		this.title = "default";
		this.fallback = "default";
		this.color = config.slack.colors.default;
		this.fields = [];

		switch(severity) {
			case "CRITICAL":
				this.title = "--" + severity + "--";
				this.fallback = "--" + severity + "--";
				this.color = config.slack.colors.CRITICAL;
				break;
			case "MAJOR":
				this.title = "--" + severity + "--";
				this.fallback = "--" + severity + "--";
				this.color = config.slack.colors.MAJOR;
				break;
			case "MINOR":
				this.title = "--" + severity + "--";
				this.fallback = "--" + severity + "--";
				this.color = config.slack.colors.MINOR;
				break;
			case "INFO":
				this.title = "--" + severity + "--";
				this.fallback = "--" + severity + "--";
				this.color = config.slack.colors.INFO;
				break;
			case "CLEARED":
				this.title = "--" + severity + "--";
				this.fallback = "--" + severity + "--";
				this.color = config.slack.colors.default;
				break;
			default:
				this.title = "Message";
				this.fallback = "Message";
				this.color = config.slack.colors.default;
		}
	}
}

module.exports = SlackAlarmAttachment;