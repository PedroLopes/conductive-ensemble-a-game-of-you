var musicians = { 
    rui : 1,
    pedro : 2,
    stefan : 3,
    emilio : 4
};

var musicians_name = { 
    rui : "rui nogueiro",
    pedro : "pedro lopes",
    stefan : "stefan brunner",
    emilio : "emilio gordoa"
};

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


var action_texts = { 
  0: "test",
  1: "poke",
  2: "infect",
  3: "ping",
  4: "link",
  5: "break it",
  6: "break it",
  7: "captcha"
};

var subtexts = { 
  0: "select a musician and test your connection to it.",
  1: "facebook's new feature: poke a musician!",
  2: "select musician and infect it with a virus.",
  3: "denial of service: ping, ping, ping, stop them!",
  4: "vote for the most popular musicians: duet time!",
  5: "what? break through the musicians firewall!",
  6: "humm, a glitch..NO! they want play freely?",
  7: "captcha"
};

//var final_url = "192.168.1.4"; //home
var final_url = "192.168.1.120"; //HCI-Haptics

//firewall
var max_firewall= 20;
var firewalls = [max_firewall,max_firewall,max_firewall,max_firewall,max_firewall]; //note that musicians id start on 1

//test
var test_complete = false;

//hyperlink
var mode_start = "mode_start";
var mode_select = "mode_select";
var link_end;
var link_start;
var mode = mode_start;
var active = true;
var POST = false;

//virus
var virus_ongoing = false;

function replaceElementText(id, text)
{
  if (document.getElementById)
  {
    var e=document.getElementById(id);
    if (e)
    {
      if (e.childNodes[0])
      {
        e.childNodes[0].nodeValue=text;
      }
      else if (e.value)
      {
        e.value=text;
      }
      else 
      {
        e.innerHTML=text;
      }
    }
  }
}

function replaceClassname(id, text)
{
  if (document.getElementById)
  {
    var e=document.getElementById(id);
    if (e)
    {
      if (e.childNodes[0])
      {
        e.childNodes[0].className=text;
      }
    }
  }
}

function sendMessageServer(id,d){
  if (movement_number == 4) { //hyperlink
    client.publish('/EMS', {
      start_1: d.charAt(3),
      start_2: d.charAt(2),
      stop_1: d.charAt(1),
      stop_2: d.charAt(0)
  });
  } else {
    client.publish('/EMS', {
      musician_id: id
    });
  }
}

  
  


function execute(who,what) {
  //alert(what);
  if (what == "loading" && !test_complete){ 
    //alert("my first test" + musicians[who]);
    sendMessageServer(musicians[who]);
    //alert(what + musicians[who]);
    for (var m in musicians){
      replaceElementText(m, "test completed"); // loop through musicians and disable test.
    }
    test_complete = true;
  }  
  else if (what == "hyperlink"){ 
    if (mode==mode_select && who != link_start){ //CANNOT LINK TO ONESELF
            link_end = who;
            for (var m in musicians){
                if (musicians.hasOwnProperty(m)) {
                    //alert(link_end);
                    //alert(m);
                    if (eval(m) != eval(link_end) || eval(m) != eval(link_start)) {
                        replaceElementText(m, "stoped");
                        //alert("changed");
                        document.getElementById(m).style.color = "gray";
                    }
                    replaceElementText(link_start, "linked");
                    document.getElementById(link_start).style.color = "blue"
                    replaceElementText(link_end, "linked");
                    document.getElementById(link_end).style.color = "blue"
                    mode=mode_start;
                }
            }
            var others = "";
            for (var m in musicians)
            {
              if (m != link_start && m != link_end)
              others = others + musicians[m];
            }
            others = others + musicians[link_start] + musicians[link_end];
            sendMessageServer(musicians[who],others);
        } else if (mode=mode_start) {
            replaceElementText(who, "link to");
            link_start = who;
            for (var m in musicians){
                if (musicians.hasOwnProperty(m)) {
                    if (eval(m) != eval(who)) replaceElementText(m, "here!");
                    mode=mode_select;
                }
            }
        }
      } else if (what == "poke" && active) { 
          //alert("enter poke");
          sendMessageServer(musicians[who]);
          active = false;
          re_label_all("charging battery...[wait 5s]")
          setTimeout(function() {re_label_all("poke"); active=true;}, 5000);
      } else if (what == "DDOS") { 
          //alert("enter ping");
          sendMessageServer(musicians[who]);
          //alert(what + musicians[who]);
      } else if (what == "virality" && !virus_ongoing) {
          var e=document.getElementById(who);
          re_label_all("infection in progress...")
          e.innerHTML="<div class=\"shake shake-constant\">infected!</div>";
          setTimeout(function() {re_label_all("re-growing virus...[wait 10s]");}, 4000);
          setTimeout(function() {clear_virus_all();}, 10000);
          if (!virus_ongoing) sendMessageServer(musicians[who]);
          virus_ongoing = true;
      } else if (what == "firewall") {
          /*for (m in musicians) {
            document.getElementById(m).style.color = "black";
          }*/
          if (firewalls[musicians[who]] == 1) {
            replaceElementText(who, "zap it!");
            firewalls[musicians[who]]--;
            //alert(what + musicians[who]);
          } else if (firewalls[musicians[who]] <= 0) {
            sendMessageServer(musicians[who]);
            firewalls[musicians[who]]=max_firewall;
            replaceElementText(who, "break it [" + (max_firewall-firewalls[musicians[who]]) + "/" + max_firewall + "]");
          }
          else  {
            firewalls[musicians[who]]--;
            replaceElementText(who, "break it [" + (max_firewall-firewalls[musicians[who]]) + "/" + max_firewall + "]");
          }
      }  
}

function clear_virus(who) {
  //alert("clean virus" + who);
  var e=document.getElementById(who);
  e.innerHTML=action_texts[2]; //virality = 2
  virus_ongoing = false;
}

function clear_virus_all() { 
  for (m in musicians) {
      var e=document.getElementById(m);
      e.innerHTML=action_texts[2]; //virality = 2
  }
  virus_ongoing = false;
}

function clear_virus_forward() { 
  for (m in musicians) {
      var e=document.getElementById(m);
      e.innerHTML=action_texts[3]; //this is a hack because of pending messages from previous movement
  }
}

function re_label(e,text) {
  e.innerHTML=text; 
}

function re_label_all(text) {
  //alert("called"+ active);
  //active=true;
  for (m in musicians) {
    var e=document.getElementById(m);
    e.innerHTML=text; 
  }
}

/*function post(path, params, method) { //this is probably not been used. 
    alert("post. do not call me");
    if (!active) return; //this returns if the active == false
    else {
      method = method || "post"; 
      var form = document.createElement("form");
      form.setAttribute("method", method);
      form.setAttribute("action", path);

      for(var key in params) {
          if(params.hasOwnProperty(key)) {
              var hiddenField = document.createElement("input");
              hiddenField.setAttribute("type", "hidden");
              hiddenField.setAttribute("name", key);
              hiddenField.setAttribute("value", params[key]);
              form.appendChild(hiddenField);
           }
      }
      document.body.appendChild(form);
      if (movement_number == 1 || movement_number == 2) //only for some movements...
      {
        active = false; //for some seconds cannot send more data
        if (movement_number == 1) { 
          timer = 4000;
          text_wait = "charging current...[wait 4s]";
        } else if (movement_number == 2) { 
          timer = 10000;
          text_wait = "re-growing virus...[wait 10s]";
        }  
        for (var m in musicians){
          replaceElementText(m,text_wait)
        }
        //setTimeout(function() {re_activate();}, timer);//also the active will be reset by a timer callback. 
      }
    }
}*/