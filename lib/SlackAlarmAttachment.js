// constructor function for creating alarm slack
// message attachments
//
var config = require("../slackbot-config.json");

function SlackAlarmAttachment(severity){
	// defaults
	this.title = "default";
	this.color = config.slack.colors.default;
	this.fields = [];

	switch(severity) {
		case "CRITICAL":
			this.title = "--" + severity + "--";
			this.color = config.slack.colors.CRITICAL;
			break;
		case "MAJOR":
			this.title = "--" + severity + "--";
			this.color = config.slack.colors.MAJOR;
			break;
		case "MINOR":
			this.title = "--" + severity + "--";
			this.color = config.slack.colors.MINOR;
			break;
		case "INFO":
			this.title = "--" + severity + "--";
			this.color = config.slack.colors.INFO;
			break;
		default:
			this.title = "Message";
			this.color = config.slack.colors.default;
	}
}

module.exports = SlackAlarmAttachment;