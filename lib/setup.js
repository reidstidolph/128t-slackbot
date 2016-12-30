/*jshint node: true */
"use strict";

// import modules
const fs = require("fs"); // file system
const readline = require('readline'); // readline 
const url = require("url"); // url module for validation purposes
// setup gets called from the main dir
const configFile = "./cache/.slackbot-config.json"; // 128T-Slackbot config file

// default config literal
//
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

// initialize config variable
var config = {};

// set up interactive prompt
//
var prompt = {"rl":null};

// method to begin prompt
prompt.start = function(){
	prompt.rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
};

// method of the prompt object for asking user questions, and processing responses.
// params arg takes an object like:
// {
//		text : "string containing question text",
//      helpText : "string containing help text",
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
			};
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
		} else if (answer === "?" && params.helpText) {
			// print help text
			process.stdout.write(`\n${params.helpText}\n\n`);
			askQuestion();

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
				return true;
			} else {return false;}
		};
	} else if (typeof params.validation === "function") {
		validate = params.validation;
	} else if (params.validation instanceof RegExp) {
		validate = function(stuffToTest){
			return !params.validation.test(stuffToTest);
		};
	} else {
		validate = function(){return false;};
	}
	askQuestion();
};

// method for ending the interactive prompt session
//
prompt.close = function(){
	prompt.rl.close();
};


// function for validating URLs
//
var validateUrl = function(answer){
	if (url.parse(answer).protocol === null || url.parse(answer).host === null) {
		return true;
	} else {return false;}
};

// quick and dirty duplicate checker function
//
function dupCheck(string, array){
	var result = false;
	array.forEach((value)=>{
		if (value === string) {
			result = true;
		}
	});
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
					}
					outputArray.push(parseInt(numberString));
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
						range = high - low;
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
};

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
	});
	process.stdout.write(`   Health Report Slack Channel(s) |\n`);
	config.slack.reportChannels.forEach((channel)=> {
		process.stdout.write(`                                  | ${channel}\n`);
	});
	process.stdout.write(`   Health Report Schedule(s)      |\n`);
	config.healthReportSchedules.forEach((schedule)=>{
		process.stdout.write(`                                  | Day:    `);
		if (schedule.d.length === 0) {
			process.stdout.write("every day\n");
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
			process.stdout.write("every hour\n");
		} else {
			for (var j = 0; j < schedule.h.length; j++) {
				if (j === schedule.h.length - 1) {
					process.stdout.write(`${schedule.h[j]}\n`);
				} else {
					process.stdout.write(`${schedule.h[j]},`);
				}
			}
		}
		process.stdout.write(`                                  | Minute: `);
		if (schedule.m.length === 0) {
			process.stdout.write("every minute\n");
		} else {
			for (var k = 0; k < schedule.m.length; k++) {
				if (k === schedule.m.length - 1) {
					process.stdout.write(`${schedule.m[k]}\n`);
				} else {
					process.stdout.write(`${schedule.m[k]},`);
				}
			}
		}
		process.stdout.write("                                  |\n");
	});
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
			process.stdout.write("Ok, modify config...\n");
			modifyConfig();
		} else if (answer === "n") {
			process.stdout.write("Ok, leaving config alone. You can re-run setup to make changes at any time.\n\nSaving config...\n");
			fs.writeFile(configFile, JSON.stringify(config, null, 3), { mode: 0o600 }, (error)=>{
				if (error) {
					console.log(error);
					process.stdout.write("Error. Unable to write config to disk.\n\n");
					prompt.close();
					process.exit(1);
				}
				process.stdout.write("Config saved...Goodbye!\n\n");
				prompt.close();
			});
		}
	});
}

// this kicks off a series of prompts to setup Slack
//
function slackSetup(runWhenFinished){
	
	function slackWebhookQuestion(){
		var slackWebhookQuestionParams = {
			text : "Slack-1. Slack Webhook URL\n   (enter '?' for help)",
			helpText : `   Enter Slack Webhook URL for your team. Must be a valid URL.
   Example:
      'https://hooks.slack.com/services/xxyyzz'`,
			invalidText : "That does not appear to be a valid URL.",
			validation : validateUrl
		};

		prompt.question(slackWebhookQuestionParams, (answer)=>{
			config.slack.webhookUrl = answer;
			process.stdout.write(`>> '${config.slack.webhookUrl}'...saved\n\n`);
			// next ask username question
			slackUserQuestion();
		});
	}

	function slackUserQuestion(){
		var slackUserQuestionParams = {
			text : `Slack-2. Slack bot name\n   (press 'enter' to use default: '${defaultConfig.slack.slackUsername}', '?' for help)`,
			helpText : `   Enter Slack name for this 128T-Slackbot instance. Slack 
   messages will appear to come from this user, so you may
   want to name it for the router that you are monitoring.
   Example:
      'my-router'`,
			invalidText : "That does not appear to be a valid name. Make sure it contains no spaces.",
			validation : /^\S*$/,
			default : defaultConfig.slack.slackUsername
		};

		prompt.question(slackUserQuestionParams, (answer)=>{
			config.slack.slackUsername = answer;
			process.stdout.write(`>> '${config.slack.slackUsername}'...saved\n\n`);
			// next ask username question
			slackAlarmChannelsQuestion();
		});
	}

	function slackAlarmChannelsQuestion(){
		var alarmChannels = [];
		var alarmHelpText = `   Enter a Slack #channel or @user, where you want alarms to be sent.
   Must be in the form of '#channel' or '@user'.
   Example:
      '@myuser'
      '#mychannel'`;
      	var alarmInvalidText = "That does not appear to be a valid Slack name. Must be in the form of '@user', or '#channel'.";

		var slackAlarmChannelsQuestionParams = {
			text : `Slack-3. Slack alarms channel\n   (enter '?' for help)`,
			helpText : alarmHelpText,
			invalidText : alarmInvalidText,
			validation : /^(@.\S*|#.\S*)$/
		};

		var moreAlarmChannelsQuestionParams = {
			text : `Slack-3. Any more alarms channels?\n   (enter 'n' if done, or another Slack #channel or @user)`,
			helpText : alarmHelpText,
			invalidText : alarmInvalidText,
			validation : /^(@.\S*|#.\S*|n\S*)$/
		};

		function askForMore(){
			prompt.question(moreAlarmChannelsQuestionParams, (answer)=>{

				if (answer === "n") {
					config.slack.alarmChannels = alarmChannels;
					process.stdout.write(">> done. Alarms will be sent to:\n");
					config.slack.alarmChannels.forEach((channel)=>{
						process.stdout.write(`   ${channel}\n`);
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
		var healthHelpText = `   Enter a Slack #channel or @user, where you want health reports to be sent.
   Must be in the form of '#channel' or '@user'.
   Example:
      '@myuser'
      '#mychannel'`;
      	var healthInvalidText = "That does not appear to be a valid Slack name. Must be in the form of '@user', or '#channel'.";

		var slackHealthChannelsQuestionParams = {
			text : `Slack-4. Slack health reports channel\n   (enter '?' for help)`,
			helpText : healthHelpText,
			invalidText : healthInvalidText,
			validation : /^(@.\S*|#.\S*)$/
		};

		var moreHealthChannelsQuestionParams = {
			text : `Slack-4. Any more health reports channels?\n   (enter 'n' if done, or another Slack #channel or @user)`,
			helpText : healthHelpText,
			invalidText : healthInvalidText,
			validation : /^(@.\S*|#.\S*|n\S*)$/
		};

		function askForMore(){
			prompt.question(moreHealthChannelsQuestionParams, (answer)=>{

				if (answer === "n") {
					config.slack.reportChannels = healthChannels;
					process.stdout.write(">> done. Health reports will be sent to:\n");
					config.slack.reportChannels.forEach((channel)=>{
						process.stdout.write(`   ${channel}\n`);
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
			text : `128T-1. REST URL of your 128T Router\n   (press 'enter' to use default '${defaultConfig.t128Control.api}', '?' for help.)`,
			invalidText : "That does not appear to be a valid URL.",
			helpText : `   Enter the 128T Router REST URL must be a valid URL.
   Example:
      https://my-128t-router.com/api/v1
      ${defaultConfig.t128Control.api}`,
			validation : validateUrl,
			default : defaultConfig.t128Control.api
		};

		prompt.question(routerUrlQuestionParams, (answer)=>{
			config.t128Control.api = answer;
			process.stdout.write(`>> '${config.t128Control.api}'...saved\n\n`);
			// next ask username question
			t128UsernameQuestion();
		});
	}

	function t128UsernameQuestion(){
		var routerUserQuestionParams = {
			text : `128T-2. 128T Router Username\n   (press 'enter' to use default '${defaultConfig.t128Control.username}', '?' for help.)`,
			invalidText : "That does not appear to be a valid username. Make sure it contains no spaces.",
			helpText : `   Enter an authorized username for your 128T Router.
   Example:
      'admin'`,
			validation : /^\S*$/,
			default : defaultConfig.t128Control.username
		};

		prompt.question(routerUserQuestionParams, (answer)=>{
			config.t128Control.username = answer;
			process.stdout.write(`>> '${config.t128Control.username}'...saved\n\n`);
			// next ask password question
			t128PasswordQuestion();
		});
	}

	function t128PasswordQuestion(){
		var routerPassQuestionParams = {
			text : `128T-3. 128T Router password\n   (enter '?' for help)`,
			invalidText : "That does not appear to be a valid password. Make sure it contains no spaces.",
			helpText : `   Enter the password for '${config.t128Control.username}' on your 128T Router.`,
			validation : /^\S*$/,
			protected: true
		};

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

	// some big, nasty regex's. Ugh.
	var daysValidation = /^(\*|([0-6]|[0-6]-[0-6]|([0-6],|[0-6]-[0-6],){1,6}([0-6]|[0-6]-[0-6])))$/;
	var hoursValidation = /^(\*|(((?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]))|(?:(?:[0-9],|1[0-9],|2[0-3],)|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]),){1,23}(?:(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])-(?:[0-9]|1[0-9]|2[0-3]))))$/;
	var minutesValidation = /^(\*|(((?:[0-9]|[1-5][0-9])|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]))|(?:(?:[0-9],|[1-5][0-9],)|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]),){1,23}(?:(?:[0-9]|[1-5][0-9])|(?:[0-9]|[1-5][0-9])-(?:[0-9]|[1-5][0-9]))))$/;
	var schedulesHelpText = `   Schedules create a recurring time, based on day(s) of week, 
   hour(s) of day, and minute(s) of hour, on which a reports will
   be sent to Slack. You will be prompted for days, weeks, and
   minutes to create a schedule, and you'll have the opportunity to.
   create multiple schedules. For example, if you want reports on 
   weekdays at 12:30pm, you will enter a schedule for days 1-5, hour
   12, minute 30.`;

	function getDays(){
		var daysQuestionParams = {
			text : "Schedule-1: Days\n   (enter '?' for help)",
			helpText : `${schedulesHelpText}

   Enter the days of the week that you want to receive health reports.
   Must be a comma seprated list of either numbers between 0 and 6,
   or of number ranges consisiting two hyphen seprated numbers between
   0 and 6. For every day of the week, simply enter '*'.
   Examples: 
      '0'       is Sun
      '1-5'     is Mon, Tue, Wed, Thu, Fri
      '0,2,4-6' is Sun, Tue, Thu, Fri, Sat)
      '*'       is Sun-Sat`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\nValid characters are '1'-'6', '-', and ','.",
			validation : daysValidation
		};

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
			text : "Schedule-2: Hours\n   (enter '?' for help)",
			helpText : `${schedulesHelpText}

   For each of the days you entered, now enter the hours of the day
   that you want to receive health reports. Must be a comma seprated
   list of either numbers between 0 and 23, or of number ranges
   consisiting of two hyphen separated numbers between 0 and 23.
   For every hour of the day, simply enter '*'.
   Examples:
      '0'         is 12am
      '23'        is 11pm
      '10-13'     is 10am, 11am, 12pm, 1pm
      '2,4,14-17' is 2am, 4am, 2pm, 3pm, 4pm, 5pm
      "*'         is all hours from 12am to 11pm`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\nValid characters are '1'-'23', '-', and ','.",
			validation : hoursValidation
		};

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
			text : "Schedule-3: Minutes\n   (enter '?' for help)",
			helpText : `${schedulesHelpText}

   For each of the days and hours you entered, now enter the 
   minutes of the hour that you want to receive health reports.
   Must be a comma seprated list of either numbers between 0 and
   59, or of number ranges consisiting of two hyphen separated
   numbers between 0 and 59. For every minute of the hour, simply
   enter '*'.
   Examples: 
      '0'         is :00
      '30-33'     is :30, :31, :32, :33
      '2,4,14-17' is :2, :4, :14, :15, :16, :17
      '*'         is all minutes from :00 to :59`,
			invalidText : "That does not appear valid. Make sure there are no spaces.\nValid characters are '1'-'59', '-', and ','.",
			validation : minutesValidation
		};

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
		};

		prompt.question(addAnotherScheduleParams, (answer)=>{
			if (answer === "y") {
				process.stdout.write("\nOk, setting up another schedule for health reports to be sent to Slack...\n\n");
				getDays();
			} else if (answer === "n") {
				runWhenFinished();
			}
		});
	}

	process.stdout.write("\nLets set up a schedule for health reports to be sent to Slack...\n\n");
	getDays();
}

function modifyConfig(){
	var modifyConfigQuestionParams = {
		text : `What do you want to modify?
   Enter one of the following:
      '1' for 128T Router config
      '2' for Slack Config
      '3' for schedule config
      'q' to quit`,
		invalidText : "Valid selections are '1', '2', '3', or 'q'.",
		validation : /^(1|2|3|q)$/
	};

	prompt.question(modifyConfigQuestionParams, (answer)=> {
		if (answer === "1" || answer === 1) {
			process.stdout.write("Ok, modifying 128T Router config...\n");
			routerSetup(()=>{
				printConfig();
				keepConfigQuestion();
			});
		} else if (answer === "2" || answer === 2) {
			process.stdout.write("Ok, modifying Slack config...\n");
			slackSetup(()=>{
				printConfig();
				keepConfigQuestion();
			});
		} else if (answer === "3" || answer === 3) {
			process.stdout.write("Ok, modifying schedule config...\n");
			scheduleSetup(()=>{
				printConfig();
				keepConfigQuestion();
			});
		} else if (answer === "q") {
			process.stdout.write("Ok, done. You can re-run setup to make changes at any time.\n\nSaving config...\n");
			fs.writeFile(configFile, JSON.stringify(config, null, 3), { mode: 0o600 }, (error)=>{
				if (error) {
					console.log(error);
					process.stdout.write("Error. Unable to write config to disk.\n\n");
					prompt.close();
					process.exit(1);
				}
				process.stdout.write("Config saved...Goodbye!\n\n");
				prompt.close();
			});
		}
	});
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
		process.stdout.write("Slack setup complete.");
		// go to schedule setup
		scheduleSetup(done);
	}

	function done(){
		process.stdout.write("Config complete!\n\n");
		printConfig();
		keepConfigQuestion();

	}
	
	routerSetup(onRouterSetup);
}

// attempt to read the config file, and begin setup
var begin = function() {
	prompt.start();
	fs.readFile(configFile, (error, configContents)=>{
		// readfile failed
		if (error) {
			process.stdout.write("\nLooks like 128T-Slackbot is running for the first time.");
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
	});
};

module.exports = begin;