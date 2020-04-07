/* Magic Mirror
 * Module: MMM-HabiticaStats
 *
 * By JSC (@delightedCrow) & PJM (@ArrayOfFrost)
 * Copyright © 2019 - MIT Licensed
 *
 */
Module.register("MMM-HabiticaStats", {
	defaults: {
		userID: null, // required
		APIToken: null, // required

		refreshRate: 60 * 60 * 1000, // 1 hour, in milliseconds
		backgroundBlurOn: true,
		zoom: null,
		orientation: "portrait", // "portrait" or "landscape"
		positionCSS: null // put the module where you want
	},

	user: null,
	fetchError: null,
	updateTimer: null,
	minRefreshRate: 30 * 1000, // minimum Refresh rate should be 30s

	getScripts: function() {
		return ["moment.js", this.file("vendor/HabiticaMagic-v2.0.1.min.js")];
	},

	getStyles: function() {
		return [
			this.file("assets/MMM-HabiticaStats.css"),
			'font-awesome.css'
		];
	},

	getTemplate: function() {
		return "MMM-HabiticaStats.njk"
	},

	getTemplateData: function() {
		return {
			user: this.user,
			config: this.config,
			error: this.fetchError
		};
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		if (this.config.refreshRate < this.minRefreshRate) {
			this.config.refreshRate = this.minRefreshRate;
			Log.error("WARNING: refreshRate was configured to be lower than the minimum 30 seconds. MMM-HabiticaStats will use 30 second refresh rate instead.");
		}
		this.fetchUserData();

	},

	fetchUserData: function() {
		// If you're doing a significant fork of MMM-HabiticaStats you might want to change the xclient header here. For more info on the xclient header: https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header
		let xclient = "6c2c57d5-67c3-4edf-9a74-2d6d70aa4c56-MMM-HabiticaStats";
		apiManager = new HabiticaAPIManager(xclient);
		// it looks like we're fetching the content data anew each time, but the
		// browser should have this cached so unless Habitica has updated the
		// content on their end this should end up being a local fetch to cache
		// after the first time
		apiManager.fetchContentData()
		.then(() => {
			return apiManager.fetchUserWithTasks(this.config.userID, this.config.APIToken);
		})
		.then((user) => {
			this.user = user;
			this.updateDom();
			this.scheduleUpdate();
		})
		.catch((fetchError) => {
			var error;
			try {
				error = JSON.parse(fetchError);
			} catch(e) {
				if (fetchError == "") {
					// internet is probably out... might as well try scheduling the next
					// update in case it comes back.
					this.scheduleUpdate();
					fetchError = "Could not connect to the Habitica server.";
				};
				// most of these other errors mean a badly reformatted request and
				// we shouldn't try to schedule new jobs -- user needs to correct the
				// error on their end first
				error = {error: fetchError};
			}
			this.fetchError = error;
			console.error(error);
			this.updateDom();
		});
	},

	scheduleUpdate: function() {
		this.updateTimer = setInterval(() => {
				this.fetchUserData();
			},
			this.config.refreshRate
		);
	},

	suspend: function() {
		Log.info("Suspending MMM-HabiticaStats...");
		clearInterval(this.updateTimer);
	},

	resume: function() {
		Log.info("Resuming MMM-HabiticaStats...");
		this.fetchUserData();
	},
});
