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
		this.interval = interval || 5;
		this.supress = supress || 2;
		this.method = method || "GET";
		this.eventQueue = [];
		this.lastEventFired = 0;
		this.iterator = this.supress;

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

	// method to process tracked state
	//
	processState() {

		// var to hold the function to be taken upon each event tracked in state
		// this will be assigned based upon if events are being suppressed or not
		var eventAction;

		function suppressEvent(eventData){
			console.log("suppressing...");
		};

		function fireEvent(eventData, self){
			console.log("adding to eventQueue");
			self.lastEventFired = self.iterator;
		};

		// in the very remote chance that this has been monitoring for a REALLY long time
		// reset the iterator
		if (this.iterator === 9007199254740992) {
			for (const hashKey of Object.keys(this.resourceState)) {
				var currentData = this.resourceState[hashKey];
				if (currentData.iteration < this.iterator) {
					currentData.iteration = 0;
				} else {currentData.iteration = this.supress;}
			}
			this.lastEventFired = 9007199254740991 - this.lastEventFired;
			this.iterator = this.supress + 1;
		}

		console.log(this.iterator);
		console.log(this.lastEventFired);
		// Fire events if you got em!
		if (this.iterator - this.lastEventFired > this.supress) {
			eventAction = fireEvent;
		// In suppression mode...don't fire events.
		} else if (this.iterator - this.lastEventFired <= this.supress) {
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
			eventAction(currentData, this);
		}

		// processing complete, increment the iterator
		this.iterator ++;
	}
}



module.exports = ResourceMonitor;