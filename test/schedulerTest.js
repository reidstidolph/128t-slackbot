/*jshint node: true */
"use strict";

var Scheduler = require("../lib/Scheduler.js");


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
	"d" : [1, 2, 3, 4, 5],
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


function myFunction(){
	console.log("FIRING MY SCHEDULED FUNCTION!");
}

var mySchedule = new Scheduler(t8, myFunction);