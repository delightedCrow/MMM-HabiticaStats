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
    userData: {},

	getStyles: function() {
		return [
			this.file("assets/MMM-HabiticaStats.css"),
            'font-awesome.css'
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
    // this.getPartyData();
    // this.getUserData();
    this.getAuthenticatedUserData();
	},

  getTemplate: function() {
		return "MMM-HabiticaStats.njk"
	},

	getTemplateData: function() {
    Log.info("Refreshing template: ", this.userProfile);
    return this.userData;
	},

  getAuthenticatedUserData: function() {
      let url = "https://habitica.com/api/v3/user";
      let req = new XMLHttpRequest();
      let mod = this;

      req.addEventListener("load", function() {
          if (this.status == 200) {
              Log.info(this.responseText);
              let data = JSON.parse(this.responseText).data;
              var userData = {};
              userData.hourglasses = data.purchased.plan.consecutive.trinkets;
              userData.gems = data.balance * 4;
              userData.gold = Math.round( data.stats.gp);
              userData.username = data.profile.name;
              userData.classname = data.stats.class;
              userData.level = data.stats.lvl;
              userData.experience = Math.round(data.stats.exp);
              userData.max_experience = Math.round(data.stats.toNextLevel);
              userData.health = Math.round(data.stats.hp);
              userData.max_health = Math.round(data.stats.maxHealth);
              userData.mana = Math.round(data.stats.mp);
              userData.max_mana = Math.round(data.stats.maxMP);
              mod.userData = userData;
              mod.updateDom();
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
  },

  getUserData: function() {
      Log.info("Getting user data");
    let url = "https://habitica.com/api/v3/members/" + this.config.userID;
    let req = new XMLHttpRequest();
    let mod = this;

    req.addEventListener("load", function() {
        if (this.status == 200) {
            let data = JSON.parse(this.responseText);
            mod.userProfile = data.data.profile;
            mod.userStats = data.data.stats;
            mod.updateDom();
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
