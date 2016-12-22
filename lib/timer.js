/*jshint node: true */
"use strict";

//

const runTimeRef = new Date(); // time reference for when script started
var weekBegin; // time reference for the beginning of the week
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

var int = 0;

var schedule = t8;

if (schedule.d.length === 0 && schedule.h.length === 0 && schedule.m.length === 0) {
	// lead interval is minute
	//setInterval(()=>{
		// fire
	//}, minInMilliseconds);
	console.log("fire every minute");

} else if (schedule.d.length === 0 && schedule.h.length === 0) {
	// lead interval is hour
	schedule.m.forEach((minute)=>{
		//setInterval(()=>{
			// fire
		//}, hrInMilliseconds);
		int++;
		console.log(`${int}: fire on minute ${minute} ever hour`);
	})

} else if (schedule.d.length === 0) {
	// lead interval is day
	schedule.h.forEach((hour)=>{
		// if minutes are empty, fill it with every minute
		if (schedule.m.length === 0) {
			for (var i = 0; i <= 59; i++) {
				schedule.m.push(i);
			}
		}

		schedule.m.forEach((minute)=>{
			//setInterval(()=>{
				// fire
			//},dayInMilliseconds);
			int++;
			console.log(`${int}: fire on minute ${minute}, hour ${hour}, ever day`);
		})
	})

} else {
	// lead interval is week
	schedule.d.forEach((day)=>{
		// if hours are empty, fill it with every hour
		if(schedule.h.length === 0) {
			for (var i = 0; i <= 23; i++) {
				schedule.h.push(i);
			}
		}

		schedule.h.forEach((hour)=>{
			// if minutes are empty, fill it with every minute
			if (schedule.m.length === 0) {
				for (var i = 0; i <= 59; i++) {
					schedule.m.push(i);
				}
			}

			schedule.m.forEach((minute)=>{
				//setInterval(()=>{
					// fire
				//},weekInMilliseconds);
				int++;
				console.log(`${int}: fire on minute ${minute}, hour ${hour}, day ${day} ever week`);
			})
		})
	})
}
