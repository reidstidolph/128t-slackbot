/*jslint node: true */
"use strict";

try {var config = require("../cache/.slackbot-config.json");}
catch(err) {
    process.stdout.write(`
    FAIL: Unable to load configuration. 
    Try running './128t-slackbot setup' first\n\n`
    );
    process.exit(1);
}
var t128 = require("../lib/t128.js"); // interacts with a 128T router
// initialize results variables
//
var success = null;
var requestFail = null;
var requestReject = null;

function testFinished(){
    if (requestFail) {
        process.stdout.write(`\n\nFAILED: ${requestFail}\n\n`);
        process.exit(1);
    } else if (requestReject) {
        process.stdout.write(`\n\nFAILED: ${requestReject}\n\n`);
        process.exit(1);
    } else if (success) {
        process.stdout.write(`\n\nSUCCESS: ${success}\n\n`);
        process.exit(0);
    }
}

var runSlackTest = function(runOnComplete) {
    t128.getData("GET", "/router/{router}/node", (error, data, response)=>{
    	if (error) {
            requestFail = error.code;
        } else if (response.statusCode != 200) {
            requestReject = response.statusCode + " " + response.statusMessage;
        } else if (response.statusCode === 200) {
            success = response.statusCode + " " + response.statusMessage;
        }
        runOnComplete();
    });
};

runSlackTest(testFinished);