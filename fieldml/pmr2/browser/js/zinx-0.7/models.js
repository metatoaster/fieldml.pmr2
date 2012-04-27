$(document).ready(function() {
    
    // Buttons
    $("#generateModel").click(function() { generateModel(); });
    $("#changeMaterial").click(function() { changeMaterial(); });
    $("#viewAll").click(function() { viewAll(); });
    
    
    // Zinx
    console.debug('Loaded');
    window.zinxProject = new ZinxProject();
    console.debug('Loaded');
    window.zinxProject.path = './';
    console.debug('Loaded');
    window.zinxProject.addScene('zinc_scene_1');
    console.debug('Loaded');   
});

function onload1(state, Models){
	// function to run at states = preRender and postRender
	window.zinxProject.zincPlugin.sceneViewer.viewAll();
}

// ==========================================================================================================
// ==========================================================================================================
// ==========================================================================================================

function ZincReadyFunction(){ // when zinc is loaded/initialised, this function is run.
    jsonfile = $('#zinc_plugin param[name=json]')[0].value;
    //netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    load_simulation(jsonfile);
    return;
}
