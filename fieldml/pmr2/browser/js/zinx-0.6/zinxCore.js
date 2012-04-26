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
            if (object.class == 'Model') {
                object.load(this._dm);
            }
        }
    }

    /** Renders the models once they are downloaded. */
    this._read = function(objects) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        var model = null;

        for(i in objects){
            var object = objects[i];
            if (object.class == 'Model') {
                model = object;
                console.debug("Rendering model "+object.id+" through download manager");
                object.render();
            }
        }
        
        var project = model.project;

        project.LoadZincScene(project); // Load the 3D scene once the objects are loaded.
    
        if(!isDefined(project.Views[0])){
            project.addView();
        }else{
            project.Views[project.defaultView].initialiseView();
        }

    }

    /** The zinc download manager. */
    this._dm = zincCreateDownloadMonitor(window.commandData, new RunnableFunctionWrapper(this._read, this._objects));

}

function ZinxProject(){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Project"; });
    
    this.idCounter = 0;
    this.uri = '_:project'+this.idCounter;
    this.id = 'project'+this.idCounter;
    this.label = "ZinxProject";
    this.folder = '.';
    this.file = 'zinxProject.json';
    
    this.ZincInitialised = false;
    this.ZincSceneLoaded = false;
    this.minZincVersion = "0.6.0"
    this.maxZincVersion = "0.6.4"
    
    this.Models = [];
    this.Textures = [];
    this.Views = [];
    
    this.time = 0;
    this._gfxSetTime = function(id, oldvalue, newvalue){
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        gfx("gfx timekeeper default set_time "+newvalue);
        return newvalue;
    }
    this.watch('time', this._gfxSetTime);
    
    this.load = function(){
       
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
        xmlhttp = new XMLHttpRequest();
        xmlhttp.project = this;
        xmlhttp.open("GET", this.file, true);
        xmlhttp.overrideMimeType("application/json");
        xmlhttp.onreadystatechange = bootstrap;
        xmlhttp.send(null);
        
        function bootstrap(){
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
            if (xmlhttp.readyState==4) {
                
                var data = JSON.parse(xmlhttp.responseText);
                
                for(var uri in data){
                    for(var property in data[uri]){
                        for(var i=0; i<data[uri][property].length; i++ ){
                            var klass = data[uri][property][i]['value'];
                            if(property == 'http://www.physiome.org.nz/rdf#class' && klass == 'Project'){
                                var projectURI = uri;
                            }
                        }
                    }
                }
                
                xmlhttp.project.fromJSON(data, projectURI);
                
                var dm = new ZinxDownloadManager();

                for (var i in xmlhttp.project.Models){
                    //if(this.Models[i].autoload){
                        dm.add(xmlhttp.project.Models[i]);
                    //}
                }
                
                dm.load();
            }
        }
    }
    
    
    // INITIALISE CMGUI //
    this.InitialiseZinc = function(){
       
        // Standard initialisation
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        }catch (error) {
            alert ("Your browser security priveleges do not permit this application to run. To remedy this you need to change the signed.applets.codebase_principal_support setting to true.  To do this type about:config in your browser address bar, then type the word signed in the filter text box and double click on the codebase_principal_support setting to change the value to true.");
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
                alert("The installed version of zinc is not valid for this application. \n" +
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
		
        window.sceneViewer.setInteractiveToolByName("transform_tool");

        // Set Transparency Mode
        window.sceneViewer.transparencyMode = Components.interfaces.CmguiISceneViewer.TRANSPARENCY_FAST;
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
		var dm = new ZinxDownloadManager();
        for(i in this.Models){
			var model = this.Models[i];
			console.debug("Model: "+model.id+" - "+model.autoload+", "+model.loaded);
            if(model.autoload && !model.loaded){
				console.debug("Loading model");
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
    //console.info('View added');
    return view;

}

ZinxProject.prototype.toJSON = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id', this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('defaultView', this.defaultView);
    data += jsonResource('Models', this.Models);
    data += jsonResource('Views', this.Views);
    data  = jsonCloseResource(data);
    
    for (var i in this.Models){
        data += this.Models[i].toJSON();
    }
    for (var i in this.Views){
        data += this.Views[i].toJSON();
    }
    
    return data;

}

ZinxProject.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Project'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.defaultView = json[uri][NS+'defaultView'][0].value;
        for (var m in json[uri][NS+'Models']){
            var modelURI = json[uri][NS+'Models'][m].value;
            model = this.addModel();
            model.fromJSON(json, modelURI);
        }
        for (var s in json[uri][NS+'Views']){
            var viewURI = json[uri][NS+'Views'][s].value;
            view = this.addView();
            view.fromJSON(json, viewURI);
        }
    }else{
        console.warn('Project from JSON: reference is not for a project');
        return -1;
    }
    
    return 1;

}

ZinxProject.prototype.save = function(){
    
    var json = this.toJSON();
    json = '{\n'+json.substr(0, json.length-2)+'\n}\n';
    saveLocalFile(this.folder+'/'+this.file,json)
    
}



function ZinxModel(parent){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Model"; });
    
    this.parent = parent;
    this.project = parent;
    
    this.project.idCounter += 1;
    this.uri = '_:model'+this.project.idCounter;
    this.id = 'model'+this.project.idCounter;
    this.label = "Model "+this.project.idCounter;
    this.autoload = true;
    this.loaded = false;
    
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
    
    if(!this.loaded){
        console.debug("LOADING MODEL");
        var nFiles = this.Files.length;
        for(var i=0;i<nFiles;i++){
            var file = this.Files[i];
            console.debug("Downloading "+file.label+" ["+file.id+"]");
            try {zincDefineMemoryBlock( dm, file.relativePath, "/"+file.id+".exelem");}
            catch (e) { alert ('Unable to find required file ' + file.relativePath);}
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
        if(file.index != null){
            var gfxcommand = "gfx read node memory:/"+file.id+".exelem region "+this.id+" time "+file.index;
        }else{
            var gfxcommand = "gfx read elem memory:/"+file.id+".exelem region "+this.id;
        }
        gfx(gfxcommand);
        //window.commandData.freeMemoryBlock("/"+file.id);
    }

    gfx("gfx draw group "+this.id+" scene default;");
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

    this.loaded = true;

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
        file.relativePath = path;
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
ZinxModel.prototype.addField = function(cmField, cmCommand) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var field = new ZinxField(this);
    field.cmField = cmField;
    field.cmCommand = cmCommand;
    this.Fields.push(field);
    
    return field;

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

ZinxModel.prototype.setNodeCoordinates = function(node, x) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var rootRegion = window.commandData.rootRegion;
	var subRegion = rootRegion.getSubRegion(this.id);
	var coordinateField = subRegion.findFieldByName("coordinates");
    var nodeObject = subRegion.getNode(node);
    coordinateField.setValuesAtNode(nodeObject, 0, x, 3);
    
}

ZinxModel.prototype.toJSON = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id', this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('circleDiscretization', this.circleDiscretization);
    data += jsonLiteral('elementDiscretization', this.elementDiscretization);
    data += jsonLiteral('autoload', this.loaded);
    data += jsonResource('Files', this.Files);
    data += jsonResource('Fields', this.Fields);
    data += jsonResource('Graphics', this.Graphics);
    data  = jsonCloseResource(data);
    
    for (var i in this.Files){
        data += this.Files[i].toJSON();
    }
    for (var i in this.Fields){
        data += this.Fields[i].toJSON();
    }
    for (var i in this.Graphics){
        data += this.Graphics[i].toJSON();
    }
    
    return data;

}

ZinxModel.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Model'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.circleDiscretization = json[uri][NS+'circleDiscretization'][0].value;
        this.elementDiscretization = json[uri][NS+'elementDiscretization'][0].value;
        this.autoload = parseJSONDatatype(json[uri][NS+'autoload'][0]);
        for (var i in json[uri][NS+'Files']){
            var fileURI = json[uri][NS+'Files'][i].value;
            file = this.addFile();
            file.fromJSON(json, fileURI);
            file.parent = this;
            file.project = this.project;
        }
        for (var i in json[uri][NS+'Fields']){
            var fieldURI = json[uri][NS+'Fields'][i].value;
            field = this.addField('','');
            field.fromJSON(json, fieldURI);
            field.parent = this;
            field.project = this.project;
        }
        for (var i in json[uri][NS+'Graphics']){
            var graphicURI = json[uri][NS+'Graphics'][i].value;
            var graphicalElement = json[graphicURI][NS+'graphicalElement'][0].value
            var graphic = this.addGraphic(graphicalElement);
            graphic.fromJSON(json, graphicURI);
            graphic.parent = this;
            graphic.project = this.project;
        }
    }else{
        console.warn('Model from JSON: uri ('+uri+') is not a model');
        return -1;
    }
    
    return 1;

}

function ZinxTexture(parent){

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Texture"; });
    
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
    
    if(!this.loaded){
        console.debug("LOADING TEXTURE");
        var nFiles = this.Files.length;
        for(var i=0;i<nFiles;i++){
            var file = this.Files[i];
            console.debug("Downloading "+file.label+" ["+file.id+"]");
            var index = "00000"+(parseInt(i)+1);
            index = index.slice(index.length - 5);
            try {zincDefineMemoryBlock( dm, file.relativePath, "/"+this.id+"slice"+index);}
            catch (e) {	alert ('Unable to find required file '+this.id);}
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
        file.relativePath = path;
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

ZinxTexture.prototype.toJSON = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id', this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('circleDiscretization', this.circleDiscretization);
    data += jsonLiteral('elementDiscretization', this.elementDiscretization);
    data += jsonLiteral('autoload', this.loaded);
    data += jsonResource('Files', this.Files);
    data += jsonResource('Fields', this.Fields);
    data += jsonResource('Graphics', this.Graphics);
    data  = jsonCloseResource(data);
    
    for (var i in this.Files){
        data += this.Files[i].toJSON();
    }
    for (var i in this.Fields){
        data += this.Fields[i].toJSON();
    }
    for (var i in this.Graphics){
        data += this.Graphics[i].toJSON();
    }
    
    return data;

}

ZinxTexture.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Model'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.autoload = parseJSONDatatype(json[uri][NS+'autoload'][0]);
        for (var i in json[uri][NS+'Files']){
            var fileURI = json[uri][NS+'Files'][i].value;
            file = this.addFile();
            file.fromJSON(json, fileURI);
            file.parent = this;
            file.project = this.project;
        }
    }else{
        console.warn('Model from JSON: uri ('+uri+') is not a model');
        return -1;
    }
    
    return 1;

}

function ZinxFile(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "File"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.uri = '_:file'+this.project.idCounter;
    this.id = 'file'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.filename = null;
    this.relativePath = null;
    this.fullPath = null;
    this.index = null;
    
    return 1;

}

ZinxFile.prototype.toJSON = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id',    this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('filename',   this.filename);
    data += jsonLiteral('relativePath', this.relativePath);
    data += jsonLiteral('fullPath',  this.fullPath);
    data += jsonLiteral('index',  this.index);
    data = jsonCloseResource(data);
    
    return data;
}

ZinxFile.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'File'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.filename = json[uri][NS+'filename'][0].value;
        this.relativePath = json[uri][NS+'relativePath'][0].value;
        if(isDefined(json[uri][NS+'fullPath'])){
            this.fullPath = json[uri][NS+'fullPath'][0].value;
        }
        if(isDefined(json[uri][NS+'index'])){
            this.index = json[uri][NS+'index'][0].value;
        }
    }else{
        console.warn('File from JSON: uri ('+uri+') is not a file');
        return -1;
    }
    
    return 1;

}


/**********************************************************************************************/
/****** ZINX BASIC FIELD OBJECT                                                          ******/
/**********************************************************************************************/
function ZinxField(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Field"; });

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

ZinxField.prototype.toJSON = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id',    this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('cmField',   this.cmField);
    data += jsonLiteral('cmCommand', this.cmCommand);
    data += jsonLiteral('autoload',  this.loaded);
    data = jsonCloseResource(data);
    
    return data;
}

ZinxField.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Field'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.cmField = json[uri][NS+'cmField'][0].value;
        this.cmCommand = json[uri][NS+'cmCommand'][0].value;
        this.autoload = parseJSONDatatype(json[uri][NS+'autoload'][0]);
    }else{
        console.warn('Field from JSON: uri ('+uri+') is not a Field');
        return -1;
    }
    
    return 1;

}

/**********************************************************************************************/
/****** ZINX GRAPHICS OBJECT                                                             ******/
/**********************************************************************************************/
function ZinxGraphic(parent) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Graphic"; });

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

    this.toJSON = function() {
    
        var data = jsonOpenResource(this.uri);
        data += jsonLiteral('class', this.class);
        data += jsonLiteral('id',    this.id);
        data += jsonLiteral('label', this.label);
        data += jsonLiteral('graphicalElement', this.graphicalElement);
        data += jsonLiteral('useGlyphField', this.useGlyphField);
        data += jsonLiteral('glyphField', this.glyphField);
        data += jsonLiteral('useDataField', this.useDataField);
        data += jsonLiteral('dataField', this.dataField);
        data += jsonLiteral('autoload', this.visible);
        data += jsonLiteral('visible', this.visible);
        data += jsonResource('material', this.material);
        data += jsonResource('spectrum', this.spectrum);
        data += this.toJSONSubClass();
        data = jsonCloseResource(data);
    
        data += this.material.toJSON();
        data += this.spectrum.toJSON();
    
        return data;
    }
    
    this.fromJSON = function(json, uri) {
    
        var NS = 'http://www.physiome.org.nz/rdf#';
        if(json[uri][NS+'class'][0].value == 'Graphic'){
            this.uri = uri;
            this.id = json[uri][NS+'id'][0].value;
            this.label = json[uri][NS+'label'][0].value;
            this.graphicalElement = json[uri][NS+'graphicalElement'][0].value;
            this.useGlyphField = parseJSONDatatype(json[uri][NS+'useGlyphField'][0]);
            this.glyphField = json[uri][NS+'glyphField'][0].value;
            this.useDataField = parseJSONDatatype(json[uri][NS+'useDataField'][0]);
            this.dataField = json[uri][NS+'dataField'][0].value;
            this.autoload = parseJSONDatatype(json[uri][NS+'autoload'][0]);
            this.visible = parseJSONDatatype(json[uri][NS+'visible'][0]);
            this.material.fromJSON(json, json[uri][NS+'material'][0].value);
            this.spectrum.fromJSON(json, json[uri][NS+'spectrum'][0].value);
            this.fromJSONSubClass(json);
        }else{
            console.warn('File from JSON: uri ('+uri+') is not a file');
            return -1;
        }
        
        return 1;

    }
    
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
            this.visible = true;
        }else{
            gfx("gfx modify g_element "+this.parent.id+" "+graphicalElement+" as "+this.id+" visible;");
            this.visible = false;
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
    this.sizeX = 0.1;
    this.sizeY = 0.1;
    this.sizeZ = 0.1;
    this.useLabels = false
    this.labelField = "cmiss_number"
    
    return 1;

}

ZinxNodePoints.prototype.load = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    if(!this.loaded){

        this.material.load();

        var gfxCommand = "gfx modify g_element "+this.parent.id+" node_points as "+this.id;
        gfxCommand += " glyph "+this.glyph;
        gfxCommand += " size "+this.sizeX+"*"+this.sizeY+"*"+this.sizeZ;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			gfxCommand += " label "+this.labelField;
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
        gfxCommand += " size "+this.sizeX+"*"+this.sizeY+"*"+this.sizeZ;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			gfxCommand += " label "+this.labelField;
		}
        gfxCommand += " material "+this.material.id;
        gfx(gfxCommand);

        this.loaded = true;
        this.visible = true;
    }
}

ZinxNodePoints.prototype.toJSONSubClass = function() {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var data = "";
    data += jsonLiteral('glyph', this.glyph);
    data += jsonLiteral('sizeX', this.sizeX);
    data += jsonLiteral('sizeY', this.sizeY);
    data += jsonLiteral('sizeZ', this.sizeZ);
    data += jsonLiteral('useLabels', this.useLabels);
    data += jsonLiteral('labelField', this.labelField);
    
    return data;
}

ZinxNodePoints.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.glyph = json[this.uri][NS+'glyph'][0].value;
    this.sizeX = json[this.uri][NS+'sizeX'][0].value;
    this.sizeY = json[this.uri][NS+'sizeY'][0].value;
    this.sizeZ = json[this.uri][NS+'sizeZ'][0].value;
    this.useLabels = parseJSONDatatype(json[this.uri][NS+'useLabels'][0].value);
    this.labelField = json[this.uri][NS+'labelField'][0].value;

}

function ZinxElementPoints(parent) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

    this.label.replace('Graphics', 'ElementPoints');
    this.graphicalElement = 'ElementPoints'
    this.glyph = "sphere";
    this.sizeX = 0.1;
    this.sizeY = 0.1;
    this.sizeZ = 0.1;
    this.discretizationX = 3;
    this.discretizationY = 3;
    this.discretizationZ = 3;
    this.distribution = "cell_centres";
    this.useLabels = false
    this.labelField = "cmiss_number"
    
}

ZinxElementPoints.prototype.load = function() {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
        
     if(!this.loaded){
        
        this.material.load();
        
        var gfxCommand = "gfx modify g_element "+this.parent.id+" element_points as "+this.id;
        gfxCommand +=  " glyph "+this.glyph;
        gfxCommand +=  " size "+this.sizeX+"*"+this.sizeY+"*"+this.sizeZ;
        gfxCommand +=  " discretization "+this.discretizationX+"*"+this.discretizationY+"*"+this.discretizationZ;
        gfxCommand +=  " "+this.distribution;
        gfxCommand += " material "+this.material.id;
		if(this.useGlyphField && this.glyphField.length){
			gfxCommand += " orientation "+this.glyphField;
		}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			gfxCommand += " label "+this.labelField;
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
        gfxCommand +=  " size "+this.sizeX+"*"+this.sizeY+"*"+this.sizeZ;
        gfxCommand +=  " discretization "+this.discretizationX+"*"+this.discretizationY+"*"+this.discretizationZ;
        gfxCommand +=  " "+this.distribution;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
		if(this.useLabels){
			gfxCommand += " label "+this.labelField;
		}
        gfx(gfxCommand);
    }
    
}

ZinxElementPoints.prototype.toJSONSubClass = function() {
    
    var data = "";
    data += jsonLiteral('glyph', this.glyph);
    data += jsonLiteral('distribution', this.distribution);
    data += jsonLiteral('sizeX', this.sizeX);
    data += jsonLiteral('sizeY', this.sizeY);
    data += jsonLiteral('sizeZ', this.sizeZ);
    data += jsonLiteral('discretizationX', this.discretizationX);
    data += jsonLiteral('discretizationY', this.discretizationY);
    data += jsonLiteral('discretizationZ', this.discretizationZ);
    data += parseJSONDatatype(jsonLiteral('useLabels', this.useLabels));
    data += jsonLiteral('labelField', this.labelField);
    
    return data;
}

ZinxElementPoints.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.glyph = json[this.uri][NS+'glyph'][0].value;
    this.distribution = json[this.uri][NS+'distribution'][0].value;
    this.sizeX = json[this.uri][NS+'sizeX'][0].value;
    this.sizeY = json[this.uri][NS+'sizeY'][0].value;
    this.sizeZ = json[this.uri][NS+'sizeZ'][0].value;
    this.discretizationX = json[this.uri][NS+'discretizationX'][0].value;
    this.discretizationY = json[this.uri][NS+'discretizationY'][0].value;
    this.discretizationZ = json[this.uri][NS+'discretizationZ'][0].value;
    this.useLabels = json[this.uri][NS+'useLabels'][0].value;
    this.labelField = json[this.uri][NS+'labelField'][0].value;

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
        gfxCommand += " material "+this.material.id;
        if(this.exterior){gfxCommand +=  " exterior";}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
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
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
        gfx(gfxCommand);
    }
}

ZinxLines.prototype.toJSONSubClass = function() {
    
    var data = "";
    data += jsonLiteral('width', this.width);
    data += jsonLiteral('exterior', this.exterior);
    
    return data;
}

ZinxLines.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.width = json[this.uri][NS+'width'][0].value;
    this.exterior = parseJSONDatatype(json[this.uri][NS+'exterior'][0]);

}

function ZinxCylinders(parent) {

    this.label.replace('Graphics', 'Cylinders');
    this.inheritFrom = ZinxGraphic;
    this.inheritFrom(parent);

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
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
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
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
        gfx(gfxCommand);
    }
}

ZinxCylinders.prototype.toJSONSubClass = function() {
    
    var data = "";
    data += jsonLiteral('radius', this.radius);
    
    return data;
}

ZinxCylinders.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.raius = json[this.uri][NS+'radius'][0].value;

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
        gfxCommand += " material "+this.material.id;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
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
        if(this.exterior){gfxCommand +=  " exterior";}
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
        gfx(gfxCommand);
    }
}

ZinxSurface.prototype.toJSONSubClass = function() {
    
    var data = "";
    data += jsonLiteral('exterior', this.exterior);
    
    return data;
}

ZinxSurface.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.exterior = parseJSONDatatype(json[this.uri][NS+'exterior'][0]);

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
        gfxCommand += " material "+this.material.id;
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
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
		if(this.useDataField && this.dataField.length){
			this.spectrum.load();
			gfxCommand += " data "+this.dataField+" spectrum "+this.spectrum.id;
		}
        gfx(gfxCommand);
    }
}

ZinxIsoSurfaces.prototype.toJSONSubClass = function() {
    
    var data = "";
    data += jsonLiteral('iso_scalar', this.isoField);
    data += jsonLiteral('iso_values', this.isoValues);
    
    return data;
}

ZinxIsoSurfaces.prototype.fromJSONSubClass = function(json) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    this.isoField = json[this.uri][NS+'iso_scalar'][0].value;
    this.isoValues = json[this.uri][NS+'iso_values'][0].value;

}


/**********************************************************************************************/
/****** ZINX MATERIAL OBJECT                                                             ******/
/**********************************************************************************************/

function ZinxMaterial(parent) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    this.__defineGetter__("class", function()  { return "Material"; });
    
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

ZinxMaterial.prototype.toJSON = function() {
    
    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id', this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('shading', this.shading);
    data += jsonLiteral('alpha', this.alpha);
    data += jsonLiteral('shininess', this.shininess);
    data += jsonResource('ambient', this.ambient);
    data += jsonResource('diffuse', this.diffuse);
    data += jsonResource('emission', this.emission);
    data += jsonResource('specular', this.specular);
    data = jsonCloseResource(data);
    
    data += this.ambient.toJSON();
    data += this.diffuse.toJSON();
    data += this.emission.toJSON();
    data += this.specular.toJSON();
    
    return data;
}

ZinxMaterial.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Material'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.shading = json[uri][NS+'shading'][0].value;
        this.alpha = json[uri][NS+'alpha'][0].value;
        this.shininess = json[uri][NS+'shininess'][0].value;
        this.ambient.fromJSON(json, json[uri][NS+'ambient'][0].value);
        this.diffuse.fromJSON(json, json[uri][NS+'diffuse'][0].value);
        this.emission.fromJSON(json, json[uri][NS+'emission'][0].value);
        this.specular.fromJSON(json, json[uri][NS+'specular'][0].value);
    }else{
        console.warn('Material from JSON: uri ('+uri+') is not a material');
        return -1;
    }
    
    return 1;

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
    
    this.__defineGetter__("class", function()  { return "Spectrum"; });

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

ZinxSpectrum.prototype.toJSON = function() {
    
    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id',    this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('colour',   this.colour);
    data += jsonLiteral('reverse', this.reverse);
    data += jsonLiteral('maximumValue',  this.maximumValue);
    data += jsonLiteral('minimumValue',  this.minimumValue);
    data += jsonLiteral('extendAbove',  this.extendAbove);
    data += jsonLiteral('extendBelow',  this.extendBelow);
    data = jsonCloseResource(data);
    
    return data;
}

ZinxSpectrum.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Spectrum'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.colour = json[uri][NS+'colour'][0].value;
        this.reverse = parseJSONDatatype(json[uri][NS+'reverse'][0]);
        this.maximumValue = json[uri][NS+'maximumValue'][0].value;
        this.minimumValue = json[uri][NS+'minimumValue'][0].value;
        this.extendAbove = parseJSONDatatype(json[uri][NS+'extendAbove'][0]);
        this.extendBelow = parseJSONDatatype(json[uri][NS+'extendBelow'][0]);
    }else{
        console.warn('Spectrum from JSON: uri ('+uri+') is not a spectrum');
        return -1;
    }
    
    return 1;

}

/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX COLOUR OBJECT                                                                     ***/
/**********************************************************************************************/
/**********************************************************************************************/

function ZinxColour(parent) {

    this.__defineGetter__("class", function()  { return "Colour"; });

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

ZinxColour.prototype.toJSON = function() {
    
    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id',    this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('red',   this.red);
    data += jsonLiteral('green', this.green);
    data += jsonLiteral('blue',  this.blue);
    data = jsonCloseResource(data);
    
    return data;
}

ZinxColour.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'Colour'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.red = json[uri][NS+'red'][0].value;
        this.green = json[uri][NS+'green'][0].value;
        this.blue = json[uri][NS+'blue'][0].value;
    }else{
        console.warn('Colour from JSON: uri ('+uri+') is not a colour');
        return -1;
    }
    
    return 1;

}

/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX SCENE OBJECT                                                                      ***/
/**********************************************************************************************/
/**********************************************************************************************/

function ZinxView(parent) {

    this.__defineGetter__("class", function()  { return "View"; });
    
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
            console.debug("Setting view parameters");
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

ZinxView.prototype.toJSON = function() {
    
    var data = jsonOpenResource(this.uri);
    data += jsonLiteral('class', this.class);
    data += jsonLiteral('id',    this.id);
    data += jsonLiteral('label', this.label);
    data += jsonLiteral('camera', this.camera);
    data += jsonLiteral('target', this.target);
    data += jsonLiteral('up', this.up);
    data += jsonLiteral('viewAngle', this.viewAngle);
    data = jsonCloseResource(data);
    
    return data;
}

ZinxView.prototype.fromJSON = function(json, uri) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var NS = 'http://www.physiome.org.nz/rdf#';
    if(json[uri][NS+'class'][0].value == 'View'){
        this.uri = uri;
        this.id = json[uri][NS+'id'][0].value;
        this.label = json[uri][NS+'label'][0].value;
        this.camera = [json[uri][NS+'camera'][0].value,json[uri][NS+'camera'][1].value, json[uri][NS+'camera'][2].value];
        this.target = [json[uri][NS+'target'][0].value,json[uri][NS+'target'][1].value, json[uri][NS+'target'][2].value];
        this.up = [json[uri][NS+'up'][0].value,json[uri][NS+'up'][1].value, json[uri][NS+'up'][2].value];
        this.viewAngle = json[uri][NS+'viewAngle'][0].value;
    }else{
        console.warn('View from JSON: uri ('+uri+') is not a view');
        return -1;
    }
    
    return 1;

}
/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX I/O                                                                          ***/
/**********************************************************************************************/
/**********************************************************************************************/
function padStringWithSpaces(str, totalLength){
    
    if(str.length <= totalLength){
        str = str + Array(totalLength + 1 - str.length).join(' ');
    }
    return str;
}

function jsonOpenResource(resource){ return '"'+resource+'":{\n'; }

function jsonCloseResource(json){ return json.substr(0, json.length-2)+'\n},\n'; }

function jsonLiteral(property, value){
    
    json = "";
    if(isDefined(value) || value != null){
        var NS = "http://www.physiome.org.nz/rdf#";
        if (Object.prototype.toString.apply(value) == '[object Array]'){
            resourceString = padStringWithSpaces('    "'+NS+property+'":', 60)
            var json =  resourceString+' [\n';
            for (var i in value){
                if(typeof value[i] == 'string'){
                    json += '        {"value": "'+value[i]+'", "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#string" }';
                }else if(typeof value[i] == 'boolean'){
                    json += '        {"value": '+value[i]+', "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#boolean" }';
                }else if(typeof value[i] == 'number'){
                    json += '        {"value": '+value[i]+', "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#decimal" }';
                }else{
                    console.warn("Unknown datatype: "+property+" = "+value[i]);
                }
                if (i<value.length-1) { json += ',\n'; }
                else { json += '\n'; }
            }
            json += '    ],\n'
        }else{
            resourceString = padStringWithSpaces('    "'+NS+property+'":', 60);
            if(typeof value == 'string'){
                var json = resourceString+'[{"value": "'+value+'", "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#string" }],\n';
            }else if(typeof value == 'boolean'){
                var json = resourceString+'[{"value": '+value+', "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#boolean" }],\n';
            }else if(typeof value == 'number'){
                var json =  resourceString+'[{"value": '+value+', "type":"literal", "datatype":"http://www.w3.org/2001/XMLSchema#decimal" }],\n';
            }else{
                console.warn("Unknown datatype: "+property+" = "+value);
            }
        }
    }
    return json;
}

function parseJSONDatatype(data){
    if(data.datatype == "http://www.w3.org/2001/XMLSchema#string"){
        return data.value;
    }else if(data.datatype == "http://www.w3.org/2001/XMLSchema#decimal"){
        return parseFloat(data.value);
    }else if(data.datatype == "http://www.w3.org/2001/XMLSchema#boolean"){
        return Boolean(data.value);
    }else{
        alert("Unknown datatype");
    }
    
}

function jsonResource(property, object){
    var NS = "http://www.physiome.org.nz/rdf#";
    if (Object.prototype.toString.apply(object) == '[object Array]'){
        resourceString = padStringWithSpaces('    "'+NS+property+'":', 60)
        var json =  resourceString+'[\n';
        for (var i in object){
            json += padStringWithSpaces('', 60)+' {"value": "'+object[i].uri+'", "type":"uri" }'
            if (i<object.length-1) { json += ',\n'; }
            else { json += '\n'; }
        }
        json += '    ],\n'
    }else{
        resourceString = padStringWithSpaces('    "'+NS+property+'":', 60)
        var json =  resourceString+'[{"value": "'+object.uri+'", "type":"uri" }],\n';
    }
    return json;
}

function saveLocalFile(savefile, data) {

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    var zinxPath = document.location.pathname;
    var zinxPathFolders = zinxPath.split("/");
    zinxPathFolders.pop();
    zinxPath = zinxPathFolders.join("/");
    file.initWithPath( zinxPath+'/'+savefile );
    
    if ( file.exists() == false ) {
        console.debug("Creating file... ");
        file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
    }
    
    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance( Components.interfaces.nsIFileOutputStream );

    outputStream.init( file, 0x04 | 0x08 | 0x20, 420, 0 );
    //var output = document.getElementById('FileData').value;
    var result = outputStream.write( data, data.length );
    outputStream.close();

}

function readLocalFile(localfile) {
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath( localfile );
    if ( file.exists() == false ) {
        alert("File does not exist");
    }
    var is = Components.classes["@mozilla.org/network/file-input-stream;1"]
        .createInstance( Components.interfaces.nsIFileInputStream );
    is.init( file,0x01, 00004, null);
    var sis = Components.classes["@mozilla.org/scriptableinputstream;1"]
        .createInstance( Components.interfaces.nsIScriptableInputStream );
    sis.init( is );
    
    return sis.read( sis.available() );
}

function readRemoteFile(file, project){
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", file, true);
    xmlhttp.onreadystatechange = new RunnableFunctionWrapper(project.bootstrap, xmlhttp);
    xmlhttp.send(null);
    
}

function selectLocalFile() {
        
    // File picker
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Select Files", nsIFilePicker.modeOpenMultiple);
    fp.appendFilter("Cmgui Files","*.exelem; *.exnode");
    fp.appendFilters(nsIFilePicker.filterAll);
    var res = fp.show();
    
    // Save files
    if (res == nsIFilePicker.returnOK){
        var filePaths = new Array;
        var files = fp.files;
        var fileInterface = Components.interfaces.nsILocalFile;
        while (files.hasMoreElements()) 
        {
            filePaths.push(files.getNext().QueryInterface(fileInterface).path);
        }
    }
    return filePaths;
}


function relativePath(filePath){
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	
	if(filePath.match("^./")){
		var relativePath = filePath.replace("./","");;
	
	}else{
		var zinxPath = document.location.pathname;
		var zinxPathFolders = zinxPath.split("/");
		zinxPathFolders.pop();
		zinxPath = zinxPathFolders.join("/");
	
		var path = Components.classes["@mozilla.org/file/local;1"]
                     .createInstance(Components.interfaces.nsILocalFile);
		path.initWithPath(zinxPath);
		var file = Components.classes["@mozilla.org/file/local;1"]
                     .createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(filePath);
	
		var relativePath = file.getRelativeDescriptor(path);
	}
	
	return relativePath;
}

function fileRelativeToFolder(file, folder){
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	
	//var folders = folder.split("/");
	//folders.pop();
	//folder = folders.join("/");
	
	var pathInterface = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsILocalFile);
	pathInterface.initWithPath(folder);
	var fileInterface = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsILocalFile);
	fileInterface.initWithPath(file);
	
	var relativePath = fileInterface.getRelativeDescriptor(pathInterface);
	
	return relativePath;
}

/********************************************************************************************/
/****** GENERAL FUNCTIONS                                                              ******/
/********************************************************************************************/

function gfx(str){
    console.debug(str);
	try {window.commandData.executeCommand(str);}
	catch (e) {	alert ('Zinc command failed: ' + str);}
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
