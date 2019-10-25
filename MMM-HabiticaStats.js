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
	questContent: {},
	gearContent: {},

	getScripts: function() {
		return ["moment.js"];
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
		this.getContentData();
		this.getAuthenticatedUserData();
		// this.getPartyData();
	},

	getTemplate: function() {
		return "MMM-HabiticaStats.njk"
	},

	getTemplateData: function() {
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

					userData.quest = data.party.quest;
					userData.stealth = data.stats.buffs.stealth;
					userData.armorBuffs = mod.calculateArmorBuffs(userData.classname, data.items.gear.equipped);
					userData.constitution = data.stats.con + data.stats.buffs.con + userData.armorBuffs.con + Math.floor(userData.level/2);
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

				var bossStrength = null;
				// if user has a quest key they are on a quest
				if (mod.userData.quest.key) {
					let quest = mod.questContent[mod.userData.quest.key];
					// if the quest has a boss it's a boss quest, otherwise it's a collection quest
					if (quest.boss) {
						bossStrength = quest.boss.str;
					}
				}

				mod.userData.tasks = mod.calculateDamage(mod.userData.constitution, mod.userData.stealth, data, bossStrength);
				// Log.info("tasks: ", mod.userData.tasks);

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

	calculateDamage: function(constitution, stealth, taskList, bossStrength) {
		// takes a list of dailies, todos, habits, etc.
		// returns the following data object:
		var data = {};
		data.dailiesDue = 0;
		data.todosDue = 0;
		data.damageToSelf = 0;
		data.damageToParty = 0;
		data.dailiesEvaded = 0; // due to stealth

		var cronTime = moment().endOf('day');
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
							data.damageToSelf += Math.round(damage * 10) / 10; // round damage to nearest tenth because game does

							// if we have a quest and a boss we can calculate the damage to party from this daily
							if (bossStrength !== null) {
								var bossDamage = (task.priority < 1) ? (taskDamage * task.priority) : taskDamage;
								bossDamage *= bossStrength;
								data.damageToParty += bossDamage;
								data.damageToSelf += bossDamage;
							}
						}
					}
					break;
				case "todo":
					// We want all todos with a date that are due today (this should include overdue tasks)
					if (task.date) {
						var taskTime = moment(task.date);
						if (taskTime.isBefore(cronTime)) {
								data.todosDue ++;
						}
					}
				break;
			}
		}
		// formatting display - rounding up to be safe like Lady Alys does :) - see https://github.com/Alys/tools-for-habitrpg/blob/29710e0f99c9d706d6911f49d60bcceff2792768/habitrpg_user_data_display.html#L1952
		data.damageToSelf = Math.ceil(data.damageToSelf * 10) / 10;
		data.damageToParty = Math.ceil(data.damageToParty * 10) / 10;

		return data;
	},

	calculateArmorBuffs: function(userClass, equippedGear) {
		// get a list of the actual item things from Content
		var armorBuffs = {str: 0, con: 0, int: 0, per: 0};
		for (keyName in equippedGear) {

			let armor = this.gearContent[equippedGear[keyName]];
			for (stat in armorBuffs) {
				armorBuffs[stat] += armor[stat];
				// apply class bonus
				if (userClass === armor.klass || userClass === armor.specialClass) {
					armorBuffs[stat] += .5 * armor[stat];
				}
			}
		}
		
		return armorBuffs;
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
	},

	getContentData: function() {
		let url = 'https://habitica.com/api/v3/content';
		let req = new XMLHttpRequest();
		let mod = this;

		req.addEventListener("load", function() {
			if (this.status == 200) {
				let data = JSON.parse(this.responseText);
				mod.questContent = data.data.quests;
				mod.gearContent = data.data.gear.flat;
				Log.info("Content data: ", mod.questContent);
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
