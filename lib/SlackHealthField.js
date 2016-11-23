/*jshint node: true */
"use strict";
// constructor function for creating alarm slack
// message attachment fields
function SlackHealthField(title, value, short){
	this.short = short || true;
	this.title = title || "default title";
	this.value = value || "default alarm message";
}

module.exports = SlackHealthField;