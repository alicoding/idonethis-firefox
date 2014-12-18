var BASE_URL = 'https://idonethis.com/';
var API_VERSION = 'v0.1'
var API_URL = BASE_URL + 'api/' + API_VERSION + '/';
var prefs = require("sdk/simple-prefs").prefs;
var url, team;
var Request = require("sdk/request").Request;
var ss = require("sdk/simple-storage");


function requestTeam() {
	Request({
		url: API_URL + 'teams/?format=json',
		content: JSON.stringify({
			team: ss.storage.teamPref,
			raw_text: 'task'
		}),
		contentType: 'application/json',
		headers: {
			Authorization: 'TOKEN ' + ss.storage.apiToken
		},
		onComplete: function(response) {
			var doneOBJ;

			try {
				console.log('here in first request.get()', response.status);
				doneOBJ = JSON.parse(response.text);
				for (var i = doneOBJ.results.length - 1; i >= 0; i--) {
					if (ss.storage.teamPref === doneOBJ.results[i].name) {
						url = doneOBJ.results[i].dones;
						team = doneOBJ.results[i].short_name;
					}
				};
			} catch (e) {
				console.error(e);
			}

		}
	}).get();
}

function onAPIChange() {
	ss.storage.apiToken = prefs.apiToken;
	requestTeam();
}

function onTeamChange(name, value) {
	ss.storage.teamPref = prefs.teamPref;
	requestTeam();
}

// Show the panel when the user clicks the button.
function handleClick(state) {

	text_entry.show();
}

function isToken() {
  if (!ss.storage.apiToken) {
  	console.error('Missing API Token');
  	button.icon = "./bwburger.png";
  	text_entry.port.emit('missingToken');
  } else {
  	requestTeam();
  }
}

function sendDone(text) {
	Request({
		url: url + '&format=json',
		content: JSON.stringify({
			team: team,
			raw_text: text
		}),
		anonymous: true,
		headers: {
			Authorization: 'TOKEN ' + ss.storage.apiToken
		},
		contentType: 'application/json',
		onComplete: function(response) {
			console.log();
			console.log('here in the request.post()', response.status);
		}
	}).post();
}

exports.main = function() {

	require("sdk/simple-prefs").on("apiToken", onAPIChange);
	require("sdk/simple-prefs").on("", onTeamChange);

	ss.storage.apiToken = prefs.apiToken;
	ss.storage.teamPref = prefs.teamPref;
	var data = require("sdk/self").data;

  // Create a button
  var button = require("sdk/ui/button/action").ActionButton({
  	id: "show-panel",
  	label: "Show Panel",
  	icon: {
  		"32": "./burger.png",
  	},
  	onClick: handleClick
  });

  // Construct a panel, loading its content from the "text-entry.html"
  // file in the "data" directory, and loading the "get-text.js" script
  // into it.
  var text_entry = require("sdk/panel").Panel({
  	position: button,
  	contentURL: data.url("text-entry.html"),
  	contentScriptFile: data.url("get-text.js")
  });

  // When the panel is displayed it generated an event called
  // "show": we will listen for that event and when it happens,
  // send our own "show" event to the panel's script, so the
  // script can prepare the panel for display.
  text_entry.on("show", function() {
  	text_entry.port.emit("show", ss.storage.teamPref);
  });

  // Listen for messages called "text-entered" coming from
  // the content script. The message payload is the text the user
  // entered.
  // In this implementation we'll just log the text to the console.
  text_entry.port.on("text-entered", function(text) {
  	sendDone(text);
  	text_entry.hide();
  });

};