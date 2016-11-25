/*jslint node: true */
"use strict";
//
// This module exports and object containing functions
// for interacting with Slack.
//
// It requires Slack information found in
// ./t128-slackbot-config.json
//

var rest = require("./rest.js");
try {var config = require("../slackbot-config.json");}
catch(err) {
    console.log("\nError with the 'slackbot-config.json' file.");
    console.log("You may not have set it up correctly.");
    console.log("Make sure the file exists in the root of this");
    console.log("app directory. See the sample-config.json for an"); 
    console.log("example 'slackbot-config.json'. \n\n");
    process.exit(1);
}

module.exports = {
    send : function(input, slackChannel, slackFromUser) {
        var requestArgs = {};

        function handleResponse(error, response, data){
            if (error) {
                console.log(error);
            } else {
                console.log("Slack response: " + response.statusCode + " " + response.statusMessage);
            }
        }

        if (typeof(input) === "string") {
            requestArgs.body = JSON.stringify({
                channel : slackChannel,
                username : slackFromUser,
                text : input
            });
        } else if (typeof(input) === "object") {
            requestArgs.body = JSON.stringify({
                channel : slackChannel,
                username : slackFromUser,
                attachments : input.attachments
            });
        }

        rest.request ("POST",
                      config.slack.webhookUrl,
                      requestArgs,
                      handleResponse);
    }
};
