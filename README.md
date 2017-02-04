# 128T-Slackbot #
*A 128 Technology Community project*

The 128T-Slackbot turns your 128T powered network into a self-aware, sentient being, capable of reporting how it is performing via Slack!

## Prerequisites
The basic components needed for a working 128T-Slackbot are:

* A host to run the 128T-Slackbot, with NodeJS installed (can be run on a 128T Router itself, or a separate host) 
* A 128T Router with enabled REST API
* A Slack team with an Incoming WebHooks custom integration enabled
* Connectivity from 128T-Slackbot host to the 128T Router, and from the 128T-Slackbot host to hooks.slack.com

### Slack Setup ###
To enable your 128T-Slackbot to integrate with Slack, an Incoming WebHook is needed on your Slack team. If you do not already have an Incoming WebHook established, browse to your Slack "Custom Integrations" page, and then to "Incoming WebHooks"

After you have an Incoming WebHook enabled, these are the key integration settings:

* **Post to Channel**: Don't worry about this one, the 128T-Slackbot will override this with channels of your choosing.
* **Webhook URL**: You will need to copy this URL, into the configuration of the 128T-Slackbot
* **Customize Name**: Don't worry about this one, the 128T-Slackbot will override this with a bot name of your choosing.
* **Customize Icon**: You can customize this, or use this for an icon: [link](http://i.imgur.com/l30dDHf.png)

## Installation
To install the 128T-Slackbot on your host system, use the following steps:

* Choose a directory on your host system, and git clone from the 128T-Slackbot repository:
```
$ git clone https://github.com/reidstidolph/128t-slackbot.git
```
* Move into the newly created `128t-slackbot` directory:
```
$ cd 128t-slackbot
```
## Configuration
To set up the 128T-Slackbot, simply run the setup wizard, and follow the prompts.
```
$ ./128t-slackbot setup
```
Configuration data is stored in `./cache/.slackbot-config.json`. If you want to re-initialize your 128T-Slackbot and start over from scratch, just delete this file.

## Operation
Operating the 128T-Slackbot is easy. Run the 128T-Slackbot without any arguments to see the available options.
```
$ ./128t-slackbot 

Welcome to 128T-Slackbot! (v1.0.0)

Usage: ./128t-slackbot {start|stop|restart|status|setup|slacktest|routertest}

	start		Start the 128T-Slackbot
	stop		Stops the 128T-Slackbot
	restart		Restarts 128T-Slackbot
	status		View status of 128T-Slackbot
	setup		Configure 128T-Slackbot
	slacktest	Test Slack configuration
	routertest	Test 128T Router configuraton

```
## Compatibility
The 128T-Slackbot should run on almost anything the can run NodeJS (Linux, Windows, Mac, Heroku, etc.), however it has been most used and tested on Linux.
The 128T-Slackbot is also compatible with 128T 2.0 "Berkshire". Older versions are most likely not compatible, and every attempt will be made to add support for future 128T versions as they are released. 

## Debug
If you are needing to debug, logs are written to the `./log` directory. `128t-slackbot.log` contains detailed logging of the code execution. If your 128T-Slackbot stops running due to a crash, it will be logged to the `error.log` file.
