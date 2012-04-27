/*
  Zinx bootstrap

  Loads the correct Zinx script for the corresponding detected plugin.
*/

function zinx_load(url) {
  jQuery.getScript(url);
}

function zinc_version() {
  var plugin = jq('#zinc_plugin')[0];
  var majorVersion = plugin.majorVersion;
  var minorVersion = plugin.minorVersion;

  // Old Firefox only plugin.
  if (minorVersion == null) {
    return "0.6";
  }

  return majorVersion + "." + minorVersion;
}

function zinx_bootstrap() {
  var zinxLibKey = 'zinx-';
  var jsRoot = jq('#zinc_plugin param[name=js_root]')[0].value;
  var zincVersion = zinc_version();
  var zinxVersion = zincVersion;

  console.log("bootstrap: detected zinc: " + zincVersion);

  if (zinxVersion != "0.6") {
    // Use the 0.7 version of the plugin
    zinxVersion = "0.7";
  }

  console.log("bootstrap: library version: " + zinxVersion);

  var zinxRoot = jsRoot + '/' + zinxLibKey + zinxVersion + '/';

  var js_index = {
    "0.6": ["zinx.js", "model.js"],
    "0.7": ["zinx.js", "zinxJSONparser.js", "models.js"]
  };

  var index = js_index[zinxVersion];

  for (i in index) {
    var u = zinxRoot + index[i];
    zinx_load(u);
    console.log("bootstrap: fetch " + u);
  }
}

/*
  Since the libraries are loaded asynchronously, we have to wait until
  the method is available before it can be called.
  
  This function waits for the id to appear on the global namespace, then
  calls the function f with arguments in the args list.
*/
function waitFor(id, f, args) {
  // default to 6000 tries, 100ms frequency for total of 10 minute to be
  // generous on really really really slow connections.
  var life = 6000;
  var timeout = 100; // ms
  var received = false;

  function poller() {
    if (window[id]) {
      return window[f].apply(window[f], args);
    }
    else {
      life--;
      if (life > 0) {
        setTimeout(poller, timeout);
      }
    }
  }
  setTimeout(poller, 0);
}

function ZincReadyFunction() {
  jsonfile = jq('#zinc_plugin param[name=json]')[0].value;
  // load_simulation(jsonfile);
  waitFor('load_simulation', 'load_simulation', [jsonfile]);
  return;
}

jq(document).ready(function() {
  // As the parameters are within the object, we need to wait until the
  // entire page is loaded before this can be called.
  zinx_bootstrap();
  waitFor('ZinxProject', 'InitialiseZinx', []);
});

