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
var slack = require("../lib/slack.js");
var routerConfig = {};
var healthReport = require("../lib/healthReportGenerator.js");
var alarm = require("../lib/alarmReportGenerator.js");


// set up and send dummy alarm data
var testAlarm = [
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "INFO",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "CRITICAL",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "MAJOR",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "MINOR",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test2",
    "message": "Test2",
    "node": "Test",
    "severity": "MAJOR",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "CRITICAL",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test",
    "message": "Test",
    "node": "Test",
    "severity": "FOO",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  },
  {
    "category": "Test2",
    "message": "Test2",
    "node": "node-bar",
    "severity": "CRITICAL",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
  }
];

// set up and send dummy health report data
var testNode = [
  {
    "name": "TEST-1",
    "role": "combo",
    "deviceInterfaces": 1,
    "networkInterfaces": 4,
    "enabled": true,
    "traffic": 46352110,
    "averageBandwidth": 25751.172222,
    "sessions": 1185,
    "sessionArrivalRate": 0,
    "retransmissions": 0,
    "retransmissionRate": 0,
    "lostPackets": 0,
    "lossRate": 0,
    "cpu": {
      "machine": [
        {
          "core": 0,
          "utilization": 100
        },
        {
          "core": 3,
          "utilization": 92
        }
      ],
      "packetProcessing": [
        {
          "core": 1,
          "utilization": 0
        }
      ],
      "trafficEngineering": [
        {
          "core": 2,
          "utilization": 0
        }
      ]
    },
    "disk": [
      {
        "partition": "/",
        "capacity": 52710469632,
        "usage": 12615966720
      }
    ],
    "memory": {
      "capacity": 8262901760,
      "usage": 5856985088
    }
  },
  {
    "name": "TEST-2",
    "role": "combo",
    "deviceInterfaces": 1,
    "networkInterfaces": 4,
    "enabled": true,
    "traffic": 46352110,
    "averageBandwidth": 25751.172222,
    "sessions": 1185,
    "sessionArrivalRate": 0,
    "retransmissions": 0,
    "retransmissionRate": 0,
    "lostPackets": 0,
    "lossRate": 0,
    "cpu": {
      "machine": [
        {
          "core": 0,
          "utilization": 100
        },
        {
          "core": 3,
          "utilization": 92
        }
      ],
      "packetProcessing": [
        {
          "core": 1,
          "utilization": 0
        }
      ],
      "trafficEngineering": [
        {
          "core": 2,
          "utilization": 0
        }
      ]
    },
    "disk": [
      {
        "partition": "/",
        "capacity": 52710469632,
        "usage": 12615966720
      }
    ],
    "memory": {
      "capacity": 8262901760,
      "usage": 5856985088
    }
  }
];

var runSlackTest = function() {
    // initialize results variables
    //
    var success = null;
    var requestFail = null;
    var requestReject = null;

    // generate Slack messages based on dummy data
    //
    var healthReportOutput = healthReport(testNode);
    var alarmOutput = alarm(testAlarm);

    function sendTestReport(onComplete) {
        config.slack.reportChannels.forEach(function(channel) {
            slack.send(healthReportOutput, channel, config.slack.slackUsername, (error, response)=>{
                if (error) {
                    requestFail = error.code;
                } else if (response.statusCode != 200) {
                    requestReject = response.statusMessage + " " + response.statusCode;
                } else if (response.statusCode === 200) {
                    success = response.statusMessage + " " + response.statusCode;
                }
                onComplete();
            });
        });
    }

    function sendTestAlarm(onComplete) {
        config.slack.alarmChannels.forEach(function(channel) {
            slack.send(alarmOutput, channel, config.slack.slackUsername, (error, response)=>{
                if (error) {
                    requestFail = error.code;
                } else if (response.statusCode != 200) {
                    requestReject = response.statusCode + " " + response.statusMessage;
                } else if (response.statusCode === 200) {
                    success = response.statusCode + " " + response.statusMessage;
                }
                onComplete();
            });
        });
    }

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

    sendTestReport(()=>{
        sendTestAlarm(()=>{
            testFinished();
        });
    });
};

runSlackTest();