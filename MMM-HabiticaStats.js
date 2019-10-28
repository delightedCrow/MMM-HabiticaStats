/* Magic Mirror
 * Module: MMM-HabiticaStats
 *
 * By JSC (@delightedCrow)
 * MIT Licensed.
 */
Module.register("MMM-HabiticaStats", {
	defaults: {
		userID: null,
		APIToken: null,
		refreshRate: 60 * 60 * 1000 // 1 hour, in milliseconds
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
		return {user: this.user};
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
