var panel1; // global for querypanel

function showOperatorConfig(selectedOperator) {
    // clear operator configuration
    var opConfig = $('#operatorConfig');
    opConfig.empty();
    $('#lineContainer').remove();

    if (selectedOperator === "schema") {
        loadSchemaGraphOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "group") {
        loadGroupingOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "filter") {
        loadFilteringOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "link") {
    	loadLinkingOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "cc") {
        loadConnectedComponentsOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "pr") {
        loadPageRankOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "pattern") {
        loadPatternMathConfig(opConfig);
    }
    else if (selectedOperator === "combination" || selectedOperator === "overlap" || selectedOperator === "exclusion") {
        loadBinaryGraphOperationConfig(opConfig);
    }
    else if (selectedOperator === "cypher") {
        loadCypherQueryConfigForm(opConfig);
    } 
    else if (selectedOperator === "expand") {
        loadExpandOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "clustering") {
        loadClusteringOperatorConfigForm(opConfig);
    }
    else if (selectedOperator === "sampling") {
        loadSamplingOperatorConfigForm(opConfig);
    }
}

function executeOperator() {
    var selectedOperator = $("#operations").val(); // The value of the selected option

    if (selectedOperator === "schema") {
        schemaGraph();
    }
    else if (selectedOperator === "group") {
        performGrouping();
    }
    else if (selectedOperator === "filter") {
        performFiltering();
    }
    else if (selectedOperator === "link") {
        performLinking();
    }
    else if (selectedOperator === "cc") {
        calculateConnectedComponents();
    }
    else if (selectedOperator === "pr") {
        calculatePageRank();
    }
    else if (selectedOperator === "pattern") {
        performPatternMatch();
    }
    else if (selectedOperator === "combination" || selectedOperator === "overlap" || selectedOperator === "exclusion") {
        performBinaryGraphOperation(selectedOperator);
    }
    else if (selectedOperator === "cypher") {
        performCypherQuery();
    }
    else if (selectedOperator === "expand") {
        performExpandGraph();
    }
    else if (selectedOperator === "clustering") {
        performClustering();
    }
    else if (selectedOperator === "sampling") {
        performSampling();
    }
}


/*******************************************************
 * Schema Graph Calculation
 *******************************************************/

function loadSchemaGraphOperatorConfigForm(opConfig) {
    opConfig.append('<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">'
        + '</div>');
}

function schemaGraph() {
    var databaseName = getSelectedDatabase();
    var schemaGraphIdentifier = $('#outputIdentifier').val();

    $.get('rest/graph/schema/' + databaseName + "?outGraph=" + schemaGraphIdentifier)
        .done(function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/')
                .done(initializeDatabaseMenu)
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
}

/*******************************************************
 * Pattern Matching
 *******************************************************/

function loadPatternMathConfig(opConfig) {
	 opConfig.append('<div class="input-group">'
		        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
		        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">'
		        + '</div></br> <div id="test"> </div>');
	/* schema= {types:[
		                {uri:"type1uri", name:"type1",
							propertys:[{uri:"prop1uri", 
							name:"prop1Name", 
							values:["sValue", "sValue2"], 
							techtype:"xsd:integer"}]
		                },
		                
		                {uri:"type2uri", name:"type2",
							propertys:[{uri:"prop2uri", 
							name:"prop2Name", 
						//	values:"values2",
							associatedURIs: "type1uri",
							techtype:"out_edge"}]
		                },
		                {uri:"type3uri", name:"type3",
							propertys:[{uri:"prop3uri", 
							name:"prop3Name", 
							values:["sValue", "sValue2"], 
							techtype:"xsd:string"}]
		                },
				]
				};*/
		

		schema={types:[]};
	    var databaseName = getSelectedDatabase();
	    $.get("rest/keys/" + databaseName)
        .done(function (data) {
        	typesArray=[];
        
            for (vli in data.vertexLabels) {
            	//schema.types.push({uri:data.vertexLabels[vli], name:data.vertexLabels[vli]});
            	typesArray[data.vertexLabels[vli]]={uri:data.vertexLabels[vli], name:data.vertexLabels[vli], propertys:[]};
            	}
            
            for (vki in data.vertexKeys) {
                vertexKey = data.vertexKeys[vki];
                for (li in vertexKey.labels) {
                	type="xsd:string";
                	if(vertexKey.numerical) type="xsd:integer";
                	typesArray[vertexKey.labels[li]].propertys.push({uri:vertexKey.name, 
						name:vertexKey.name, 
						//values:["sValue", "sValue2"], 
						techtype:type});
                }
            }
            
            schemaInfo={};
       
            
            idTypeMap=[];
            $.get("rest/graph/schema/"+databaseName)
            .done(function (result) {
            	console.log(result);
            	for (ei in result.nodes){
            		//typesArray[result.nodes[ei].data.label].id=result.nodes[ei].data.id;
            		idTypeMap[result.nodes[ei].data.id]=result.nodes[ei].data.label;
            	}
            	
            	for (ei in result.edges){
            		sourcelabel= idTypeMap[result.edges[ei].data.source];
            		targetlabel= idTypeMap[result.edges[ei].data.target];
            		typesArray[sourcelabel].propertys.push({uri:result.edges[ei].data.label, 
						name:result.edges[ei].data.label, associatedURIs:targetlabel,
						techtype:"out_edge"});
            	}
            		
            	  //construct schema from types array
                for(ti in typesArray){
                	schema.types.push(typesArray[ti]);
                }
                panel1 = new QueryPanel("test");
    			panel1.initSchemaIndices(schema);
    			panel1.addStartingType();
            	
            });
            
          
            
           
        });
}

function performPatternMatch(){
	
	 panel1.types=[];
	 panel1.edges=[];
	 panel1.typeCounts=[];
	 panel1.readQuery("0_0"+"_"+panel1.panelID);
	  
	  for(var key in panel1.types){
		  panel1.types[key].included=false;
	  }
	  panel1.types[0].included=true;
	  query={"types":panel1.types, "edges":panel1.edges};
	  console.log(JSON.stringify(query, null, '\t'));
	  
	  var outputGraphIdentifier = $('#outputIdentifier').val();
	

	    var patternMatchConf = JSON.stringify(query);
	    var databaseName = getSelectedDatabase();

	    $.postJSON('rest/graph/pattern_match/' + databaseName + '?outGraph=' + outputGraphIdentifier,
	    		patternMatchConf, function (data) {
	            console.log(data);
	            useDefaultLabel = true;
	            useForceLayout = false;
	            drawGraph(data);
	            changed = true;
	            $.get('rest/databases/')
	                .done(initializeDatabaseMenu)
	        }
	    );
	  
	  
}


/*******************************************************
 * Graph Grouping
 *******************************************************/

function loadGroupingOperatorConfigForm(opConfig) {
    var databaseName = getSelectedDatabase();

    opConfig.append('<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">'
        + '</div>');

    $.get("rest/keys/" + databaseName)
        .done(function (data) {
        	loadGroupingOperatorConfigFormHelper(opConfig, data);
        });

}


function loadGroupingOperatorConfigFormHelper(opConfig, data, fillForm){
            vertexPropertyTree = {};
            for (vli in data.vertexLabels) vertexPropertyTree[data.vertexLabels[vli]] = [];
            for (vki in data.vertexKeys) {
                vertexKey = data.vertexKeys[vki];
                for (li in vertexKey.labels) vertexPropertyTree[vertexKey.labels[li]].push(vertexKey.name);
            }

            edgePropertyTree = {}
            for (eli in data.edgeLabels) edgePropertyTree[data.edgeLabels[eli]] = [];
            for (eki in data.edgeKeys) {
                edgeKey = data.edgeKeys[eki];
                for (li in edgeKey.labels) edgePropertyTree[edgeKey.labels[li]].push(edgeKey.name);
            }

            output = "<div class=\"panel panel-default\" id=\"groupingNodeSettings\">\n"
                + "<div class=\"panel-heading\">by <strong>vertex type</strong> and properties</div>\n"
                + "<ul class=\"list-group\">\n";
            for (vpti in Object.keys(vertexPropertyTree)) {
                output += "<li class=\"list-group-item\">\n"
                    + "<strong>" + Object.keys(vertexPropertyTree)[vpti] + "</strong>\n"
                for (vptpi in vertexPropertyTree[Object.keys(vertexPropertyTree)[vpti]]) {
                    property = vertexPropertyTree[Object.keys(vertexPropertyTree)[vpti]][vptpi];
                    output += "<div class=\"checkbox\"><label><input data-path=\"" + Object.keys(vertexPropertyTree)[vpti] + ">" + property + "\" type=\"checkbox\">" + property + "</label></div>\n";
                }
                ////adding dropdown for neighbor selection here..
                
                output += "by Neighbor: <select name=\"neighbors\" data-path=\""+Object.keys(vertexPropertyTree)[vpti]+"\">";
                output += "<option value=\"none\">none</option>";
                for (c in Object.keys(vertexPropertyTree))
                	{
                	currentLabel= Object.keys(vertexPropertyTree)[c];
                	if(currentLabel!=Object.keys(vertexPropertyTree)[vpti])
                		output += "<option value=\""+currentLabel+"\">"+currentLabel+"</option>";
                	}
                output += "</select>";

                ///
                output += "</li>";
            }
            output += "</ul>\n"
                + "</div>\n"
                + "<div class=\"panel panel-default\" id=\"groupingEdgeSettings\">\n"
                + "<div class=\"panel-heading\">by <strong>edge type</strong> and properties</div>\n"
                + "<ul class=\"list-group\">\n";
            for (epti in Object.keys(edgePropertyTree)) {
                output += "<li class=\"list-group-item\">\n"
                    + "<strong>" + Object.keys(edgePropertyTree)[epti] + "</strong>\n"
                for (eptpi in edgePropertyTree[Object.keys(edgePropertyTree)[epti]]) {
                    property = edgePropertyTree[Object.keys(edgePropertyTree)[epti]][eptpi];
                    output += "<div class=\"checkbox\"><label><input data-path=\"" + Object.keys(edgePropertyTree)[epti] + ">" + property + "\" type=\"checkbox\">" + property + "</label></div>\n";
                }
                output += "</li>";
            }
            output += "</ul>\n"
                + "</div>\n";

            opConfig.append(output)
    
    if(fillForm){
    	fillForm(data);
    }
}

function getGroupingConfig(){
    vertexSettings = {};
    neighborGrouping = {};
    edgeSettings = {};
    $("#groupingNodeSettings").find("input").each(function (i, e) {
    	/*if($(e).attr("type") == "text"){
    			console.log($(e).val());
    			neighborGrouping[$(e).attr("data-path")]=$(e).val();
    			 vertexSettings[$(e).attr("data-path")] = vertexSettings[$(e).attr("data-path")] || [];
    	}*/
        if (!e.checked) return;
        a = $(e).attr("data-path").split(">");
        vertexSettings[a[0]] = vertexSettings[a[0]] || [];
        vertexSettings[a[0]].push(a[1]);
    });
    $("#groupingNodeSettings").find("select").each(function (i, e) {
    			//console.log($(e).val());
    			if($(e).val()!="none"){
    				neighborGrouping[$(e).attr("data-path")]=$(e).val();
    				vertexSettings[$(e).attr("data-path")] = vertexSettings[$(e).attr("data-path")] || [];
    			}
    });
    $("#groupingEdgeSettings").find("input").each(function (i, e) {
        if (!e.checked) return;
        a = $(e).attr("data-path").split(">");
        edgeSettings[a[0]] = edgeSettings[a[0]] || [];
        edgeSettings[a[0]].push(a[1]);
    });
    settings = [];
    for (vski in Object.keys(vertexSettings)) {
        key = Object.keys(vertexSettings)[vski];
        value={type: "vertex", label: key, keys: vertexSettings[key].join(",")};
        if(neighborGrouping[key]!=null & neighborGrouping[key]!="") 
				value.byneighbor=neighborGrouping[key];
        settings.push(value);
    }
    for (eski in Object.keys(edgeSettings)) {
        key = Object.keys(edgeSettings)[eski];
        settings.push({type: "edge", label: key, keys: edgeSettings[key].join(",")});
    }
    conf = {"conf": settings};

    var grpConfig = JSON.stringify(conf);
    //console.log("operator.js:" + grpConfig);
    return grpConfig;
}

function performGrouping() {
    var outputGraphIdentifier = $('#outputIdentifier').val();
    
    var grpConfig = getGroupingConfig();

    var databaseName = getSelectedDatabase();

    $.postJSON('rest/graph/grouping/' + databaseName + '?outGraph=' + outputGraphIdentifier,
        grpConfig, function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/')
                .done(initializeDatabaseMenu)
        }
    );
}

/*******************************************************
 * Edge Fusion
 *******************************************************/

function loadEdgeFusionOperatorConfigForm(opConfig, metaData, fillForm) {
    opConfig.append(
    			`<div id="edgeLabelInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Edge label</span>
    				<select id="edgeLabel" class="selectpicker" title="..." data-width="60%"></select>
    	        </div>
    	        <div id="edgeAttributeInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Edge Attribute</span>
    				<select id="edgeAttribute" class="selectpicker" title="..." data-width="60%"></select>
    	        </div>
    	        <div id="edgeFusionMethodInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Method</span>
    				<select id="edgeFusionMethod" class="selectpicker" data-width="60%">
    		     		<option value="SUM" selected>SUM</option>
    		     	</select>
    	        </div>
        		<div class="checkbox">
					<label>
						<input id="keepCurrentEdges" type="checkbox" readonly>keepCurrentEdges
					</label>
				</div>`);
    
    $("#edgeLabel").selectpicker("refresh");
    $("#edgeAttribute").selectpicker("refresh");
    $("#edgeFusionMethod").selectpicker("refresh");
    
    for(var i = 0; i < metaData.edgeLabels.length; i++){
    	$("#edgeLabel").append(`<option value="${metaData.edgeLabels[i]}" selected>${metaData.edgeLabels[i]}</option>`);
    }
    
    var edgePropertyTree = getEdgePropertyTree();
    
    $("#edgeLabel").on("change", function(e){
    	console.log("changed to: " + $(this).val());
    	$("#edgeAttribute").empty();
    	
    	console.log(edgePropertyTree[$(this).val()]);
    	
    	for(var i in edgePropertyTree[$(this).val()]){
    		var option = `<option value="${edgePropertyTree[$(this).val()][i][0]}">${edgePropertyTree[$(this).val()][i][0]}</option>`;
    		console.log(option);
    		
    		$('#edgeAttribute').append(option);
    	}
    	
        $("#edgeAttribute").selectpicker("refresh");
    });
    
    if(fillForm){
    	fillForm();
    }
    
    function getEdgePropertyTree(){
    	var edgePropertyTree = {};
    	
		for (var edgeLabelIndex in metaData.edgeLabels) {
			edgePropertyTree[metaData.edgeLabels[edgeLabelIndex]] = [];
		}
		for (var edgeKeyIndex in metaData.edgeKeys) {
			var edgeKey = metaData.edgeKeys[edgeKeyIndex];
			for (var labelIndex in edgeKey.labels){
				edgePropertyTree[edgeKey.labels[labelIndex]].push([edgeKey.name,edgeKey.numerical]);
			}
		}
		
		return edgePropertyTree;
	}
}

function getEdgeFusionConfig(){
	var config = {
			"edgeLabel": $("#edgeLabel").val(),
			"edgeAttribute": $("#edgeAttribute").val(),
			"edgeFusionMethod": $("#edgeFusionMethod").val(),
			"keepCurrentEdges":$("#keepCurrentEdges").is(":checked")
	}
	
	return config;
}

/*******************************************************
 * Vertex Fusion
 *******************************************************/

function loadVertexFusionOperatorConfigForm(opConfig, metaData, fillForm) {
    opConfig.append(
    			`<div id="vertexAttributeInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Vertex Attribute</span>
    				<select id="vertexAttribute" data-width="60%" class="selectpicker" title="..."></select>
    	        </div>
    	        <div id="vertexFusionMethodInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Method</span>
    				<select id="vertexFusionMethod" data-width="60%" class="selectpicker" >
    		     		<option value="COUNT" selected>COUNT</option>
    		     	</select>
    	        </div>
    	        <div class="alert alert-info" style="margin-top:30px">
					ClusterId is added as temporary development fix to the attributes list regardless of if it is present in the graph attributes or not.
					The operator will fail if this attribute is not present in the data provided to it
				</div>
				<div class="checkbox">
					<label>
						<input id="deleteReflexiveEdges" type="checkbox" readonly>deleteReflexiveEdges
					</label>
				</div>`);
    
    $("#vertexAttribute").selectpicker("refresh");
    $("#vertexFusionMethod").selectpicker("refresh");
    
    // temporary adding ClusterId regardless of if this property is present
    $("#vertexAttribute").append(`<option value="ClusterId" selected>ClusterId</option>`);
    
    for(var i = 0; i < metaData.vertexKeys.length; i++){
    	$("#vertexAttribute").append(`<option value="${metaData.vertexKeys[i].name}" selected>${metaData.vertexKeys[i].name}</option>`);
    }
    
    if(fillForm){
    	fillForm();
    }
}

function getVertexFusionConfig(){
	var config = {
			"vertexAttribute": $("#vertexAttribute").val(),
			"vertexFusionMethod": $("#vertexFusionMethod").val(),
			"deleteReflexiveEdges":$("#deleteReflexiveEdges").is(":checked")
	}
	
	return config;
}


/*******************************************************
 * Graph Filtering
 *******************************************************/

function loadFilteringOperatorConfigForm(opConfig) {
    var databaseName = getSelectedDatabase();

    $.get("rest/keys/" + databaseName)
        .done(function(data){
        	loadFilteringOperatorConfigFormHelper(data,opConfig); 
        });
}

function loadFilteringOperatorConfigFormHelper(data, opConfig, fillForm) {
	
    vertexPropertyTree = {};
    for (vli in data.vertexLabels) vertexPropertyTree[data.vertexLabels[vli]] = [];
    for (vki in data.vertexKeys) {
        vertexKey = data.vertexKeys[vki];
        for (li in vertexKey.labels) {
        	vertexPropertyTree[vertexKey.labels[li]].push([vertexKey.name,vertexKey.numerical]);
        }
    }

    edgePropertyTree = {}
    for (eli in data.edgeLabels) edgePropertyTree[data.edgeLabels[eli]] = [];
    for (eki in data.edgeKeys) {
        edgeKey = data.edgeKeys[eki];
        for (li in edgeKey.labels) edgePropertyTree[edgeKey.labels[li]].push([edgeKey.name,edgeKey.numerical]);
    }

    opConfig.append("<div class=\"input-group\"><span class=\"input-group-addon\" id=\"basic-addon1\">Output Graph</span><input id=\"outputIdentifier\" class=\"form-control\" placeholder=\"type here...\" aria-describedby=\"basic-addon1\"></div>");	
    opConfig.append("<div class=\"panel panel-default\" id=\"filteringSettings\">");			

	$("#filteringSettings").append(
		`<div class="panel-heading" style="padding-bottom:0px">
			<ul class="nav nav-tabs" style="border-bottom-width:0px;font-weight:bold">
				<li id="filteringElementTypeNodes" class="active">
					<a href="" style="padding-right:5px">
						<div class="checkbox" style="margin:0px">
							Vertices
							<label id="nodeSwitchCheckboxLabel" style="float:right;margin:-2px 4px auto" >
								<input id="nodeSwitchCheckbox" type="checkbox" />
							</label>
						</div>
					</a>
				</li>
				<li id="filteringElementTypeEdges">
					<a href="" style="padding-right:5px">
						<div class="checkbox" style="margin:0px">
							Edges
							<label id="edgeSwitchCheckboxLabel" style="float:right;margin:-2px 4px auto" >
								<input id="edgeSwitchCheckbox" type="checkbox" />
							</label>
						</div>
					</a>
				</li>
			</ul>
		</div>`);	
	

    $.get("rest/filterOperations")
        .done(function (data) {
        	//console.log(data);

            //console.log(vertexPropertyTree);
            //console.log(edgePropertyTree);
            //console.log(data.operations);

			// creating checkboxes for all vertex and edge items
            $("#filteringSettings").append("<ul class=\"list-group\"></ul>");
            Object.keys(vertexPropertyTree).forEach(function(k){
                $("#filteringSettings .list-group").append("<li class=\"list-group-item node-item\" style=\"display: block;margin-bottom:0px;border-top-width:0px\"><div class=\"checkbox\">" +
                    "<label><input data-properties=\""+vertexPropertyTree[k].join("|")+"\" type=\"checkbox\"><strong>"+k+"</strong></label> " +
                    "<button data-properties=\""+vertexPropertyTree[k].join("|")+"\" style=\"margin-left: 1em;\">" +
                    "<strong>+</strong> Filterkriterium</button></div></li>");
            });
            Object.keys(edgePropertyTree).forEach(function(k){
                $("#filteringSettings .list-group").append("<li class=\"list-group-item edge-item\" style=\"display: block;margin-bottom:0px;border-top-width:0px\"><div class=\"checkbox\">" +
                    "<label><input data-properties=\""+edgePropertyTree[k].join("|")+"\" type=\"checkbox\"><strong>"+k+"</strong></label> " +
                    "<button data-properties=\""+edgePropertyTree[k].join("|")+"\" style=\"margin-left: 1em;\">" +
                    "<strong>+</strong> Filterkriterium</button></div></li>");
            });

			// only vertex tab is visible by default: hide all edge items
			$(".edge-item").hide();

			
			// provide exact height of #filterSettings div to ensure smooth switching between both options
			var borderWidth = parseInt( $("#filteringSettings").css("borderBottomWidth") );
			var BORDER_BUFFER = isNaN(borderWidth)? 0 : (2 * borderWidth);
			var vertexPropertyCount = Object.keys(vertexPropertyTree).length;
			var edgePropertyCount = Object.keys(edgePropertyTree).length;
			var listGroupItemHeight = $("#filteringSettings .list-group-item").outerHeight();
			var panelHeadingHeight = $("#filteringSettings .panel-heading").outerHeight()
			
			if( vertexPropertyCount > edgePropertyCount ){
				$("#filteringSettings").css("height", panelHeadingHeight + BORDER_BUFFER + listGroupItemHeight * vertexPropertyCount );
			}
			else {
				$("#filteringSettings").css("height", panelHeadingHeight + BORDER_BUFFER + listGroupItemHeight * edgePropertyCount );
			}
			
			// opacity layer to indicate, that a filter tab is disabled
			$("#filteringSettings").append(`<div id="opacityLayer" style="display:none;position:relative;z-index:10;width:100%;bottom:0px;background-color:#ffffff;opacity:0.7"></div>`);
			
			// adjusting opacity layer parameters according to actual height of the filtering items
			var adjustOpacityLayerStyle = function(){
				var totalHeight = 0;
				$('.list-group-item[style*="display: block"]').each( function(index,element){
					totalHeight += $( this ).outerHeight();
				});
								
				$("#opacityLayer").css("height", totalHeight );
				$("#opacityLayer").css("margin-top", - totalHeight );						
			}
			adjustOpacityLayerStyle();
							
			// default configuration, both tabs enabled
			$("#nodeSwitchCheckbox").prop('checked', true);
			$("#edgeSwitchCheckbox").prop('checked', true);
			
			
			$("#filteringElementTypeNodes").on("click", function(e){
		
				// stop propagation to handle chechbox and tab events separately
				e.stopImmediatePropagation();
				e.preventDefault();
				// handling checkbox event (enabling or disabling appropriate filter)
				if ( (e.target.id == "nodeSwitchCheckbox") || (e.target.id == "nodeSwitchCheckboxLabel") ){
					// setTimeout prevents FireFox bug from occuring (by default anchor event is triggered before checkbox)
					setTimeout(function() { 
						$("#nodeSwitchCheckbox").prop('checked', !$("#nodeSwitchCheckbox").prop('checked'));
						if ( !$("#nodeSwitchCheckbox").prop('checked') && $("#filteringElementTypeNodes").hasClass("active")){
							$("#opacityLayer").css("display", "block");
							adjustOpacityLayerStyle();									
						}
						else if ( $("#nodeSwitchCheckbox").prop('checked') && $("#filteringElementTypeNodes").hasClass("active") ){
							$("#opacityLayer").css("display", "none");
						}
					}, 1);
				}
				// handling tab event (switching between tabs)
				else{
					var edgesTab = $("#filteringElementTypeEdges");
					if( edgesTab.hasClass("active") ){
						edgesTab.removeClass("active");
						$(this).addClass("active");
						$(".node-item").show();
						$(".edge-item").hide();
						
						if ( !$("#nodeSwitchCheckbox").prop('checked') ){
							$("#opacityLayer").css("display", "block");
							adjustOpacityLayerStyle();
						}
						else {
							$("#opacityLayer").css("display", "none");
						}
					}							
				}
			});

			$("#filteringElementTypeEdges").on("click", function(e){

				// stop propagation to handle chechbox and tab events separately					
				e.stopImmediatePropagation();
				e.preventDefault();
				// handling checkbox event (enabling or disabling appropriate filter)
				if ( (e.target.id == "edgeSwitchCheckbox") || (e.target.id == "edgeSwitchCheckboxLabel") ){
					// setTimeout prevents FireFox bug from occuring (by default anchor event is triggered before checkbox)
					setTimeout(function() { 
						$("#edgeSwitchCheckbox").prop('checked', !$("#edgeSwitchCheckbox").prop('checked')); 
						if ( !$("#edgeSwitchCheckbox").prop('checked') && $("#filteringElementTypeEdges").hasClass("active")){
							$("#opacityLayer").css("display", "block");
							adjustOpacityLayerStyle();
						}
						else if ( $("#edgeSwitchCheckbox").prop('checked') && $("#filteringElementTypeEdges").hasClass("active") ){
							$("#opacityLayer").css("display", "none");
						}
					}, 1);
				}
				// handling tab event (switching between tabs)
				else{
					var nodesTab = $("#filteringElementTypeNodes");
					if( nodesTab.hasClass("active") ){
						nodesTab.removeClass("active");
						$(this).addClass("active");
						$(".node-item").hide();
						$(".edge-item").show();
						
						if ( !$("#edgeSwitchCheckbox").prop('checked') ){
							$("#opacityLayer").css("display", "block");
							adjustOpacityLayerStyle();									
						}
						else {
							$("#opacityLayer").css("display", "none");
						}
					}							
				}
			});
			
			
            $(".node-item button, .edge-item button").on("click",function(e){
                propertyline = '<div class="input-group" style=""><div class="input-group-addon" style=""><select>';
                data.operations[0].eval.forEach(function(e){ propertyline += '<option>'+e+'</option>'; });
                propertyline += '</select></div><select class="form-control" style="width: 33%;">';
                $(e.target).attr("data-properties").split("|").forEach(function(e,i){ x=e.split(","); propertyline += '<option value="'+(x[1]=="false"?"textual":"numeric")+'">'+x[0]+'</option>'; });
                propertyline += '</select><select class="form-control" style="width: 33%;"><optgroup class="numeric-group" label="Wertevergleich">';
                data.operations[1].numeric.forEach(function(e){ propertyline += '<option>'+e+'</option>'; });
                propertyline += '</optgroup><optgroup class="textual-group" label="Textvergleich">';
                data.operations[2].textual.forEach(function(e){ propertyline += '<option'+(e=='exists' ? ' selected="selected"' : '')+'>'+e+'</option>'; });
                propertyline += '</optgroup></select><input type="text" class="form-control" placeholder="Wert" style="width: 34%;"><div class="input-group-addon"><button onclick=\"$(this).parent().parent().remove()\">x</button></div></div>';
                $(e.target).parent().parent().append(propertyline);
                $(e.target).parent().parent().find(".input-group").last().find(".form-control").first().change(function(f){
                    $(f.target).parent().find(".textual-group").attr("style","display:"+($(f.target).parent().find(".form-control").first().val()=="textual"?"initial":"none"));
                    $(f.target).parent().find(".numeric-group").attr("style","display:"+($(f.target).parent().find(".form-control").first().val()=="textual"?"none":"initial"));
                });
                $(e.target).parent().parent().find(".input-group").last().find(".form-control").first().change();
            });

            $(".node-item button, .edge-item button").hide();
            $(".node-item input, .edge-item input").on("click",function(e){
            	$(e.target).parent().parent().parent().children(".input-group").toggle(e.target.checked);
            	$(e.target).parent().parent().children("button").toggle(e.target.checked && $(e.target).attr("data-properties")!="") 
            });
            
            if(fillForm){
            	fillForm(data);
            }
    });
}


function getfilteringConfig(itemType){
	
	var getNumericRightSide = function(elements){	
		var selectedOption = $(elements[1]).find("option:selected").text();
		var parsedValue = parseFloat(elements[2].value.replace(",","."));
		
		// replace rightSide value with 0 if it is NaN for operators where rightSide value is irrelevant ("exists" and "not_exists")
		if ( selectedOption == "exists" || selectedOption == "not_exists"){
			return isNaN( parsedValue )? 0 : parsedValue;
		}
		return parsedValue;
	}

	return $(filteringSettings).find(itemType).toArray().map(function(e,i){
			if($(e).find(".checkbox input").toArray()[0].checked) return {
				label:  $(e).find("label strong").text(),
				eval:   $(e).find(".input-group-addon option:selected").map(function(j,x){ return $(x).text(); }).toArray().slice(1).join(","),
				filter: $(e).find(".input-group").map(function(j,x){
					elements = $(x).children("select, .input-group input").toArray(); console.log(elements);				
					return {
						id:        j,
						type:      $(elements[0]).val(),
						attribute: $(elements[0]).children("option:selected").text(),
						operation: $(elements[1]).find("option:selected").text(),
						rightSide: $(elements[0]).val()=="numeric" ? getNumericRightSide(elements) : elements[2].value
					}
				}).toArray()
			}
		}).filter(function(n){ return n != undefined });
}

function performFiltering() {
    var outputGraphIdentifier = $('#outputIdentifier').val();
	var filteringConfig = {};	
	
	filteringConfig["vertex"] = $("#nodeSwitchCheckbox").prop('checked') ? getfilteringConfig(".node-item") : [];
	filteringConfig["edge"] = $("#edgeSwitchCheckbox").prop('checked') ? getfilteringConfig(".edge-item") : [];	
	
	console.log(JSON.stringify(filteringConfig));
	
    $.postJSON('rest/graph/filter/' + getSelectedDatabase() + '?outGraph=' + outputGraphIdentifier,
    	JSON.stringify(filteringConfig), function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/').done(initializeDatabaseMenu);
        }
    );
}

/*******************************************************
 * Graph Clustering
 *******************************************************/

function loadClusteringOperatorConfigForm(opConfig) {
    opConfig.append(
    			`<div class="input-group" style="width:100%">
			    	<span class="input-group-addon" id="basic-addon1" style="width:40%">Output Graph</span>
			    	<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
				</div>
				<div class="input-group" style="width:100%">
			    	<span class="input-group-addon" id="basic-addon1" style="width:40%">Edge attribute</span>
			    	<input id="edgeAttribute" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
				</div>
    			<div id="clusteringMethodInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Clustering method</span>
    				<select id="clusteringMethod" class="selectpicker" title="..." data-width="60%">
    		     		<option value="CONCON">CONCON</option>
    		     		<option value="CORRELATION_CLUSTERING">CORRELATION_CLUSTERING</option>
    		     		<option value="CENTER">CENTER</option>
    		     		<option value="MERGE_CENTER">MERGE_CENTER</option>
    		     		<option value="STAR1">STAR1</option>
    		     		<option value="STAR2">STAR2</option>
    		     	</select>
    	        </div>
    	        <div class="alert alert-info" style="margin-top:30px">
					CENTER, MERGE_CENTER, STAR1, STAR2 clustering methods require all edges to have an attribute with values of type double. 
					Name of the attribute has to be provided in the "Edge attribute" text input 
				</div>`);
    
    $("#clusteringMethod").selectpicker("refresh");
}

function getClusteringConfig(){
	return {
		"edgeAttribute": $("#edgeAttribute").val(),
		"clusteringMethod": $("#clusteringMethod").val()
	};
}

function performClustering(){
	
	var outputGraphIdentifier = $("#outputIdentifier").val();
	
    $.postJSON('rest/graph/clustering/' + getSelectedDatabase() + '?outGraph=' + outputGraphIdentifier,
    	JSON.stringify(getClusteringConfig()), function (data) {
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/').done(initializeDatabaseMenu);
        }
    );
}

/*******************************************************
 * Graph Sampling
 *******************************************************/

function loadSamplingOperatorConfigForm(opConfig) {
    opConfig.append(
    			`<div class="input-group" style="width:100%">
			    	<span class="input-group-addon" id="basic-addon1" style="width:40%">Output Graph</span>
			    	<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
				</div>
    			<div id="samplingOperatorInputGroup" class="input-group" style="width:100%">
    		        <span class="input-group-addon" id="basic-addon1" style="width:40%">Sampling method</span>
    				<select id="samplingMethod" class="selectpicker" title="..." data-width="60%">
    		     		<option value="No Sampling" selected>No Sampling</option>
    		     		<option value="Node Sampling">Node Sampling</option>
    		     		<option value="Edge Sampling">Edge Sampling</option>
    		     		<option value="PageRank Sampling">PageRank Sampling</option>
    		     	</select>
    	        </div>
    	        <div class="input-group" style="width:100%">
			    	<span class="input-group-addon" id="basic-addon1" style="width:40%">Threshold</span>
			    	<input id="samplingThreshold" class="form-control" placeholder="0.2" aria-describedby="basic-addon1">
				</div>`);
    
    $("#samplingMethod").selectpicker("refresh");
}

function getSamplingConfig(){
	return {
		"samplingMethod": $("#samplingMethod").val(),
		"samplingThreshold": ($("#samplingThreshold").length && $("#samplingThreshold").val() !== "") ? $("#samplingThreshold").val() : ($("#samplingThreshold").val() == "" ? $("#samplingThreshold").attr("placeholder") : -1),
	};
}

function performSampling(){
	
    $.get(`rest/graph/${getSelectedDatabase()};sampling=${getSamplingConfig().samplingMethod};threshold=${getSamplingConfig().samplingThreshold}`)
    .done(function (data) {
        useDefaultLabel = true;
        useForceLayout = false;
        drawGraph(data);
        changed = true;
        $.get('rest/databases/')
         .done(initializeDatabaseMenu);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    });	
}


/*******************************************************
 * Binary Graph Operations: Combination, Overlap, Exclusion
 *******************************************************/
function loadBinaryGraphOperationConfig(opConfig) {
    var otherGraphPicker = '<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Other Graph</span>'
        + '<select id="otherGraph" class="selectpicker" title="Graphs...">';
    for (var i = 0; i < currentDatabases.length; i++) {
        var name = currentDatabases[i];
        otherGraphPicker += '<option value="' + name + '">' + name + '</option></div>';
    }
    otherGraphPicker += '</select>';
    opConfig.append(otherGraphPicker);
    $('#otherGraph').show();
    $('#otherGraph').selectpicker('refresh');

    opConfig.append('<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">'
        + '</div>');
}

function performBinaryGraphOperation(binaryOp) {
    var databaseName = getSelectedDatabase();
    var otherGraph = $('#otherGraph').val();
    var outGraph = $('#outputIdentifier').val();

    $.get('rest/graph/binary/' + databaseName + "/" + otherGraph + "?op=" + binaryOp +"&outGraph=" + outGraph)
        .done(function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/')
                .done(initializeDatabaseMenu)
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
}

/*******************************************************
 * Graph Algorithm: Weakly Connected Components
 *******************************************************/
function loadConnectedComponentsOperatorConfigForm(opConfig) {
    opConfig.append('<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">'
        + '</div>');
}

function calculateConnectedComponents() {
    var outputGraphIdentifier = $('#outputIdentifier').val();
    var databaseName = getSelectedDatabase();

    $.get('rest/graph/wcc/' + databaseName + '?outGraph=' + outputGraphIdentifier,
        function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/')
                .done(initializeDatabaseMenu)
        }
    );
}

/*******************************************************
 * Graph Algorithm: PageRank
 *******************************************************/
function loadPageRankOperatorConfigForm(opConfig) {
    opConfig.append(
    		`<div class="input-group" style="width:100%">
            	<span class="input-group-addon" id="basic-addon1" style="width:40%">Output Graph</span>
            	<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" data-width="60%">
            </div>
    		<div class="input-group" style="width:100%">
            	<span class="input-group-addon" id="basic-addon1" style="width:40%">Damping Factor</span>
            	<input id="damping" type="number" step="0.01" min="0.0" max="1.0" class="form-control" placeholder="type here... (defaults to 0.85)" aria-describedby="basic-addon1"  data-width="60%">
            </div>
    		<div class="input-group" style="width:100%">
            	<span class="input-group-addon" id="basic-addon1" style="width:40%">PageRank Iterations</span>
    			<input id="iterations" type="number" step="1" min="1" max="100" class="form-control" placeholder="type here... (defaults to 30)" aria-describedby="basic-addon1" data-width="60%">
            </div>`);
}

function calculatePageRank() {
    var outputGraphIdentifier = $('#outputIdentifier').val();
    var dampingFactor = $('#damping').val();
    var iterations = $('#iterations').val();
    var databaseName = getSelectedDatabase();

    $.get('rest/graph/pr/' + databaseName
        + '?outGraph=' + outputGraphIdentifier
        + '&damping=' + dampingFactor
        + '&iter=' + iterations,
        function (data) {
            console.log(data);
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data);
            changed = true;
            $.get('rest/databases/')
                .done(initializeDatabaseMenu)
        }
    );
}

/******************************************
 * Cypher Query
 ******************************************/

function loadCypherQueryConfigForm(opConfig) {
    opConfig.append('<div class="input-group">'
        + '<span class="input-group-addon" id="basic-addon1">Output Graph</span>'
        + '<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">' +
        '</div>');
    opConfig.append('<form id="cypher-query-form" class="well">' +
        '<div class="form-group">' +
        '<label class="form-label" for="cypher-query">Cypher Query</label>' +
        '<textarea class="form-control" id="cypher-query" name="cypher-query" rows="5" text="Enter Cypher query here..."' +
        ' style="resize: vertical;"></textarea> ' +
        '</div>' +
        '<div class="form-check">' +
        '<input type="checkbox" class="form-check-input" id="cypher-attach-attr" name="cypher-attach-attr" checked>' +
        '<label class="form-check-label" for="cypher-attach-attr">Attach Attributes</label>' +
        '</div>' +
        '<label class="form-label" for="cypher-constr-pattern">Constuction Pattern (Optional)</label>' +
        '<textarea class="form-control" id="cypher-constr-pattern" name="cypher-constr-pattern" rows="5"' +
        ' style="resize: vertical;"></textarea>' +
        '</form>');
}


function performCypherQuery() {
    console.log("Running cypher");
    let formData = $('#cypher-query-form').serialize();
    let databaseName = getSelectedDatabase();
    let outputGraph = $('#outputIdentifier').val();
    console.log(formData);
    $.post('rest/graph/cypher/' +  databaseName + '?outGraph=' +
        outputGraph, formData, function (data) {
       drawGraph(data);
    }).fail(function (error) {
        alert('Cypher query failed: ' + error);
        console.log(error);
    });
}

/*************************************************
 * Graph expand
 *************************************************/

function loadExpandOperatorConfigForm(opConfig) {
    opConfig.append(
    	`<div class="input-group" style="width:100%">
	        <span class="input-group-addon" id="basic-addon1" style="width:50%">Output Graph</span>
	        <input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
        </div>
        <div class="input-group" style="width:100%">
	        <span class="input-group-addon" style="width:50%">Type Property (Optional)</span>
	        <input id="typePropertyKey" class="form-control" placeholder="_gretl_gradoop_element_type">
        </div>`);
}

function performExpandGraph() {
    console.log("Running expand");
    let databaseName = getSelectedDatabase();
    $.get('rest/graph/expand/' +  databaseName + '?outGraph=' + $("#outputIdentifier").val()
        + '&typeProperty=' + $('#typePropertyKey').val(), function (data) {
        drawGraph(data);
    });
}

/*************************************************
 * RDF graph data source
 *************************************************/

function loadRDFGraphConfigForm(opConfig) {
    opConfig.append(
    		`<div class="input-group" style="width:100%">
		        <span class="input-group-addon" id="basic-addon1" style="width:35%">Output Graph</span>
		        <input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
	        </div>
	        <div class="input-group" style="width:100%">
		        <span class="input-group-addon" id="basic-addon1" style="width:35%">SPARQL endpoint</span>
		        <input id="sparqlEndpoint" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
	        </div>
	        <form id="rdf-query-form" class="well">
	        <div class="form-group">
	        	<label class="form-label" for="rdf-query">SPARQL Query</label>
	        	<textarea class="form-control" id="sparqlQuery" name="sparql-query" rows="5" text="Enter SPARQL query here..." style="resize: vertical;"></textarea>
	        </div>
	        </form>
	        <button type="button" class="btn btn-success" onclick="fillFormWithSampleData()" style="margin-top:10px;margin-bottom:10px">fillFormWithSampleData</button>
			<div class="alert alert-info">
				SPARQL queries require triples as an output. First and third element are mapped to vertices, second to an edge
			</div>
			<div class="alert alert-info">
				<strong>Endpoint example</strong><br>
				http://dbpedia.org/sparql
			</div>
			<div class="alert alert-info">
				<strong>Query example</strong><br>
				SELECT DISTINCT ?City "isLocatedIn" ?Country<br>
				WHERE { <br>
					?City rdf:type dbo:City ;<br> 
					rdfs:label ?label ; <br>
					dbo:country ?Country<br>
				} LIMIT 100
			</div>`);
}

function fillFormWithSampleData(){
	$("#outputIdentifier").val("cities10");
	$("#sparqlEndpoint").val("http://dbpedia.org/sparql");
	$("#sparqlQuery").val("SELECT DISTINCT ?City \"isLocatedIn\" ?Country\nWHERE { \n    ?City rdf:type dbo:City;\n    rdfs:label ?label; \n    dbo:country ?Country\n} LIMIT 10");
}

function getRDFGraphConfig(){
	var config = {
			"endpoint": $("#sparqlEndpoint").val(),
			"query": $("#sparqlQuery").val()
	};
	
	return config;
}

