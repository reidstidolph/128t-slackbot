/*jshint node: true */
"use strict";

//
// This module exports an class that takes
// in a 128T REST resource, and sets up monitoring of it.
// "active", "cleared" events are emmitted on changes in state.
// "error" events are emmitted if REST requests fail.
//
//

var t128 = require("./t128.js");
const crypto = require('crypto');
const EventEmitter = require("events");

// the smallest allowable 128T polling interval.
// any attempts to poll faster than this, will be reset to this.
const minPollInterval = 2000;

// function for hashing objects, and returning the hash value
//
function hash(obj) {
	return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
}

// function for setting of a monitoring loop based on setInterval
// 
function monitorLoop(resourceMonitor) {
	var msInterval;
	// derive an interval in milliseconds, no less than 2000ms (2s)
	if (resourceMonitor.interval < minPollInterval/1000) {
		msInterval = minPollInterval;
	} else {msInterval=resourceMonitor.interval*1000;}

	setInterval(function(){
		// only launch a request if no others are pending, and the monitor is currently running
		if (resourceMonitor.running === true && resourceMonitor.pending === false) {
			resourceMonitor.fetchData();
		} 
	}, msInterval)
}


// function to check if object is already tracked in state, based on it's hash value
//
function checkIfTracked(hash, resourceMonitor) {
	if (resourceMonitor.resourceState[hash]) {
		return true;
	} else {
		return false;
	}
}

// function to initialize incoming data, generate it's hash ID,
// and load it into state tracking
//
function initData(data, resourceMonitor) {

	// only process objects that are populated
	if (Object.keys(data).length > 0) {

		// create hash of the provided data
		var dataHash = hash(data);

		// add data to state tracking, if it is not already there
		if (!checkIfTracked(dataHash, resourceMonitor)) {

			// fire the event, and add to tracking with the hash is key
			resourceMonitor.resourceState[dataHash] = {"version" : resourceMonitor.version, "data" :data};
			// resourceMonitor.emit("active", {"id" : dataHash, "data" : resourceMonitor.resourceState[dataHash].data});
			resourceMonitor.activeQueue.push(resourceMonitor.resourceState[dataHash].data);
		} else {

			resourceMonitor.resourceState[dataHash].version = resourceMonitor.version;
		}
	}
}

// method to process tracked state. This code is meant to avoide multiple versions
// over the objects being tracked. It iterates through the object once, and takes appropriate
// action on each tracked object. Side note: probably more efficient ways of doing this, but
// for now, it works.
//
function processState(resourceMonitor) {

	// in the very remote chance that this has been monitoring for a REALLY long time
	// reset the version
	if (resourceMonitor.version === 9007199254740992) {
		for (const hashKey of Object.keys(resourceMonitor.resourceState)) {
			var currentData = resourceMonitor.resourceState[hashKey];
			if (currentData.version < resourceMonitor.version) {
				currentData.version = 0;
			} else {currentData.version = 1;}
		}
		resourceMonitor.version = 1;
	}

	// iterate through all elements in the object, to see if any have cleared
	for (const hashKey of Object.keys(resourceMonitor.resourceState)) {

		// if the object has an older version, then it
		// was not updated by initData, therefore it is cleared
		if (resourceMonitor.resourceState[hashKey].version < resourceMonitor.version) {

			// emit the event as cleared
			resourceMonitor.clearedQueue.push(resourceMonitor.resourceState[hashKey].data);
			// clear it from tracking
			delete resourceMonitor.resourceState[hashKey];
		}
	}

	// empty the emit queues and clear them
	if (resourceMonitor.activeQueue.length > 0) {
		resourceMonitor.emit("active", resourceMonitor.activeQueue);
		resourceMonitor.activeQueue = [];
	}
	if (resourceMonitor.clearedQueue.length > 0) {
		resourceMonitor.emit("cleared", resourceMonitor.clearedQueue);
		resourceMonitor.clearedQueue = [];
	}

	// processing complete, increment the version
	resourceMonitor.version ++;
}

// class that is exported by this module
//
class ResourceMonitor extends EventEmitter {

	constructor(resource, method, interval) {
		// since this extends the EventEmitter, need to call super to allow use of "this"
		// ...it's an ES6 thing...
		//
		super();
		this.resource = resource || "/router/{router}/alarm";
		this.interval = interval || 5;
		this.method = method || "GET";
		this.running = false;
		this.pending = false;
		this.version = 0;
		this.activeQueue = [];
		this.clearedQueue = [];

		// wire up a method for fetching data
		//
		this.fetchData = ()=> {
			t128.getData(this.method, this.resource, this.handleData);
			this.pending = true;
		};

		// wire up a method for handling data the comes back
		//
		this.handleData = (error, data, response)=> {
			// pending request satisfied...reset to false.
			this.pending = false;
			// if error is returned, emit error
			if (error) {
				this.emit("error", error);
			// no error, continue...
			} else {
				// if data returned is array, iterate through it, treating each object individually
				if (data instanceof Array && data.length > 0) {
					data.forEach((data)=> {
						initData(data, this);
					})
				} else {initData(data, this);}

			processState(this);
			}
		};

		// object to track state of data returned
		//
		this.resourceState = {};

		// initilize the monitoring
		//
		monitorLoop(this);
	}

	start(){
		process.stdout.write(`Starting to monitor ${this.resource}\n`);
		this.running = true;
	}

	stop(){
		process.stdout.write(`Stopping monitor of ${this.resource}\n`);
		this.running = false;
	}
}

module.exports = ResourceMonitor;