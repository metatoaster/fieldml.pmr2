/* 
  Since zinx does not verify existence of debug features of a browser,
  we need to do this.
*/


var fake_console = {
    log: function() { },
    info: function() { },
    debug: function() { },
    warn: function() { },
    error: function(msg) { }
};

if (typeof(console) == "undefined") {
    console = fake_console
}
else {
    for (i in fake_console) {
        if (!(i in console)) {
          console[i] = fake_console[i];
        }
    }
}
