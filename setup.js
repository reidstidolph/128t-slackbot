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

prompt.question = function(text, invalidText, validation, callback){

	var validate;

	if (typeof validation === "string") {

		var regex = new RegExp(validation);
		validate = function(stuffToTest){
			return regex.text(stuffToTest);
		}

	} else if (typeof validation === "function") {
		
		validate = validation;

	} else {

		validate = function(){return false};
	
	}

	function askQuestion(){
		prompt.rl.question(`${text}:\n> `, processAnswer);
	}

	function processAnswer(answer){
		if (answer === "" || answer === null || validate(answer)) {
			process.stdout.write(`\n${invalidText}\n\n`);
			askQuestion();
		} else {
			process.stdout.write(`>> saved: ${answer}\n\n`);
			callback(answer);
		}
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
	
	var text = `1. Enter the REST URL of your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.api}')`;
	var invalidText = "That does not appear to be a valid URL.";
	var validation = function(answer){
		if (url.parse(answer).protocol == null || url.parse(answer).host == null) {
			return true;
		} else {return false;}
	}

	process.stdout.write("\nLets get some information about your 128T Router...\n\n");

	prompt.question(text, invalidText, validation, (answer)=>{

	});
	

	function t128UsernameQuestion(){

		var validation = /\s/;

		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question(`2. Enter an authorized username for your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.username}'):\n> `, (answer) => {
			if (answer === "") {
				rl.close();
			} else if (validation.test(answer)) {
				process.stdout.write("\nThat does not appear to be a valid username. Make sure it contains no spaces.\n\n");
				rl.close();
				t128UsernameQuestion();
				return;
			} else {
				config.t128Control.username = answer;
				rl.close();
			}
			process.stdout.write(`>> 128T Router Username:  ${config.t128Control.username}\n\n`);
			t128PasswordQuestion();
		});
	}

	function t128PasswordQuestion(){

		var validation = /\s/;

		var rl = readline.createInterface({
			input: process.stdin,
			output: null
		});

		process.stdout.write(`3. Enter password for ${config.t128Control.username} on your 128T Router:\n(keystrokes will be hidden):\n> `);
		rl.question(`3. Enter password for ${config.t128Control.username} on your 128T Router:\n(keystrokes will be hidden):\n> `, (answer) => {
			if (answer === "" || answer === null) {
				process.stdout.write("\nThat does not appear to be a valid username. Got no input.\n\n");
				rl.close();
				setTimeout(()=>{
				t128PasswordQuestion();
				}, 1000)
				return
			} else if (validation.test(answer)) {
				process.stdout.write("\nThat does not appear to be a valid password. Make sure it contains no spaces.\n\n");
				rl.close();
				t128PasswordQuestion();
				return;
			} else {
				config.t128Control.password = answer;
				rl.close();
			}
			process.stdout.write(`>> 128T Router password:  (set)\n\n`);
			runWhenFinished();
		});

	}
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