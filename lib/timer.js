/*jshint node: true */
"use strict";

// ===========>time===========>
//
// intverval ref   now/runtime
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

const runTimeRef = new Date(); // time reference for when script started
const secondInMilliseconds = 1000;
const minInMilliseconds =  60000; // ms in hour
const hrInMilliseconds =   3600000; // ms in hour
const dayInMilliseconds =  86400000; // ms in day
const weekInMilliseconds = 604800000; // ms in week

// example of every minute
var t1 = {
	"d" : [], // fire every day
	"h" : [], // fire every hour
	"m" : [] // fire every minute
};

// every hour at minute 0
var t2 = {
	"d" : [],
	"h" : [],
	"m" : [0]
};

// every 15 minutes during work hours
var t3 = {
	"d" : [],
	"h" : [9, 10, 11, 12, 13, 14, 15, 16, 17],
	"m" : [0, 15, 30, 45]
};

// every 15 minutes during work hours, on work days
var t4 = {
	"d" : [2, 3, 4, 5, 6],
	"h" : [9, 10, 11, 12, 13, 14, 15, 16, 17],
	"m" : [0, 15, 30, 45]
};


// Saturday at 5:00pm
var t5 = {
	"d" : [6],
	"h" : [17],
	"m" : [0]
};

// Wednesday every hour at :30
var t6 = {
	"d" : [3],
	"h" : [], // 0-23
	"m" : [30]
};

// Wednesday every minute at hour 1
var t7 = {
	"d" : [3],
	"h" : [1], // 0-23
	"m" : []
};

var t8 = {
	"d" : [],
	"h" : [1], // 0-23
	"m" : []
};

// var int = 0;

var schedule = t6;

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
			break;

		case "hour":
			// return the number of milliseconds past the hour
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds);
			break

		case "day":
			// return the number of milliseconds past the day
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds) + (now.getHours() * hrInMilliseconds);
			break

		case "week":
			// return the number of milliseconds past the week
			return now.getMilliseconds() + (now.getSeconds() * secondInMilliseconds) + (now.getMinutes() * minInMilliseconds) + (now.getHours() * hrInMilliseconds) + (now.getDay() * dayInMilliseconds);
			break

		default:
			return 0;
	}
}

function populateArray(number) {
	var array = []
	for (var i = 0; i <= number; i++) {
		array.push(i);
	}
	return array;
}

function setNewInterval (time, functionCall) {
	setInterval(()=>{
		functionCall;
	}, time);
}

function getTimeToNextFire (runTime, intervalTime) {

}

var fire = ()=>{console.log("fire!")}

if (schedule.d.length === 0 && schedule.h.length === 0 && schedule.m.length === 0) {
	// interval is minute
	// reference is at 00 seconds in every minute
	console.log("fire every minute");
	setNewInterval(minInMilliseconds, fire);

} else if (schedule.d.length === 0 && schedule.h.length === 0) {
	// interval is hour
	// reference is 00 minutes 00 seconds in every hour
	schedule.m.forEach((minute)=>{
		//setInterval(()=>{
			// fire
		//}, hrInMilliseconds);
		//int++;
		console.log(`${int}: fire on minute ${minute} ever hour`);
	})

} else if (schedule.d.length === 0) {
	// interval is day
	// reference is 00 hours 00 minutes 00 seconds in every day
	schedule.h.forEach((hour)=>{
		// if minutes are empty, fill it with every minute
		if (schedule.m.length === 0) {
			schedule.m = populateArray(59);
		}

		schedule.m.forEach((minute)=>{
			//setInterval(()=>{
				// fire
			//},dayInMilliseconds);
			//int++;
			console.log(`${int}: fire on minute ${minute}, hour ${hour}, ever day`);
		})
	})

} else {
	// interval is week
	// reference is 0 day 00 hours 00 minutes 00 seconds in every week
	schedule.d.forEach((day)=>{
		// if hours are empty, fill it with every hour
		if(schedule.h.length === 0) {
			schedule.h = populateArray(23);
		}

		schedule.h.forEach((hour)=>{
			// if minutes are empty, fill it with every minute
			if (schedule.m.length === 0) {
				schedule.m = populateArray(59);
			}

			schedule.m.forEach((minute)=>{
				//setInterval(()=>{
					// fire
				//},weekInMilliseconds);
				//int++;
				console.log(`${int}: fire on minute ${minute}, hour ${hour}, day ${day} ever week`);
			})
		})
	})
}
