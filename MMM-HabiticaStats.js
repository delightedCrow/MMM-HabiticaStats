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

	getStyles: function() {
		return [
			this.file("assets/MMM-HabiticaStats.css"),
			"font-awesome5.css"
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
    this.getPartyData();
	},

  getTemplate: function() {
		return "MMM-HabiticaStats.njk"
	},

	getTemplateData: function() {
    return {"health_max":50, "health_current":40, "mana_current":10, "mana_max": 25, "exp_current":800, "exp_max":867};
	},

  getPartyData: function() {
    let url = 'https://habitica.com/api/v3/groups/party';
    let req = new XMLHttpRequest();
    let mod = this;

    req.addEventListener("load", function() {
      Log.info(JSON.parse(this.responseText));
      if (this.status == 200) {
        Log.info("DID IT!");
      }
    });

    req.addEventListener("error", function() {
      // most likely an internet connection issue
      Log.error("Could not connect to the Habitica server.");
    });

    req.open("GET", url);
    req.setRequestHeader('x-api-user', this.config.userID);
    req.setRequestHeader('x-api-key', this.config.APIToken);
    req.send();
  }
});
