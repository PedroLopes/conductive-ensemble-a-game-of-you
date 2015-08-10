var 
express 		= require('express')
,bodyParser 	= require('body-parser')
,http 			= require('http')
,session 		= require('express-session')
,cookieParser 	= require('cookie-parser')
,faye       	= require('faye')
,port 			= 5001
,app 			= express()
,count 			= 3 //captchas at start
,max_captchas	= 60 //captchas needed to break the whole thing.
,JADE 			= false //jade or html
,DEBUG 			= true
,captcha 		= require('./index')
,captchaOptions = {}


var exec 		= require('child_process').exec;
//ems scripts (python)
var location_exec = "/Users/pedro/Dropbox/1.projects/1.MusclePropelledHaptics/code/mobile_haptics/understandingems/demos/python-interface/simple-scripts/";
location_exec = "cd " + location_exec + ";";
var ems_exec = "python conductive_ems.py /dev/tty.usbserial-HMYID101";

var SERIAL = true;
var ONE_STOP = false;

//talk back to clients via faye
var server = http.createServer(app);
var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  //mount:    '/localhost:5001',
  timeout:  45
});

var show = true;
var client_count = 0;

bayeux.attach(server);

bayeux.on('handshake', function(clientId) {
	client_count++;
    if (DEBUG) console.log('Client connected', clientId);
    if (DEBUG) console.log('Clients' + client_count);
});

bayeux.on('subscribe', function(clientId,channel) {
	//if (DEBUG) console.log('[SUBSCRIBE FROM CLIENT] ' + clientId + ' -> ' + ' -> ');
	if (DEBUG) console.log('[SUBSCRIBE FROM CLIENT] ' + clientId + ' -> ' + channel + ' -> ');
	if (channel == "/end" && show == false)  {
		if (DEBUG) console.log("send all clients the END news");
		bayeux.getClient().publish('/end', {text: "You've killed<br> the show."});	
	}
});


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: true
}))

// parse application/json
app.use(bodyParser.json())

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

//cookie and session
app.use(cookieParser('setting.secret'))

app.use(session({
		secret: 'setting.secret'
}))

//view engine
if (JADE) app.set('view engine', 'jade')
else app.use(express.static(__dirname + '/public'));


app.get('/captcha', function(req, res) {
	captcha(captchaOptions, function(err, data) {
		if(err) {
			res.send(err)
		}
		else {
			req.session.captcha = data.captchaStr
			res.end(data.captchaImg)
		}
	})
})

app.get('/', function(req, res) {
		if (JADE) res.render('index')
			else res.render(__dirname + '/public' + 'index.html')
})

app.post('/', function(req, res) {
	if(req.session && req.session.captcha && req.body.captcha && req.session.captcha.toLowerCase() === req.body.captcha.toLowerCase()) {
		count++;
		if (count >= max_captchas){
			bayeux.getClient().publish('/end', {text: "You've killed<br> the show."});	
			show = false;
			if (SERIAL && !ONE_STOP) if (SERIAL) exec(location_exec + ems_exec + " " + "crowdsource 1", console.log);
			ONE_STOP = true;
		} else bayeux.getClient().publish('/update', {text: count.toString()});	
		
		res.send("great, do more.")
	}
	else res.send("try to hack again.")
})

server.listen(port, function() {
	console.log('Listening happens on port ' + port)
})

//lame messaging below, should be refactored
app.get('/end', function(req, res) {
	max_captchas = 3;
	bayeux.getClient().publish('/end', {text: "You've killed<br> the show."});	
	console.log("ended by curl")
	if (SERIAL && !ONE_STOP) {
		if (SERIAL) exec(location_exec + ems_exec + " " + "crowdsource 1", console.log);
		console.log(location_exec + ems_exec + " " + "crowdsource 1");
		ONE_STOP = true;
	}
	show = false;
	setInterval(function(){
  		bayeux.getClient().publish('/end', {text: "You've killed the show."});	
	}, 300); 
})

app.get('/10', function(req, res) {
	max_captchas = 10;
	console.log("max_captchas=" + max_captchas)
})

app.get('/20', function(req, res) {
	max_captchas = 20;
	console.log("max_captchas=" + max_captchas)
})

app.get('/30', function(req, res) {
	max_captchas = 30;
	console.log("max_captchas=" + max_captchas)
})

app.get('/40', function(req, res) {
	max_captchas = 40;
	console.log("max_captchas=" + max_captchas)
})

app.get('/50', function(req, res) {
	max_captchas = 50;
	console.log("max_captchas=" + max_captchas)
})