var ResourceMonitor = require("../lib/ResourceMonitor");

var testMon = new ResourceMonitor();

testMon.on("cleared", function(event){
	console.log("cleared event fired!");
	console.log(event);
});

testMon.on("active", function(event){
	console.log("active event fired!");
	console.log(event);
});

testMon.on("error", function(error){
	console.log("error fired!");
	console.log(error);
})

//testMon.iterator = 9007199254740990;

var testData1 = [{"foo" : "bar"}];
var testData2 = [{"foo" : "fighter"}, {"foo" : "bar"}];
var testData3 = [{"foo" : "fighter"}];
var testData4 = [{}];
var testData5 = [{"foo" : "fum"}, {"foo" : "fi"}, {"foo" : "bar"}]
var testData6 = [];

var error=null;
response="foo";
console.log("----------begin---------");
//console.log(testMon.resourceState);

console.log("----------iterate 1---------");
testMon.handleData(error, testData1, response);
//console.log(testMon.resourceState);

console.log("----------iterate 2---------");
testMon.handleData(error, testData2, response);
//console.log(testMon.resourceState);

console.log("----------iterate 3---------");
testMon.handleData(error, testData3, response);
//console.log(testMon.resourceState);

console.log("----------iterate 4---------");
testMon.handleData(error, testData4, response);
//console.log(testMon.resourceState);

console.log("----------iterate 5---------");
testMon.handleData(error, testData5, response);
//console.log(testMon.resourceState);

console.log("----------iterate 6---------");
testMon.handleData(error, testData6, response);
//console.log(testMon.resourceState);


setTimeout(()=> {
	testMon.start();
}, 10000);