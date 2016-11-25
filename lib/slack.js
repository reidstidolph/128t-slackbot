/*jshint node: true */
"use strict";

//
// This module exports and object containing functions
// for interacting with Slack.
//
// It requires Slack information found in
// ./t128-slackbot-config.json
//

var rest = require("./rest.js");
var config = require("../slackbot-config.json");

module.exports = {
    send : function(input, slackChannel, slackFromUser) {
        var requestArgs = {};

        function handleResponse(error, response, data){
            if (error) {
                // need to log this
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
