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
		"slackUsername"          : "128T-Slackbot",
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

// function for validating URLs
//
var validateUrl = function(answer){
	if (url.parse(answer).protocol == null || url.parse(answer).host == null) {
		return true;
	} else {return false;}
}

// quick and dirty duplicate checker function
//
function dupCheck(string, array){
	var result = false;
	array.forEach((value)=>{
		if (value === string) {
			result = true;
		}
	})
	return result;
}

// Parse comma separated strings of numbers and/or number ranges,
// and return a proper array of numbers. This assumes input is a 
// string that has already been validated. This is super ugly, but
// hey...it works.
//
var parseTimeString = function(input){
	var outputArray = [];
	var stringLength = input.length;
	var outputArray = [];
	var stringLength = input.length;

	// set through the string an pull out numbers
	for(var i = 0; i < stringLength; i++){

		if (input[i] != "," && input[i] != "-") {
			// figure out how far till the next separator
			// and if we are dealing with a range or not
			var next = i+1;
			var range = false;
			var numberString = "";
			while(input[next] != "," && next < stringLength) {
				// if we are dealing with a range, mark it
				if (input[next]=="-") {range=next;}
				// ..then advance
				next++;
			}
			
			if ((next - i) == 1) {
				// single digit...push it in
				outputArray.push(parseInt(input[i]));
			} else {
				if (range === false) {
					// multiple digits...concatinate and push
					for (var j = i; j < next; j++){
						numberString += input[j];
						outputArray.push(parseInt(numberString));
						
					}
					// increase the interation passed the next separator
					i += (next - i);
				} else {
					// expand the range, and push
					var lowNumberString = "";
					var highNumberString = "";
					for (var k = i; k < range; k++){
						lowNumberString += input[k];
					}
					for (var l = (range+1); l < next; l++){
						highNumberString += input[l];
					}

					var high = parseInt(highNumberString);
					var low = parseInt(lowNumberString);
					// if the lower digit is greater, swap high and low
					if (low > high) {
						high = parseInt(lowNumberString);
						low = parseInt(highNumberString);
					}

					if (low == high) {
						// range is not really a range...just push one of them.
						outputArray.push(low);
					} else {
						var range = high - low;
						for(var z=low; z <= high; z++){
							outputArray.push(z);
						}
					}
					// increase the iteration passed the next separator
					i += (next - i);
				}
			}
		}
	}
	return Array.from(new Set(outputArray)).sort(function(a,b){ return b - a;}).reverse();
}

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
				callback(params.default);
			} else {
				process.stdout.write(`\n${params.invalidText}\n\n`);
				askQuestion();
			}
		} else if (validate(answer)) {
			process.stdout.write(`\n${params.invalidText}\n\n`);
			askQuestion();
		} else {
			callback(answer);
		}
	}

	// determine what kind of validation is needed, and set up
	// validation function
	//
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
			return !params.validation.test(stuffToTest);
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

	var configErrorQuestionParams = {
		text : "Found existing configuration, but it contains errors. Start a new one? (y/n) ",
		invalidText : 'Please enter "y" for "yes", or "n" for "no".',
		validation : /^(y|n)$/
	};

	prompt.question(configErrorQuestionParams, (answer) => {
		if (answer === "y") {
			process.stdout.write("Ok, starting new config...\n");
		} else if (answer === "n") {
			process.stdout.write("Ok, leaving config alone. You can re-run setup to create a new one, or attempt to manually fix errors.\n");
		}
	});
}

// question to ask if config json parse succeeds
function keepConfigQuestion(){

	var keepConfigQuestionParams = {
		text : "Modify this config? (y/n) ",
		invalidText : 'Please enter "y" for "yes", or "n" for "no".',
		validation : /^(y|n)$/
	};

	prompt.question(keepConfigQuestionParams, (answer)=> {
		if (answer === "y") {
			process.stdout.write("Ok, starting modifying config...\n");
		} else if (answer === "n") {
			process.stdout.write("Ok, leaving config alone. You can re-run setup to make changes at any time.\n\n");
			prompt.close();
		}
	});
}

// this kicks off a series of prompts to setup Slack
//
function slackSetup(runWhenFinished){
	
	function slackWebhookQuestion(){
		var slackWebhookQuestionParams = {
			text : "1. Enter Slack Webhook URL for your team",
			invalidText : "That does not appear to be a valid URL.",
			validation : validateUrl
		}

		prompt.question(slackWebhookQuestionParams, (answer)=>{
			config.slack.webhookUrl = answer;
			process.stdout.write(`>> '${config.slack.webhookUrl}'...saved\n\n`);
			// next ask username question
			slackUserQuestion();
		});
	}

	function slackUserQuestion(){
		var slackUserQuestionParams = {
			text : `2. Enter Slack name for this 128T-Slackbot instance.\n   Slack messages will appear to come from this user,\n   so you may want to name it for the router that\n   you are monitoring.\n(press 'enter' to use default: '${defaultConfig.slack.slackUsername}')`,
			invalidText : "That does not appear to be a valid name. Make sure it contains no spaces.",
			validation : /^\S*$/,
			default : defaultConfig.slack.slackUsername
		}

		prompt.question(slackUserQuestionParams, (answer)=>{
			config.slack.slackUsername = answer;
			process.stdout.write(`>> '${config.slack.slackUsername}'...saved\n\n`);
			// next ask username question
			slackAlarmChannelsQuestion();
		});
	}

	function slackAlarmChannelsQuestion(){
		var alarmChannels = [];

		var slackAlarmChannelsQuestionParams = {
			text : `3. Enter a Slack #channel or @user, that you want to send alarms to`,
			invalidText : "That does not appear to be a valid Slack name. Must be in the form of '@my-user', or '#my-channel'.",
			validation : /^(@\S*|#.\S*)$/
		}

		var moreAlarmChannelsQuestionParams = {
			text : `Send alarms to more #channels or @users?\n(enter 'done', or another Slack channel or user)`,
			invalidText : "That does not appear to be a valid Slack name. Must be in the form of '@my-user', or '#my-channel'.",
			validation : /^(@\S*|#.\S*|done)$/
		}

		function askForMore(){
			prompt.question(moreAlarmChannelsQuestionParams, (answer)=>{

				if (answer === "done") {
					config.slack.alarmChannels = alarmChannels;
					process.stdout.write(">> done. Alarms will be sent to:\n");
					config.slack.alarmChannels.forEach((channel)=>{
						process.stdout.write(`   ${channel}\n`)
					});
					process.stdout.write("\n");
					slackHealthReportChannelsQuestion();
				} else if (dupCheck(answer, alarmChannels)) {
					process.stdout.write(`>> '${answer}' already saved.\n\n`);
					askForMore();
				} else {
					alarmChannels.push(answer);
					process.stdout.write(`>> '${answer}'...saved\n\n`);
					askForMore();
				}
			});
		}

		prompt.question(slackAlarmChannelsQuestionParams, (answer)=>{
			alarmChannels.push(answer);
			process.stdout.write('>> ...saved\n\n');
			// ask for more users
			askForMore();
		});
	}

	function slackHealthReportChannelsQuestion(){
		var healthChannels = [];

		var slackHealthChannelsQuestionParams = {
			text : `4. Enter a Slack #channel or @user, that you want to send health reports to`,
			invalidText : "That does not appear to be a valid Slack name. Must be in the form of '@my-user', or '#my-channel'.",
			validation : /^(@\S*|#.\S*)$/
		}

		var moreHealthChannelsQuestionParams = {
			text : `Send health reports to more #channels or @users?\n(enter 'done', or another Slack channel or user)`,
			invalidText : "That does not appear to be a valid Slack name. Must be in the form of '@my-user', or '#my-channel'.",
			validation : /^(@\S*|#.\S*|done)$/
		}

		function askForMore(){
			prompt.question(moreHealthChannelsQuestionParams, (answer)=>{

				if (answer === "done") {
					config.slack.reportChannels = healthChannels;
					process.stdout.write(">> done. Health reports will be sent to:\n");
					config.slack.reportChannels.forEach((channel)=>{
						process.stdout.write(`   ${channel}\n`)
					});
					process.stdout.write("\n");
					// Break out of slack line of questions
					runWhenFinished();
				} else if (dupCheck(answer, healthChannels)) {
					process.stdout.write(`>> '${answer}' already saved.\n\n`);
					askForMore();
				} else {
					healthChannels.push(answer);
					process.stdout.write(`>> '${answer}'...saved\n\n`);
					askForMore();
				}
			});
		}

		prompt.question(slackHealthChannelsQuestionParams, (answer)=>{
			healthChannels.push(answer);
			process.stdout.write('>> ...saved\n\n');
			// ask for more users
			askForMore();
		});
	}

	process.stdout.write("Let's get some information about your Slack team...\n\n");
	// kick off this series of questions
	slackWebhookQuestion();
}

// this kicks off a series of prompts to setup a 128T router
//
function routerSetup(runWhenFinished){


	function t128RouterUrlQuestion(){
		var routerUrlQuestionParams = {
			text : `1. Enter the REST URL of your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.api}')`,
			invalidText : "That does not appear to be a valid URL.",
			validation : validateUrl,
			default : defaultConfig.t128Control.api
		}

		prompt.question(routerUrlQuestionParams, (answer)=>{
			config.t128Control.api = answer;
			process.stdout.write(`>> '${config.t128Control.api}'...saved\n\n`);
			// next ask username question
			t128UsernameQuestion();
		});
	}

	function t128UsernameQuestion(){
		var routerUserQuestionParams = {
			text : `2. Enter an authorized username for your 128T Router\n(press 'enter' to use default: '${defaultConfig.t128Control.username}')`,
			invalidText : "That does not appear to be a valid username. Make sure it contains no spaces.",
			validation : /^\S*$/,
			default : defaultConfig.t128Control.username
		}

		prompt.question(routerUserQuestionParams, (answer)=>{
			config.t128Control.username = answer;
			process.stdout.write(`>> '${config.t128Control.username}'...saved\n\n`);
			// next ask password question
			t128PasswordQuestion();
		});
	}

	function t128PasswordQuestion(){
		var routerPassQuestionParams = {
			text : `3. Enter password for ${config.t128Control.username} on your 128T Router`,
			invalidText : "That does not appear to be a valid password. Make sure it contains no spaces.",
			validation : /^\S*$/,
			protected: true
		}

		prompt.question(routerPassQuestionParams, (answer)=>{
			config.t128Control.password = answer;
			process.stdout.write('>> password saved\n\n');
			// next ask password question
			runWhenFinished();
		});
	}

	process.stdout.write("\nLets get some information about your 128T Router...\n\n");
	// kick off the series of questions
	t128RouterUrlQuestion();
}

// this kicks off a series of propmts to set up a report schedule
function scheduleSetup(runWhenFinished){

	var newSchedule = {
		"d" : [],
		"h" : [],
		"m" : []
	};

	function getDays(){
		var daysQuestionParams = {
			text : `1. Enter the days of the week that you want to receive health reports.
      Must be a comma seprated list of either numbers from 0 to 6: 
            (Example: '0' is Sun, '1' is Mon, ...'6' is Sat)
      Instead of a single number, a hyphen seprated numbers 
      from 0 to 6 can be used to indicate a range:
            (Example: '1-5' is Mon, Tue, Wed, Thu, Fri)
      Numbers and ranges can be used together: 
            (Example: '0,2,4-6' is Sun, Tue, Thu, Fri, Sat)
      For every day of the week, simply enter '*':
            (Example: '*' is Sun-Sat)`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\hValid characters are '1'-'6', '-', and ','.",
			validation : /^(\*|([0-6]|[0-6]-[0-6]|([0-6],|[0-6]-[0-6],){1,6}([0-6]|[0-6]-[0-6])))$/
		}

		prompt.question(daysQuestionParams, (answer)=>{
			if (answer != "*") {
				newSchedule.d = parseTimeString(answer);
				process.stdout.write(`>> '${newSchedule.d}'...saved\n\n`);
			} else {
				process.stdout.write(`>> 'every day'...saved\n\n`);
			}
			// next ask username question
			getHours();
		});
	}

	function getHours(){
		var hoursQuestionParams = {
			text : `2. For each of the days you entered, now enter the hours 
      of the day that you want to receive health reports.
      Must be a comma seprated list of either numbers from 0 to 23: 
            (Example: '0' is 12am, '1' is 1am, ...'23' is 11pm)
      Instead of a single number, a hyphen seprated numbers 
      from 0 to 23 can be used to indicate a range:
            (Example: '10-13' is 10am, 11am, 12pm, 1pm)
      Numbers and ranges can be used together: 
            (Example: '2,4,14-17' is 2am, 4am, 2pm, 3pm, 4pm, 5pm)
      For every hour of the day, simply enter '*':
            (Example: '*' is all hours from 12am to 11pm)`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\nValid characters are '1'-'23', '-', and ','.",
			// one big, nasty regex. Ugh.
			validation : /^(\*|(((?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]))|(?:(?:[0-9],|1[0-9]|2[0-3],)|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]),){1,23}(?:(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]))))$/
		}

		prompt.question(hoursQuestionParams, (answer)=>{
			if (answer != "*") {
				newSchedule.h = parseTimeString(answer);
				process.stdout.write(`>> '${newSchedule.h}'...saved\n\n`);
			} else {
				process.stdout.write(`>> 'every hour'...saved\n\n`);
			}
			// next ask question
			getMinutes();
		});
	}

	function getMinutes(){
		var minutesQuestionParams = {
			text : `3. For each of the days and hours you entered, 
      now enter the minutes of the hour that you want to 
      receive health reports.
      Must be a comma seprated list of either numbers from 0 to 59: 
            (Example: '0' is :00, '5' is :05, ...'59' is :59)
      Instead of a single number, a hyphen seprated numbers 
      from 0 to 59 can be used to indicate a range:
            (Example: '30-33' is :30, :31, :32, :33)
      Numbers and ranges can be used together: 
            (Example: '2,4,14-17' is :2, :4, :14, :15, :16, :17)
      For every hour of the day, simply enter '*':
            (Example: '*' is all minutes from :00 to :59)`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\nValid characters are '1'-'59', '-', and ','.",
			// one big, nasty regex. Ugh.
			validation : /^(\*|(((?:[0-9]|[1-5][0-9])|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]))|(?:(?:[0-9],|[1-5][0-9],)|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]),){1,23}(?:(?:[0-9]|[1-5][0-9])|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]))))$/
		}

		prompt.question(minutesQuestionParams, (answer)=>{
			if (answer != "*") {
				newSchedule.m = parseTimeString(answer);
				process.stdout.write(`>> '${newSchedule.m}'...saved\n\n`);
			} else {
				process.stdout.write(`>> 'every minute'...saved\n\n`);
			}
			
			// finished...move this schedule to config, and clear it out
			config.healthReportSchedules.push(newSchedule);
			newSchedule = {
				"d" : [],
				"h" : [],
				"m" : []
			};

			// next ask question
			addAnotherSchedule();
		});
	}

	function addAnotherSchedule(){
		var addAnotherScheduleParams = {
			text : "Schedule added. Do you want to add another? (y/n) ",
			invalidText : 'Please enter "y" for "yes", or "n" for "no".',
			validation : /^(y|n)$/
		}

		prompt.question(addAnotherScheduleParams, (answer)=>{
			if (answer === "y") {
				process.stdout.write("\nOk, setting up another schedule for health reports to be sent to Slack...\n\n");
				getDays();
			} else if (answer === "n") {
				runWhenFinished();
			}
		})
	}

	process.stdout.write("\nLets set up a schedule for health reports to be sent to Slack...\n\n");
	getDays();
}

// this kicks off a series of propmpts to build a config from scratch
//
function startNewConfig(){
	config = defaultConfig;

	function onRouterSetup(){
		process.stdout.write("128T Router setup complete.\n");
		// go to slack setup
		slackSetup(onSlackSetup);
	}

	function onSlackSetup(){
		process.stdout.write("Slack setup complete.\n");
		// go to schedule setup
		scheduleSetup(done);
	}

	function done(){
		process.stdout.write("Config complete!\n\n")
		printConfig();

	}
	
	routerSetup(onRouterSetup);
}

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