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
		userTasks: {},
		HABITICA_MAGIC: {
			"taskCapMin": -47.27,
			"taskCapMax": 21.27
		},

	getStyles: function() {
		return [
			this.file("assets/MMM-HabiticaStats.css"),
            'font-awesome.css'
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
    // get content data first
		// https://habitica.com/api/v3/content
    this.getAuthenticatedUserData();
		this.getPartyData();
		// this.getAuthenticatedUserTasks();
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
              let data = JSON.parse(this.responseText).data;
							Log.info("AuthenticatedUserData: ", data);
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

							userData.constitution = data.stats.con + data.stats.buffs.con;
							userData.quest = data.party.quest;
							userData.stealth = data.stats.buffs.stealth;
              mod.userData = userData;
              mod.updateDom();
							mod.getAuthenticatedUserTasks();
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

	getAuthenticatedUserTasks: function() {
		let url = "https://habitica.com/api/v3/tasks/user";
		let req = new XMLHttpRequest();
		let mod = this;

		req.addEventListener("load", function() {
				if (this.status == 200) {
						let data = JSON.parse(this.responseText).data;
						Log.info("AuthenticatedUserTasks: ", data);
						mod.userTasks = mod.calculateDamage(mod.userData.constitution, mod.userData.stealth, data, mod.userData.quest);
						Log.info("tasks: ", mod.userTasks);

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

	calculateDamage: function(constitution, stealth, taskList, quest) {
		// takes a list of dailies, todos, habits, etc.
		// returns the following data object:
		var data = {};
		data.dailiesDue = 0;
		data.todosDue = 0;
		data.damageToSelf = 0;
		data.damageToParty = 0;
		data.dailiesEvaded = 0; // due to stealth

		var stealthRemaining = stealth;
		// calculate bonus from user's constitution
		var conBonus = 1 - (constitution / 250);
		conBonus = (conBonus < 0.1 ) ? 0.1 : conBonus;

		for (var i=0; i<taskList.length; i++) {
			let task = taskList[i];
			// damage is calculated differently for each type of task
			switch (task.type) {
				case "daily":
					if (task.isDue && !task.completed) {
						Log.info("Daily: ", task.text);
						// thieves can cast stealth to avoid a certain number of dailies
						if (stealthRemaining > 0) { // avoided!
							stealthRemaining --;
							data.dailiesEvaded ++;
						} else { // calculate damage!

							data.dailiesDue ++;
							const valueMin = -47.27; // task values are capped ...
				      const valueMax =  21.27; // ... for some purposes
							var taskDamage = (task.value < valueMin) ? valueMin : task.value;
							taskDamage = (taskDamage > valueMax) ? valueMax : taskDamage;
							taskDamage = Math.abs(Math.pow(0.9747, taskDamage));

							// if a subtask is completed, decrease the task damage proportionately
							if (task.checklist.length > 0 ) {
								var subtaskDamage = (taskDamage/task.checklist.length);
								for (var j=0; j<task.checklist.length; j++) {
									if (task.checklist[j].completed) {
										taskDamage = taskDamage - subtaskDamage;
									}
								}
							}

							var damage = taskDamage * conBonus * task.priority * 2;
							data.damageToSelf += Math.round(damage * 10) / 10; // round damage to nearest tenth

							// if we have a quest and a boss we can calculate the damage to party from this daily
							if (quest.content && quest.content.boss) {
								var bossDamage = (task.priority < 1) ? (taskDamage * task.priority) : taskDamage;
								bossDamage *= quest.content.boss.str;
								data.damageToParty += bossDamage;
								data.damageToSelf += bossDamage;
							}
						}
					}
				break;
				case "todo":
				// count number of todo's due
				// figure out what makes a task due
				break;
			}
		}

		return data;
	},

  getPartyData: function() {
    let url = 'https://habitica.com/api/v3/groups/party';
    let req = new XMLHttpRequest();
    let mod = this;

    req.addEventListener("load", function() {
      if (this.status == 200) {
				let data = JSON.parse(this.responseText);
        Log.info("Party Data: ", data);
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
