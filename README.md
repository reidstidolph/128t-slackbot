# 128T Slackbot #
*A 128 Technology Community project*

The 128T Slackbot turns your 128T powered network into a self-aware, sentient being, capable of reporting how it is performing via Slack! (except for the sentient, self-aware part)

## Prerequisites
The basic components needed for a working 128T-Slackbot are:

* A host to run the 128T-Slackbot, with NodeJS installed (can be run on a 128T Router itself, or a separate host) 
* A 128T Router with enabled REST API
* A Slack team with an Incoming WebHooks custom integration enabled
* Connectivity from 128T-Slackbot host to the 128T Router, and from the 128T-Slackbot host to hooks.slack.com

### Slack Setup ###
To enable your 128T-Slackbot to integrate with Slack, and Incoming WebHook is needed on your Slack team. If you do not already have an Incoming WebHook established, browse to your Slack "Custom Integrations" page, and then to "Incoming WebHooks"

After you have an Incoming WebHook enabled, these are the key integration settings:

* **Post to Channel**: Don't worry about this one, the 128T-Slackbot will override this with channels of your choosing.
* **Webhook URL**: You will need to copy this URL, into the configuration of the 128T-Slackbot
* **Customize Name**: Don't worry about this one, the 128T-Slackbot will override this with a bot name of your choosing.
* **Customize Icon**: You can customize this, or use this for an icon: [link](http://i.imgur.com/l30dDHf.png)

## Installation
To install the 128T-Slackbot on your host system, us the following steps:

* Choose a directory on your host system, and git clone from the 128T-Slackbot repository (alternatively you can download from the Bitbucket repository page):
```
[user@host]$ git clone <128T Slackbot https|ssh URL>
```
* Move into the newly created `128t-slackbot` directory. Make the `128t-slackbot` file executable (if it is not already):
```
[user@host]$ cd 128t-slackbot
[user@host]$ chmod +x ./128t-slackbot
```
## Configuration
todo

## Operation
todo

```
#!plaintext
[user@host]$ ./128t-slackbot 

Welcome to 128T-Slackbot!

Usage: ./128t-slackbot {start|stop|restart|status}

	start		Start the 128T-Slackbot
	stop		Stops the 128T-Slackbot
	restart		Restarts 128T-Slackbot
	status		View status of 128T-Slackbot


```


## Contributors
todo

## License
todo