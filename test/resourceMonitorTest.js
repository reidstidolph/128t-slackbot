var ResourceMonitor = require("../lib/ResourceMonitor");

var testMon = new ResourceMonitor();
var testData1 = {
    "category": "None",
    "message": "string",
    "node": "string",
    "severity": "INFO",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
};

var testData2 = {"foo" : "fighter"};

var error=null;
response="foo";

console.log(testMon.resourceState);
testMon.handleData(error, testData1, response);
console.log(testMon.resourceState);
testMon.handleData(error, testData1, response);
console.log(testMon.resourceState);
testMon.handleData(error, testData2, response);
console.log(testMon.resourceState);