var ResourceMonitor = require("../lib/ResourceMonitor");

var testMon = new ResourceMonitor();
testMon.iterator = 9007199254740990;

var testData1 = [{"foo" : "bar"}];
var testData2 = [{"foo" : "fighter"}, {"foo" : "bar"}];
var testData3 = [{"foo" : "fighter"}];
var testData4 = [{}];
var testData5 = [{"foo" : "fum"}, {"foo" : "fi"}, {"foo" : "bar"}]
var testData6 = [];

var error=null;
response="foo";

console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData1, response);
console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData2, response);
console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData3, response);
console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData4, response);
console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData5, response);
console.log(testMon.resourceState);

console.log("\n");
testMon.handleData(error, testData6, response);
console.log(testMon.resourceState);