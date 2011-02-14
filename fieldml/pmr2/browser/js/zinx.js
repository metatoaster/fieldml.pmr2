/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/****** ZINX DOWNLOAD MANAGER OBJECT                                                     ******/
/**********************************************************************************************/
/**********************************************************************************************/

/**
    Creates a new Download Manager. The download manager makes it super easy to download, load and render models. The loading and rendering of the model is dependent on the model, i.e., it might involve defining the computed fields and loading the graphics, materials and spectrums. There are three steps to using the download manager:
    @example
    var dm = new ZinxDownloadManager(); // 1. Create the download manager
    dm.add(model1);                     // 2. Add models to the download manager
    dm.add(model2);
    dm.load();                          // 3. Load the models
    @class Represents a download manager.
*/
function ZinxDownloadManager() {

    /** An array to store the objects to be loaded. */
    this._objects = new Array();

    /**
        Adds models to the download manager.
        @param {zinxModel} object A model to be loaded by the download manager.
    */
    this.add = function(object) {
        this._objects.push(object);
    }

    /** Loads the objects that have been added to the download manager. */
    this.load = function() {
        for(i in this._objects){
            var object = this._objects[i];
            object.load(this._dm);
        }
    }

    /** Renders the models once they are downloaded. */
    this._read = function(objects) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
        for(i in objects){
            var object = objects[i];
            console.debug("Rendering model "+object.id+" through download manager");
            object.render();
        }
        
        var project = object.project;
        if(object.class == 'ZinxModel'){
            project.LoadZincScene(project); // Load the 3D scene once the objects are loaded.
        
            if(!isDefined(project.Views[0])){
                project.addView();
            }
            // NO DEFAULT VIEWS
            //else{
                //project.Views[project.defaultView].initialiseView();
            //}
        }
    }
    /**
        Resets the array of model.
    */
    this.reset = function() {
        this._objects = new Array();
    }
    
    /** The zinc download manager. */
    this._dm = zincCreateDownloadMonitor(window.commandData, new RunnableFunctionWrapper(this._read, this._objects));

}

function ZinxProject(){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxProject"; });
    
    this.idCounter = 0;
    this.uri = '_:project'+this.idCounter;
    this.id = 'project'+this.idCounter;
    this.label = "ZinxProject2";
    this.path = '.';
    this.interactiveTool = 'transform_tool';
    this.transparencyMode = 'fast';
    
    this.ZincInitialised = false;
    this.ZincSceneLoaded = false;
    this.minZincVersion = "0.6.0"
    this.maxZincVersion = "0.6.4"
    
    if(typeof(ZinxIO)=='function'){
        this.io = new ZinxIO(this);
    }
    
    this.Models = [];
    this.Textures = [];
    this.Views = [];
    this.defaultView = null;
    
    this.download_manager = null;
    
    // Other properties:
    this.enabledModelSelection = false; // Tags the cmgui model on loading to allow selection.
    this._name_template_model = null;
    
    this.time = 0;
    this._gfxSetTime = function(id, oldvalue, newvalue){
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        gfx("gfx timekeeper default set_time "+newvalue);
        return newvalue;
    }
    this.watch('time', this._gfxSetTime);
        
    // INITIALISE CMGUI //
    this.InitialiseZinc = function(){
       
        // Standard initialisation
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        }catch (error) {
            console.error("Your browser security priveleges do not permit this application to run. To remedy this you need to change the signed.applets.codebase_principal_support setting to true.  To do this type about:config in your browser address bar, then type the word signed in the filter text box and double click on the codebase_principal_support setting to change the value to true.");
        }
        
        if(!this.ZincInitialised){
		
            if (zincCheckValidVersion(this.minZincVersion, this.maxZincVersion))
            {
                console.info("Zinc version ("+zincVersion()+") valid");
                zincInitialise(this._ZincReadyFunction);
                this.ZincInitialised = true;
                console.info("Zinc initialised");
            }
            else
            {
                console.error("The installed version of zinc is not valid for this application. \n" +
                    "Version installed : " + zincVersion() +
                    "\nMinimum allowable version :" + this.minZincVersion +
                    "\nMaximum allowable version :" + this.maxZincVersion + "\n");
            }
        }
    }

    // Function to run when Zinc is initialised //
    this._ZincReadyFunction = function(zincCommandData){
       
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        this.commandData = zincCommandData;
        
        // TO BE REMOVED ONCE ALL GFX COMMANDS ARE CONVERTED TO USING this.project.gfx()
        window.commandData = zincCommandData;
	
        gfx("gfx modify scene default manual;");
        gfx("gfx modify light default dir 0 -0.5 -1");
        gfx("gfx modify lmodel default ambient 0.1 0.1 0.1");
        
        if(isDefined(ZincReadyFunction)){
            ZincReadyFunction();
        }
        
        window.commandData.registerSelectionHandler(new SelectionHandler());
        
    }
    
    // Load the default Zinc scene. This loads only once scene per project
    // This should be fixed to allow multiple scenes.
    this.LoadZincScene = function(project){

        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        if(!this.ZincSceneLoaded){
            zincCreateSceneViewer(document.getElementById(project.SceneObjectId), window.commandData, this._ZincSceneReadyFunction);
            this.ZincSceneLoaded = true;
        }

    }

   // Function to run when the Zinc Scene has been loaded //
    this._ZincSceneReadyFunction = function(sceneViewer){
        
        console.info("Initialising default scene");

        window.sceneViewer = sceneViewer;
	
        window.sceneViewer.setBackgroundColourRGB(46/255, 52/255, 54/255);
        window.sceneViewer.perturbLines = true;
        window.sceneViewer.setSceneByName("default");
		
        window.sceneViewer.setInteractiveToolByName('transform_tool');

        // Set Transparency Mode
        window.sceneViewer.transparencyMode = Components.interfaces.CmguiISceneViewer.TRANSPARENCY_SLOW;
        window.sceneViewer.transparencyLayers = 5;
		
        window.sceneViewer.antialiasMode = 1;
        window.sceneViewer.viewAll();
	
        console.info("Default scene initialised");
        
        
        if(isDefined(ZincSceneReadyFunction)){
            ZincSceneReadyFunction();
        }
    }
    
    /** Loads the objects that have been added to the download manager. */
	this.loadModels = function() {
        
        dm = new ZinxDownloadManager();
        
        if(this.enabledModelSelection && this._name_template_model==null){
            var nameTemplateModel = this.addModel();
            nameTemplateModel.addFile('name_template.exnode');
            this._name_template_model = nameTemplateModel;
        }
        
        for(i in this.Models){
			var model = this.Models[i];
			console.debug("Model: "+model.id+" - "+model.autoload+", "+model.loaded);
            if((model.autoload && !model.loaded && !model.loadInProgress) || (model.reload)){
                if(model.reload){ model.loaded = false; }
				console.debug("Loading model "+model.id);
                model.loadInProgress = true;
				dm.add(model);
			}
        }
        
        dm.load();
        
    }

	this.loadTextures = function() {
		var dm = new ZinxDownloadManager();
        for(i in this.Textures){
			var texture = this.Textures[i];
            if(texture.autoload && !texture.loaded){
				dm.add(texture);
			}
        }
        dm.load();
    }


}

ZinxProject.prototype.addModel = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var model = new ZinxModel(this);
    this.Models.push(model);
    
    return model;

}

ZinxProject.prototype.getModel = function(label) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var nModels = this.Models.length;
    for(var i=0;i<nModels;i++){
        if(this.Models[i].label==label){ return this.Models[i] }
    }
    return null;

}

ZinxProject.prototype.addTexture = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var texture = new ZinxTexture(this);
    this.Textures.push(texture);
    
    return texture;

}

ZinxProject.prototype.addView = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var view = new ZinxView(this);
    view.getView();
    this.Views.push(view);
    this.defaultView = this.Views.length-1;
    return view;

}

ZinxProject.prototype.setInteractiveTool = function(tool) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    // tool can be: transform_tool, node_tool, element_tool
    if(tool){
        this.interactiveTool = tool;
    }
    window.sceneViewer.setInteractiveToolByName(this.interactiveTool);
    
}

ZinxProject.prototype.setTransparencyMode = function(mode) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    // transparency modes: 1 = fast, 2 = slow, 3 = order independent
    if(mode=='fast'){
        try{
            window.sceneViewer.transparencyMode = Components.interfaces.CmguiISceneViewer.TRANSPARENCY_FAST;
        } catch(e){ console.debug("Unable to set fast transparency mode.");}
    }else if (mode=='slow'){
        try{
            window.sceneViewer.transparencyMode = Components.interfaces.CmguiISceneViewer.TRANSPARENCY_SLOW;
            window.sceneViewer.transparencyLayers = 5;
        } catch(e){ console.debug("Unable to set slow transparency mode.");}
    }else if (mode=='order_independent'){
        try{
            window.sceneViewer.transparencyMode = Components.interfaces.CmguiISceneViewer.TRANSPARENCY_ORDER_INDEPENDENT;
        } catch(e){ console.debug("Unable to set order independent transparency mode.");}
    }
    
}


function ZinxModel(parent){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxModel"; });
    
    this.parent = parent;
    this.project = parent;
    
    this.project.idCounter += 1;
    this.uri = '_:model'+this.project.idCounter;
    this.id = 'model'+this.project.idCounter;
    this.label = "Model "+this.project.idCounter;
    this.autoload = true;
    this.loaded = false;
    this.loadInProgress = false;
    this.reload = false;
    
    this.Files = [];
    this.Fields = [];
    this.Graphics = [];

    this.circleDiscretization = 8;
    this.elementDiscretization = 8;

}

/**
@private
Returns the object at a given index.
@param {integer} index The index of the object to be returned.
@type object
@developer This should be made private.
*/
ZinxModel.prototype.load = function(dm) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var projectPath = this.project.path+"/";
    
    if(!this.loaded){
        console.debug("LOADING MODEL");
        var nFiles = this.Files.length;
        for(var i=0;i<nFiles;i++){
            var file = this.Files[i];
            if(file.reload){
                console.debug("Downloading "+file.label+" ["+file.id+"] path = "+projectPath+file.path);
                filename = file.filename
                extensions = filename.split('.')
                NExt = extensions.length
                if(extensions[NExt-1]=='bz2'){
                    extension = '.'+extensions[NExt-2]+'.'+extensions[NExt-1]
                }else{
                    extension = '.'+extensions[NExt-1]
                }
                try {zincDefineMemoryBlock( dm, file.path, "/"+file.id+extension);}
                catch (e) { console.error('Unable to find required file ' + file.path);}
            }
        }
    }

}

/**
@private
Returns the object at a given index.
@param {integer} index The index of the object to be returned.
@type object
@developer This should be made private.
*/
ZinxModel.prototype.render = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    console.debug("RENDERING MODEL");

    var nFiles = this.Files.length;
    for(var i=0;i<nFiles;i++){
        var file = this.Files[i];
        if(file.reload){
            filename = file.filename
            extensions = filename.split('.')
            NExt = extensions.length
            if(extensions[NExt-1]=='bz2'){
                extension = '.'+extensions[NExt-2]+'.'+extensions[NExt-1]
            }else{
                extension = '.'+extensions[NExt-1]
            }
            if(file.index != null){
                var gfxcommand = "gfx read node memory:/"+file.id+extension+" time "+file.index;
            }else{
                var gfxcommand = "gfx read node memory:/"+file.id+extension;
            }
            gfx(gfxcommand);
            
            if(file.free_memory_block==true){
                window.commandData.freeMemoryBlock("/"+file.id+extension);
                console.debug('Freed memory block for '+file.id)
            }
        }
    }
    
    if(this.project.enabledModelSelection &&
            this.project._name_template_model!=null &&
            this.project._name_template_model.id!=this.id){
        gfx("gfx read elem memory:/"+this.project._name_template_model.Files[0].id+".exelem"+";");
    
//var rootRegion = window.commandData.rootRegion;
//	var subRegion = rootRegion.getSubRegion(this.id);
//	var coordinateField = subRegion.findFieldByName("coordinates");
//    var nodeObject = subRegion.getNode(node);
//    coordinateField.setValuesAtNode(nodeObject, 0, x, 3);


        var rootRegion = window.commandData.rootRegion;
        var subRegion = rootRegion.getSubRegion(this.id);
        
        var node = subRegion.createNode(9999);
        subRegion.mergeNode(node);

        //name_field = rootRegion.findFieldByName("name"); //should be this??
        name_field = subRegion.findFieldByName("name");
        name_field.setStringAtNode(0, node, 0, this.id);
    }

    if(this.reload==false){ gfx("gfx draw group "+this.id+" scene default;"); }
    gfx("gfx modify g_element "+this.id+" general clear circle_discretization "+this.circleDiscretization
        +" element_discretization "+this.elementDiscretization+";");

    var nFields = this.Fields.length;
    for(var i=0;i<nFields;i++){
        var field = this.Fields[i];
        if(field.autoload){
            field.load();
        }else{
            field.loaded = false;
        }
    }
    
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        var graphic = this.Graphics[i];
        if(graphic.autoload){
            graphic.load();
        }else{
            graphic.loaded = false;
        }
    }
    
    if(this.reload){
       var nGraphics = this.Graphics.length;
        for(var i=0;i<nGraphics;i++){
            var graphic = this.Graphics[i];
            graphic.update();
        } 
    }

    this.reload = false;
    this.loaded = true;
    this.loadInProgress = false;
}

/**
Adds a file to the model.
@param {string} fullPath Requires the full path to the file.
@param {integer} index.
@type object Returns the file object.
*/
ZinxModel.prototype.addFile = function(path) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var file = new ZinxFile(this);
    if(path){
        file.path = path;
        var fileSplit = path.split("/");
        file.filename = fileSplit.pop();
        file.label = file.filename;
        if(arguments.length==2){
            file.index = arguments[1];
        }
    }
    this.Files.push(file);
    return file;

}

/**
Adds a field to the model.
@param {string} cmField Define the field operation (e.g., add, multiply).
@param {string} cmCommand Defines the field operation properties.
@type object Returns the file object.
*/
ZinxModel.prototype.addField = function(label, cmField, cmCommand) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var field = new ZinxField(this);
    field.label = label;
    field.cmField = cmField;
    field.cmCommand = cmCommand;
    this.Fields.push(field);
    
    return field;

}

ZinxModel.prototype.getField = function(label) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var nFields = this.Fields.length;
    for(var i=0;i<nFields;i++){
        if(this.Fields[i].label==label){ return this.Fields[i] }
    }
    return null;

}

/**
Adds a graphic to the model.
@param {string} graphicalElement Defines the type of graphic to be added, which can be "NodePoints", "ElementPoints", "Lines", "Cylinders", "Surfaces" or "IsoSurfaces".
@type object Returns the gaphics object.
*/
ZinxModel.prototype.addGraphic = function(graphicalElement) {

    if(graphicalElement == "NodePoints"){
        var graphic = new ZinxNodePoints(this);
    }else if(graphicalElement == "ElementPoints"){
        var graphic = new ZinxElementPoints(this);
    }else if(graphicalElement == "Lines"){
        var graphic = new ZinxLines(this);
    }else if(graphicalElement == "Cylinders"){
        var graphic = new ZinxCylinders(this);
    }else if(graphicalElement == "Surfaces"){
        var graphic = new ZinxSurface(this);
    }else if(graphicalElement == "IsoSurfaces"){
        var graphic = new ZinxIsoSurfaces(this);
    }
    graphic.material.clone("default");
    this.Graphics.push(graphic);

    return graphic;

}

ZinxModel.prototype.getGraphics = function(label) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        if(this.Graphics[i].label==label){ return this.Graphics[i] }
    }
    return null;

}

ZinxModel.prototype.show = function() {
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        this.Graphics[i].show();
    }
}

ZinxModel.prototype.hide = function() {
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        this.Graphics[i].hide();
    }
}

ZinxModel.prototype.toggleVisibility = function() {
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        this.Graphics[i].toggleVisibility();
    }
}

ZinxModel.prototype.setTransparency = function(value) {
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        this.Graphics[i].setTransparency(value);
    }
}

ZinxModel.prototype.setVisibility = function(value) {
    var nGraphics = this.Graphics.length;
    for(var i=0;i<nGraphics;i++){
        this.Graphics[i].setVisibility(value);
    }
}

ZinxModel.prototype.setNodeCoordinates = function(node, x) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var rootRegion = window.commandData.rootRegion;
	var subRegion = rootRegion.getSubRegion(this.id);
	var coordinateField = subRegion.findFieldByName("coordinates");
    var nodeObject = subRegion.getNode(node);
    coordinateField.setValuesAtNode(nodeObject, 0, x, 3);
    
}

function ZinxTexture(parent){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxTexture"; });
    
    this.parent = parent;
    this.project = parent;
    
    this.project.idCounter += 1;
    this.uri = '_:texture'+this.project.idCounter;
    this.id = 'texture'+this.project.idCounter;
    this.label = "Texture "+this.project.idCounter;
    this.width = null;
    this.height = null;
    this.depth = null;
    this._imageWidth = null;
    this._imageHeight = null;
    this._imageDepth = null;
    this.autoload = true;
    this.loaded = false;
    
    this.Files = [];

}

/**
@private
Returns the object at a given index.
@param {integer} index The index of the object to be returned.
@type object
@developer This should be made private.
*/
ZinxTexture.prototype.load = function(dm) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var projectPath = this.project.path+"/";
    
    if(!this.loaded){
        console.debug("LOADING TEXTURE");
        var nFiles = this.Files.length;
        for(var i=0;i<nFiles;i++){
            var file = this.Files[i];
            console.debug("Downloading "+file.label+" ["+file.id+"]");
            var index = "00000"+(parseInt(i)+1);
            index = index.slice(index.length - 5);
            try {zincDefineMemoryBlock( dm, projectPath+file.path, "/"+this.id+"slice"+index);}
            catch (e) {	console.error('Unable to find required file '+this.id);}
        }
    }

}

/**
@private
Returns the object at a given index.
@param {integer} index The index of the object to be returned.
@type object
@developer This should be made private.
*/
ZinxTexture.prototype.render = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    console.debug("RENDERING TEXTURE");
    if(this.width == null & this.imageWidth == null){
        // Temporary load first image
        gfx("gfx create texture temporary_image image memory:/"+this.id+"slice00001 width 1 height 1 decal;");
        var image = window.commandData.findTextureByName("temporary_image");
	
        // Get image size
        sizes = image.getOriginalTexelSizes({});
        this._imageWidth = sizes[0];
        this._imageHeight = sizes[1];
        this._imageDepth = this.Files.length;
	
        // Destroy temporary image
        gfx("gfx destroy texture temporary_image;");        
    }
    
    if(this.width==null){
        gfx("gfx create texture "+this.id+" width "+this._imageWidth+" height "+this._imageHeight+" depth "+this._imageDepth+" border linear_filter image memory:/"+this.id+"slice00000 number_pattern '00000' number_series 1 "+this.Files.length+" 1 compress;");
    }else{
        gfx("gfx create texture "+this.id+" width "+this.width+" height "+this.height+" depth "+this.depth+" border linear_filter image memory:/"+this.id+"slice00000 number_pattern '00000' number_series 1 "+this.Files.length+" 1 compress;");
    }
    
    var nFiles = this.Files.length;
    for(var i=0;i<nFiles;i++){
        var file = this.Files[i];
        if(file.free_memory_block){
            var index = "00000"+(parseInt(i)+1);
            index = index.slice(index.length - 5);
            window.commandData.freeMemoryBlock("/"+file.id+"slice"+index);
        }
    }
    
    this.loaded = true;

}


/**
@private
Returns the object at a given index.
@param {integer} index The index of the object to be returned.
@type object
@developer This should be made private.
*/
ZinxTexture.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    console.debug("UPDATING TEXTURE");
    if(this.width == null & this.imageWidth == null){
        // Temporary load first image
        gfx("gfx create texture temporary_image image memory:/"+this.id+"slice00001 width 1 height 1 decal;");
        var image = window.commandData.findTextureByName("temporary_image");
	
        // Get image size
        sizes = image.getOriginalTexelSizes({});
        this._imageWidth = sizes[0];
        this._imageHeight = sizes[1];
        this._imageDepth = this.Files.length;
	
        // Destroy temporary image
        gfx("gfx destroy texture temporary_image;");        
    }
    
    if(this.width==null){
        console.debug('using image defaults')
        gfx("gfx modify texture "+this.id+" width "+this._imageWidth+" height "+this._imageHeight+" depth "+this._imageDepth+";");
    }else{
        console.debug('using user values')
        gfx("gfx modify texture "+this.id+" width "+this.width+" height "+this.height+" depth "+this.depth+";");
    }

    this.loaded = true;

}



/**
Adds a file to the model.
@param {string} fullPath Requires the full path to the file.
@param {integer} index.
@type object Returns the file object.
*/
ZinxTexture.prototype.addFile = function(path) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var file = new ZinxFile(this);
    if(path){
        file.path = path;
        var fileSplit = path.split("/");
        file.filename = fileSplit.pop();
        file.label = file.filename;
        if(arguments.length==2){
            file.index = arguments[1];
        }
    }
    this.Files.push(file);
    return file;

}

function ZinxFile(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxFile"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:file'+this.project.idCounter;
    this.id = 'file'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.filename = null;
    this.path = null;
    this.index = null;
    this.reload = true;
    
    this.free_memory_block = true;
    
    return 1;

}

ZinxFile.prototype.set_file_path = function(path) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    if(path){
        this.path = path;
        var fileSplit = path.split("/");
        this.filename = fileSplit.pop();
        this.label = this.filename;
        if(arguments.length==2){
            this.index = arguments[1];
        }
    }

}

/**********************************************************************************************/
/****** ZINX BASIC FIELD OBJECT                                                          ******/
/**********************************************************************************************/
function ZinxField(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxField"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:field'+this.project.idCounter;
    this.id = 'field'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.cmField = 'add';
    this.cmCommand = 'field coordinates.x coordinates.y';
    this.autoload = true;
    this.loaded = false;
    
    return 1;
	
}

ZinxField.prototype.load = function() {
		
	  	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	  	
	  	gfx("gfx define field "+this.parent.id+"/"+this.id+" "+this.cmField+" "+this.cmCommand);
		this.loaded = true;

}
	
ZinxField.prototype.update = function() {
		
	  	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	  	
	  	this.load();

}
	
ZinxField.prototype.unload = function() {
		
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		
		if(this.loaded){
			gfx("gfx destroy field "+this.parent.parent.id+"/"+this.id);
	  		this.loaded = false;
	  	}
		
}

/**********************************************************************************************/
/****** ZINX GRAPHICS OBJECT                                                             ******/
/**********************************************************************************************/
function ZinxGraphic(parent) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxGraphic"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:graphic'+this.project.idCounter;
    this.id = 'graphic'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.autoload = true;
    this.useGlyphField = false;
    this.glyphField = '';
    this.useDataField = false;
    this.dataField = 'coordinates';

    // Status variables
    this.visible = false;
    this.loaded = false;

    this.graphicalElement = "nodepoints";
    this.material = new ZinxMaterial(this);
    this.spectrum = new ZinxSpectrum(this);

    this.show = function(){
        
        var graphicalElement = this.graphicalElement;
        if(graphicalElement == "NodePoints"){graphicalElement = "node_points";}
        if(graphicalElement == "ElementPoints"){graphicalElement = "element_points";}
        if(graphicalElement == "IsoSurfaces"){graphicalElement = "iso_surfaces";}
        
        if(!this.visible){
            gfx("gfx modify g_element "+this.parent.id+" "+graphicalElement+" as "+this.id+" visible;");
            this.visible = true;
        }
    }
    
    this.hide = function(){
        
        var graphicalElement = this.graphicalElement;
        if(graphicalElement == "NodePoints"){graphicalElement = "node_points";}
        if(graphicalElement == "ElementPoints"){graphicalElement = "element_points";}
        if(graphicalElement == "IsoSurfaces"){graphicalElement = "iso_surfaces";}
        
        if(this.visible){
            gfx("gfx modify g_element "+this.parent.id+" "+graphicalElement+" as "+this.id+" invisible;");
            this.visible = false;
        }
    }
    
    this.toggleVisibility = function(){
        
        var graphicalElement = this.graphicalElement;
        if(graphicalElement == "NodePoints"){graphicalElement = "node_points";}
        if(graphicalElement == "ElementPoints"){graphicalElement = "element_points";}
        if(graphicalElement == "IsoSurfaces"){graphicalElement = "iso_surfaces";}
        
        if(this.visible){
            gfx("gfx modify g_element "+this.parent.id+" "+graphicalElement+" as "+this.id+" invisible;");
            this.visible = false;
        }else{
            gfx("gfx modify g_element "+this.parent.id+" "+graphicalElement+" as "+this.id+" visible;");
            this.visible = true;
        }
    }
    
    this.setTransparency = function(value){
        
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        this.material.alpha = value;
        gfx("gfx modify material "+this.material.id+" alpha "+this.material.alpha);
        if(value<=0){this.hide();}
        if(value>0 && !this.visible){this.show();}
    }
    
    this.setVisibility = function(value){
        
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        if(value!=this.material.alpha){
            this.material.alpha = value;
            gfx("gfx modify material "+this.material.id+" alpha "+this.material.alpha);
            if(value<=0){this.hide();}
            if(value>0 && !this.visible){this.show();}
        }
    }
    
}

function ZinxNodePoints(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);
    
    this.label.replace('Graphics', 'NodePoints');
    this.graphicalElement = 'NodePoints'
    this.glyph = "sphere";
    this._size = [1,1,1];
    this._scale = [1,1,1]
    this.orientation = '';
    this.useLabels = false
    this.labelField = "cmiss_number"
    
    return 1;

}

ZinxNodePoints.prototype.__defineGetter__("size", function() {
    return this._size;
});

ZinxNodePoints.prototype.__defineSetter__("size", function(x) {
    if(typeof x=="number"){
        this._size = [x,x,x]
    }else{
        this._size = x
    }
});

ZinxNodePoints.prototype.__defineGetter__("scale", function() {
    return this._scale;
});

ZinxNodePoints.prototype.__defineSetter__("scale", function(x) {
    if(typeof x=="number"){
        this._scale = [x,x,x]
    }else{
        this._scale = x
    }
});

ZinxNodePoints.prototype.load = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    if(!this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" node_points as "+this.id;
        gfxCommand += " glyph "+this.glyph;
        gfxCommand += " size "+this._size[0]+"*"+this._size[1]+"*"+this._size[2];
        gfxCommand += " scale_factors \""+this._scale[0]+"*"+this._scale[1]+"*"+this._scale[2]+"\"";
		if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.orientation.length){
			field = this.parent.getField(this.orientation)
            if(field==null){field_id = this.orientation}
            else{field_id = field.id}
			gfxCommand += " orientation "+field_id;
		}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			field = this.parent.getField(this.labelField)
            if(field==null){field_id = this.labelField}
            else{field_id = field.id}
			gfxCommand += " label "+field_id;
		}
        gfxCommand += " material "+this.material.id;
        gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxNodePoints.prototype.update = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    if(this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" node_points as "+this.id;
        gfxCommand += " glyph "+this.glyph;
        gfxCommand += " size "+this._size[0]+"*"+this._size[1]+"*"+this._size[2];
        gfxCommand += " scale_factors \""+this._scale[0]+"*"+this._scale[1]+"*"+this._scale[2]+"\"";
		if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.orientation.length){
            field = this.parent.getField(this.orientation)
            if(field==null){field_id = this.orientation}
            else{field_id = field.id}
			gfxCommand += " orientation "+field_id;
		}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			field = this.parent.getField(this.labelField)
            if(field==null){field_id = this.labelField}
            else{field_id = field.id}
			gfxCommand += " label "+field_id;
		}
        gfxCommand += " material "+this.material.id;
        gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

function ZinxElementPoints(parent) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'ElementPoints');
    this.graphicalElement = 'ElementPoints'
    this.glyph = "sphere";
    this._size = [0.1,0.1,0.1];
    this._scale = [1,1,1]
    this.orientation = '';
    this._discretization = [3,3,3];
    this.distribution = "cell_centres";
    this.useLabels = false
    this.labelField = "cmiss_number"
    
}

ZinxElementPoints.prototype.__defineGetter__("size", function() {
    return this._size;
});

ZinxElementPoints.prototype.__defineSetter__("size", function(x) {
    if(typeof x=="number"){
        this._size = [x,x,x]
    }else{
        this._size = x
    }
});

ZinxElementPoints.prototype.__defineGetter__("scale", function() {
    return this._scale;
});

ZinxElementPoints.prototype.__defineSetter__("scale", function(x) {
    if(typeof x=="number"){
        this._scale = [x,x,x]
    }else{
        this._scale = x
    }
});

ZinxElementPoints.prototype.__defineGetter__("discretization", function() {
    return this._discretization;
});

ZinxElementPoints.prototype.__defineSetter__("scale", function(x) {
    if(typeof x=="number"){
        this._discretization = [x,x,x]
    }else{
        this._discretization = x
    }
});

ZinxElementPoints.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
     if(!this.loaded){
        
        this.material.load();
        
        var gfxCommand = "gfx modify g_element "+this.parent.id+" element_points as "+this.id;
        gfxCommand +=  " glyph "+this.glyph;
        gfxCommand +=  " size "+this._size[0]+"*"+this._size[1]+"*"+this._size[2];
        gfxCommand +=  " scale_factors \""+this._scale[0]+"*"+this._scale[1]+"*"+this._scale[2]+"\"";
		gfxCommand +=  " discretization "+this._discretization[0]+"*"+this._discretization[1]+"*"+this._discretization[2];
        gfxCommand +=  " "+this.distribution;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
        gfxCommand += " material "+this.material.id;
		if(this.orientation.length){
			field = this.parent.getField(this.orientation)
            if(field==null){field_id = this.orientation}
            else{field_id = field.id}
			gfxCommand += " orientation "+field_id;
		}
		if(this.useGlyphField && this.glyphField.length){
			console.warning("This has been deprecated, use graphic.orientation instead");
		}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			field = this.parent.getField(this.labelField)
            if(field==null){field_id = this.labelField}
            else{field_id = field.id}
			gfxCommand += " label "+field_id;
		}
        gfx(gfxCommand);
    
        this.loaded = true;
        this.visible = true;

    }

}

ZinxElementPoints.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    if(this.loaded){
        var gfxCommand = "gfx modify g_element "+this.parent.id+" element_points as "+this.id;
        gfxCommand +=  " glyph "+this.glyph;
        gfxCommand +=  " size "+this._size[0]+"*"+this._size[1]+"*"+this._size[2];
        gfxCommand +=  " scale_factors \""+this._scale[0]+"*"+this._scale[1]+"*"+this._scale[2]+"\"";
		gfxCommand +=  " discretization "+this._discretization[0]+"*"+this._discretization[1]+"*"+this._discretization[2];
        gfxCommand +=  " "+this.distribution;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.orientation.length){
			field = this.parent.getField(this.orientation)
            if(field==null){field_id = this.orientation}
            else{field_id = field.id}
			gfxCommand += " orientation "+field_id;
		}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			field = this.parent.getField(this.labelField)
            if(field==null){field_id = this.labelField}
            else{field_id = field.id}
			gfxCommand += " label "+field_id;
		}
        gfx(gfxCommand);
    }
    
}

function ZinxLines(parent) {

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'Lines');
    this.graphicalElement = 'Lines'
    this.width = 1;
    this.exterior = false;

}

ZinxLines.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    if(!this.loaded){
        
        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" lines as "+this.id;
        gfxCommand += " line_width "+this.width;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
        gfxCommand += " material "+this.material.id;
        if(this.exterior){gfxCommand +=  " exterior";}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxLines.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(this.loaded){

        var gfxCommand = "gfx modify g_element "+this.parent.id+" lines as "+this.id;
        gfxCommand += " line_width "+this.width;
        if(this.exterior){gfxCommand +=  " exterior";}
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);
    }
}

function ZinxCylinders(parent) {

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'Cylinders');
    this.graphicalElement = 'Cylinders'
    this.radius = 0.1;

}

ZinxCylinders.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(!this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" cylinders as "+this.id;
        gfxCommand += " constant_radius "+this.radius;
        gfxCommand += " material "+this.material.id;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxCylinders.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(this.loaded){
        var gfxCommand = "gfx modify g_element "+this.parent.id+" cylinders as "+this.id;
        gfxCommand += " constant_radius "+this.radius;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);
    }
}

function ZinxSurface(parent) {

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'Surfaces');
    this.graphicalElement = 'Surfaces'
    this.exterior = true;

}

ZinxSurface.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(!this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" surfaces as "+this.id;
        if(this.exterior){gfxCommand +=  " exterior";}
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
        gfxCommand += " material "+this.material.id+" selected_material "+this.material.id;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxSurface.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(this.loaded){
        var gfxCommand = "gfx modify g_element "+this.parent.id+" surfaces as "+this.id;
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
        if(this.exterior){gfxCommand +=  " exterior";}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);
    }
}


function ZinxIsoSurfaces(parent) {

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'IsoSurfaces');
    this.graphicalElement = 'IsoSurfaces'
    this.isoField = "coordinates.x";
    this.isoValues = "0.5";


}

ZinxIsoSurfaces.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(!this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" iso_surfaces as "+this.id;
        gfxCommand += " iso_scalar "+this.isoField;
        gfxCommand += " iso_values "+parseIsoValues(this.isoValues);
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
        gfxCommand += " material "+this.material.id;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxIsoSurfaces.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    if(this.loaded){
        var gfxCommand = "gfx modify g_element "+this.parent.id+" iso_surfaces as "+this.id;
        gfxCommand += " iso_scalar "+this.isoField;
        gfxCommand += " iso_values "+parseIsoValues(this.isoValues);
        if(this.coordinates){gfxCommand +=  " coordinate "+this.coordinates;}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			field = this.parent.getField(this.dataField)
            if(field==null){field_id = this.dataField}
            else{field_id = field.id}
			gfxCommand += " data "+field_id+" spectrum "+this.spectrum.id;
		}
		gfx(gfxCommand);
    }
}

/**********************************************************************************************/
/****** ZINX MATERIAL OBJECT                                                             ******/
/**********************************************************************************************/

function ZinxMaterial(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "ZinxMaterial"; });
    
    this.parent = parent;
    this.project = this.parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:material'+this.project.idCounter;
    this.id = 'material'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.alpha = 1;
    this.shininess = 1;
    this.shading = "normal_mode";
    this.ambient = new ZinxColour(this);
    this.diffuse = new ZinxColour(this);
    this.emission = new ZinxColour(this);
    this.specular = new ZinxColour(this);

    this.loaded = false;

}

ZinxMaterial.prototype.load = function() {

    if(!this.loaded || this.loaded==null){
        var gfxCommand = "gfx create material "+this.id;
        gfxCommand += " "+this.shading;
        gfxCommand += " ambient "+this.ambient.red+" "+this.ambient.green+" "+this.ambient.blue;
        gfxCommand += " diffuse "+this.diffuse.red+" "+this.diffuse.green+" "+this.diffuse.blue;
        gfxCommand += " emission "+this.emission.red+" "+this.emission.green+" "+this.emission.blue;
        gfxCommand += " specular "+this.specular.red+" "+this.specular.green+" "+this.specular.blue;
        gfxCommand += " alpha "+this.alpha;
        gfxCommand += " shininess "+this.shininess;

        gfx(gfxCommand); // execute command

        this.loaded = true;
    }

}

ZinxMaterial.prototype.update = function() {

    if(this.loaded){
        var gfxCommand = "gfx modify material "+this.id;
        gfxCommand += " "+this.shading;
        gfxCommand += " ambient "+this.ambient.red+" "+this.ambient.green+" "+this.ambient.blue;
        gfxCommand += " diffuse "+this.diffuse.red+" "+this.diffuse.green+" "+this.diffuse.blue;
        gfxCommand += " emission "+this.emission.red+" "+this.emission.green+" "+this.emission.blue;
        gfxCommand += " specular "+this.specular.red+" "+this.specular.green+" "+this.specular.blue;
        gfxCommand += " alpha "+this.alpha;
        gfxCommand += " shininess "+this.shininess;

        gfx(gfxCommand);
    }

}

ZinxMaterial.prototype.unload = function() {
    if(this.loaded){
        gfx("gfx destroy material "+this.id)+";";
        this.loaded = false;
    }
}


ZinxMaterial.prototype.clone = function(col) {

    c = builtinColours();

    this.ambient.rgb = [c[col][0], c[col][1], c[col][2]];
    this.diffuse.rgb = [c[col][3], c[col][4], c[col][5]];
    this.emission.rgb = [c[col][6], c[col][7], c[col][8]];
    this.specular.rgb = [c[col][9], c[col][10], c[col][11]];
    this.alpha = c[col][12];
    this.shininess = c[col][13];

    this.update();

}

function builtinColours(){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var c = new Array();

    c["default"] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0];
    c["black"]   = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.3, 1.0, 0.2];
    c["blue"]    = [0.0, 0.0, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 1.0];
    c["bone"]    = [0.7, 0.7, 0.6, 0.9, 0.9, 0.7, 0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 1.0, 0.2];
    c["gold"]    = [1.0, 0.4, 0.0, 1.0, 0.7, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.3];
    c["gray"]    = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 0.2];
    c["green"]   = [0.0, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 0.1];
    c["muscle"]  = [0.4, 0.14, 0.11, 0.5, 0.12, 0.1, 0.0, 0.0, 0.0, 0.3, 0.5, 0.5, 1.0, 0.2];
    c["red"]     = [0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 0.2];
    c["silver"]  = [0.4, 0.4, 0.4, 0.7, 0.7, 0.7, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.3];
    c["tissue"]  = [0.9, 0.7, 0.5, 0.9, 0.7, 0.5, 0.0, 0.0, 0.0, 0.2, 0.2, 0.3, 1.0, 0.2];
    c["white"]   = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0];

    return c;

}

/**********************************************************************************************/
/**********************************************************************************************/
/****** ZINX SPECTRUM OBJECT                                                             ******/
/**********************************************************************************************/
/**********************************************************************************************/

function ZinxSpectrum(parent) {
    
    this.__defineGetter__("class", function()  { return "ZinxSpectrum"; });

    this.parent = parent;
    this.project = this.parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:spectrum'+this.project.idCounter;
    this.id = 'spectrum'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;

    this.colour = "rainbow";
    this.reverse = false;
    this.maximumValue = 1.0;
    this.minimumValue = 0.0;
    this.extendBelow = true;
    this.extendAbove = true;
    
    this.loaded = false;
    
    return 1;   
}

ZinxSpectrum.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
     if(!this.loaded){
        gfx("gfx create spectrum "+this.id+" clear overwrite_colour;");
        var gfxCommand = "gfx modify spectrum "+this.id+" linear";
        if(this.reverse){gfxCommand += " reverse";}
        gfxCommand += " range "+this.minimumValue+" "+this.maximumValue;
        if(this.extendBelow){gfxCommand += " extend_below";}
        if(this.extendAbove){gfxCommand += " extend_above";}
        gfxCommand += " "+this.colour+" colour_range 0 1.0 component 1;";
        gfx(gfxCommand);
    
        this.loaded = true;

    }

}

ZinxSpectrum.prototype.update = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    if(this.loaded){
        gfx("gfx modify spectrum "+this.id+" clear overwrite_colour;");
        var gfxCommand = "gfx modify spectrum "+this.id+" linear";
        if(this.reverse){gfxCommand += " reverse";}
        gfxCommand += " range "+this.minimumValue+" "+this.maximumValue;
        if(this.extendBelow){gfxCommand += " extend_below";}
        if(this.extendAbove){gfxCommand += " extend_above";}
        gfxCommand += " "+this.colour+" colour_range 0 1.0 component 1;";
        gfx(gfxCommand);
    }

}

ZinxSpectrum.prototype.unload = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    if(this.loaded){
        gfx("gfx destroy spectrum "+this.id+";");
        this.loaded = "false";
    }

}

ZinxSpectrum.prototype.autorange = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
    gfx("gfx modify spectrum "+this.id+" autorange;");

}

ZinxSpectrum.prototype.spectrumColours = {
    rainbow:"Rainbow",
    red:"Red",
    green:"Green",
    blue:"Blue",
    white_to_blue:"White to blue",
    white_to_red:"White to red",
    monochrome:"Monochrome",
    alpha:"Alpha"
}

/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX COLOUR OBJECT                                                                     ***/
/**********************************************************************************************/
/**********************************************************************************************/

function ZinxColour(parent) {

    this.__defineGetter__("class", function()  { return "ZinxColour"; });

    this.parent = parent;
    this.project = this.parent.project;

    this.project.idCounter += 1;
    this.uri = '_:colour'+this.project.idCounter;
    this.id = 'colour'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;

    this.red = 1;
    this.green = 1;
    this.blue = 1;

    /* Hex to RGB colour functions */
    function HexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
    function HexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
    function HexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
    function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
    // TODO: define function to get hex value
    //this.__defineGetter__("hex", function() { return null; });
}

ZinxColour.prototype.__defineSetter__("rgb", function(x) {
    this.red = x[0];
    this.green = x[1];
    this.blue = x[2];
});

ZinxColour.prototype.__defineGetter__("rgb", function() {
    return [this.red, this.green, this.blue];
});

ZinxColour.prototype.__defineSetter__("hex", function(h) {
    this.red = HexToR(h);
    this.green = HexToG(h);
    this.blue = HexToB(h);
});


/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX SCENE OBJECT                                                                      ***/
/**********************************************************************************************/
/**********************************************************************************************/

function ZinxView(parent) {

    this.__defineGetter__("class", function()  { return "ZinxView"; });
    
    this.parent = parent;
    this.project = parent;
    
    this.project.idCounter += 1;
    this.uri = '_:view'+this.project.idCounter;
    this.id = 'view'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;

    this.camera = [0.0, 1.0, 0.0];
    this.target = [0.0, 0.0, 0.0];
    this.up     = [0.0, 0.0, 1.0];
    this.viewAngle = undefined;

}

ZinxView.prototype.initialiseView = function() {
        
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
        if(!isDefined(this.viewAngle) || this.viewAngle==null){
            console.debug("Getting view parameters");
            this.getView();
        }else{
            console.debug("Setting view parameters "+this.id);
            this.setView();
        }
        
}
    
ZinxView.prototype.getView = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    console.debug("Getting View");
    if(window.sceneViewer){
        var cameraX={}; var cameraY={}; var cameraZ={};
        var targetX={}; var targetY={}; var targetZ={};
        var upX={}; var upY={}; var upZ={};
    
        window.sceneViewer.getLookatParameters(
            cameraX, cameraY, cameraZ, targetX, targetY, targetZ, upX, upY, upZ);
        var viewAngle = window.sceneViewer.viewAngle;

        this.camera = [cameraX.value, cameraY.value, cameraZ.value];
        this.target = [targetX.value, targetY.value, targetZ.value];
        this.up     = [upX.value, upY.value, upZ.value];
        this.viewAngle = viewAngle;
    }
    
}
    
ZinxView.prototype.setView = function() {
        
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
    var cameraX = this.camera[0];   var cameraY = this.camera[1];   var cameraZ = this.camera[2];
    var targetX = this.target[0]; var targetY = this.target[1]; var targetZ = this.target[2];
    var upX = this.up[0];    var upY = this.up[1]; var upZ = this.up[2];
    var viewAngle = this.viewAngle;
        
    window.sceneViewer.setLookatParametersNonSkew(cameraX, cameraY, cameraZ,
        targetX, targetY, targetZ, upX, upY, upZ);
    window.sceneViewer.viewAngle = viewAngle;

}
    
ZinxView.prototype.viewAll = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    window.sceneViewer.viewAll();

}

/********************************************************************************************/
/****** GENERAL FUNCTIONS                                                              ******/
/********************************************************************************************/

function gfx(str){
    console.debug(str);
	try {window.commandData.executeCommand(str);}
	catch (e) {	console.error('Zinc command failed: ' + str);}
}

function isDefined( variable)
{
    return (typeof(variable) == "undefined")?  false: true;
}

function RunnableFunctionWrapper(aFunction, arg1)
{
	this.run_function = aFunction;
	this.arg1 = arg1;
}

RunnableFunctionWrapper.prototype =
{
	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIRunnable) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE;
	},

	run: function()
	{
		this.run_function(this.arg1);
	}
};

function parseIsoValues(def){
	
	if(def.match(":")){
		var values = def.split(":");
		var isoValues = [];
		for(i=parseFloat(values[0]);i<=parseFloat(values[2]);i+=parseFloat(values[1])){
			isoValues.push(i);
		}
	}else{
		var isoValues = def;
	}
		
	return isoValues;

}

// Checks if the Firebug consile is available
if(typeof(console)=='undefined'){
    var console = {
            log: function() { },
            info: function() { },
            debug: function() { },
            warn: function() { },
            error: function(msg) { }
    };
    
}

function SelectionHandler()
{
}

SelectionHandler.prototype =
{
  QueryInterface: function(aIID)
  {
    if (aIID.equals(Components.interfaces.CmguiIEventHandler) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  onEvent: function()
  {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
	//if(window.selectionTool=="elements"){
	//	ElementSelectionHandler();
	//}else if(window.selectionTool=="nodes"){
	//	NodeSelectionHandler();
	//}else if(window.selectionTool=="trackingPoint"){
	//	TrackingPointSelectionHandler();
	//}
    
    ElementSelectionHandler();
  }
}


function ElementSelectionHandler(){

	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

	var Elements = {};
	var count = {};
	var time = 0;
	
	window.commandData.getSelectedElements(Elements, count);

    // Data is a standard Javascript array of nodes.
	var element = Elements.value[0];
	var region = element.region;
	var node = region.getNode("9999");
	var name_field = region.findFieldByName("name");
	var name = name_field.evaluateAsStringAtNode(node, time);
    
    //console.debug("Element: "+element.identifier);
	//console.debug("Field: "+name_field.name);
	//console.debug("MESH: "+name);
    
    if(isDefined(modelSelectionFunction)){
        modelSelectionFunction(name);
    }

}
