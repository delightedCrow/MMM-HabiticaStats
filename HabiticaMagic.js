class HabiticaUserTasksManager {
	constructor(data) {
		this.apiData = data;
	}

	get taskList() {
		return this.apiData;
	}

	get todosDueToday() {
		return this.todosDueOnDate(moment().endOf('day'));
	}

	todosDueOnDate(dueDate) {
		var todos = [];

		for (var i=0; i<this.taskList.length; i++) {
			let task = this.taskList[i];
			if (task.type != "todo") { continue; }

			if (task.date) {
				var taskTime = moment(task.date);
				if (taskTime.isBefore(dueDate)) {
						todos.push(task);
				}
			}
		}

		return todos;
	}

	calculateDailyStatsFor(user) {

		var stats = {
			dueCount: 0,
			totalDamageToSelf: 0,
			dailyDamageToSelf: 0,
			bossDamage: 0,
			dailiesEvaded: 0
		}
		const min = -47.27; // task value cap min
		const max = 21.27; // task value cap max
		var stealthRemaining = user.stealth;
		let conBonus = user.constitutionBonus;

		for (var i=0; i<this.taskList.length; i++) {
			let task = this.taskList[i];
			// skip the rest of this for loop if the task isn't a daily, isn't due, or is completed
			if (task.type != "daily") { continue; }
			if (!task.isDue || task.completed) { continue; }

			// thieves can cast stealth to avoid a certain number of dailies
			if (stealthRemaining > 0) { // avoided!
				stealthRemaining --;
				stats.dailiesEvaded ++;
			} else { // calculate damage!

				stats.dueCount ++;

				var taskDamage = (task.value < min) ? min : task.value;
				taskDamage = (taskDamage > max) ? max : taskDamage;
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
				stats.dailyDamageToSelf += Math.round(damage * 10) / 10; // round damage to nearest tenth because game does

				// if we have a quest and a boss we can calculate the damage to party from this daily
				if (user.quest.data !== null && user.quest.data.boss) {
					var bossDamage = (task.priority < 1) ? (taskDamage * task.priority) : taskDamage;
					bossDamage *= user.quest.data.boss.str;
					stats.bossDamage += bossDamage;
				}
			}
		}
		// formatting display - rounding up to be safe like Lady Alys does :) - see https://github.com/Alys/tools-for-habitrpg/blob/29710e0f99c9d706d6911f49d60bcceff2792768/habitrpg_user_data_display.html#L1952
		stats.totalDamageToSelf = stats.dailyDamageToSelf + stats.bossDamage;
		stats.totalDamageToSelf = Math.ceil(stats.totalDamageToSelf * 10) / 10;
		stats.bossDamage = Math.ceil(stats.bossDamage * 10) / 10;

		this.dailyStats = stats;
	}
}

class HabiticaUser {
	constructor(data) {
		this.apiData = data;
		this.stats = this._calculateStats();
	}

	get gems() {
		return this.apiData.balance * 4;
	}
	get hourglasses() {
		return this.apiData.purchased.plan.consecutive.trinkets;
	}
	get gold() {
		return Math.round(this.apiData.stats.gp);
	}
	get level() {
		return this.apiData.stats.lvl;
	}
	get displayName() {
		return this.apiData.profile.name;
	}
	get className() {
		return this.apiData.stats.class;
	}
	get experience() {
		return Math.floor(this.apiData.stats.exp);
	}
	get experienceToLevel() {
		return Math.round(this.apiData.stats.toNextLevel);
	}
	get mana() {
		return Math.floor(this.apiData.stats.mp);
	}
	get manaMax() {
		return Math.round(this.apiData.stats.maxMP);
	}
	get health() {
		return Math.floor(this.apiData.stats.hp);
	}
	get healthMax() {
		return Math.round(this.apiData.stats.maxHealth);
	}
	get stealth() {
		return this.apiData.stats.buffs.stealth;
	}
	get armor() {
		return this.apiData.items.gear.equipped;
	}

	_calculateStats() {
		var stats = {
			totals: {str: 0, con: 0, int: 0, per: 0},
			armor: {str: 0, con: 0, int: 0, per: 0},
			buffs: {
				str: this.apiData.stats.buffs.str,
				con: this.apiData.stats.buffs.con,
				int: this.apiData.stats.buffs.int,
				per: this.apiData.stats.buffs.per
			},
			points: {
				str: this.apiData.stats.str,
				con: this.apiData.stats.con,
				int: this.apiData.stats.int,
				per: this.apiData.stats.per
			}
		}

		// calculate armor stats from each piece of armor
		for (var key in this.armor) {
			let item = this.armor[key];
			for (var stat in stats.armor) {
				stats.armor[stat] += item[stat];
				// apply class bonus if user is wearing special class gear
				if (this.className === item.klass ||
						this.className === item.specialClass) {
					stats.armor[stat] += .5 * item[stat];
				}
			}
		}

		// add up all stats for total, including level bonus
		let levelBonus = Math.floor(this.level / 2);
		for (var stat in stats.totals) {
			stats.totals[stat] = stats.armor[stat] +
				stats.buffs[stat] +
				stats.points[stat] +
				levelBonus;
		}

		return stats;
	}

	// this user's constitution bonus against daily damage
	get constitutionBonus() {
		let bonus = 1 - (this.stats.totals.con / 250);
		return (bonus < 0.1) ? 0.1 : bonus;
	}

	get quest() {
		return (this.apiData.party.quest);
	}

	set tasks(userTaskManager) {
		this._taskManager = userTaskManager;
		this.tasks.calculateDailyStatsFor(this);
	}

	get tasks() {
		return this._taskManager;
	}
}

class HabiticaAPIManager {
	constructor(language="en") {
		this.language = language;
		this.content = {};
	}

	fetchContentData(callback) {
		const url = 'https://habitica.com/api/v3/content';
		let req = this.constructor.APIRequest(url);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				let data = JSON.parse(this.responseText);
				hm.content = data.data;
				if (callback) {
					callback();
				}
			}
		};
		req.send();
	}

	fetchAuthenticatedUser(userID, userAPIToken, callback) {
		const url = 'https://habitica.com/api/v3/user';
		let req = this.constructor.authenticatedAPIRequest(url, userID, userAPIToken);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				var data = JSON.parse(this.responseText).data;
				let user = new HabiticaUser(hm.replaceKeysWithContent(data));
				callback(user);
			}
		};
		req.send();
	}

	fetchUserTasks(userID, userAPIToken, callback) {
		const url = "https://habitica.com/api/v3/tasks/user";
		let req = this.constructor.authenticatedAPIRequest(url, userID, userAPIToken);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				var data = JSON.parse(this.responseText).data;
				var tasks = new HabiticaUserTasksManager(data);
				callback(tasks);
			}
		};
		req.send();
	}

	fetchUserWithTasks(userID, userAPIToken, callback) {
		this.fetchAuthenticatedUser(userID, userAPIToken, (user) => {
			this.fetchUserTasks(userID, userAPIToken, (tasks) => {
				user.tasks = tasks;
				callback(user);
			});
		});
	}

	replaceKeysWithContent(data) {
		// replace equipped gear with full content version
		for (var key in data.items.gear.equipped) {
			let armorName = data.items.gear.equipped[key];
			let armor = this.content.gear.flat[armorName];
			data.items.gear.equipped[key] = armor;
		}
		// replace party quest key with actual quest
		if (data.party.quest.key) {
			data.party.quest.data = this.content.quests[data.party.quest.key];
		}
		return data;
	}

	// API REQUEST FUNCTIONS
	static authenticatedAPIRequest(url, userID, userAPIToken) {
		let req = new XMLHttpRequest();
		req.open("GET", url);

		req.onerror = function() {
			console.error("HabiticaAPI Error: ", this.statusText);
		};

		req.setRequestHeader('x-api-user', userID);
		req.setRequestHeader('x-api-key', userAPIToken);
		return req;
	}

	static APIRequest(url) {
		let req = new XMLHttpRequest();
		req.open("GET", url);

		req.onerror = function() {
			console.error("HabiticaAPI Error: ", this.statusText);
		};

		return req;
	}
}
