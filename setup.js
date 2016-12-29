/*jshint node: true */
"use strict";

// import modules
const fs = require("fs"); // file system
const readline = require('readline'); // readline 
const url = require("url"); // url module for validation purposes
const configFile = "./slackbot-config.json"; // 128T-Slackbot config file

// default config literal
var defaultConfig = {
	"logLevel"                  : "debug",
	"t128Control" : {
		"api"                    : "https://127.0.0.1/api/v1",
		"username"               : "admin",
		"password"               : null
	},
	"slack" : {
		"webhookUrl"             : null,
		"slackUsername"          : null,
		"alarmChannels"          : [],
		"reportChannels"         : [],
		"colors"                 : {
			"default"             : "#00adef",
			"defaultAlt"          : "#373a36",
			"INFO"                : "#00b050",
			"MINOR"               : "#ffea00",
			"MAJOR"               : "#ff9300",
			"CRITICAL"            : "#d0021b"
		}
	},
	"timers" : {
		"alarmPollInterval"      : 5,
		"alarmSuppressCount"     : 20
	},
	"healthReportSchedules"     : []
};

var config = {};

var prompt = {};
prompt.rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// method of the prompt object for asking user questions, and processing responses.
// params arg takes an object like:
// {
//		text : "string containing question text",
//		invalidText : "string containing text shown if response is invalid",
//		validation : (optional...may be a function, regex, or string)
//		default : "default answer value" (optional...passed as answer if none is entered.),
//      protected : true (optional...used for hiding passwords)
//	}
//
// Callback returns response string as arg
//
prompt.question = function(params, callback){

	var validate;

	function askQuestion(){
		// if protected, i.e. a password, hide text
		if (params.protected === true) {
			var stdin = process.openStdin();
			var onDataHandler = function(char) {
				char = char + "";
				switch (char) {
					case "\n": case "\r": case "\u0004":
					// Remove this handler
					stdin.removeListener("data",onDataHandler); 
					break;//stdin.pause(); break;
					default:
					process.stdout.write("'\x1B[2K\x1B[200D" + "> " + Array(prompt.rl.line.length+1).join("*"));
					break;
				}
			}
			process.stdin.on("data", onDataHandler);
			prompt.rl.question(`${params.text}:\n> `, function(value) {
				prompt.rl.history = prompt.rl.history.slice(1);
				processAnswer(value);
			});

		} else {
			prompt.rl.question(`${params.text}:\n> `, processAnswer);
		}
	}

	function processAnswer(answer){
		if (answer === "" || answer === null ){
			// if a default is provided, return it as the answer...otherwise it's invalid
			if (params.default) {
				process.stdout.write(`>> saved: ${params.default}\n\n`);
				callback(params.default);
			} else {
				process.stdout.write(`\n${params.invalidText}\n\n`);
				askQuestion();
			}
		} else if (validate(answer)) {
			process.stdout.write(`\n${params.invalidText}\n\n`);
			askQuestion();
		} else {
			if (params.protected === true) {
				process.stdout.write(">> saved.\n\n")
			} else {
				process.stdout.write(`>> saved: ${answer}\n\n`);
			}
			callback(answer);
		}
	}

	if (typeof params.validation === "string") {
		validate = function(stuffToTest){
			if (stuffToTest == params.validation) {
				return true
			} else {return false;}
		}
	} else if (typeof params.validation === "function") {
		validate = params.validation;
	} else if (params.validation instanceof RegExp) {
		validate = function(stuffToTest){
			return params.validation.test(stuffToTest);
		}
	} else {
		validate = function(){return false};
	}

	askQuestion();
}

prompt.close = function(){
	prompt.rl.close();
}


// function to print a nice output of the config
//
function printConfig(){
	process.stdout.write(`Current config:
   128T Router REST URL           | ${config.t128Control.api}
   Slack Webhook URL              | ${config.slack.webhookUrl}
   Slack Bot Name                 | ${config.slack.slackUsername}
   Alarms Slack Channel(s)        | \n`);
	config.slack.alarmChannels.forEach((channel)=> {
		process.stdout.write(`                                  | ${channel}\n`);
	})
	process.stdout.write(`   Health Report Slack Channel(s) |\n`);
	config.slack.reportChannels.forEach((channel)=> {
		process.stdout.write(`                                  | ${channel}\n`);
	})
	process.stdout.write(`   Health Report Schedule(s)      |\n`);
	config.healthReportSchedules.forEach((schedule)=>{
		process.stdout.write(`                                  | Day:    `);
		if (schedule.d.length === 0) {
			process.stdout.write("every day\n")
		} else {
			for (var i = 0; i < schedule.d.length; i++) {
				if (i === schedule.d.length - 1) {
					process.stdout.write(`${schedule.d[i]}\n`);
				} else {
					process.stdout.write(`${schedule.d[i]},`);
				}
			}
		}
		process.stdout.write(`                                  | Hour:   `);
		if (schedule.h.length === 0) {
			process.stdout.write("every hour\n")
		} else {
			for (var i = 0; i < schedule.h.length; i++) {
				if (i === schedule.h.length - 1) {
					process.stdout.write(`${schedule.h[i]}\n`);
				} else {
					process.stdout.write(`${schedule.h[i]},`);
				}
			}
		}
		process.stdout.write(`                                  | Minute: `);
		if (schedule.m.length === 0) {
			process.stdout.write("every minute\n")
		} else {
			for (var i = 0; i < schedule.m.length; i++) {
				if (i === schedule.m.length - 1) {
					process.stdout.write(`${schedule.m[i]}\n`);
				} else {
					process.stdout.write(`${schedule.m[i]},`);
				}
			}
		}
		process.stdout.write("                                  |\n");
	})
}

// question to ask if config json parse fails
function configErrorQuestion(){
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question("Found existing configuration, but it contains errors. Start a new one? (y/n) ", (answer) => {
		if (answer === "y") {
			process.stdout.write("Ok, starting new config...\n");
			rl.close();
		} else if (answer === "n") {
			process.stdout.write("Ok, leaving config alone. You can re-run setup to create a new one, or attempt to manually fix errors.\n");
			rl.close();
		} else {
			rl.close();
			configErrorQuestion();
		}
	});
}

// question to ask if config json parse succeeds
function keepConfigQuestion(){
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question("Modify this config? (y/n)\n> ", (answer) => {
		if (answer === "y") {
			process.stdout.write("Ok, starting modifying config...\n");
			rl.close();
		} else if (answer === "n") {
			process.stdout.write("Ok, leaving config alone. You can re-run setup to make changes at any time.\n");
			rl.close();
		} else {
			rl.close();
			keepConfigQuestion();
		}
	});
}

function healthReportScheduleQuestion(){

}

// this kicks off a series of prompts to setup Slack
//
function slackSetup(runWhenFinished){
	process.stdout.write("Let's get some information about your Slack team...\n\n");
	function slackWebhookQuestion(){
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question(`1. Enter your Slack Webhook URL:\n> `, (answer) => {
			if (answer === "") {
				rl.close();
			} else if (url.parse(answer).protocol == null || url.parse(answer).host == null) {
				process.stdout.write("\nThat does not appear to be a valid URL.\n\n");
				rl.close();
				t128ControlAPIQuestion();
				return;
			} else {
				config.t128Control.api = answer;
				rl.close();
			}
			process.stdout.write(`>> 128T Router REST URL:  ${config.t128Control.api}\n\n`)
		});
	}

	function slackUserQuestion(){

	}

	function slackAlarmChannelsQuestion(){

	}

	function slackHealthReportChannelsQuestion(){

	}

	slackWebhookQuestion();
}

// this kicks off a series of prompts to setup a 128T router
//
function routerSetup(runWhenFinished){

	var validateUrl = function(answer){
		if (url.parse(answer).protocol == null || url.parse(answer).host == null) {
			return true;
		} else {return false;}
	}

	var routerUrlQuestionParams = {
		text : `1. Enter the REST URL of your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.api}')`,
		invalidText : "That does not appear to be a valid URL.",
		validation : validateUrl,
		default : defaultConfig.t128Control.api
	}

	var routerUserQuestionParams = {
		text : `2. Enter an authorized username for your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.username}')`,
		invalidText : "That does not appear to be a valid username. Make sure it contains no spaces.",
		validation : /\s/,
		default : defaultConfig.t128Control.username
	}

	var routerPassQuestionParams = {
		text : `3. Enter password for ${config.t128Control.username} on your 128T Router:`,
		invalidText : "That does not appear to be a valid password. Make sure it contains no spaces.",
		validation : /\s/,
		protected: true
	}

	function t128UsernameQuestion(){
		prompt.question(routerUserQuestionParams, (answer)=>{
			config.t128Control.username = answer;
			// next ask password question
			t128PasswordQuestion();
		});
	}

	function t128PasswordQuestion(){
		prompt.question(routerPassQuestionParams, (answer)=>{
			config.t128Control.password = answer;
			// next ask password question
			
		});
	}

	process.stdout.write("\nLets get some information about your 128T Router...\n\n");

	prompt.question(routerUrlQuestionParams, (answer)=>{
		config.t128Control.api = answer;
		// next ask username question
		t128UsernameQuestion();
	});
	
}

function startNewConfig(){
	config = defaultConfig;

	function onRouterSetup(){
		process.stdout.write("128T Router setup complete.\n");
		slackSetup();
	}

	function onSlackSetup(){
		process.stdout.write("Slack setup complete.\n");
	}
	
	routerSetup(onRouterSetup);
}

process.stdout.write("\nBeginning 128T-Slackbot setup...\n\n");

// attempt to read the config file
fs.readFile(configFile, (error, configContents)=>{
	// readfile failed
	if (error) {
		process.stdout.write("Looks like no configuration exists.\n(Perhaps this 128T-Slackbot is running for the first time)\n");
		startNewConfig();
	} else {
		try {
			config = JSON.parse(configContents);
		}
		catch(error) {
			process.stdout.write("Found an existing configuration, but it contains errors.");
			configErrorQuestion();
			return;
		}
		printConfig();
		keepConfigQuestion();
	}
})