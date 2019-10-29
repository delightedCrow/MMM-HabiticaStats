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

	apiManager: null,
	user: null,
	updateTimer: null,

	getScripts: function() {
		return ["moment.js", "HabiticaMagic.js"];
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
			config: this.config
		};
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.apiManager = new HabiticaAPIManager("en");
		this.apiManager.fetchContentData(() => {
			this.fetchUserData();
		});
	},

	fetchUserData: function() {
		this.apiManager.fetchUserWithTasks(this.config.userID, this.config.APIToken, (user) => {
				this.user = user;
				Log.info("Fetched User: ", this.user);
				this.updateDom();
				this.updateTimer = setInterval(() => {
					this.fetchUserData();
				}, this.config.refreshRate);
		});
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
