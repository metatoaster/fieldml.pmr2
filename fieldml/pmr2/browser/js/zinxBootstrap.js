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
  var updateVersion = plugin.updateVersion;

  // see if nsplugin version is installed.
  if (minorVersion == null) {
    try {
      return zincVersion();
    }
    catch (e) {
      // If the plugin is installed check whether symbols are missing,
      // if we can figure this out for the user we can replace the 
      // innerHTML with a message using this object:
      // var plugin_cont = jq('#zinc')[0];
    }
  }

  // Zinc<0.7.1 does not return updateVersion
  if (updateVersion == null) {
    return majorVersion + "." + minorVersion;
  }

  return majorVersion + "." + minorVersion + "." + updateVersion;
}

function zinc_to_zinx(zinc_version) {
  // This simple mapping will suffice until a future updated version of
  // Zinc-0.7 breaks something.
  return zinc_version.substring(0, 3);
}

function zinx_bootstrap() {
  var zinxPrefix = 'zinx-';
  var jsRoot = jq('#zinc_plugin param[name=js_root]')[0].value;
  var zincVersion = zinc_version();
  var zinxVersion = zinc_to_zinx(zincVersion);

  // The files to import for the corresponding zinx version.
  var zinx_filelist = {
    "0.6": ["zinx.js", "model.js"],
    "0.7": ["zinx.js", "zinxJSONparser.js", "models.js"]
  };

  // The mapping of the zinc plugin to the zinx version.

  console.log("bootstrap: detected zinc: " + zincVersion);

  console.log("bootstrap: using library version: " + zinxVersion);

  var zinxRoot = jsRoot + '/' + zinxPrefix + zinxVersion + '/';

  var index = zinx_filelist[zinxVersion];

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

