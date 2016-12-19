/*jshint node: true */
"use strict";

//
// This module handles logging of stdout and stderr messages.
// A logger is constucted by passing it a the app or module name 
// you are loggign from, and the loglevel. Example:
//
//    var Logger =  require("logger.js");
//    var logger = new Logger("myApp", "notice");
//
// After importing the module, and creating the logger, simply write
// logs like so:
//
//    logger.log("debug", "logging object", obj);
//
// ...where arg1 is valid loglevel, arg2 is string (or object), and 
// arg3 is an optional object. Logger writes a standard log format to 
// based on the set loglevel. Objects provided as args will be logged
// in a human friendly format
//

var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var logLevels = { "emergency" : 0, 
				  "alert"     : 1, 
				  "critical"  : 2, 
				  "error"     : 3, 
				  "warning"   : 4,
				  "notice"    : 5,
				  "info"      : 6, 
				  "debug"     : 7 };

class Logger {
	constructor(module, level) {
		this.module = module || "none";
		this.logLevel = 3;
		if (logLevels[level]) {
			this.logLevel = logLevels[level];
		}
		process.stdout.write(`logging for module ${this.module} started at log level ${level}-${this.logLevel}\n`);
	}

	log(logLevel, log, obj) {
		if (logLevels[logLevel] <= this.logLevel) {
			var timestamp = new Date();
			// handle objects passes as logs
			if (typeof log === "object") {
				log = `\n${JSON.stringify(log, null, 3)}`;
			}

			// handle objects passes as logs
			if (typeof obj === "object") {
				obj = `\n${JSON.stringify(obj, null, 3)}`;
			} else {obj = "";}

	    	process.stdout.write(`${month[timestamp.getMonth()]} ${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}.${timestamp.getMilliseconds()} ${this.module} [${logLevel}]: ${log}${obj}\n`);
		}
	}
}

module.exports = Logger;