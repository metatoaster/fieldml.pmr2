function ZinxProject(){
	
    this.__defineGetter__("class", function()  { return "ZinxProject"; });
    
    this.Counters = {'models':0};
    this.idCounter = 0;
    this.id = 'project';
    this.path = '.';
    
    this.zincPlugin = null;
    this.ZincInitialised = false;
    this.ZincSceneLoaded = false;
    
    this.Scenes = [];
    this.Models = [];
    this.Images = [];
    this.Views = [];
    
    // Builtin Colours for cloning
    this.colours = new Array();
    this.colours["default"] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0];
    this.colours["black"]   = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.3, 1.0, 0.2];
    this.colours["blue"]    = [0.0, 0.0, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 1.0];
    this.colours["bone"]    = [0.7, 0.7, 0.6, 0.9, 0.9, 0.7, 0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 1.0, 0.2];
    this.colours["gold"]    = [1.0, 0.4, 0.0, 1.0, 0.7, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.3];
    this.colours["gray"]    = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 0.2];
    this.colours["green"]   = [0.0, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 0.1];
    this.colours["muscle"]  = [0.4, 0.14, 0.11, 0.5, 0.12, 0.1, 0.0, 0.0, 0.0, 0.3, 0.5, 0.5, 1.0, 0.2];
    this.colours["red"]     = [0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.2, 1.0, 0.2];
    this.colours["silver"]  = [0.4, 0.4, 0.4, 0.7, 0.7, 0.7, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.3];
    this.colours["tissue"]  = [0.9, 0.7, 0.5, 0.9, 0.7, 0.5, 0.0, 0.0, 0.0, 0.2, 0.2, 0.3, 1.0, 0.2];
    this.colours["white"]   = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0];
    
}

ZinxProject.prototype.addScene = function(scene_id) {
	
    this.Scenes.push(scene_id);
    
    if(this.zincPlugin==null){
		this.zincPlugin = document.getElementById(this.Scenes[0]);
	}
    
    return;

}

ZinxProject.prototype.addModel = function() {
	
    var model = new ZinxModel(this);
    if(arguments.length>=1){
		model.region = arguments[0]
	}
    if(arguments.length>=2){
		model.id = arguments[1]
	}
    this.Models.push(model);
    
    return model;

}

ZinxProject.prototype.findModelsByLabel = function(label) {
	
    var models = []
	for(m in this.Models){
        model = this.Models[m];
        if(model.label==label){
            models.push(model);
        }
    }
    return models;
}

ZinxProject.prototype.addImage = function() {
	
    var image = new ZinxImage(this);
    if(arguments.length>=1){
		image.region = arguments[0]
	}
    if(arguments.length>=2){
		image.id = arguments[1]
	}
    this.Images.push(image);
    
    return image;

}

ZinxProject.prototype.loadModels = function() {
	
    var dm = this.zincPlugin.createDownloadManager();
	
	Models = []
	for(i in this.Models){
		model = this.Models[i]
		if(model.load(dm)){
			Models.push(model);
		}
	}
    
    Images = []
	for(i in this.Images){
		image = this.Images[i]
		if(image.load(dm)){
			Images.push(image);
		}
	}
	
    loadFunction = function(){};
    if(arguments.length==1){
		loadFunction = arguments[0]
	}
	
	loadFunction('preLoad', Models, Images);
	dm.addCompletionCallback(this.renderModels(Models, Images, loadFunction));
	loadFunction('postLoad', Models, Images);
    
    return;

}

ZinxProject.prototype.renderModels = function(Models, Images, loadFunction) {
	
	return function(){
		loadFunction('preRender', Models, Images);
		for(i in Images){
			Images[i].render();
		}
		for(m in Models){
			Models[m].render();
		}
		loadFunction('postRender', Models, Images);
	}

}



/**********************************************************************************************/
/****** ZINX MODEL OBJECT                                                                ******/
/**********************************************************************************************/
function ZinxModel(parent){
	
    this.__defineGetter__("class", function()  { return "ZinxModel"; });
    
    this.parent = parent;
    this.project = parent;
    
    this.project.Counters['models'] += 1;
    this.id = 'model'+this.project.Counters['models'];
    this.region = '';
    
    this.autoload = true;
    this.loaded = false;
    this.loadInProgress = false;
    this.reload = false;
    this.visible = true;
    this.clearMemory = true;
    
    this.subRegion = null;
    this.discretization = 8;
    
    this.Files = [];
    this.ExternalResources = [];
    this.Images = [];
    this.Fields = [];
    this.Graphics = [];

}

ZinxModel.prototype.addFile = function(path) {
	
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

ZinxModel.prototype.addExternalResource = function(path) {
	
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
    this.ExternalResources.push(file);
    return file;

}

ZinxModel.prototype.addImage = function(path) {
	
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
    this.Images.push(file);
    return file;

}

ZinxModel.prototype.addField = function(type, properties) {
    var field = new ZinxField(this, type, properties);
    this.Fields.push(field);
    return field;
}

ZinxModel.prototype.addGraphic = function(type) {
    var graphic = new ZinxGraphic(this, type);
    this.Graphics.push(graphic);
    return graphic;
}

ZinxProject.prototype.addView = function() {

    var view = new ZinxView(this);
    view.getView();
    this.Views.push(view);
    this.defaultView = this.Views.length-1;
    return view;

}

ZinxModel.prototype.findGraphicsByLabel = function(label) {
	
    var graphics = []
	for(g in this.Graphics){
        graphic = this.Graphics[g];
        if(graphic.label==label){
            graphics.push(graphic);
        }
    }
    return graphics;
}

ZinxModel.prototype.load = function(dm) {
	
    var added = false;
	if((this.autoload && !this.loaded && !this.loadInProgress) || (this.reload)){
		
		msg(2, 'Loading model: '+model.id);
		
		if(this.reload){ this.loaded = false; }
		this.loadInProgress = true;
		
		for(f in this.Files){
			file = this.Files[f];
			msg(2, 'Downloading file: '+this.project.path+file.path);
			file.download_item = dm.addURI(this.project.path+file.path);
		}
		for(e in this.ExternalResources){
			externalResources = this.ExternalResources[e];
			msg(2, 'Downloading file: '+this.project.path+externalResources.path);
			externalResources.download_item = dm.addURI(this.project.path+externalResources.path);
		}
		for(i in this.Images){
			image = this.Images[i];
			msg(2, 'Downloading image: '+this.project.path+image.path);
			image.download_item = dm.addURI(this.project.path+image.path);
		}
        
		added = true;
	}
	
	return added;
}

ZinxModel.prototype.render = function() {
	
	msg(2, 'Rendering model: '+this.region+'/'+this.id);
	
	// Get/Create region
    if(this.subRegion==null){
        var regions = (this.region+'/'+this.id).split('/');
        var subRegion = this.project.zincPlugin.context.getDefaultRegion();
        for(r in regions){
            if(regions[r].length>0){
                var childRegion = subRegion.findSubregionAtPath(regions[r]);
                if(childRegion){
                    subRegion = childRegion;
                }else{
                    subRegion = subRegion.createChild(regions[r]);
                }
            }
        }
        this.subRegion = subRegion;
    }
	
	// Load files from memory
	var streamInformation = this.subRegion.createStreamInformation();
    for(f in this.Files){
        streamInformation.createResourceDownloadItem(this.Files[f].download_item);
	}
	 for(e in this.ExternalResources){
        var streamResource = streamInformation.createResourceDownloadItem(this.ExternalResources[e].download_item);
		streamInformation.setResourceURI(streamResource, this.ExternalResources[e].path);
		streamInformation.setResourceParse(streamResource, 0);
	}
	
    this.subRegion.read(streamInformation);
    var fieldModule = this.subRegion.getFieldModule();
    fieldModule.defineAllFaces();
    
    if(this.Images.length>0){
        var xiField = fieldModule.findFieldByName("xi");
        this.imageField = fieldModule.createImage(xiField);
        this.imageField.setName("sunset"); // TODO: CHANGE TO this.id ************************
        var imageStreamInformation = this.imageField.createStreamInformation();
        for(i in this.Images){
       		imageStreamInformation.createResourceDownloadItem(this.Images[i].download_item);
        }
        this.imageField.read(imageStreamInformation);
    }
    
    this.loaded = true;
	this.loadInProgress = false;
    
    // Clearing download items if clearMemory is set to true.
    if(this.clearMemory){
        msg(3, 'Clearing memory');
        //~ for(f in this.Files){
            //~ delete this.Files[f].download_item;
        //~ }
        for(i in this.Images){
            this.Images[i].download_item = null;
        }
    }
    
	// Load fields
	for(f in this.Fields){
		field = this.Fields[f].load();
	}
    
	// Initialise rendition
	// TODO: check this isn't expensive
	this.rendition = this.project.zincPlugin.context.getDefaultGraphicsModule().getRendition(this.subRegion);
	
    // Load graphics
	this.rendition.beginChange();
	this.rendition.executeCommand('general clear element_discretization '+this.discretization+' circle_discretization 8');
	for(g in this.Graphics){
		graphic = this.Graphics[g].load();
	}
	this.rendition.endChange();
	
}

ZinxModel.prototype.viz = function(value) {
    for(var g in this.Graphics){
        this.Graphics[g].viz(value);
    }
}

/**********************************************************************************************/
/****** ZINX FILE OBJECT                                                                 ******/
/**********************************************************************************************/
function ZinxFile(parent) {
	
    this.__defineGetter__("class", function()  { return "ZinxFile"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.id = 'file'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.filename = null;
    this.path = null;
    this.index = null;
    this.reload = true;
    
    this.free_memory_block = true;

}

/**********************************************************************************************/
/****** ZINX FIELD OBJECT                                                                ******/
/**********************************************************************************************/
function ZinxField(parent, type, properties) {
    
    this.__defineGetter__("class", function()  { return "ZinxField"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.id = 'field'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.autoload = true;
    this.loaded = false;

    this.type = type;
    this.properties = properties;
    
}

ZinxField.prototype.load = function() {
	
    if(!this.loaded){
        var fieldModule = this.parent.subRegion.getFieldModule();
        fieldModule.defineField(this.id, this.type+" "+this.properties);
        this.loaded = true;
    }
    return this;
}

/**********************************************************************************************/
/**********************************************************************************************/
/*** ZINX SCENE VIEWER OBJECT                                                               ***/
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
        if(!isDefined(this.viewAngle) || this.viewAngle==null){
            console.debug("Getting view parameters");
            this.getView();
        }else{
            console.debug("Setting view parameters "+this.id);
            this.setView();
        }
}
    
ZinxView.prototype.getView = function() {
    console.debug("Getting View");
    if(this.parent.zincPlugin.sceneViewer){
        var parameters = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]; 
    
        this.parent.zincPlugin.sceneViewer.getLookAtParameters(
            parameters);
        var viewAngle = this.parent.zincPlugin.sceneViewer.viewAngle;

        this.camera = [parameters[0], parameters[1], parameters[2]];
        this.target = [parameters[3], parameters[4], parameters[5]];
        this.up     = [parameters[6], parameters[7], parameters[8]];
        this.viewAngle = viewAngle;
    }
    
}
    
ZinxView.prototype.setView = function() {
          
    var cameraX = this.camera[0];   var cameraY = this.camera[1];   var cameraZ = this.camera[2];
    var targetX = this.target[0]; var targetY = this.target[1]; var targetZ = this.target[2];
    var upX = this.up[0];    var upY = this.up[1]; var upZ = this.up[2];
    var viewAngle = this.viewAngle;
        
    this.parent.zincPlugin.sceneViewer.setLookAtParametersNonSkew(cameraX, cameraY, cameraZ,
        targetX, targetY, targetZ, upX, upY, upZ);
    this.parent.zincPlugin.sceneViewer.viewAngle = viewAngle;
}
    
ZinxView.prototype.viewAll = function()
{
    this.parent.zincPlugin.sceneViewer.viewAll();
}


/**********************************************************************************************/
/****** ZINX GRAPHICS OBJECT                                                             ******/
/**********************************************************************************************/
function ZinxGraphic(parent, type) {
    
    this.__defineGetter__("class", function()  { return "ZinxGraphic"; });

    this.parent = parent;
    this.project = parent.project;
    
    this.project.idCounter += 1;
    this.id = 'graphic'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    this.autoload = true;
    this.loaded = false;
    this.visible = true;
    
    this.type = type;
    
    this.material = new ZinxMaterial(this);
    this.spectrum = new ZinxSpectrum(this);
    
    this.coordinatesField = 'coordinates';
    
    this.useData = false;
    this.dataField = 'coordinates';
	
	this.glyph = "sphere";
    this._size = [0.1,0.1,0.1];
    this._scale = [1,1,1]
    
    this.orientGlyph = false;
    this.orientField = 'coordinates';
    
    this.useLabels = false
    this.labelField = "cmiss_number"
	
    this.useTexture = false
    this.textureCoordinates = 'coordinates';
	   
	this._discretization = [3,3,3];
    this.distribution = "cell_centres";
    
   	this.useXiFace = false;
 	this.xiFace = 'xi1_0';
	    
	this.exterior = false;
		
	if (this.type=='cylinders'){
		this._size = [0.1,0.1,0.1];
	}
	
	this.isoField = "coordinates.x";
	this.isoValues = "0.5";
    
}

ZinxGraphic.prototype.viz = function(value) {
    
    if(value=='off'){
        this.visible = false;
        this.update();
    }else if(value=='on'){
        this.visible = true;
        this.update();
    }else{
        this.material.alpha = value;
    }
    
    
    //~ if(value=='off'){
        //~ console.debug('off');
        //~ var graphic = this.parent.rendition.getFirstGraphic();
        //~ if (graphic){
            //~ this.parent.rendition.beginChange();
            //~ graphic.setVisibilityFlag(0);
            //~ this.parent.rendition.endChange();
        //~ }
        //~ this.visible = false;
        //~ 
    //~ }else if(value=='on'){
        //~ console.debug('on');
        //~ var graphic = this.parent.rendition.getFirstGraphic();
        //~ if (graphic){
            //~ console.debug(graphic)
            //~ this.parent.rendition.beginChange();
            //~ graphic.setVisibilityFlag(1);
            //~ this.parent.rendition.endChange();
        //~ }
        //~ this.visible = true;
        //~ 
    //~ }else{
        //~ this.material.alpha = value;
    //~ }
    
}

ZinxGraphic.prototype.command = function() {
    var material = ' material '+this.material.id;
    
    var glyph = " glyph "+this.glyph;
    var size = " size "+this._size[0]+"*"+this._size[1]+"*"+this._size[2];
    var scaleFactors = " scale_factors \""+this._scale[0]+"*"+this._scale[1]+"*"+this._scale[2]+"\"";
    var discretization =  " discretization "+this._discretization[0]+"*"+this._discretization[1]+"*"+this._discretization[2];
    var distribution =  " "+this.distribution;
    var coordinatesField =  " coordinate "+this.coordinatesField;
    var lineWidth = " line_width "+this._size[0];
    var radius = " constant_radius "+this._size[0];
    
    var exterior = '';
    if(this.exterior){ exterior = ' exterior '; }
    
    if(this.visible){
        var visible = ' visible';
    }else{
        var visible = ' invisible';
    }
        
    var dataField = ''
    if(this.useData){
        this.spectrum.load();
        dataField = " data "+this.dataField+" spectrum "+this.spectrum.id;
    }
    
    var orient = ''
    if(this.orientGlyph){
        orient = " orientation "+this.orientField;
    }
    
    var labels = ''
    if(this.useLabels){
        labels = " label "+this.labelField;
    }
    
    var texture = ''
    if(this.useTexture){
        texture = " texture_coordinates "+this.textureCoordinates;
    }
    
    var face = '';
    if(this.useXiFace){
        face = " face "+ this.xiFace;
    }
    
    var isoField = " iso_scalar "+this.isoField;
    var isoValues = " iso_values "+parseIsoValues(this.isoValues);

    var command = this.gelem+' as ' +this.id+' ';
    if (this.type=='nodepoints'){
        command += glyph + size + scaleFactors;
        command += orient +labels;
        
    }else if (this.type=='elementpoints'){
        command += glyph +size + scaleFactors;
        command += discretization +distribution +orient +labels;
    
    }else if (this.type=='lines'){
        command += lineWidth +exterior;
        
    }else if (this.type=='cylinders'){
        command += radius +exterior;
        
    }else if (this.type=='surfaces'){
        command +=exterior;
        if (this.useXiFace == true)
 		command += face;
    
    }else if (this.type=='isosurfaces'){
        this.material.material.setImageField(1, this.parent.imageField); 
        command +=isoField +isoValues;
    }
    
    command += coordinatesField;
    command += material;
    command += texture;
    command += dataField;
    command += visible;
    
    return command;
}

ZinxGraphic.prototype.load = function() {
    if(!this.loaded & this.autoload){
        this.material.load();
        var command = this.command()
		msg(3, 'Loading graphics: '+command);
		console.log(command);
		this.parent.rendition.executeCommand(command);
        this.loaded = true;
    }
}

ZinxGraphic.prototype.update = function() {
    if(this.loaded){
		this.parent.rendition.executeCommand(this.command());
    }else{
        this.autoload = true;
        this.load();
    }
}

ZinxGraphic.prototype.__defineGetter__("type", function() {
    return this._type;
});

ZinxGraphic.prototype.__defineSetter__("type", function(x) {
    this._type = x;
    if(this.type.localeCompare("nodepoints") == 0){this.gelem = "node_points";}
    else if(this.type.localeCompare("elementpoints") == 0){this.gelem = "element_points";}
    else if(this.type.localeCompare("IsoSurfaces") == 0){this.gelem = "iso_surfaces";}
    else if(this.type.localeCompare("lines") == 0){this.gelem = "lines";}
    else if(this.type.localeCompare("cylinders") == 0){this.gelem = "cylinders";}
    else if(this.type.localeCompare("surfaces") == 0){this.gelem = "surfaces";}
});

ZinxGraphic.prototype.__defineGetter__("size", function() {
    return this._size;
});

ZinxGraphic.prototype.__defineSetter__("size", function(x) {
    if(typeof x=="number"){
        this._size = [x,x,x]
    }else{
        this._size = x
    }
});

ZinxGraphic.prototype.__defineGetter__("scale", function() {
    return this._scale;
});

ZinxGraphic.prototype.__defineSetter__("scale", function(x) {
    if(typeof x=="number"){
        this._scale = [x,x,x]
    }else{
        this._scale = x
    }
});

ZinxGraphic.prototype.__defineGetter__("discretization", function() {
    return this._discretization;
});

ZinxGraphic.prototype.__defineSetter__("discretization", function(x) {
    if(typeof x=="number"){
        this._discretization = [x,x,x]
    }else{
        this._discretization = x
    }
});

function parseIsoValues(def){
	def = String(def)
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


/**********************************************************************************************/
/****** ZINX MATERIAL OBJECT                                                             ******/
/**********************************************************************************************/

function ZinxMaterial(parent) {
	
    this.__defineGetter__("class", function()  { return "ZinxMaterial"; });
    
    this.parent = parent;
    this.project = this.parent.project;
    
    this.project.idCounter += 1;
    this.id = 'material'+this.project.idCounter;
    this.label = this.class+" "+this.project.idCounter;
    
    this._alpha = 1;
    this._shininess = 1;
    this._ambient  = [1.0, 1.0, 1.0];
    this._diffuse  = [1.0, 1.0, 1.0];
    this._emission = [0.0, 0.0, 0.0];
    this._specular = [0.0, 0.0, 0.0];
    
    this.material = null;

    this.loaded = false;
	
	this.__defineGetter__("ambient", function(values) {return this._ambient;});
	this.__defineSetter__("ambient", function(values) {
		this._ambient = values;
		if(this.material){
			this.material.setAttributeReal3(this.material.ATTRIBUTE.AMBIENT, this._ambient);
		}
	});
	
	this.__defineGetter__("diffuse", function(values) {return this._diffuse;});
	this.__defineSetter__("diffuse", function(values) {
		this._diffuse = values;
		if(this.material){
			this.material.setAttributeReal3(this.material.ATTRIBUTE.DIFFUSE, this._diffuse);
		}
	});
	
	this.__defineGetter__("emission", function(values) {return this._emission;});
	this.__defineSetter__("emission", function(values) {
		this._emission = values;
		if(this.material){
			this.material.setAttributeReal3(this.material.ATTRIBUTE.EMISSION, this._emission);
		}
	});
	
	this.__defineGetter__("specular", function(values) {return this._specular;});
	this.__defineSetter__("specular", function(values) {
		this._specular = values;
		if(this.material){
			this.material.setAttributeReal3(this.material.ATTRIBUTE.SPECULAR, this._specular);
		}
	});
	
	this.__defineGetter__("shininess", function(values) {return this._shininess;});
	this.__defineSetter__("shininess", function(values) {
		this._shininess = values;
		if(this.material){
			this.material.setAttributeReal(this.material.ATTRIBUTE.SHININESS, this._shininess);
		}
	});
	this.__defineGetter__("alpha", function(values) {return this._alpha;});
	this.__defineSetter__("alpha", function(values) {
		this._alpha = values;
		if(this.material){
			this.material.setAttributeReal(this.material.ATTRIBUTE.ALPHA, this._alpha);
		}
	});
	
}

ZinxMaterial.prototype.load = function() {
	
    if(this.material==null){
		var graphicsModule = this.project.zincPlugin.context.getDefaultGraphicsModule();
        this.material = graphicsModule.createMaterial();
		this.material.setName(this.id);
		this.loaded = true;
	}
	
	this.material.setAttributeReal3(this.material.ATTRIBUTE.AMBIENT, this._diffuse);
	this.material.setAttributeReal3(this.material.ATTRIBUTE.DIFFUSE, this._ambient);
	this.material.setAttributeReal3(this.material.ATTRIBUTE.EMISSION, this._emission);
	this.material.setAttributeReal3(this.material.ATTRIBUTE.SPECULAR, this._specular);
	this.material.setAttributeReal(this.material.ATTRIBUTE.SHININESS, this._shininess);
	this.material.setAttributeReal(this.material.ATTRIBUTE.ALPHA, this._alpha);

}

ZinxMaterial.prototype.clone = function(colour_name) {
    c = this.project.colours[colour_name];
    this.ambient = [c[0], c[1], c[2]];
    this.diffuse = [c[3], c[4], c[5]];
    this.emission = [c[6], c[7], c[8]];
    this.specular = [c[9], c[10], c[11]];
    this.alpha = c[12];
    this.shininess = c[13];
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
	
	this.spectrum = null;
	
    this.colour = "rainbow";
    this.change = "linear";
    this.reverse = false;
    this.range = [0.0, 1.0];
    this.colour_range = [0.0, 1.0];
    this.extend = [true, true];
    
    this.loaded = false;
    
    return 1;   
}

ZinxSpectrum.prototype.load = function() {
	
	

    if(this.spectrum==null){
		var graphicsModule = this.project.zincPlugin.context.getDefaultGraphicsModule();
        this.spectrum = graphicsModule.createSpectrum();
		this.spectrum.setName(this.id);
		this.loaded = true;
	}
	
	this.spectrum.executeCommand('clear overwrite_colour');
	
	command = this.change+' range '+this.range[0]+' '+this.range[1];
	command += ' '+this.colour+' colour_range 0 1 component 1';
    if(this.reverse){ command += ' reverse'; }
	if(this.extend[0]){command += ' extend_below';}
    if(this.extend[1]){command += ' extend_above';}
    
    msg(4, 'Loading spectrum '+this.id+': '+command);
    
	this.spectrum.executeCommand(command);
	
	// TODO: add more complex spectrums that contain linear elements (stops)
	// TODO: add alphas above and below to improve rendering.
	//~ this.spectrum.executeCommand('linear range 2 2.5 rainbow colour_range 0 1 component 1');
	//~ this.spectrum.executeCommand('linear range 2.5 3 alpha colour_range 0 0 component 1');
}

// Didn't work - check later. Could calculate field min and max.
//~ ZinxSpectrum.prototype.autorange = function() {
	//~ 
	//~ 
	//~ msg(10, 'Autoranging');
    //~ if(this.spectrum){
		//~ msg(10, 'Autoranging now');
		//~ this.spectrum.executeCommand('autorange');
	//~ }
//~ }


function msg(level, text){
	console.debug(text);
}
