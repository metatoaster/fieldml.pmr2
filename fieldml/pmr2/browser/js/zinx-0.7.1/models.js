function InitialiseZinx() {
    
    // Buttons
    jq("#generateModel").click(function() { generateModel(); });
    jq("#changeMaterial").click(function() { changeMaterial(); });
    jq("#viewAll").click(function() { viewAll(); });
    
    // Zinx
    window.zinxProject = new ZinxProject();
    window.zinxProject.path = '';
    window.zinxProject.addScene('zinc_plugin');
    console.info(window.zinxProject.zincPlugin);
    ZincReadyFunction();
}

function onload1(state, Models){
	// function to run at states = preRender and postRender
	window.zinxProject.zincPlugin.sceneViewer.viewAll();
}
