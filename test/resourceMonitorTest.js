var ResourceMonitor = require("../lib/ResourceMonitor");

var testMon = new ResourceMonitor();
var testData1 = {"foo" : "bar"};
var testData2 = {"foo" : "fighter"};
var testData3 = [{"foo" : "fum"}, {"foo" : "fi"}, {"foo" : "bar"}]

var error=null;
response="foo";

console.log(testMon.resourceState);
testMon.handleData(error, testData1, response);
console.log(testMon.resourceState);
testMon.handleData(error, testData1, response);
console.log(testMon.resourceState);
testMon.handleData(error, testData2, response);
console.log(testMon.resourceState);
testMon.handleData(error, testData3, response);
console.log(testMon.resourceState);