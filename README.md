# MMM-HabiticaStats: A MagicMirror² Module
`MMM-HabiticaStats` is a module for [MagicMirror²](https://github.com/MichMich/MagicMirror) that displays player statistics for [Habitica](https://habitica.com).

 **REQUIRED API KEYS:**

 You're gonna need a (free) Habitica account to get an API token (see the [Habitica wiki](https://habitica.fandom.com/wiki/API_Options#API_Token) for details on how to find your API Token in your Habitica account).

## Using the module

To use this module:
1.  Copy the `MMM-HabiticaStats` folder to your `MagicMirror/modules` directory
2.  Add the module to the modules array in the `config/config.js` file like in the following example:

````javascript
modules: [
	{
		module: "MMM-HabiticaStats",
		position: "middle_center", // put it wherever you want
		config: {
			userID: "YOUR-HABITICA-USER-ID-HERE",
			APIToken: "YOUR-HABITICA-API-TOKEN-HERE"
		}
	}
]
````

## Fixing The Background Blur

If you're running MagicMirror using Electron (i.e, not in `serveronly` mode) and the background blur isn't showing up for you, try enabling Electron's `experimentalFeatures` option by adding the following block to your `config` options in your MagicMirror `config.js` file.

````javascript
electronOptions: {
	webPreferences: {
		experimentalFeatures: true,
		nodeIntegration: false
	}
},
````

## Contributing & Development

This module uses SASS, so to make style changes please edit the `MMM-HabiticaStats.scss` file and use node-sass to compile the css file:

- Run the command `npm install` to install node-sass.
- Run `npm run watch` and node-sass will autocompile the CSS file any time changes are made to the `MMM-HabiticaStats.scss` file.
- Run `npm run build` to build the CSS file.
