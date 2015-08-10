//server 
var http 		= require('http');
var sys 		= require('sys')
var path 		= require('path');
var fs 			= require('fs');
var second 		= require('fs');
//shell tools
var exec 		= require('child_process').exec;
//for client side publishing
var faye       	= require('faye');
var math 		= require('mathjs');

const DEBUG = true;
const WRITE_TO_FILE = false;
var skip = false;
const SERIAL = true;
const SAY = false;
var movements = {
  0: "loading",
  1: "poke",
  2: "virality",
  3: "DDOS",
  4: "hyperlink",
  5: "firewall",
  6: "firewall",
  7: "crowdsource"
};

//URLs
var final_url = "192.168.1.120"; 

//ems scripts (python)
var location_exec = "simple-scripts/";
location_exec = "cd " + location_exec + ";";
var ems_exec = "python conductive_ems.py /dev/tty.usbserial";
var exec_maxs = 2; //max python scripts at once 
var current_execs = 0; //make sure python scripts dont go all parallel style
var exec_maxs_restore_timer = [2000,2000,4000,1000,1000,4000,4000,4000]; //timers per movemnt
//"loading" / "poke" / "virality" / "DDOS" /"hyperlink" / "firewall" / "firewall" / "crowdsource"

//pais for voting
var pairs_start = ["12", "21", "13", "31", "14", "41", "23", "32", "24", "42", "34", "43"];
var pairs_values_start = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var pairs_stop = ["12", "21", "13", "31", "14", "41", "23", "32", "24", "42", "34", "43"];
var pairs_values_stop = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var current_fav_start = "00";

//MESSAGE PROTOCOL // below are vars for eval (these correspond to message protocol)
var movement_id = 0;
var start = "start";
var others ="12";
var previous_part = "previous_part";
var next_part = "next_part";
var lineReader = require('line-reader');

var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  timeout:  45
});

var minute = 60;
var milliseconds = 1000;
var movement = "movement"

process.argv.forEach(function (val, index, array) {
	if(val === "-v" || val === "--verbose") DEBUG = true;
	else if(val === "-o" || val === "--write") 
	{
		WRITE_TO_FILE = true;	
		lineReader.eachLine('realtime.txt', function(line, last,err) {
		  	if(last){
		  		if (DEBUG) console.log("last line=" + line) 
		  		movement_id = line;
		  		if (movement_id > 0) start = true;
		  	}
		});
	}
});

extensions = {
	".html" : "text/html",
	".css" : "text/css",
	".js" : "application/javascript",
	".png" : "image/png",
	".gif" : "image/gif",
	".jpg" : "image/jpeg"
};

function getFile(filePath,res,mimeType){
	fs.exists(filePath,function(exists){
		if(exists){
			fs.readFile(filePath,function(err,contents){
				if(!err){ //file ok, serve it.
					res.writeHead(200,{
						"Content-type" : mimeType,
						"Content-Length" : contents.length
					});
					res.end(contents);
					if (DEBUG) console.log("done serving file " + filePath);
				} else {
					if (DEBUG) console.dir(err);
				};
			});
		} else { //404
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end("Stop hacking webpages and start hacking muscles.");
		};
	});
};

function requestHandler(req, res) {
	if(req.method == 'POST'){
    req.on('data', function(chunk) {
      	var formdata = chunk.toString();
      	//heard that node.js should not use try catch, still, let me try. 
		try {
		  var message_id = eval(formdata.split("&")[0]); //old version, i dont like it safety wise
		  if (DEBUG) console.log(message_id);
		}
		catch (e) {
		  skip = true;
		  if (DEBUG) console.log("FAILURE");
		  if (DEBUG) console.log(e);
		}
		if (!skip) {
			if (DEBUG) console.log(chunk.toString());
			if (DEBUG) console.log("messageID="+message_id);
			if (message_id == "start") {
				start = true;
				if (DEBUG) console.log("GOooooo");
			} else if (message_id == "next_part") { 
				if (DEBUG) console.log("skipping to next part, was at part "+ movement_id);
				movement_id++;
				bayeux.getClient().publish('/movement_number', {text: movement_id.toString()});	
				if (DEBUG) console.log ("now at part " + movement_id);
				if (WRITE_TO_FILE) {
					var stream = second.createWriteStream("realtime.txt");
					stream.once('open', function(fd,er) {
					  if (er) console.log(er);
					  stream.write("" + movement_id);
					  stream.end();
					});
				}
			} else if (message_id == "previous_part") { 
				if (DEBUG) console.log("skipping to previous_part , was at part "+ movement_id);
				movement_id--;
				if (DEBUG) console.log ("now at part " + movement_id);
			}
			//everything else is done via jaye
      	}
      	skip = false;
    });	
	} else if (req.method == 'GET' && movement_id != 7){
		var fileName = path.basename(req.url) || 'index.html';
		var ext = path.extname(fileName);
		var localFolder = __dirname + '/public/';

		if(!extensions[ext]){ //404
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end("Stop hacking webpages and start hacking muscles.");
		};
		getFile((localFolder + fileName),res,extensions[ext]);
	} else if (req.method == 'GET' && movement_id == 7){
		if (DEBUG) console.log("REDIRECTTTTT 302 / temp");
		res.writeHead(302,
		  {Location: 'http://'+final_url+":5001/"}
		);
		res.end();
	}
}

var server = http.createServer(requestHandler);
server.listen(3000); 
bayeux.attach(server);

var client_count = 0;

bayeux.on('handshake', function(clientId) {
	client_count++;
    if (DEBUG) console.log('Client connected', clientId);
    if (DEBUG) console.log('Clients' + client_count);
});

bayeux.on('disconnect', function(clientId) {
	client_count--;
    if (DEBUG) console.log('Client disconnected', clientId);
    if (DEBUG) console.log('Clients' + client_count);
});


bayeux.on('subscribe', function(clientId,channel) {
	if (DEBUG) console.log('[SUBSCRIBE FROM CLIENT] ' + clientId + ' -> ' + channel + ' -> ');
	if (channel == "/movement_number")  {
		if (DEBUG) console.log("send all clients the news");
		bayeux.getClient().publish('/movement_number', {text: movement_id.toString()});	
	}
});

bayeux.on('publish', function(clientId, channel, data) {
	if (channel != "/EMS") return;
	if (DEBUG) console.log('[GOT FROM CLIENT] ' + clientId + ' -> ' + channel + ' -> ' + data);
	if (movement_id == 4) {
		if (DEBUG) console.log("hyperlink data is:");
		var stop_1 = data.stop_1;
		var stop_2 = data.stop_2;
		var start_1 = data.start_1;
		var start_2 = data.start_2;
		var index_start = pairs_start.indexOf(start_1 + start_2);
		pairs_values_start[index_start]++;
		var index_stop = pairs_stop.indexOf(stop_1 + stop_2);
		pairs_values_stop[index_stop]++;
		var max = 0;
		var max_index = 0;
		for (var i = 0; i < pairs_values_start.length; i++) {
    		if (pairs_values_start[i] > max)
    		{
    			max = pairs_values_start[i];
    			max_index = i;
    		}
		}
		if (DEBUG) console.log("fav start is: " + pairs_start[max_index]);
		if (pairs_start[max_index] != current_fav_start){
			current_fav_start = pairs_start[max_index];
			if (DEBUG) console.log("start: " + pairs_start[max_index].charAt(0));	
			if (DEBUG) console.log("start: " + pairs_start[max_index].charAt(1));	
			var max_stop = 0;
			var max_index_stop = 0;
			for (var i = 0; i < pairs_values_stop.length; i++) {
	    		if (pairs_values_stop[i] > max_stop)
	    		{
	    			max_stop = pairs_values_stop[i];
	    			max_index_stop = i;
	    		}
			}
			if (DEBUG) console.log("fav stop is: " + pairs_stop[max_index_stop]);
			if (DEBUG) console.log("stop: " + pairs_stop[max_index_stop].charAt(0));	
			if (DEBUG) console.log("stop: " +  pairs_stop[max_index_stop].charAt(1));	
			if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + pairs_start[max_index].charAt(0) + " " + pairs_start[max_index].charAt(1) + " " + pairs_stop[max_index_stop].charAt(0) + " " + pairs_stop[max_index_stop].charAt(1) , console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
		}	
		else if (DEBUG) console.log("which hasnt changed");
		
	} 
	else { 
	  	var musician_id = data.musician_id;
		if (movement_id == 1) { //poke
			if (isOneDigit(musician_id)){
				if (DEBUG) console.log("poke received" + musician_id);
				if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + musician_id, console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
			}
		} else if (movement_id == 2) {//virality
			if (isOneDigit(musician_id)){
				if (DEBUG) console.log("virus received" + musician_id);
				if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + musician_id, console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
			} 
		} else if (movement_id == 3) {//DDOS
			if (isOneDigit(musician_id)){
				if (DEBUG) console.log("DDOS received" + musician_id);
				if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + musician_id, console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
			}
		} else if (movement_id == 5 || movement_id == 6) { //firewall
			if (isOneDigit(musician_id)){
				if (DEBUG) console.log("SAY: FIREWALL received" + musician_id);
				if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + musician_id, console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
			}
		} else if (movement_id == 0) { //loading test
			if (DEBUG) console.log("TEST received");
			if (isOneDigit(musician_id)){
				if (DEBUG) console.log("SAY: TEST received" + musician_id);
				if (current_execs <= exec_maxs) {
					if (DEBUG) console.log("doing one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					if (SERIAL) exec(location_exec + ems_exec + " " + movements[movement_id] + " " + musician_id, console.log);
					current_execs++;
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				} else  {
					if (DEBUG) console.log("skip one" + current_execs + "/" + exec_maxs_restore_timer[movement_id]);
					setTimeout(function() {current_execs = 0;}, exec_maxs_restore_timer[movement_id]);
				}
			}
		}
   	}
});

if (DEBUG) console.log("Started CONDUCTIVE server. Verbose is On.");

function isOneDigit(input) {
     return /^(0|[1-9])$/.test(input);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 11; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function puts(error, stdout, stderr) { sys.puts(stdout) }
