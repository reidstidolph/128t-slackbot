/*jshint node: true */
"use strict";

var path = require('path');
var Logger =  require("../lib/logger.js");
var logger = new Logger("loggerTest", "notice");

logger.log("info", "Test 123");

var obj = {"foo" : "fighter"};

logger.log("info", obj);

obj.fi = "new data";

logger.log("debug", "object is:", obj);
logger.log("info", "object is:", obj);
logger.log("info", "object is:", obj);
logger.log("notice", "object is:", obj);
logger.log("critical", "object is:", obj);

console.log(__filename);
console.log(path.basename(__filename));