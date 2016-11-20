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

var config = require("../slackbot-config.json");
var config = require("../templates/alarm.json");

module.exports = function (data) {
	var outputString = "empty";

	return outputString;
}
