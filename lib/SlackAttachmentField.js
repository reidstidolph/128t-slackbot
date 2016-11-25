/*jshint node: true */
"use strict";

// module exports a simple class for producing Slack
// message attachment fields
//

function SlackHealthField(title, value, short){
	this.short = short || true;
	this.title = title || "default title";
	this.value = value || "default message";
}

module.exports = SlackHealthField;