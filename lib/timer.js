/*jshint node: true */
"use strict";

//

const runTimeRef = new Date(); // time reference for when script started
var weekBegin; // time reference for the beginning of the week
const min =  60000; // ms in hour
const hr =   3600000; // ms in hour
const day =  86400000; // ms in day
const week = 604800000; // ms in week



var schedule = {"d":[],"h":[],"m":[]};

if (schedule.d.length == schedule.h.length ==  schedule.m.length == 0) {
	// lead interval is minute
} else if (schedule.d.length == schedule.h.length == 0) {
	// lead interval is hour
} else if (schedule.d.length == 0) {
	// lead interval is day
} else {
	// lead interval is week
}

// example of every minute
{
	"d" : [], // fire every day
	"h" : [], // fire every hour
	"m" : [] // fire every minute
}
setInterval(()=>{
	// fire
}, min);

// every hour at minute 0
{
	"d" : [],
	"h" : [],
	"m" : [0]
}
setInterval(()=>{
	// fire
}, hr);

// every 15 minutes during work hours
{
	"d" : [],
	"h" : [9, 10, 11, 12, 13, 14, 15, 16, 17],
	"m" : [0, 15, 30, 45]
}
setInterval(()=>{
	setTimeout(()=>{
		// fire
	}, hr); // + min 0, 15, 30, 45
}, day); // + h 9, 10, 11, ...

setInterval(()=>{
	// fire
}, day + (9 * hr) + (0 * min);
setInterval(()=>{
	// fire
}, day + (9 * hr) + (15 * min);

// every 15 minutes during work hours, on work days
{
	"d" : [2, 3, 4, 5, 6],
	"h" : [9, 10, 11, 12, 13, 14, 15, 16, 17],
	"m" : [0, 15, 30, 45]
}

setInterval(()=>{
	setTimeout(()=>{
		setTimeout(()=>{
			// fire
		}, min); // + 0m, 15m, 30m, 45m
	}, day); // + 9h, 10h, 11h, 12h...
}, week); // + 2d, 3d, 4d, 5d, 6d

// Saturday at 5:00pm
{
	"d" : [6],
	"h" : [17],
	"m" : [0]
}
setInterval(()=>{
	// fire
}, week + (6*day) + (17*hr) + (0*min);

// Wednesday every hour at :30
{
	"d" : [3],
	"h" : [], // 0-23
	"m" : [30]
}

setInterval(()=>{}, week);

setInterval(()=>{}, day);

setInterval(()=>{}, hr);

setInterval(()=>{}, min);

