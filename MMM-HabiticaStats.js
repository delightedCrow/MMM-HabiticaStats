/* Magic Mirror
 * Module: MMM-HabiticaStats
 *
 * By JSC (@delightedCrow)
 * MIT Licensed.
 */
Module.register("MMM-HabiticaStats", {
	defaults: {
		userID: null,
		APIToken: null
	},

	apiManager: null,
	user: null,

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
			this.apiManager.fetchUserWithTasks(this.config.userID, this.config.APIToken, (user) => {
					this.user = user;
					this.updateDom();
			});
		});
	}
});
