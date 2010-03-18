// Performs initilisation of the Zinx (and Zinc) environment and plugin. 
window.onload=function(){
    window.zincSurfaceMaterial = 'bone';
    window.zincLineMaterial = 'silver';

    window.zinxProject = new ZinxProject();
    window.zinxProject.SceneObjectId = 'zinc_plugin';
    window.zinxProject.InitialiseZinc();
    window.zinxProject.extraModelsLoaded = false;
}

// Performs post-initialisation actions. Called implicitly after InitialiseZinc().
function ZincReadyFunction(){
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    if (typeof onZincReady == 'function'){
        onZincReady();
    }
    return;
}

// Performs post-model rendering actions. Called implicitly after loadModels().
function ZincSceneReadyFunction(){
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    window.zinxProject.currentViewIndex = window.zinxProject.defaultView;
    // Set the background to black.
    window.sceneViewer.setBackgroundColourRGB(0.0, 0.0, 0.0);
    return;
}

// Loads and renders a CMGUI model.
//    ARG: fileList - a list of URLs to CMGUI model files. Generally these are .exnode and exelem files.
function showModel(filesList){    
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	if (filesList != null){
        var model = window.zinxProject.addModel();             
        //model.label = "Patient";
            
        for(var i=0; i<filesList.length; i++){
            model.addFile(filesList[i]);
        }
                
        var surfaceGraphic = model.addGraphic("Surfaces");
        surfaceGraphic.material.clone(window.zincSurfaceMaterial);
        
        var linesGraphic = model.addGraphic("Lines");
        linesGraphic.material.clone(window.zincLineMaterial);

        
        window.zinxProject.loadModels();
	}
	
}

// Removes all models from the scene by hiding them. (This is an alternative to unloading/destroying the models.)
function hideModels(){
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	
	var allModels = window.zinxProject.Models;
	for (var i=0; i< allModels.length; i++){
	    if (allModels[i] != null){
	        allModels[i].hide();
	    }
	}
}

// Removes all models from the scene and replaces them with a new model.
//    ARG: fileList - a list of URLs to CMGUI model files. Generally these are .exnode and exelem files.
function replaceModel(fileList){
    hideModels();
    showModel(fileList);
}
