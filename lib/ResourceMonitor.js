/*jshint node: true */
"use strict";

//
// This module exports an object that takes
// in a 128T REST resource, and returns
// begins monitoring it. Events are emmitted
// on changes in state.
//
// It requires Slack information found in 
// ./t128-slackbot-config.json
//

var t128 = require("./lib/t128.js");
//const crypto = require('crypto');
const EventEmitter = require("events");
class ResourceMonitor extends EventEmitter {

	constructor(resource, interval, supress) {
		
		this.resource = resource;
		this.intervarl = interval;
		this.supress = supress;
		this.lastSample = {};
		this.newSample = {};
		this.dataGetter = ()=>{};
		this.handleData = ()=>{
			// parse, check, repeat
		};
		this.running = ()=>{};
	}

	start(){

	}

	stop(){

	}
}

t128.getData("GET", "/router/{router}/alarm", handleAlarmResponse);

module.exports = ResourceMonitor;