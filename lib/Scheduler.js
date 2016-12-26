/*jshint node: true */
"use strict";

// This module exports a class that sets up timed events,
// based on a provided schedule. Based on the provided schedule
// object. The schedule object is in the form of:
//    {m:[],h:[],d:[]}
// Array must be empty (meaning ALL m/h/d), or be populated with 
// valid minute/hour/day integers. E.g.:
//    m (0-59)
//    h (0-24)
//    d (0-6)
// Based on schedule, it calulates the following:
//    interval: time on which the schedule revolves. (weekly, daily, hourly)
//    offset: how far past 0:00:00:00:000 in the most recent interval, runtime
//            is. e.g. if runtime is wed:11:59.22:0100, interval is daily,
//            then offset is how many ms past wed:00:00:00:0000 runtime is
//    i[1-n]: scheduled intervals on which the provided function is to fire.
//            The module figures out where the fire times land in time, based
//            on the runtime reference, and the most recent interval reference.
//
// Below is a ascii visual to help explain the concenpt of how timing is 
// calibrated and intervals are calculated.
//      
//     interval 
//   |----------|
//
// ===========>time===========>
//
// intverval ref   runtimeRef
//           |     |
//  i1|------|---| |
//     i2|---|-----||
//           |i3|--|-------|
//           |     | |----------|i5
//           |     |
//            -----
//            offset
//
// 

var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), "warning"); // set up logger

const secondInMilliseconds = 1000;
const minInMilliseconds =  60000; // ms in hour
const hrInMilliseconds =   3600000; // ms in hour
const dayInMilliseconds =  86400000; // ms in day
const weekInMilliseconds = 604800000; // ms in week

// helper function to put numbers into time arrays
//
function populateArray(number) {
	var array = [];
	for (var i = 0; i <= number; i++) {
		array.push(i);
	}
	return array;
}

// helper function to create intervals
//
function setNewInterval (time, functionCall) {
	setInterval(()=>{
		functionCall();
	}, time);
}

// based on a provided interval (week, day, hour, minute), and a
// date, it figures out where the date sits in the interval. The 
// starting reference point of the interval is set to be 0 s/m/h/d 
// of the most recent s/m/h/d. 
// 
function getReferenceOffset(intervalType, now) {
	switch (intervalType) {
		case "minute":
			// return the number of milliseconds past the minute
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds);

		case "hour":
			// return the number of milliseconds past the hour
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds);

		case "day":
			// return the number of milliseconds past the day
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds) + (now.getHours() * hrInMilliseconds);

		case "week":
			// return the number of milliseconds past the week
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds) + (now.getHours() * hrInMilliseconds) + (now.getDay() * dayInMilliseconds);

		default:
			return 0;
	}
}

// function to set timers based on a provided schedule object
//
function setTimers(runTime, schedule, intervalType, offset, timedFunction) {
	
	switch (intervalType) {
		case "minute":

			var timeToFirstFire = minInMilliseconds - offset;

			logger.log("debug", `Running scheduled action in ${timeToFirstFire}ms, then every ${minInMilliseconds}ms (1 ${intervalType}) after that.`);
			// start the timers
			logger.log("debug", `Setting scheduled event for second 0 of every minute.`);
			setTimeout(()=>{
				timedFunction();
				setNewInterval(minInMilliseconds, timedFunction);
			}, timeToFirstFire);

			break;

		case "hour":

			// populate the minute array, if it is empty (i.e. run every minute)
			if (schedule.m.length === 0) {
				schedule.m = populateArray(59);
			}

			// set a time for each scheduled minute in the hour
			schedule.m.forEach((minute)=>{

				logger.log("debug", `Setting scheduled event for minute ${minute} of every hour.`);
				// calculate the number of milliseconds into the hour that this minute is
				var thisMinInMilliseconds = minute * minInMilliseconds;
				var timeToFirstFire = 0;

				// if this minute is > our offset, first fire after the time difference between the two values
				if (thisMinInMilliseconds > offset) {
					timeToFirstFire = thisMinInMilliseconds - offset;
				// if this minute is < our offset, we already missed it for this interval.
				} else if (thisMinInMilliseconds < offset) {
					timeToFirstFire = hrInMilliseconds - (offset - thisMinInMilliseconds);
				}

				logger.log("debug", `Running scheduled action in ${timeToFirstFire}ms, then every ${hrInMilliseconds}ms (1 ${intervalType}) after that.`);
				// start the timer
				setTimeout(()=>{
					timedFunction();
					setNewInterval(hrInMilliseconds, timedFunction);
				}, timeToFirstFire);
			});

			break;

		case "day":

			// populate the minute and hour arrays, if empty (i.e. run every minute/hour)
			if (schedule.m.length === 0) {
				schedule.m = populateArray(59);
			}
			if(schedule.h.length === 0) {
				schedule.h = populateArray(23);
			}

			// set a timer for each scheduled minute in each scheduled hour of the day
			schedule.h.forEach((hour)=>{
				schedule.m.forEach((minute)=>{

					logger.log("debug", `Setting scheduled event for minute ${minute}, hour ${hour} of every day.`);
					// calculate the number of milliseconds into the hour that this minute is
					var thisMinInMilliseconds = (minute * minInMilliseconds) + (hour * hrInMilliseconds);
					var timeToFirstFire = 0;

					// if this minute is > our offset, first fire after the time difference between the two values
					if (thisMinInMilliseconds > offset) {
						timeToFirstFire = thisMinInMilliseconds - offset;
					// if this minute is < our offset, we already missed it for this interval.
					} else if (thisMinInMilliseconds < offset) {
						timeToFirstFire = dayInMilliseconds - (offset - thisMinInMilliseconds);
					}

					logger.log("debug", `Running scheduled action in ${timeToFirstFire}ms, then every ${dayInMilliseconds}ms (1 ${intervalType}) after that.`);
					// start the timer
					setTimeout(()=>{
						timedFunction();
						setNewInterval(dayInMilliseconds, timedFunction);
					}, timeToFirstFire);
				});
			});

			break;

		case "week":

			// populate the minute and hour arrays, if empty (i.e. run every minute/hour)
			if (schedule.m.length === 0) {
				schedule.m = populateArray(59);
			}
			if(schedule.h.length === 0) {
				schedule.h = populateArray(23);
			}

			// set a timer for each scheduled minute in each scheduled hour of the day
			schedule.d.forEach((day)=>{
				schedule.h.forEach((hour)=>{
					schedule.m.forEach((minute)=>{

						logger.log("debug", `Setting scheduled event for minute ${minute}, hour ${hour}, day ${day} of every week.`);
						// calculate the number of milliseconds into the hour that this minute is
						var thisMinInMilliseconds = (minute * minInMilliseconds) + (hour * hrInMilliseconds) + (day * dayInMilliseconds);
						var timeToFirstFire = 0;

						// if this minute is > our offset, first fire after the time difference between the two values
						if (thisMinInMilliseconds > offset) {
							timeToFirstFire = thisMinInMilliseconds - offset;
						// if this minute is < our offset, we already missed it for this interval.
						} else if (thisMinInMilliseconds < offset) {
							timeToFirstFire = weekInMilliseconds - (offset - thisMinInMilliseconds);
						}

						logger.log("debug", `Running scheduled action in ${timeToFirstFire}ms, then every ${dayInMilliseconds}ms (1 ${intervalType}) after that.`);
						// start the timer
						setTimeout(()=>{
							timedFunction();
							setNewInterval(weekInMilliseconds, timedFunction);
						}, timeToFirstFire);
					});
				});
			});

			break;

		default:
			logger.log("error", `Invalid interval type: ${intervalType}. No timers set.`);
			return;
	}	
}

function getIntervalType(schedule) {
	// evaluate the schedule object base on some conditionals
	//
	if (schedule.d.length === 0 && schedule.h.length === 0 && schedule.m.length === 0) {
		// interval is minute
		logger.log("debug", "Schedule interval is every minute");
		return "minute";
	} else if (schedule.d.length === 0 && schedule.h.length === 0) {
		// interval is hour
		logger.log("debug", "Schedule interval is every hour");
		return "hour";
	} else if (schedule.d.length === 0) {
		// interval is day
		logger.log("debug", "Schedule interval is every day");
		return "day";
	} else {
		// interval is week
		logger.log("debug", "Schedule interval is every week");
		return "week";
	}
}

// class to be exported
//
class Scheduler {

	constructor(schedule, scheduledFunction) {
		this.runTimeRef = new Date();
		this.schedule = schedule;
		this.intervalType = getIntervalType(schedule);
		this.offset = getReferenceOffset(this.intervalType, this.runTimeRef);

		logger.log("info", "Setting up a schedule");
		setTimers(this.runTimeRef, this.schedule, this.intervalType, this.offset, scheduledFunction);
	}
}

// exports the Scheduler class
//
module.exports = Scheduler;