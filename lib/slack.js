/*jshint node: true */
"use strict";

//
// This module exports and object containing functions
// for interacting with Slack.
//
// It requires Slack information found in
// .slackbot-config.json
//

var rest = require("./rest.js");
var config = require("../cache/.slackbot-config.json");
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), config.logLevel); // set up logger

module.exports = {
    send : function(input, slackChannel, slackFromUser, callback) {
        
        var requestArgs = {};

        function handleResponse(error, response, data){
            if (error) {
                logger.log("error", "Request to Slack failed:", error);
                if (callback) {
                    callback(error, response, data);
                }
            } else {
                logger.log("info", `Slack request got ${response.statusCode} ${response.statusMessage}`);
                if (callback) {
                    callback(null, response, data);
                }
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
        logger.log("debug", "Attempting Slack request.");
    }
};
