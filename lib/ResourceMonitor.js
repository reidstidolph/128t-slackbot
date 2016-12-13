/*jshint node: true */
"use strict";

//
// This module exports an object that takes
// in a 128T REST resource, and returns
// begins monitoring it. Events are emmitted
// on changes in state.
//
//

var t128 = require("./t128.js");
const crypto = require('crypto');
const EventEmitter = require("events");

// function for hashing objects, and returning the hash value
function hash(obj) {
	return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
}

class ResourceMonitor extends EventEmitter {

	constructor(resource, method, interval, supress) {
		super();
		this.resource = resource || "/router/{router}/alarm";
		this.intervarl = interval || 5;
		this.supress = supress || 10;
		this.method = method || "GET";

		// wire up a method for fetching data
		//
		this.fetchData = ()=> {
			t128.getData(this.method, this.resource, this.handleData);
		};

		// wire up a method for handling data the comes back
		//
		this.handleData = (error, data, response)=> {
			// create hash of the returned data
			var dataHash = hash(data);
			// determine if this data is tracked or now
			if (!this.checkIfTracked(dataHash)) {
				console.log("add to tracking.");
				// add to tracking
				this.resourceState[dataHash] = data;
			}
		};

		// object to track state of data returned
		//
		this.resourceState = {};
	}

	start(){

	}

	stop(){

	}

	// method to check if object is already tracked in state, based on it's hash value
	checkIfTracked(hash) {
		if (this.resourceState[hash]) {
			console.log("object already exists.");
			return true;
		} else {
			console.log("got new object!");
			return false;
		}
	}
}



module.exports = ResourceMonitor;