function load_simulation(path){
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", path, true);
    xmlhttp.overrideMimeType("application/json");
    xmlhttp.onreadystatechange = process_simulation;
    xmlhttp.send(null);
}

function process_simulation() {
    if (xmlhttp.readyState == 4) {
        try {
            simulation = JSON.parse(xmlhttp.responseText);
        }
        catch (e) {
            console.error('bad json');
            console.error(xmlhttp.responseText);
            return false;
        }
        window.simulation = simulation;
        generateModels();
    }
}

function loadingCallback()
{
    return function()
    {
        viewAll();
    }
}

function generateModels() {
    sim = window.simulation;
    
    // Add groups to #accordian-graphics
    for(i in sim.Groups) {
        $("#accordion-graphics").append('<h3><a href="#">'+sim.Groups[i]+' <span class="show_all graphics_button" >Show</span> <span class="hide_all graphics_button">Hide</span></a></h3>')
        $("#accordion-graphics").append('<div id="graphics-'+sim.Groups[i].toLowerCase()+'"></div>')
    }

    for (nm=0; nm<sim.Models.length; nm++) {
        model = window.zinxProject.addModel();
        model.label = sim.Models[nm].label;
        model.elementDiscretization = sim.Models[nm].elementDiscretization;
        model.autoload = sim.Models[nm].load
        model.id = sim.Models[nm].region_name;
        add_model_to_group(sim.Models[nm].group, sim.Models[nm].label)

        for (nf=0; nf<sim.Models[nm].files.length; nf++) {
            // model.addFile(sim.id+"/"+sim.Models[nm].files[nf]);
            model.addFile(sim.Models[nm].files[nf]);
        }
        
        for (ng = sim.Models[nm].graphics.length - 1; ng >= 0; ng--) {
            gtype = sim.Models[nm].graphics[ng].type;
            var g = null;
            switch (gtype) {
                case 'nodepoints':
                    g = addNodePoints(model, sim.Models[nm].graphics[ng], 
                                          sim.Models[nm].graphics[ng].material,
                                          sim.vrange)
                    break;
                case 'surfaces':
                case 'surface':  // 0.6
                    g = addSurface(model, sim.Models[nm].graphics[ng], 
                                       sim.Models[nm].graphics[ng].material,
                                       sim.Models[nm].graphics[ng].xiFace, 
                                       sim.vrange)
                    break;
                case 'vectors':
                    g = addVectors(model, sim.Models[nm].graphics[ng],
                                       sim.Models[nm].graphics[ng].material,
                                       sim.crange)
                    break;
                case 'lines':
                    g = addLines(model, sim.Models[nm].graphics[ng],
                                     sim.Models[nm].graphics[ng].material,
                                     sim.crange)
                    break;
                case 'elementpoints':
                case 'elementPoints':  // 0.6
                    g = addElementPoints(model,
                        sim.Models[nm].graphics[ng],
                        sim.Models[nm].graphics[ng].material,
                        sim.Models[nm].graphics[ng].glyph,
                        sim.Models[nm].graphics[ng].discretization,
                        sim.Models[nm].graphics[ng].size,
                        sim.Models[nm].graphics[ng].orientation,
                        sim.Models[nm].graphics[ng].scale, sim.crange)
                    break;
            }
            if (g == null) {
                console.error('notimplemented: ' + 
                    sim.Models[nm].graphics[ng].type);
                console.error('nm: ' + nm);
                console.error('ng: ' + ng);
            }
            else {
                try {
                    setMaterial(g, sim.Models[nm].graphics[ng].ambient,
                                sim.Models[nm].graphics[ng].diffuse, 
                                sim.Models[nm].graphics[ng].emission,
                                sim.Models[nm].graphics[ng].specular,
                                sim.Models[nm].graphics[ng].alpha,
                                sim.Models[nm].graphics[ng].shininess);
                }
                catch (e) {
                    console.error("can't set material");
                    console.info(g);
                }
            }
        }      
    }
    
    if (sim.View)
    {
        var view = window.zinxProject.addView();
        setView(view, sim.View[0].camera, sim.View[0].target, sim.View[0].up,
                sim.View[0].angle);
        view.setView();
    }
    // Load models and create sceneViewer
    window.zinxProject.loadModels(loadingCallback());
}

function setView(view, camera, target, up, angle){
	if (camera)
		view.camera = camera;
	if (target)
		view.target = target;
	if (up)
		view.up = up;
	if (angle)
		view.viewAngle = angle;
}

function setMaterial(g, ambient, diffuse, emission, specular, alpha, shininess){
	if (alpha)
		g.material.alpha= alpha;
	if (ambient)
	{
		g.material.ambient = [ambient[0], ambient[1], ambient[2]];
	}
	if (diffuse)
	{
		g.material.diffuse= [diffuse[0], diffuse[1], diffuse[2]];
	}
	if (emission)
	{
		g.material.emission = [emssion[0], emssion[1], emssion[2]];
	}
	if (specular)
	{
		g.material.specular = [specular[0], specular[1], specular[2]];
	}
	if (shininess)
	{
   	g.material.shininess = shininess;
	}
	if (g.material)
		g.material.load();
  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
}

function addNodePoints(model, graphics, material, range){
    var g = model.addGraphic("nodepoints");
    g.label = graphics.label
    g.size = 2;
    g.useDataField = false;
	 if (material)
		  g.material.clone(material);
  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    return g;
}

function addLines(model, graphics, material, range){
    var g = model.addGraphic("lines");
    g.label = graphics.label
  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    return g;
}

function addSurface(model, graphics, material, xiFace, range){
    var g = model.addGraphic("surfaces");
    g.label = graphics.label
    g.exterior = true;
    g.useDataField = false;
	 if (material)
		  g.material.clone(material);
	 if (xiFace)
	 {
		 g.useXiFace = true;
 		 g.xiFace = xiFace;
	 }
    //g.dataField = "potential";
    //g.spectrum.minimumValue = range[0];
    //g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    //add_graphics_to_gui(model.group, model.label, graphics.label)
    return g;
}

function addElementPoints(model, graphics, material, glyph, discretization,
	size, orientation, scale, range){
    var g = model.addGraphic("elementpoints");
    g.label = graphics.label
    g.useDataField = false;
	 if (material)
		  g.material.clone(material);
	 if (glyph)
		  g.glyph = glyph;
	 if (discretization)
		  g._discretization = discretization;
	 if (size)
		  g._size = size;
	 if (orientation)
	 {
	 	g.orientGlyph = true;
		g.orientField = orientation;
	 }
	 if (scale)
		  g._scale = scale;

  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    return g;
}

function addVectors(model, graphics, material, range){
	
    var g = model.addGraphic("nodepoints");
    g.label = graphics.label
    g.glyph = "arrow_line";
    g.size = 0;
    g.scale = [1e+06,3,3];
    g.orientation = "current";
    g.useDataField = false;
	 if (material)
		  g.material.clone(material);
   // g.dataField = "current_magnitude";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    //add_graphics_to_gui(model.label, graphics.label)
    return model;
}

function add_model_to_group(group, model){
    label = model.substr(0,1).toUpperCase()+model.substr(1)
    model_id = "graphics-model-"+model.toLowerCase()
    $('#graphics-'+group.toLowerCase()).append('<div id="'+model_id+'" class="model-block">'+label+': </div>')
}
function add_visibility_button(model, graphics){
    classes = "toggle_visibility graphics_button"
    model_id = "#graphics-model-"+model.toLowerCase()
    $(model_id).append('<span class="'+classes+'" sid="'+model+'" gid="'+graphics+'" >'+graphics+'</span>')
    $(model_id+" > span:last").button({label: graphics});
    $(model_id+" > span:last").click(function() {toggle_visibility(this)});
}

function toggle_visibility(element){
 
    sid = $(element).attr("sid")
    gid = $(element).attr("gid")
    console.debug(sid+' '+gid)
    
    model = window.zinxProject.getModel(sid)
    if(model.loaded==false){
        model.autoload = true
        window.zinxProject.loadModels();
    }else{
        graphic = model.getGraphics(gid)
        console.debug(' > '+graphic.label)
        graphic.load()
        graphic.toggleVisibility()
        graphic.spectrum.autorange()
    }
}


// ==========================================================================================================
// ==========================================================================================================
// ==========================================================================================================

function viewAll(){
	window.zinxProject.zincPlugin.sceneViewer.viewAll();
}
