/*
  Instantiate the Zinx project.  Call after the appropriate libraries
  have been loaded.
*/
function InitialiseZinx() {
  //window.zinxProject = new ZinxProject();
  window.zinxProject = new ZinxProject();
  window.zinxProject.SceneObjectId = 'zinc_plugin'; 
  // Runs zinx; ZincReadyFunction will be called through here.
  window.zinxProject.InitialiseZinc(); 
}

// ==========================================================================================================

function ZincSceneReadyFunction(){ // once the models are loaded and scene rendered, this function is called.
    //setTimeout('window.zinxProject.setTransparencyMode(\'order_independent\')', 500);
    //gfx('gfx define faces egroup model1');
    setTimeout('window.zinxProject.Views[0].setView();', 10);
    setTimeout('window.zinxProject.Views[0].viewAll();', 10);
    return;
}

// ==========================================================================================================
// ==========================================================================================================
// ==========================================================================================================


function load_simulation(path){
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", path, true);
    xmlhttp.overrideMimeType("application/json");
    xmlhttp.onreadystatechange = process_simulation;
    xmlhttp.send(null);
}

function process_simulation(){
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    if (xmlhttp.readyState==4) {
        window.simulation = JSON.parse(xmlhttp.responseText);
        generateModels()
    }
}

function generateModels(){
    sim = window.simulation;
    
    // Add groups to #accordian-graphics
    for(i in sim.Groups){
        jq("#accordion-graphics").append('<h3><a href="#">'+sim.Groups[i]+' <span class="show_all graphics_button" >Show</span> <span class="hide_all graphics_button">Hide</span></a></h3>')
        jq("#accordion-graphics").append('<div id="graphics-'+sim.Groups[i].toLowerCase()+'"></div>')
    }

    base = jq('base').attr('href').replace(/[^\/]*$/, '');
    
    for(nm=0;nm<sim.Models.length;nm++){
        model = window.zinxProject.addModel();
        model.label = sim.Models[nm].label;
        model.elementDiscretization = sim.Models[nm].elementDiscretization;
        model.autoload = sim.Models[nm].load
        model.id = sim.Models[nm].region_name;
        add_model_to_group(sim.Models[nm].group, sim.Models[nm].label)
        
        for(nf=0;nf<sim.Models[nm].files.length;nf++){
    //        model.addFile(sim.id+"/"+sim.Models[nm].files[nf]);
            model.addFile(base + sim.Models[nm].files[nf]);
        }
        
        for(ng=sim.Models[nm].graphics.length-1;ng>=0;ng--){
            if(sim.Models[nm].graphics[ng].type=='points'){
                var g = addPoints(model, sim.Models[nm].graphics[ng], sim.Models[nm].graphics[ng].material, sim.vrange)
            }else if(sim.Models[nm].graphics[ng].type=='surface'){
                var g = addSurface(model, sim.Models[nm].graphics[ng], sim.Models[nm].graphics[ng].material,
						sim.Models[nm].graphics[ng].xiFace, sim.vrange)
            }else if(sim.Models[nm].graphics[ng].type=='vectors'){
                var g = addVectors(model, sim.Models[nm].graphics[ng], sim.Models[nm].graphics[ng].material, sim.crange)
            }else if(sim.Models[nm].graphics[ng].type=='lines'){
                var g = addLines(model, sim.Models[nm].graphics[ng], sim.Models[nm].graphics[ng].material, sim.crange)
            }else if(sim.Models[nm].graphics[ng].type=='elementPoints'){
                var g = addElementPoints(model, sim.Models[nm].graphics[ng], sim.Models[nm].graphics[ng].material, 
						sim.Models[nm].graphics[ng].glyph, sim.Models[nm].graphics[ng].discretization, 
						sim.Models[nm].graphics[ng].size, sim.Models[nm].graphics[ng].orientation,
						sim.Models[nm].graphics[ng].scale, sim.crange)
            }
				setMaterial(g, sim.Models[nm].graphics[ng].ambient, sim.Models[nm].graphics[ng].diffuse, 
					sim.Models[nm].graphics[ng].emission, sim.Models[nm].graphics[ng].specular,
					sim.Models[nm].graphics[ng].alpha, sim.Models[nm].graphics[ng].shininess);
        }      
    }
    
	 if (sim.View)
	 {
		var view = window.zinxProject.addView();
		setView(view, sim.View[0].camera, sim.View[0].target, sim.View[0].up, sim.View[0].angle);
    }
    // Load models and create sceneViewer
    window.zinxProject.loadModels();
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
		g.material.ambient.red = ambient[0];
		g.material.ambient.green = ambient[1];
		g.material.ambient.blue = ambient[2];
	}
	if (diffuse)
	{
		g.material.diffuse.red = diffuse[0];
		g.material.diffuse.green = diffuse[1];
		g.material.diffuse.blue = diffuse[2];
	}
	if (emission)
	{
		g.material.emission.red = emssion[0];
		g.material.emission.green = emssion[1];
		g.material.emission.blue = emssion[2];
	}
	if (specular)
	{
		g.material.specular.red = specular[0];
		g.material.specular.green = specular[1];
		g.material.specular.blue = specular[2];
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

function addPoints(model, graphics, material, range){
    var g = model.addGraphic("NodePoints");
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
    var g = model.addGraphic("Lines");
    g.label = graphics.label
  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    return g;
}

function addSurface(model, graphics, material, xiFace, range){
    var g = model.addGraphic("Surfaces");
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
    var g = model.addGraphic("ElementPoints");
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
		  g.orientation = orientation;
	 if (scale)
		  g._scale = scale;

  //  g.dataField = "potential";
   // g.spectrum.minimumValue = range[0];
   // g.spectrum.maximumValue = range[1];
    //add_visibility_button(model.label, graphics.label)
    return g;
}

function addVectors(model, graphics, material, range){
	
    var g = model.addGraphic("NodePoints");
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
    jq('#graphics-'+group.toLowerCase()).append('<div id="'+model_id+'" class="model-block">'+label+': </div>')
}
function add_visibility_button(model, graphics){
    classes = "toggle_visibility graphics_button"
    model_id = "#graphics-model-"+model.toLowerCase()
    jq(model_id).append('<span class="'+classes+'" sid="'+model+'" gid="'+graphics+'" >'+graphics+'</span>')
    jq(model_id+" > span:last").button({label: graphics});
    jq(model_id+" > span:last").click(function() {toggle_visibility(this)});
}

function toggle_visibility(element){
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
    sid = jq(element).attr("sid")
    gid = jq(element).attr("gid")
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

function reload_model(model){
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    
}
function reload_models(){
    
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    // TODO //
    
}

