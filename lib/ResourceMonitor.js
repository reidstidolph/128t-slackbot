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

// actions to be taken on events being suppressed
function suppressEvent(eventData){
	//console.log("suppressing...");
	eventData.emitted = "suppressed";
};

// actions to be taken on events to be emitted
function fireEvent(eventData, resourceMonitor){
	//console.log("adding to eventQueue");
	eventData.emitted = "queued";
	resourceMonitor.emitQueue.push(eventData.data);
	resourceMonitor.lastEventFired = resourceMonitor.iterator;
};

class ResourceMonitor extends EventEmitter {

	constructor(resource, method, interval, suppress) {
		super();
		this.resource = resource || "/router/{router}/alarm";
		this.interval = interval || 5;
		this.suppress = suppress || 2;
		this.method = method || "GET";
		this.emitQueue = [];
		this.lastEventFired = 0;
		this.iterator = this.suppress;

		// wire up a method for fetching data
		//
		this.fetchData = ()=> {
			t128.getData(this.method, this.resource, this.handleData);
		};

		// wire up a method for handling data the comes back
		//
		this.handleData = (error, data, response)=> {

			// if data returned is array, iterate through it, treating each object individually
			if (data instanceof Array && data.length > 0) {
				data.forEach((data)=> {
					this.initData(data);
				})
			} else (this.initData(data))

			this.processState();
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
	//
	checkIfTracked(hash) {
		if (this.resourceState[hash]) {
			//console.log("object already exists.");
			return true;
		} else {
			//console.log("got new object!");
			return false;
		}
	}

	// method to initialize data, and load it into state tracking
	//
	initData(data) {

		// only process objects that are populated
		if (Object.keys(data).length > 0) {

			// create hash of the provided data
			var dataHash = hash(data);

			// add data to state tracking, if it is not already there
			if (!this.checkIfTracked(dataHash)) {

				// add to tracking with the hash is key
				this.resourceState[dataHash] = {"emitted" : "no", "state" : "active", "iteration" : this.iterator, "data" :data};
			} else {

				this.resourceState[dataHash].state = "active";
				this.resourceState[dataHash].iteration = this.iterator;
			}
		}
	}

	// method to process tracked state. This code is meant to avoide multiple iterations
	// over the objects being tracked. It iterates through the object once, and takes appropriate
	// action on each tracked object. Side note: probably more efficient ways of doing this, but
	// for now, it works.
	//
	processState() {

		// var to hold the function with action to be taken upon each event tracked in state.
		// It will be assigned based upon if events are being suppressed or not.
		var eventAction;

		// in the very remote chance that this has been monitoring for a REALLY long time
		// reset the iterator
		if (this.iterator === 9007199254740992) {
			for (const hashKey of Object.keys(this.resourceState)) {
				var currentData = this.resourceState[hashKey];
				if (currentData.iteration < this.iterator) {
					currentData.iteration = 0;
				} else {currentData.iteration = this.suppress;}
			}
			this.lastEventFired = 9007199254740991 - this.lastEventFired;
			this.iterator = this.suppress + 1;
		}

		// Fire events if you got em!
		if (this.iterator - this.lastEventFired > this.suppress) {
			eventAction = fireEvent;
		// In suppression mode...don't fire events.
		} else if (this.iterator - this.lastEventFired <= this.suppress) {
			eventAction = suppressEvent
		}

		// iterate through all elements in the object, and update them
		for (const hashKey of Object.keys(this.resourceState)) {

			var currentData = this.resourceState[hashKey];

			// first determine if this event is cleared.
			// if the object has an older iteration, then it
			// was not updated by initData, therefore it is cleared
			if (currentData.iteration < this.iterator) {
				currentData.state = "cleared";
			}

			// next take action on the event
			if (currentData.emitted === "no") {
				eventAction(currentData, this);
			}
		}

		// processing complete, increment the iterator
		this.iterator ++;
	}
}



module.exports = ResourceMonitor;