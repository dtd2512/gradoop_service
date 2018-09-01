var mxBasePath = 'js/mxgraph/src';

function Workflow(){}

// Workflow graph starts here. The document.onLoad executes the
// createEditor function with a given configuration.
// In the config file, the mxEditor.onInit method is
// overridden to invoke this global function as the
// last step in the editor constructor.
Workflow.init = function(editor)
{	
	var graphVariables = {};
	
	initialize();
	
	function initialize(){
		$.editor = editor;
		// Enables rotation handle
		mxVertexHandler.prototype.rotationEnabled = true;

		// Enables guides
		mxGraphHandler.prototype.guidesEnabled = true;
		
	    // Alt disables guides
	    mxGuide.prototype.isEnabledForEvent = function(evt)
	    {
	    	return !mxEvent.isAltDown(evt);
	    };
		
		// Enables snapping waypoints to terminals
		mxEdgeHandler.prototype.snapToTerminals = true;
		
		// Defines an icon for creating new connections in the connection handler.
		// This will automatically disable the highlighting of the source vertex.
		mxConnectionHandler.prototype.connectImage = new mxImage('images/workflow/connector.gif', 16, 16);
		
		// Enables connections in the graph and disables
		// reset of zoom and translate on root change
		// (ie. switch between XML and graphical mode).
		editor.graph.setConnectable(true);

		// Clones the source if new connection has no target
		//editor.graph.connectionHandler.setCreateTarget(true);
		
		// disables popup menu
		mxPopupMenu.prototype.enabled = false;
		
		// disables panning
		editor.graph.setPanning(false);
		
		// hiding the first toolbar element, but keeps it selected, changes default left click behavior
		$("#toolbar img").first().css("visibility", "hidden");
		$("#toolbar img").first().css("width", "100%");
		
		var isMouseOverGraph = false;
		
	    // Changes the zoom on mouseWheel events
	    mxEvent.addMouseWheelListener(function (evt, up)
	    {
		    if (!mxEvent.isConsumed(evt))
		    {
		    	if (up && isMouseOverGraph)
				{
		    		editor.execute('zoomIn');
				}
				else if(isMouseOverGraph)
				{
					editor.execute('zoomOut');
				}
				//mxEvent.consume(evt);
		    }
	    });
	    $('#graph').on('mouseover', function(event){ isMouseOverGraph = true; });     
	    $('#graph').on('mouseout', function(event){ isMouseOverGraph = false; });

		// Create select actions in page
		var node = document.getElementById('zoomActions');
		mxUtils.write(node, 'Zoom: ');
		mxUtils.linkAction(node, 'In', editor, 'zoomIn');
		mxUtils.write(node, ', ');
		mxUtils.linkAction(node, 'Out', editor, 'zoomOut');
		mxUtils.write(node, ', ');
		mxUtils.linkAction(node, 'Actual', editor, 'actualSize');
		mxUtils.write(node, ', ');
		mxUtils.linkAction(node, 'Fit', editor, 'fit');

		$('#zoomActions span').css('color', '#6e6e6e');
		
		editor.graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt)
		{
			selectionChanged(editor.graph);
		});
		//selectionChanged(editor.graph);
		
		var style = editor.graph.getStylesheet().getDefaultVertexStyle();
		style[mxConstants.STYLE_STROKECOLOR] = 'black';
		//style[mxConstants.STYLE_ROUNDED] = true;
		style[mxConstants.STYLE_SHADOW] = false;
		style[mxConstants.STYLE_FILLCOLOR] = 'white';
		//style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
		style[mxConstants.STYLE_FONTCOLOR] = 'black';
		style[mxConstants.STYLE_FONTSIZE] = '12';
		style[mxConstants.STYLE_SPACING] = 4;
		
		// Rounded edge and vertex handles
		var touchHandle = new mxImage('images/workflow/handle-main.png', 17, 17);
		mxVertexHandler.prototype.handleImage = touchHandle;
		mxEdgeHandler.prototype.handleImage = touchHandle;
		mxOutline.prototype.sizerImage = touchHandle;
		
		// computes workflow using individual ajax requests
		document.getElementById("workflowRun").appendChild(mxUtils.button('Run', computeWorkflow));
		
		// computes workflow in one request
		document.getElementById("workflowRun").appendChild(mxUtils.button('RunAtOnce', computeBuilderWorkflow));

		document.getElementById("workflowRun").appendChild(mxUtils.button('RunSelected', computeSelected));

		$('#workflowRun button').addClass('btn btn-success');
		$('#workflowRun button').css('marginRight', '10px');
		
		$("#displaySaveAsWorkflowConfig").on("click", displaySaveAsWorkflowConfig);
		$("#displayLoadWorkflowConfig").on("click", displayLoadWorkflowConfig);
		$("#clearWorkflow").on("click", clearWorkflow);
		
		// adding on-screen label to the connectors using connector identifier
		editor.graph.convertValueToString = function(cell)
		{
			if (mxUtils.isNode(cell.value)	)
			{
				if (cell.value.nodeName.toLowerCase() == 'connector')
				{
					return cell.getAttribute('identifier', '');
				}
				else
				{
					return cell.getAttribute('label', '');
				}
			}
			return '';
		};
		
		var incomingLinkingConnectorIndex = 1;
		
		// setting default on-screen label for linking inputs other then graphs
		editor.graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, event){
			var edge = event.getProperty('cell');
			var source = editor.graph.getModel().getTerminal(edge, true);
			var target = editor.graph.getModel().getTerminal(edge, false);

			if(target.getAttribute("label") == "Linking" && source.getAttribute("label") != "Graph")
			{
				edge.setAttribute("identifier", "INPUT" + incomingLinkingConnectorIndex);
				incomingLinkingConnectorIndex++;
			}
		});
		
		addConnectionValidationHandler();
	}
	
	function addConnectionValidationHandler(){
		var allowedConnections = {
				"Graph":        { maxIncoming:   0, maxOutgoing: 999 },
				"RDFGraph":     { maxIncoming:   0, maxOutgoing: 999 },
				"Filter":       { maxIncoming:   1, maxOutgoing: 999 },
				"Linking":      { maxIncoming: 999, maxOutgoing: 999 },
				"Clustering":   { maxIncoming:   1, maxOutgoing: 999 },
				"Sampling":     { maxIncoming:   1, maxOutgoing: 999 },
				"Grouping":     { maxIncoming:   1, maxOutgoing: 999 },
				"EdgeFusion":   { maxIncoming:   1, maxOutgoing: 999 },
				"VertexFusion": { maxIncoming:   1, maxOutgoing: 999 },
				"Cypher":       { maxIncoming:   1, maxOutgoing: 999 },
				"Combine":      { maxIncoming:   2, maxOutgoing: 999 },
				"Overlap":      { maxIncoming:   2, maxOutgoing: 999 },
				"Exclude":      { maxIncoming:   2, maxOutgoing: 999 },
				"SchemaGraph":  { maxIncoming:   1, maxOutgoing: 999 },
				"ExpandGraph":  { maxIncoming:   1, maxOutgoing: 999 },
				"WCC":          { maxIncoming:   1, maxOutgoing: 999 },
				"PageRank":     { maxIncoming:   1, maxOutgoing: 999 },
				"Output":       { maxIncoming:   1, maxOutgoing:   0 }
		};
		
	    editor.graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, event){
		    var edge = event.getProperty("cell");
		    var source = editor.graph.getModel().getTerminal(edge, true);
		    var target = editor.graph.getModel().getTerminal(edge, false);

		    var connectionStats = getConnectionStats();
		    
		    var sourceLabel = connectionStats[source.getId()].label;
		    var targetLabel = connectionStats[target.getId()].label;
		    
		    if(!isValidConnectionCount() || !isUniqueConnection(source.getId(), target.getId(), edge.getId())){
		    	var edgeCell = editor.graph.getModel().getCell(edge.getId());
		    	editor.graph.getModel().remove(edgeCell);
		    }
		    
		    function isValidConnectionCount(){
			    if(allowedConnections[sourceLabel].maxIncoming < connectionStats[source.getId()].incoming
			    		|| allowedConnections[sourceLabel].maxOutgoing < connectionStats[source.getId()].outgoing
			    		|| allowedConnections[targetLabel].maxIncoming < connectionStats[target.getId()].incoming
			    		|| allowedConnections[targetLabel].maxOutgoing < connectionStats[target.getId()].outgoing){
			    	return false;
			    }
			    return true;
		    }
		    
		    function isUniqueConnection(newSourceId, newTargetId, newEdgeId){
		    	var allCells = editor.graph.getChildCells(editor.graph.getDefaultParent(), true, true);
		    	
		    	// iterating over connections
		    	for(var i = 0; i < allCells.length; i++){
		    		
		    		if(allCells[i].isEdge()){
		    			var edgeId = allCells[i].getId();
		    			var sourceId = allCells[i].source.id;
		    			var targetId = allCells[i].target.id;
		    			
		    			if(newSourceId == sourceId && newTargetId == targetId && newEdgeId != edgeId){
		    				return false;
		    			}
		    		}
		    	}
		    	return true;
		    }
	    });
	    
	    function getConnectionStats(){
	    	var result = {};
	    	
	    	var allCells = editor.graph.getChildCells(editor.graph.getDefaultParent(), true, true);
	    	
	    	// iterating over cells
	    	for(var i = 0; i < allCells.length; i++){
	    		var cellId = allCells[i].getId();
	    		var label = allCells[i].getAttribute("label");
	    		
	    		if(allCells[i].isVertex()){
		    		result[cellId] = {
			    		"label": label,
			    		"incoming": 0,
			    		"outgoing": 0
			    	}
	    		}
	    	}
	    	
	    	// iterating over connections
	    	for(var i = 0; i < allCells.length; i++){
	    		if(allCells[i].isEdge()){
	    			var sourceId = allCells[i].source.id;
	    			var targetId = allCells[i].target.id;
	    			result[sourceId].outgoing++;
	    			result[targetId].incoming++;
	    		}
	    	}
	    	
	    	return result;
	    }
	}
	
	function selectionChanged(graph){
		// perform actions related to the cell, that was deselected
		readSelection();
		
		//$.ajaxSetup({async: true});
		
		// Forces focusout in IE
		editor.graph.container.focus();

		// Gets the selection cell
		var cell = editor.graph.getSelectionCell();

		var opConfig = $('#operatorConfig');

		if (cell == null)
		{
			opConfig.empty();
		}
		else
		{	
			opConfig.empty();
			var attrs = cell.value.attributes;

			if(attrs['label'].nodeValue == "Graph"){
				selectGraphCell(opConfig, cell, editor)
			}
			else if(attrs['label'].nodeValue == "RDFGraph"){
				selectRDFGraphCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Filter"){
				selectFilterCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Linking"){
				selectLinkingCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Clustering"){
				selectClusteringCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Sampling"){
				selectSamplingCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Grouping"){
				selectGroupingCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "EdgeFusion"){
				selectEdgeFusionCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "VertexFusion"){
				selectVertexFusionCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Cypher"){
				selectCypherCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "PageRank"){
				selectPageRankCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == ""){
				selectConnectorCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Exclude"){
				selectExcludeCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "ExpandGraph"){
				selectExpandGraphCell(opConfig, cell);
			}
			else if(attrs['label'].nodeValue == "Output"){
				selectOutputCell(opConfig, cell);
			}			
		}
		
		graphVariables.previousSelection = cell;
	}
	
	/**
	 * Reads value associated with the cell
	 */
	function readSelection(){
		// stop from attempts to execute the method in case no cell selection existed
		if(!graphVariables.previousSelection) return;

		var cellId = graphVariables.previousSelection.getId();
		var jsonRoot = getJsonRoot();
		var element = getElement(cellId);

		if($("#databases2").length){
			if(element) {
				var oldIdentifier = element._attr.identifier._value;
			}
			
			var identifier = $("#databases2").val();

			checkChanged(oldIdentifier, identifier);

			saveAttribute(graphVariables.previousSelection, "identifier", identifier);
		}
		
		if($("#sparqlEndpoint").length){
			if(element) {
				var oldRdfGraphConfig = element._attr.rdfGraphConfig._value;
				var oldIdentifier = element._attr.identifier._value;
			}
			
			var rdfGraphConfig = JSON.stringify(getRDFGraphConfig());
			var identifier = $("#outputIdentifier").val();

			checkChanged(oldRdfGraphConfig, rdfGraphConfig);
			checkChanged(oldIdentifier, identifier);
			
			saveAttribute(graphVariables.previousSelection, "rdfGraphConfig", rdfGraphConfig);
			saveAttribute(graphVariables.previousSelection, "identifier", identifier);
		}
		
		if( $('#filteringSettings').length ){
			if(element) {
				var oldFilteringConfig = element._attr.filteringConfig._value; 
			}
			
			var filteringConfig = {};	
			filteringConfig["vertex"] = $("#nodeSwitchCheckbox").prop('checked') ? getfilteringConfig(".node-item") : [];
			filteringConfig["edge"] = $("#edgeSwitchCheckbox").prop('checked') ? getfilteringConfig(".edge-item") : [];	
			filteringConfig = JSON.stringify(filteringConfig);

			checkChanged(oldFilteringConfig, filteringConfig);
			
			saveAttribute(graphVariables.previousSelection, "filteringConfig", filteringConfig);
		}
		
		if( $("#linkConfig").length ){
			if(element) {
				var oldLinkingConfig = element._attr.linkingConfig._value;			
			}
			var linkingConfig = JSON.stringify(getLinkingConfig());

			checkChanged(oldLinkingConfig, linkingConfig);
			
			saveAttribute(graphVariables.previousSelection, "linkingConfig", linkingConfig);
		}

		if( $("#clusteringMethod").length ){
			if(element) {
				var oldClusteringConfig = element._attr.clusteringConfig._value;	
			}
			var clusteringConfig = JSON.stringify(getClusteringConfig());

			checkChanged(oldClusteringConfig, clusteringConfig);	
			
			saveAttribute(graphVariables.previousSelection, "clusteringConfig", clusteringConfig);
		}
		
		if( $("#samplingOperatorInputGroup").length ){
			if(element) {
				var oldSamplingConfig = element._attr.samplingConfig._value;	
			}
			var samplingConfig = JSON.stringify(getSamplingConfig());

			checkChanged(oldSamplingConfig, samplingConfig);			
			
			saveAttribute(graphVariables.previousSelection, "samplingConfig", samplingConfig);
		}
		
		if( $('#groupingNodeSettings').length ){
			if(element) {
				var oldGrpConfig = element._attr.grpConfig._value;			
			}
			var grpConfig = getGroupingConfig();

			checkChanged(oldGrpConfig, grpConfig);
			
			saveAttribute(graphVariables.previousSelection, "grpConfig", grpConfig);
		}

		if( $('#edgeFusionMethodInputGroup').length ){
			if(element) {
				var oldEdgeFusionConfig = element._attr.edgeFusionConfig._value;
			}
			var edgeFusionConfig = JSON.stringify(getEdgeFusionConfig());

			checkChanged(oldEdgeFusionConfig, edgeFusionConfig);
			
			saveAttribute(graphVariables.previousSelection, "edgeFusionConfig", edgeFusionConfig);
		}
		
		if( $('#vertexFusionMethodInputGroup').length ){
			if(element) {
				var oldVertexFusionConfig = element._attr.vertexFusionConfig._value;				
				var vertexFusionConfig = JSON.stringify(getVertexFusionConfig());
			}

			checkChanged(oldVertexFusionConfig, vertexFusionConfig);
			
			saveAttribute(graphVariables.previousSelection, "vertexFusionConfig", vertexFusionConfig);
		}
		
		if( $("#cypher-query-form").length ){
			if(element) {
				var oldFormdata = element._attr.formdata._value;	
			}
			var formdata = $('#cypher-query-form').serialize();

			checkChanged(oldFormdata, formdata);

			saveAttribute(graphVariables.previousSelection, "formdata", formdata);
		}
		
		if( $('#exclusionConnectorIdentifier').length ){
			var edit = new mxCellAttributeChange(graphVariables.previousSelection, "identifier", $('#exclusionConnectorIdentifier').val());
            editor.graph.getModel().execute(edit);			
		}
		
		if( $('#linkingConnectorIdentifier').length ){
			var edit = new mxCellAttributeChange(graphVariables.previousSelection, "identifier", $('#linkingConnectorIdentifier').val());
            editor.graph.getModel().execute(edit);			
		}

		if( $('#damping').length && $('#iterations').length ){
			if(element) {
				var oldDampingFactor = element._attr.dampingFactor._value;
				var oldIterations = element._attr.iterations._value;
			}

			var dampingFactor = $('#damping').val();
			var iterations = $('#iterations').val();
			
			checkChanged(oldDampingFactor, dampingFactor);
			checkChanged(oldIterations, iterations);
			
			saveAttribute(graphVariables.previousSelection, "dampingFactor", dampingFactor);
			saveAttribute(graphVariables.previousSelection, "iterations", iterations);
		}
		
		if( $('#overlapIncomingEdges').length ){
			if(element) {
				var oldPreviousCellId = element._attr.previousCellId._value;
				var oldFirstIncomingEdgeIdentifier = element._attr.firstIncomingEdgeIdentifier._value;
			}
			
			var jsonRoot = getJsonRoot();
			var firstIncomingEdgeIdentifier = $('#overlapIncomingEdges').selectpicker('val');
			
			for(var i = 0; i < jsonRoot["Connector"].length; i++){
				// finds edges that point to the overlap cell
				// and selects edge, that has identifier, that was previously chosen 
				if(jsonRoot["Connector"][i].mxCell[0]._attr.target._value == graphVariables.previousSelection.getId() &&
						jsonRoot["Connector"][i]._attr.identifier._value == firstIncomingEdgeIdentifier){
					var previousCellId = jsonRoot["Connector"][i].mxCell[0]._attr.source._value;
				}
			}
			
			checkChanged(oldPreviousCellId, previousCellId);
			checkChanged(oldFirstIncomingEdgeIdentifier, firstIncomingEdgeIdentifier);		
			
			saveAttribute(graphVariables.previousSelection, "firstCell", previousCellId);    
			saveAttribute(graphVariables.previousSelection, "firstEdge", firstIncomingEdgeIdentifier);         
		}
		
		if( $("#typePropertyKey").length ){
			if(element) {
				var oldTypePropertyKey = element._attr.typePropertyKey._value;
			}
			var typePropertyKey = $("#typePropertyKey").val();
			
			checkChanged(oldTypePropertyKey, typePropertyKey);
			
			saveAttribute(graphVariables.previousSelection, "typePropertyKey", typePropertyKey);
		}
		
		if( $("#outputCellInputGroup").length ){
			if(element) {
				var oldIdentifier = element._attr.identifier._value;
			}
			var identifier = $("#outputIdentifier").val();
			
			checkChanged(oldIdentifier, identifier);		
			
			saveAttribute(graphVariables.previousSelection, "identifier", identifier);
		}
		
		function checkChanged(oldValue, newValue){
			if(oldValue != newValue){
				setChanged();
			}
		}
		
		function setChanged(){
			var changedEdit = new mxCellAttributeChange(graphVariables.previousSelection, "changed", true);
	        editor.graph.getModel().execute(changedEdit);
		}
		
		function saveAttribute(cell, attributeName, attributeValue){
			var edit = new mxCellAttributeChange(cell, attributeName, attributeValue);
            editor.graph.getModel().execute(edit);
		}
	}
	
	function selectGraphCell(opConfig, cell, editor){
		var currentDatabases = [];
	    opConfig.append(
			`<div class="input-group">
                <span class="input-group-addon">Graph</span>
                <select id="databases2" class="selectpicker" title="...">
                </select>
             </div>`);
	    $.get('rest/databases/')
        .done(initializeDatabaseMenu2)
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
	    
	    opConfig.append(`<button id="refreshMetadata" type="button" class="btn btn-success" style="margin-top:15px;margin-bottom:15px">Refresh metadata</button>`);
	    
	    $("#refreshMetadata").on("click", function(){
		    var selectedGraph = $("#databases2").val();
		    
		    if($("#metadataRefreshResult").length){
		    	$("#metadataRefreshResult").remove();
		    }
		    $("#refreshMetadata").removeClass("btn-success");
		    $("#refreshMetadata").html("Refreshing metadata...");
		    
		    deleteMetadataRelatedProperties();
		    
			$.get(`rest/updateMetaData/${selectedGraph}`)
			.done(function (data){
				if($("#refreshMetadata").length){
					$("#refreshMetadata").addClass("btn-success");
					$("#refreshMetadata").html("Refresh metadata");
					
					opConfig.append(`
						<div id="metadataRefreshResult" class="alert alert-success alert-dismissible">
							<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
							Metadata refresh complete!
						</div>`);
				}
			});
	    });
	    
	    
	    function deleteMetadataRelatedProperties(){
			var jsonRoot = getJsonRoot();
			
			console.log(JSON.stringify(jsonRoot));
			
			if(jsonRoot["Filter"]){
				for(var i = 0; i < jsonRoot["Filter"].length; i++){
					var currentCellId = jsonRoot["Filter"][i]._attr.id._value;
					var currentCell = editor.graph.getModel().getCell(currentCellId);
					
					var edit = new mxCellAttributeChange(currentCell, "filteringConfig", `{"vertex":[],"edge":[]}`);
		            editor.graph.getModel().execute(edit);
				}
			}
			
			if(jsonRoot["Grouping"]){
				for(var i = 0; i < jsonRoot["Grouping"].length; i++){
					var currentCellId = jsonRoot["Grouping"][i]._attr.id._value;
					var currentCell = editor.graph.getModel().getCell(currentCellId);
					
					var edit = new mxCellAttributeChange(currentCell, "grpConfig", `{"conf":[]}`);
		            editor.graph.getModel().execute(edit);
				}
			}

			if(jsonRoot["Linking"]){
				for(var i = 0; i < jsonRoot["Linking"].length; i++){
					var currentCellId = jsonRoot["Linking"][i]._attr.id._value;
					var currentCell = editor.graph.getModel().getCell(currentCellId);
					
					var edit = new mxCellAttributeChange(currentCell, "linkingConfig", "");
		            editor.graph.getModel().execute(edit);
				}
			}

			if(jsonRoot["EdgeFusion"]){
				for(var i = 0; i < jsonRoot["EdgeFusion"].length; i++){
					var currentCellId = jsonRoot["EdgeFusion"][i]._attr.id._value;
					var currentCell = editor.graph.getModel().getCell(currentCellId);
					
					var edit = new mxCellAttributeChange(currentCell, "edgeFusionConfig", `{"edgeLabel":"", "edgeAtribute":"", "edgeFusionMethod":""}`);
		            editor.graph.getModel().execute(edit);
				}
			}

			if(jsonRoot["VertexFusion"]){
				for(var i = 0; i < jsonRoot["VertexFusion"].length; i++){
					var currentCellId = jsonRoot["VertexFusion"][i]._attr.id._value;
					var currentCell = editor.graph.getModel().getCell(currentCellId);
					
					var edit = new mxCellAttributeChange(currentCell, "vertexFusionConfig", `{"vertexAtribute":"", "vertexFusionMethod":"", "deleteReflexiveEdges":""}`);
		            editor.graph.getModel().execute(edit);
				}
			}
	    }
	    
	    function initializeDatabaseMenu2(databases) {
	        databases.sort();
	        var databaseSelect = $('#databases2');

	        var diff = $(databases).not(currentDatabases).get();
	        databaseSelect.show();
//	        databaseSelect.on('changed.bs.select', function(){
//            	var edit = new mxCellAttributeChange(cell, "identifier", $('#databases2').find(':selected').text());
//                editor.graph.getModel().execute(edit);
//	        });
	        
	        if (currentDatabases.length != 0 && diff.length == 1) {
	            databaseSelect.append('<option selected="selected" value="' + diff[0] + '">' + diff[0] + '</option>');
	        } else {
	            for (var i = 0; i < diff.length; i++) {
	                var name = diff[i];
	                databaseSelect.append('<option value="' + name + '">' + name + '</option>');
	            }
	        }
	        databaseSelect.selectpicker('refresh');
	        
	        databaseSelect.selectpicker('val', cell.getAttribute('identifier', ''));
	        currentDatabases = databases;

	        // on click, the dropdown menus open, this has to be done here so it is done only once
//	        $('.dropDown').find('dt a').on('click', function () {
//	            $(this).closest('.dropDown').find('ul').slideToggle('fast');
//	        });

	        // hide dropdown menus when something else is clicked
//	        $(document).bind('click', function (e) {
//	            var $clicked = $(e.target);
//	            if (!$clicked.parents('#vertexPropertyKeys').length)
//	                $('#vertexPropertyKeys').find('dd ul').hide();
//	            if (!$clicked.parents('#edgePropertyKeys').length)
//	                $('#edgePropertyKeys').find('dd ul').hide();
//	            if (!$clicked.parents('#vertexFilters').length)
//	                $('#vertexFilters').find('dd ul').hide();
//	            if (!$clicked.parents('#edgeFilters').length)
//	                $('#edgeFilters').find('dd ul').hide();
//	            if (!$clicked.parents('#vertexAggrFuncs').length)
//	                $('#vertexAggrFuncs').find('dd ul').hide();
//	            if (!$clicked.parents('#edgeAggrFuncs').length)
//	                $('#edgeAggrFuncs').find('dd ul').hide();
//	        });
	    }
	}
	
	function selectRDFGraphCell(opConfig, cell){
		loadRDFGraphConfigForm(opConfig);
		
		var rdfGraphConfig = JSON.parse(cell.value.attributes['rdfGraphConfig'].nodeValue);
		var identifier = cell.value.attributes['identifier'].nodeValue;
		
		$("#sparqlEndpoint").val(rdfGraphConfig.endpoint),
		$("#sparqlQuery").val(rdfGraphConfig.query),
		$("#outputIdentifier").val(identifier);
	}
	
	function selectFilterCell(opConfig, cell){					
		var jsonRoot = getJsonRoot();
		
		if (incomingConnectorExists(cell.id)) {
			preprocessPreceedingInputs(cell.id, selectFilterCellCallback);
			
			function selectFilterCellCallback(){
			    $.postJSON('rest/combinedKeys', JSON.stringify(computePreceedingGraphs(cell.id)), 
			    		function (metaData) {
			    			metaData = complementMetaData(metaData, getPreceedingCellId(cell.id));
			    			
							setTimeout(function(){
								
								var fillForm = function(filterOperationsData){
									var filteringConfig = JSON.parse(cell.value.attributes['filteringConfig'].nodeValue);
									
									// iterating vertex labels
									for(var i = 0; i < filteringConfig.vertex.length; i++){
										
										var selector = "#filteringSettings strong:contains('"+filteringConfig.vertex[i].label+"')";
										var elem = $(selector).filter(function(){
											return $(this).html() === filteringConfig.vertex[i].label;
										});
										
										elem.prev().prop('checked', true);
										if( elem.parent().next().attr('data-properties') != "" ){
											elem.parent().next().css('display', 'inline-block');
										}
										
										var eval = filteringConfig.vertex[i].eval.split(',');
										
										// iterating filtering options for each label
										for(var j = 0; j < filteringConfig.vertex[i].filter.length; j++){
											
											drawFilteringCriteria();
											
							                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(1)).children().filter(function(){
							                	return $(this).html() === filteringConfig.vertex[i].filter[j].attribute;
							                }).attr('selected','selected');
							                
							                if(filteringConfig.vertex[i].filter[j].type === "textual"){
							                	$($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(2)).find('optgroup.textual-group').children().filter(function(){
								                	return $(this).html() === filteringConfig.vertex[i].filter[j].operation;
								                }).attr('selected','selected');
							                    elem.parent().parent().parent().find(".textual-group").attr("style","display:initial");
							                    elem.parent().parent().parent().find(".numeric-group").attr("style","display:none");
							                }
							                else{
							                	$($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(2)).find('optgroup.numeric-group').children().filter(function(){
								                	return $(this).html() === filteringConfig.vertex[i].filter[j].operation;
								                }).attr('selected','selected');
							                    elem.parent().parent().parent().find(".textual-group").attr("style","display:none");
							                    elem.parent().parent().parent().find(".numeric-group").attr("style","display:initial");
							                }
							                
							                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(3)).val(filteringConfig.vertex[i].filter[j].rightSide);		                
							                
							                if(j != 0){
								                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(0)).find('option').filter(function(){
								                	return $(this).html() === eval[j-1];
								                }).attr('selected','selected');
							                }
										}						
									}
									
									// iterating edge labels
									for(var i = 0; i < filteringConfig.edge.length; i++){								
										var selector = "#filteringSettings strong:contains('"+filteringConfig.edge[i].label+"')";
										var elem = $(selector).filter(function(){
											return $(this).html() === filteringConfig.edge[i].label;
										});
										
										elem.prev().prop('checked', true);
										if( elem.parent().next().attr('data-properties') != "" ){
											elem.parent().next().css('display', 'inline-block');
										}
										
										var eval = filteringConfig.edge[i].eval.split(',');
										
										
										// iterating filtering options for each label
										for(var j = 0; j < filteringConfig.edge[i].filter.length; j++){
											
											drawFilteringCriteria();

							                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(1)).children().filter(function(){
							                	return $(this).html() === filteringConfig.edge[i].filter[j].attribute;
							                }).attr('selected','selected');
							                
							                if(filteringConfig.edge[i].filter[j].type === "textual"){
							                	$($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(2)).find('optgroup.textual-group').children().filter(function(){
								                	return $(this).html() === filteringConfig.edge[i].filter[j].operation;
								                }).attr('selected','selected');
							                    elem.parent().parent().parent().find(".textual-group").attr("style","display:initial");
							                    elem.parent().parent().parent().find(".numeric-group").attr("style","display:none");
							                }
							                else{
							                	$($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(2)).find('optgroup.numeric-group').children().filter(function(){
								                	return $(this).html() === filteringConfig.edge[i].filter[j].operation;
								                }).attr('selected','selected');
							                    elem.parent().parent().parent().find(".textual-group").attr("style","display:none");
							                    elem.parent().parent().parent().find(".numeric-group").attr("style","display:initial");
							                }
							                
							                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(3)).val(filteringConfig.edge[i].filter[j].rightSide);		                
							                
							                if(j != 0){
								                $($(elem.parent().parent().parent().find('div.input-group').get(j)).children().get(0)).find('option').filter(function(){
								                	return $(this).html() === eval[j-1];
								                }).attr('selected','selected');
							                }
										}	
									}
									
									function drawFilteringCriteria(){
						                var propertyline = '<div class="input-group" style=""><div class="input-group-addon" style=""><select>';
						                filterOperationsData.operations[0].eval.forEach(function(e){ propertyline += '<option>'+e+'</option>'; });
						                propertyline += '</select></div><select class="form-control" style="width: 33%;">';
						                elem.prev().attr("data-properties").split("|").forEach(function(e,i){ x=e.split(","); propertyline += '<option value="'+(x[1]=="false"?"textual":"numeric")+'">'+x[0]+'</option>'; });
						                propertyline += '</select><select class="form-control" style="width: 33%;"><optgroup class="numeric-group" label="Wertevergleich">';
						                filterOperationsData.operations[1].numeric.forEach(function(e){ propertyline += '<option>'+e+'</option>'; });
						                propertyline += '</optgroup><optgroup class="textual-group" label="Textvergleich">';
						                filterOperationsData.operations[2].textual.forEach(function(e){ propertyline += '<option'+(e=='exists' ? ' selected="selected"' : '')+'>'+e+'</option>'; });
						                propertyline += '</optgroup></select><input type="text" class="form-control" placeholder="Wert" style="width: 34%;"><div class="input-group-addon"><button onclick=\"$(this).parent().parent().remove()\">x</button></div></div>';
						                elem.prev().parent().parent().parent().append(propertyline);
						                elem.prev().parent().parent().find(".input-group").last().find(".form-control").first().change(function(f){
						                    $(f.target).parent().find(".textual-group").attr("style","display:"+($(f.target).parent().find(".form-control").first().val()=="textual"?"initial":"none"));
						                    $(f.target).parent().find(".numeric-group").attr("style","display:"+($(f.target).parent().find(".form-control").first().val()=="textual"?"none":"initial"));
						                });
						                elem.prev().parent().parent().find(".input-group").last().find(".form-control").first().change();
									}
								};
								
								loadFilteringOperatorConfigFormHelper(metaData, opConfig, fillForm);
							}, 1);
			            }	    
			        );
			}
		}			
	}
	
	function selectLinkingCell(opConfig, cell){
		var jsonRoot = getJsonRoot();
		
		// check if inputs exist
		if (incomingConnectorExists(cell.id)) {
			preprocessPreceedingInputs(cell.id, selectLinkingCellCallback);
			
			function selectLinkingCellCallback(){
				var inputs = [];
				
				// obtaining inputs
				for(var i = 0; i < jsonRoot["Connector"].length; i++){
					// select connectors that points to the current linking cell
					if(jsonRoot["Connector"][i].mxCell[0]._attr.target._value == cell.getId()){
						var previousCellId = jsonRoot["Connector"][i].mxCell[0]._attr.source._value;
						// check if graph cell is an input to the linking cell
						if(getElement(previousCellId)._attr.label._value == "Graph"){
							inputs.push({
								"type": "Graph",
								"id": previousCellId,
								"identifier": getElement(previousCellId)._attr.identifier._value
							});
						}
						else{
							inputs.push({
								"type": "SubWorkflow",
								"id": previousCellId,
								"identifier": jsonRoot["Connector"][i]._attr.identifier._value,
								"value": computePreceedingGraphs( getElement(previousCellId)._attr.id._value )								
							});
						}
					}
				}

				inputs.push({
					"type": "AllGraphs",
					"identifier": "*"	
				});
				
				
				$.postJSON('rest/linkingKeys', JSON.stringify(inputs),
						function(response){
							response = complementLinkingMetaData(response, cell.id);

				    		var fillForm = function(){
				    		var linkingConfigCell = cell.value.attributes['linkingConfig'].nodeValue;

				    		if(linkingConfigCell != ""){
					    		var linkingConfig = JSON.parse(linkingConfigCell);

					    		blockingComponentsCount = linkingConfig.linkSpec.blockingComponents.length;
					    		for(var i = 0; i < blockingComponentsCount; i++){	
					    			$(".blockingConfigurationItem").last().attr("data-config", JSON.stringify(linkingConfig.linkSpec.blockingComponents[i]));	
					    			if(i < (blockingComponentsCount - 1)){
					    				$("#addBlockingConfiguration").click();
					    			}
					    		}
					    		$(".blockingConfigurationItem").first().click();
					    		
					    		similarityComponentsCount = linkingConfig.linkSpec.similarityComponents.length;
					    		//console.log("similarityComponentsCount: " + similarityComponentsCount);
					    		for(var i = 0; i < similarityComponentsCount; i++){
					    			//console.log(JSON.stringify(linkingConfig.linkSpec.similarityComponents[i]));
					    			$(".similarityConfigurationItem").last().attr("data-config", JSON.stringify(linkingConfig.linkSpec.similarityComponents[i]));	
					    			if(i < (similarityComponentsCount - 1)){
					    				$("#addSimilarityConfiguration").click();
					    			}
					    		}
					    		
					    		
					    		$(".similarityConfigurationItem").first().click();
					    		
								$("#aggregationStrategy input").each(function(i){
									if( $(this).val() == linkingConfig.linkSpec.selectionComponent.aggregationStrategy ){
										$(this).prop("checked", true).change();
									}
								});
								
								$("#aggregationThresholdSlider").bootstrapSlider("setValue", linkingConfig.linkSpec.selectionComponent.aggregationThreshold);
								$("#aggregationThresholdSpan").text(linkingConfig.linkSpec.selectionComponent.aggregationThreshold);
								
								$("#selectionRuleEnabled").prop("checked", linkingConfig.linkSpec.selectionRuleEnabled);
								if($("#selectionRuleEnabled").is(":checked")){
									$("#selectionRuleOverlay").hide();
								}
								else{
									$("#selectionRuleOverlay").show();
								}
								
								var ruleComponents = linkingConfig.linkSpec.selectionComponent.ruleComponents;
								
								for(var i = 0; i < ruleComponents.length; i++){							
									switch(ruleComponents[i].componentType){
									case "OPEN_PARENTHESIS":
										addOpenParenthesisRuleComponent();
										break;
									case "CLOSE_PARENTHESIS":
										addCloseParenthesisRuleComponent();
										break;
									case "SELECTION_OPERATOR_AND":
										addAndOperatorRuleComponent();
										break;
									case "SELECTION_OPERATOR_OR":
										addOrOperatorRuleComponent();
										break;
									case "CONDITION":
										addSelectionCondition.index = 1;
										var conditionId = ruleComponents[i].conditionId;
										var similarityFieldId = ruleComponents[i].similarityFieldId;
										var operator = ruleComponents[i].operator;
										var threshold = ruleComponents[i].threshold;

										var shortOperator;
										switch(operator){
											case "EQUAL": shortOperator = "==";break;
											case "GREATER": shortOperator = ">";break;
											case "SMALLER": shortOperator = "<";break;
											case "GREATER_EQUAL": shortOperator = ">=";break;
											case "SMALLER_EQUAL": shortOperator = "<=";break;
											case "NOT_EQUAL": shortOperator = "!=";break;
											default:break;
										}
										
										$("#ruleComponents").append(
										`<button type="button" class="btn btn-default" 
											data-conditionId ="${conditionId}" 
											data-similarity="${similarityFieldId}" 
											data-operator="${operator}" 
											data-threshold="${threshold}" 
											style="display:block;float:left">${similarityFieldId} ${shortOperator} ${threshold}</button>`);
										
										addRuleComponentsHandler();
										addSelectionCondition.index++;
										
										break;
									default:
										break;
									}
								}
								
								$("#keepCurrentEdges").prop("checked", linkingConfig.linkSpec.keepCurrentEdges);
								$("#edgeLabel").val(linkingConfig.linkSpec.edgeLabel);
				    		}
			    		}
							
							loadLinkingOperatorConfigFormHelper(opConfig, response.data, fillForm);
						}
				);
			}
		}
	}
	
	function selectClusteringCell(opConfig, cell){
		loadClusteringOperatorConfigForm(opConfig);
		
		var clusteringConfig = JSON.parse(cell.getAttribute('clusteringConfig',''));
		
		$('#edgeAttribute').val(clusteringConfig.edgeAttribute);
		
		$('#clusteringMethod').val(clusteringConfig.clusteringMethod);
		$('#clusteringMethod').selectpicker("refresh");
	}
	
	function selectSamplingCell(opConfig, cell){
		loadSamplingOperatorConfigForm(opConfig);
		
		var samplingConfig = JSON.parse(cell.getAttribute('samplingConfig',''));
		
		$('#samplingMethod').val(samplingConfig.samplingMethod);
		$('#samplingThreshold').val(samplingConfig.samplingThreshold);
		
		$('#samplingMethod').selectpicker("refresh");
	}
	
	function selectGroupingCell(opConfig, cell){
		var jsonRoot = getJsonRoot();
		
		if (incomingConnectorExists(cell.id)) {
			
			preprocessPreceedingInputs(cell.id, selectGroupingCellCallback);
			
			function selectGroupingCellCallback(){
			    $.postJSON('rest/combinedKeys', JSON.stringify(computePreceedingGraphs(cell.id)), 
			    		function (metaData) {
	    					metaData = complementMetaData(metaData, getPreceedingCellId(cell.id));
			    			var fillForm = function(){
				    			var grpConfig = JSON.parse(cell.value.attributes['grpConfig'].nodeValue);
				    			for(var i = 0; i < grpConfig.conf.length; i++){	    				
				    				var settingsId = (grpConfig.conf[i].type == "vertex") ? '#groupingNodeSettings' : '#groupingEdgeSettings';			
			    					var selector = "strong:contains('" + grpConfig.conf[i].label + "')";
			    					var listGroupItem = $(settingsId).find(selector).parent();
			    					
			    					// check for empty string to prevent usage of split(','), that returns array of length 1 in this case
			    					var keys = (grpConfig.conf[i].keys !== "") ? grpConfig.conf[i].keys.split(','): [];

			    					for(var j = 0; j < keys.length; j++){
			    						var keySelector = "label:contains('" + keys[j] + "')";
			    						listGroupItem.find(keySelector).find('input').prop('checked', true);
			    					}

			    					if(grpConfig.conf[i].byneighbor){
				    					var neighborSelector = "option:contains('" + grpConfig.conf[i].byneighbor +"')";
			    						$(settingsId).find(selector).parent().find(neighborSelector).attr('selected','selected');
			    					}
				    			}
			    			}
			    			loadGroupingOperatorConfigFormHelper(opConfig, metaData, fillForm);
			    });
			}
		}
	}
	
	function selectEdgeFusionCell(opConfig, cell){
		var jsonRoot = getJsonRoot();
		
		if (incomingConnectorExists(cell.id)) {
			
			preprocessPreceedingInputs(cell.id, selectEdgeFusionCellCallback);
			
			function selectEdgeFusionCellCallback() {
			    $.postJSON('rest/combinedKeys', JSON.stringify(computePreceedingGraphs(cell.id)), 
			    		function (metaData) {
	    					metaData = complementMetaData(metaData, getPreceedingCellId(cell.id));
			    			var fillForm = function(){
				    			var edgeFusionConfig = JSON.parse(cell.value.attributes['edgeFusionConfig'].nodeValue);
				    			
				    			$("#edgeLabel").val(edgeFusionConfig.edgeLabel).change();
				    			$("#edgeAttribute").val(edgeFusionConfig.edgeAttribute);
				    			$("#edgeFusionMethod").val(edgeFusionConfig.edgeFusionMethod);
				    			
				    			$("#keepCurrentEdges").prop("checked", edgeFusionConfig.keepCurrentEdges);
				    			
				    		    $("#edgeLabel").selectpicker("refresh");
				    		    $("#edgeAttribute").selectpicker("refresh");
				    		    $("#edgeFusionMethod").selectpicker("refresh");
			    			}
			    			loadEdgeFusionOperatorConfigForm(opConfig, metaData, fillForm);
			    });
			}
		}
	}

	function selectVertexFusionCell(opConfig, cell){
		var jsonRoot = getJsonRoot();
		
		if (incomingConnectorExists(cell.id)) {
			
			preprocessPreceedingInputs(cell.id, selectVertexFusionCellCallback);
			
			function selectVertexFusionCellCallback() {
			    $.postJSON('rest/combinedKeys', JSON.stringify(computePreceedingGraphs(cell.id)), 
			    		function (metaData) {
	    					metaData = complementMetaData(metaData, getPreceedingCellId(cell.id));
			    			var fillForm = function(){
				    			var vertexFusionConfig = JSON.parse(cell.value.attributes['vertexFusionConfig'].nodeValue);
				    			
				    			$("#vertexAttribute").val(vertexFusionConfig.vertexAttribute);
				    			$("#vertexFusionMethod").val(vertexFusionConfig.vertexFusionMethod);
				    			$("#deleteReflexiveEdges").prop("checked", vertexFusionConfig.deleteReflexiveEdges);
				    			
				    		    $("#vertexLabel").selectpicker("refresh");
				    		    $("#vertexAttribute").selectpicker("refresh");
			    			}
			    			loadVertexFusionOperatorConfigForm(opConfig, metaData, fillForm);
			    });
			}
		}
	}
	
	function selectCypherCell(opConfig, cell){
		loadCypherQueryConfigForm(opConfig);
		
		// formdata has the following structure
		// option 1: cypher-query=[value1]&cypher-attach-attr=on&cypher-constr-pattern=[value2]
		// option 2: cypher-query=[value1]&cypher-constr-pattern=[value2]
		var formdata = cell.value.attributes['formdata'].nodeValue;
		var formElements = decodeURIComponent(formdata.replace(/\+/g," ")).split("&");
		
		if(formElements.length == 2){
			var cypherQuery = formElements[0].split("=");
			var cypherConstrPattern = formElements[1].split("=");
			
			$("#cypher-query").val(cypherQuery[1]);
			$("#cypher-attach-attr").prop('checked', false);
			$("#cypher-constr-pattern").val(cypherConstrPattern[1]);
		}
		else{
			var cypherQuery = formElements[0].split("=");
			var cypherAttachAttr = formElements[1].split("=");
			var cypherConstrPattern = formElements[2].split("=");
			
			$("#cypher-query").val(cypherQuery[1]);
			if(cypherAttachAttr[1] == "on"){
				$("#cypher-attach-attr").prop('checked', true);
			}
			$("#cypher-constr-pattern").val(cypherConstrPattern[1]);
		}
	}
	
	function selectPageRankCell(opConfig, cell){
		loadPageRankOperatorConfigForm(opConfig);
		
		$('#damping').val(cell.getAttribute('dampingFactor',''));
        $('#iterations').val(cell.getAttribute('iterations',''));   
	}
	
	function selectConnectorCell(opConfig, cell){
		var connectorTarget = getElement(cell.target.getId())._attr.label._value;
		if(connectorTarget == "Exclude"){
		    opConfig.append(`<div class="input-group">
		    					<span class="input-group-addon" id="basic-addon1">Connector identifier</span>
		    					<input id="exclusionConnectorIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
		    				</div>`);
		    $('#exclusionConnectorIdentifier').val(cell.getAttribute('identifier','')); 
		}
		if(connectorTarget == "Linking"){
			
			var connectorSource = getElement(cell.source.getId())._attr.label._value;
			
			// allow naming of all types of vertices except of graphs (they already have an identifier)
			if(connectorSource != "Graph"){
			    opConfig.append(`<div class="input-group">
    					<span class="input-group-addon" id="basic-addon1">Connector identifier</span>
    					<input id="linkingConnectorIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
    				</div>`);
			    $('#linkingConnectorIdentifier').val(cell.getAttribute('identifier','')); 
			}
		}
	}
	
	function selectExcludeCell(opConfig, cell){
		var jsonRoot = getJsonRoot();

		if (incomingConnectorExists(cell.id)) {
			var incomingConnectorIdentifiers = [];
			for(var i = 0; i < jsonRoot["Connector"].length; i++){
				if(jsonRoot["Connector"][i].mxCell[0]._attr.target._value == cell.getId()){
					incomingConnectorIdentifiers.push(jsonRoot["Connector"][i]._attr.identifier._value);
				}
			}
			
			if(incomingConnectorIdentifiers.length == 2){
				opConfig.append(
						`<div class="input-group">
		                    <span class="input-group-addon">First connector</span>
		                    <select id="overlapIncomingEdges" class="selectpicker" title="...">
		                    </select>
	                	</div>`);
				
			    var overlapSelect = $('#overlapIncomingEdges');
			    
		        for (var i = 0; i < incomingConnectorIdentifiers.length; i++) {
		            overlapSelect.append('<option value="' + incomingConnectorIdentifiers[i] + '">' + incomingConnectorIdentifiers[i] + '</option>');
		        }
			    overlapSelect.selectpicker('refresh');
			    
			    // restoring previously selected value
				var firstEdge = cell.getAttribute('firstEdge','');
				if(firstEdge){
					overlapSelect.selectpicker('val', firstEdge);
				};
			}
		}
	}
	
	function selectOutputCell(opConfig, cell){
		opConfig.append(
			`<div id="outputCellInputGroup" class="input-group" style="width:100%">
	    		<span class="input-group-addon" id="basic-addon1" style="width:40%">Output Graph</span>
	    		<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
	    	</div>`);
		
		var identifier = cell.value.attributes['identifier'].nodeValue;
		$("#outputIdentifier").val(identifier);
	}
	
	function selectExpandGraphCell(opConfig, cell){
		loadExpandOperatorConfigForm(opConfig);
		
		var typePropertyKey = cell.value.attributes['typePropertyKey'].nodeValue;
		$('#typePropertyKey').val(typePropertyKey);
	}
	
	function preprocessPreceedingInputs(elementId, callback){
		
		var jsonRoot = getJsonRoot();
		var callStack = [];
		
		getCallStack(elementId);
		
		if(callStack.length != 0){
			processCell(callStack.pop());
		}
		else{
			callback();
		}
		
		function getCallStack(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;
			
			if(rootElementLabel == "RDFGraph"){
				callStack.push(rootElementId);
			}

			for (var k = 0; k < jsonRoot["Connector"].length; k++){
				if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == rootElementId){
					getCallStack(jsonRoot["Connector"][k].mxCell[0]._attr.source._value);
				};
			}	
		}
		
		function processCell(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;
			var rootElementIdentifier = rootElement._attr.identifier._value;
			var jsonRoot = getJsonRoot();			
			
			if(rootElementLabel == "RDFGraph"){	    
				$.get("rest/graphExists/" + rootElementIdentifier)
			     .done(function (data){
			    	if (data.graphExists){
						if(callStack.length != 0){
							processCell(callStack.pop());
						}
						else{
							callback();
						}
			    	}
			    	else{
			    		var restQuery = "rest/rdfgraph/?outGraph=" + rootElementIdentifier;
			    		
						$.postJSON(restQuery, rootElement._attr.rdfGraphConfig._value, function (data) {
				            
							if(callStack.length != 0){
								processCell(callStack.pop());
							}
							else{
								callback();
							}
						});
			    	}
			    });
			}
		}
	}
	
	function computePreceedingGraphs(elementId){
		var preceedingGraphIdentifiers = [];
		
		var jsonRoot = getJsonRoot();
		var callStack = [];
		
		getCallStack(elementId);
		
		if(callStack.length != 0){
			processCell(callStack.pop());
		}
		
		return preceedingGraphIdentifiers;
		
		function getCallStack(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;

			callStack.push(rootElementId);
			
			for (var k = 0; k < jsonRoot["Connector"].length; k++){
				if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == rootElementId){
					getCallStack(jsonRoot["Connector"][k].mxCell[0]._attr.source._value);
				};
			}	
		}
		
		function processCell(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;					
			var jsonRoot = getJsonRoot();			
			
			if(rootElementLabel == "Graph" || rootElementLabel == "RDFGraph"){
				preceedingGraphIdentifiers.push(rootElement._attr.identifier._value);
				if(callStack.length != 0){
					processCell(callStack.pop());
				}
			}
			else{
				if(callStack.length != 0){
					processCell(callStack.pop());
				}
			}
		}
	}

	function computePreceedingOperators(elementId){
		var preceedingOperators = {};
		
		var jsonRoot = getJsonRoot();
		var callStack = [];
		
		getCallStack(elementId);
		
		if(callStack.length != 0){
			processCell(callStack.pop());
		}
		
		return preceedingOperators;
		
		function getCallStack(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;

			callStack.push(rootElementId);	
			
			for (var k = 0; k < jsonRoot["Connector"].length; k++){
				if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == rootElementId){
					getCallStack(jsonRoot["Connector"][k].mxCell[0]._attr.source._value);
				};
			}
		}
		
		function processCell(rootElementId){
			var rootElement = getElement(rootElementId);
			var rootElementLabel = rootElement._attr.label._value;					
			var jsonRoot = getJsonRoot();			
			
			if(rootElementLabel == "Grouping"){
				preceedingOperators.grouping = true;
			}
			else if(rootElementLabel == "Clustering"){
				preceedingOperators.clustering = true;
			}
			else if(rootElementLabel == "Linking"){
				if(rootElement._attr.linkingConfig._value){
					preceedingOperators.linking = true;
					preceedingOperators.linkingEdgeLabel = JSON.parse(rootElement._attr.linkingConfig._value).linkSpec.edgeLabel;
				}
			}
			else if(rootElementLabel == "PageRank"){
				preceedingOperators.pagerank = true;
			}
			
			if(callStack.length != 0){
				processCell(callStack.pop());
			}
		}
	}
	
	function complementMetaData(metaData, cellId){
		var preceedingOperators = computePreceedingOperators(cellId);
		
		if(preceedingOperators.grouping){
			metaData.vertexKeys.push({
				"labels": metaData.vertexLabels,
				"name": "count",
				"numerical": true
			});
			metaData.edgeKeys.push({
				"labels": metaData.edgeLabels,
				"name": "count",
				"numerical": true
			});
		}
		if(preceedingOperators.clustering){
			metaData.vertexKeys.push({
				"labels": metaData.vertexLabels,
				"name": "ClusterId",
				"numerical": true
			});
		}
		if(preceedingOperators.linking){
			metaData.edgeKeys.push({
				"labels": metaData.edgeLabels,
				"name": preceedingOperators.linkingEdgeLabel,
				"numerical": true
			});
		}
		if(preceedingOperators.pagerank){
			metaData.vertexKeys.push({
				"labels": metaData.vertexLabels,
				"name": "pagerank",
				"numerical": true
			});
		}
		
		return metaData;
	}

	function complementLinkingMetaData(response, linkingCellId){
		var jsonRoot = getJsonRoot();
		for(var i = 0; i < response.data.length; i++){
			if(response.data[i].id){
				response.data[i].metaData = JSON.stringify(complementMetaData(JSON.parse(response.data[i].metaData), response.data[i].id));
			}
			else{
				response.data[i].metaData = JSON.stringify(complementMetaData(JSON.parse(response.data[i].metaData), linkingCellId));
			}
		}
		
		return response;
	}
	
	function incomingConnectorExists(currentCellId){
		var jsonRoot = getJsonRoot();
		if(jsonRoot["Connector"]){
			for (var k = 0; k < jsonRoot["Connector"].length; k++){
				if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == currentCellId){
					return true;
				};
			}
		}

		return false;
	}
	
	function getPreceedingCellId(currentCellId){
		var jsonRoot = getJsonRoot();
		for (var k = 0; k < jsonRoot["Connector"].length; k++){
			if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == currentCellId){
				return jsonRoot["Connector"][k].mxCell[0]._attr.source._value;
			};
		}
	}
	
	function getJsonRoot(){
		var encoder = new mxCodec();
		var encodedGraph = encoder.encode(editor.graph.getModel());
		var jsonObj = xmlToJSON.parseString(mxUtils.getXml(encodedGraph));	
		return jsonObj.mxGraphModel[0].root[0];
	}
	
	function getElement(elementId){
		
		var jsonRoot = getJsonRoot();
		
		for(var prop in jsonRoot){
			for(var i = 0; i < jsonRoot[prop].length; i++){
				if(jsonRoot[prop][i]._attr.id._value == elementId){
					return jsonRoot[prop][i];
				}	
			}								
		}
	}
	
	// is persisted over subsequent workflow computations; contains all the necessary metainformation
	var cellList = [];
	
	var callStack = [];
	
	function computeSelected(){
		readSelection();
		
		var jsonRoot = getJsonRoot();
		clearCellFormat();
		
		var selectionCell = editor.graph.getSelectionCell();
		
		if(selectionCell){
			var selectionCellId = selectionCell.getId();
			
			getCallStack(selectionCellId);
			
			propagateChanged();		
			
			if(callStack.length != 0){
				performCellOperation(callStack.pop());
			}
		}
	}
	
	function computeWorkflow(){
		// storing configuration for the currently selected item
		readSelection();
		
		var jsonRoot = getJsonRoot();
		var outputNodeId = jsonRoot["Output"][0]._attr.id._value;
		
		clearCellFormat();
		
		getCallStack(outputNodeId);
		
		propagateChanged();
		
		if(callStack.length != 0){
			performCellOperation(callStack.pop());
		}
	}
	
	function getCallStack(rootElementId){
		var jsonRoot = getJsonRoot();
		
		var rootElement = getElement(rootElementId);
		var rootElementLabel = rootElement._attr.label._value;

		callStack.push(rootElementId);
		
		// cell is already in the array in case of subsequent workflow computation
		if(!cellList[rootElementId]){
			cellList[rootElementId] = {};
		}

		cellList[rootElementId].label = rootElementLabel;
		
		var rootElementChanged = rootElement._attr.changed._value;
		cellList[rootElementId].changed = rootElementChanged;
		
		cellList[rootElementId].incomingVertices = [];
		cellList[rootElementId].followingVertices = [];			

		for (var k = 0; k < jsonRoot["Connector"].length; k++){
			if(jsonRoot["Connector"][k].mxCell[0]._attr.source._value == rootElementId){
				cellList[rootElementId].followingVertices.push(jsonRoot["Connector"][k].mxCell[0]._attr.target._value);
			};
			if(jsonRoot["Connector"][k].mxCell[0]._attr.target._value == rootElementId){
				cellList[rootElementId].incomingVertices.push(jsonRoot["Connector"][k].mxCell[0]._attr.source._value);
				getCallStack(jsonRoot["Connector"][k].mxCell[0]._attr.source._value);
			};
		}
	}
	
	function propagateChanged(){
		var jsonRoot = getJsonRoot();
		
		for(var j = 0; j < jsonRoot["Connector"].length; j++){
			for(var i = 0; i < callStack.length; i++){
				var currentElementId = callStack[i];

				if(cellList[currentElementId].changed == true){
					for(var k = 0; k < cellList[currentElementId].followingVertices.length ; k++){
						var followingVertexId = cellList[currentElementId].followingVertices[k];
						
						setChanged(followingVertexId, true);
						if(cellList[followingVertexId]){
							cellList[followingVertexId].changed = true;
						}
					}
				}
			}
		}
	}
	
	function performCellOperation(rootElementId){
		var rootElement = getElement(rootElementId);
		var rootElementLabel = rootElement._attr.label._value;					
		var jsonRoot = getJsonRoot();
		
		var finalOutputIdentifier = jsonRoot["Output"][0]._attr.identifier._value;
		
		var DEFAULT_GRAPH_NAME = "DEFAULT_HANDLER_GRAPH";
		
		setEdgeStyle(rootElementId, 'rounded;fillColor=#5dbcd2;fontColor=white');
		
		if(rootElementLabel == "Graph"){
			cellList[rootElementId].outputGraphIdentifier = rootElement._attr.identifier._value;
			
			if(callStack.length != 0){
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				cellList[rootElementId].changed = false;
				setChanged(rootElementId, false);
				performCellOperation(callStack.pop());
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
				cellList[rootElementId].changed = false;
				setChanged(rootElementId, false);
				performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
			}
		}
		
		if(rootElementLabel == "RDFGraph"){
			if(cellList[rootElementId].changed){
				var outputGraphIdentifier = rootElement._attr.identifier._value;
				if(callStack.length == 1){
					if(finalOutputIdentifier != null){
						outputGraphIdentifier = finalOutputIdentifier;
					}
				}
				
				var rdfGraphConfig = rootElement._attr.rdfGraphConfig._value;

				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/rdfgraph/?outGraph=${outputGraphIdentifier}`;
				
				$.postJSON(restQuery, rdfGraphConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);	
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}

		if(rootElementLabel == "Output"){		
			var previousCellId = cellList[rootElementId].incomingVertices[0];
			var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
			
			var previousCell = getElement(previousCellId);
			var previousCellLabel = previousCell._attr.label._value;
			
			var requestGraph = function(){
			    $.get(`rest/graph/${inputGraphIdentifier};sampling=No Sampling;threshold=0.2`)
		        .done(function (data) {
		            useDefaultLabel = true;
		            useForceLayout = false;
		            drawGraph(data, inputGraphIdentifier);
		            changed = true;
		            
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
		        })
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			
			if(finalOutputIdentifier != null){
			    $.get(`rest/renameGraph/${inputGraphIdentifier}?outGraph=${finalOutputIdentifier}`)					
				 .done(function (data) {
					 inputGraphIdentifier = finalOutputIdentifier;
					 cellList[previousCellId].outputGraphIdentifier = finalOutputIdentifier;
					 requestGraph();
		        })
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		            alert(errorThrown);
		        });
			}
			else{
				if(cellList[previousCellId].label != "Graph"){
				    $.get(`rest/renameGraph/${inputGraphIdentifier}?outGraph=${DEFAULT_GRAPH_NAME}`)					
					 .done(function (data) {
						 inputGraphIdentifier = DEFAULT_GRAPH_NAME;
						 cellList[previousCellId].outputGraphIdentifier = DEFAULT_GRAPH_NAME;
						 requestGraph();
			        })
			        .fail(function (jqXHR, textStatus, errorThrown) {
						setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
			        });
				}
				else if(cellList[previousCellId].label == "Graph"){
					requestGraph();
				}
			}
		}

		if(rootElementLabel == "Filter"){
			if(cellList[rootElementId].changed){
				var filteringConfig = rootElement._attr.filteringConfig._value;
				
				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/filter/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`;
				
				$.postJSON(restQuery, filteringConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Linking"){
			if(cellList[rootElementId].changed){
				var linkingConfig = JSON.parse(rootElement._attr.linkingConfig._value);
				
				var inputGraphs = [];
				
				for(var i = 0; i < cellList[rootElementId].incomingVertices.length; i++){
					var previousCellId = cellList[rootElementId].incomingVertices[i];

					// obtaining connector identifier
					for(var j = 0; j < jsonRoot["Connector"].length; j++){
						// select connector between previous cell and linking cell
						if(jsonRoot["Connector"][j].mxCell[0]._attr.source._value == previousCellId){
							if(getElement(previousCellId)._attr.label._value == "Graph"){
								var connectorIdentifier = getElement(previousCellId)._attr.identifier._value;
							}
							else{
								var connectorIdentifier = jsonRoot["Connector"][j]._attr.identifier._value;
							}
						}
					}
					var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
					
					inputGraphs.push({
						"connectorIdentifier": connectorIdentifier,
						"inputGraphIdentifier": inputGraphIdentifier
					});
				}
				
				var config = {"linkingConfig": linkingConfig, "inputGraphs": inputGraphs }
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/linking?linkedGraph=${outputGraphIdentifier}`;

				$.postJSON(restQuery, JSON.stringify(config), function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}

		if(rootElementLabel == "Clustering"){
			if(cellList[rootElementId].changed){
				var clusteringConfig = rootElement._attr.clusteringConfig._value;
				
				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/clustering/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`;
						
				$.postJSON(restQuery, clusteringConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Sampling"){
			if(cellList[rootElementId].changed){
				var samplingConfigObject = JSON.parse(rootElement._attr.samplingConfig._value);
				
				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
			    $.get(`rest/graph/sampling/${inputGraphIdentifier};sampling=${samplingConfigObject.samplingMethod};threshold=${samplingConfigObject.samplingThreshold};outGraph=${outputGraphIdentifier}`)
		        .done(function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
		        })
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Grouping"){
			if(cellList[rootElementId].changed){
				var grpConfig = rootElement._attr.grpConfig._value;

				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/grouping/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`;
						
				$.postJSON(restQuery, grpConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}

		if(rootElementLabel == "EdgeFusion"){
			if(cellList[rootElementId].changed){
				var edgeFusionConfig = rootElement._attr.edgeFusionConfig._value;

				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/edge_fusion/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`;
						
				$.postJSON(restQuery, edgeFusionConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "VertexFusion"){
			if(cellList[rootElementId].changed){
				var vertexFusionConfig = rootElement._attr.vertexFusionConfig._value;

				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				var restQuery = `rest/graph/vertex_fusion/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`;
						
				$.postJSON(restQuery, vertexFusionConfig, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Cypher"){
			if(cellList[rootElementId].changed){
				var formdata = rootElement._attr.formdata._value;

				var previousCellId = cellList[rootElementId].incomingVertices[0];
				var inputGraphIdentifier = cellList[previousCellId].outputGraphIdentifier;
				
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
			    $.post(`rest/graph/cypher/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`, formdata, function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
			    })
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Combine" || rootElementLabel == "Overlap"){
			if(cellList[rootElementId].changed){
				var inputGraphIdentifier = [];
				inputGraphIdentifier[0] = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				inputGraphIdentifier[1] = cellList[cellList[rootElementId].incomingVertices[1]].outputGraphIdentifier;				
				
				var outputGraphIdentifier =  inputGraphIdentifier[0] + "_" + inputGraphIdentifier[1] + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
				
				if(rootElementLabel == "Combine"){
					var operation = "combination";
				}
				if(rootElementLabel == "Overlap"){
					var operation = "overlap";
				}
				
				var restQuery = `rest/graph/binary/${inputGraphIdentifier[0]}/${inputGraphIdentifier[1]}?op=${operation}&outGraph=${outputGraphIdentifier}`;

				$.get(restQuery)
					.done(function (data) {
						setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
						cellList[rootElementId].changed = false;
						setChanged(rootElementId, false);
						if(callStack.length != 0){
							performCellOperation(callStack.pop());
						}
						else{
							setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
							drawGraph(data, inputGraphIdentifier);
						}
					})
					.fail(function (jqXHR, textStatus, errorThrown) {
						setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
					});
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "Exclude"){
			if(cellList[rootElementId].changed){
				var inputGraphIdentifier = [];
				inputGraphIdentifier[0] = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				inputGraphIdentifier[1] = cellList[cellList[rootElementId].incomingVertices[1]].outputGraphIdentifier;					
				
				// swapping operands if needed
				var firstOperandId = rootElement._attr.firstCell._value;
				
				if(cellList[firstOperandId].outputGraphIdentifier != inputGraphIdentifier[0] 
					&& cellList[firstOperandId].outputGraphIdentifier  == inputGraphIdentifier[1]){
					var tmp = inputGraphIdentifier[0];
					inputGraphIdentifier[0] = inputGraphIdentifier[1];
					inputGraphIdentifier[1] = tmp;
				}
				
				var outputGraphIdentifier =  inputGraphIdentifier[0] + "_" + inputGraphIdentifier[1] + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;				
				
				var restQuery = `rest/graph/binary/${inputGraphIdentifier[0]}/${inputGraphIdentifier[1]}?op=exclusion&outGraph=${outputGraphIdentifier}`;
				
				$.get(restQuery)
				.done(function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "SchemaGraph"){
			if(cellList[rootElementId].changed){
				var inputGraphIdentifier = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;				
			    
				$.get(`rest/graph/schema/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`)
		        .done(function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
		        })
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}

		if(rootElementLabel == "ExpandGraph"){
			if(cellList[rootElementId].changed){
				var typePropertyKey = rootElement._attr.typePropertyKey._value;
				
				var inputGraphIdentifier = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;				
			    
				$.get(`rest/graph/expand/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}&typeProperty=${typePropertyKey}`)
		        .done(function (data) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
					cellList[rootElementId].changed = false;
					setChanged(rootElementId, false);
					if(callStack.length != 0){
						performCellOperation(callStack.pop());
					}
					else{
						setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
						drawGraph(data, inputGraphIdentifier);
					}
		        })
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "WCC"){
			if(cellList[rootElementId].changed){
				var inputGraphIdentifier = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;
			    
			    $.get(`rest/graph/wcc/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}`,
			        function (data) {
						setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
						cellList[rootElementId].changed = false;
						setChanged(rootElementId, false);
						if(callStack.length != 0){
							performCellOperation(callStack.pop());
						}
						else{
							setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
							drawGraph(data, inputGraphIdentifier);
						}
			    	}
			    )
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		if(rootElementLabel == "PageRank"){
			if(cellList[rootElementId].changed){
				var inputGraphIdentifier = cellList[cellList[rootElementId].incomingVertices[0]].outputGraphIdentifier;
				var outputGraphIdentifier = inputGraphIdentifier + Math.floor((Math.random() * 1000) + 1);
				
				cellList[rootElementId].outputGraphIdentifier = outputGraphIdentifier;

				var dampingFactor = rootElement._attr.dampingFactor._value;
				var iterations = rootElement._attr.iterations._value;
				
				// populating with default values
				dampingFactor = dampingFactor ? dampingFactor : 0.85;
				iterations = iterations ? iterations : 30;
								
			    $.get(`rest/graph/pr/${inputGraphIdentifier}?outGraph=${outputGraphIdentifier}&damping=${dampingFactor}&iter=${iterations}`,
			            function (data) {
							setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
							cellList[rootElementId].changed = false;
							setChanged(rootElementId, false);
							if(callStack.length != 0){
								performCellOperation(callStack.pop());
							}
							else{
								setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
								drawGraph(data, inputGraphIdentifier);
							}
			            }
			    )
		        .fail(function (jqXHR, textStatus, errorThrown) {
					setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
		        });
			}
			else{
				setEdgeStyle(rootElementId, 'rounded;fillColor=white;fontColor=black');
				if(callStack.length != 0){
					performCellOperation(callStack.pop());
				}
				else{
					setEdgeStyle(rootElementId, 'rounded;fillColor=#5cb85c;fontColor=white');
					performRequestAndGraphDrawing(cellList[rootElementId].outputGraphIdentifier);
				}
			}
		}
		
		function performRequestAndGraphDrawing(graphIdentifier){
		    $.get(`rest/graph/${graphIdentifier};sampling=No Sampling;threshold=0.2`)
	         .done(function (data) {
	            useDefaultLabel = true;
	            useForceLayout = false;
	            drawGraph(data, graphIdentifier);
	            changed = true;
	        })
	        .fail(function (jqXHR, textStatus, errorThrown) {
				setEdgeStyle(rootElementId, 'rounded;fillColor=#e0262f;fontColor=black');
	        });
		}
	}

	function setEdgeStyle(cellId, style){
		editor.graph.getModel().beginUpdate();
		editor.graph.getModel().getCell(cellId).setStyle(style);
		editor.graph.getModel().endUpdate();
		editor.graph.refresh();
	}
	
	function setChanged(cellId, value){
		var changedEdit = new mxCellAttributeChange(editor.graph.getModel().getCell(cellId), "changed", value);
        editor.graph.getModel().execute(changedEdit);
	}
	
	function clearCellFormat(){
		var jsonRoot = getJsonRoot();
		if(jsonRoot["Connector"]){
			for (var k = 0; k < jsonRoot["Connector"].length; k++){
				var sourceId = jsonRoot["Connector"][k].mxCell[0]._attr.source._value;
				var targetId = jsonRoot["Connector"][k].mxCell[0]._attr.target._value;
				setEdgeStyle(sourceId, "rounded;fillColor=white;fontColor=black");
				setEdgeStyle(targetId, "rounded;fillColor=white;fontColor=black");
			}
		}
	}
	
	Workflow.clearCellFormat = clearCellFormat;
	
	function computeBuilderWorkflow(){
		var jsonRoot = getJsonRoot();
		readSelection();
		
		clearCellFormat();

		var outputNodeId = jsonRoot["Output"][0]._attr.id._value;
		
		var workflowConfig = getWorkflowConfig();
		
		$.postJSON('rest/workflow/compute', JSON.stringify(workflowConfig), function (graph) {
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(JSON.parse(graph.data), graph.name);
            changed = true;
            
            setEdgeStyle(outputNodeId, "rounded;fillColor=#5cb85c;fontColor=white");
		});
	}
	
	function getWorkflowConfig(){
		var jsonRoot = getJsonRoot();
		var cells = [];
		
		if(jsonRoot["Graph"]){
			for (var i = 0; i < jsonRoot["Graph"].length; i++){
				var cellId = jsonRoot["Graph"][i]._attr.id._value;
				
				cells[cellId] = {
						"className": "org.uni_leipzig.biggr.builder.constructors.JSONDataSourceConstructor",
						"arguments": {
							"path": jsonRoot["Graph"][i]._attr.identifier._value
						},
						"generatedId": getGeneratedId()
				};
			}
		}

		if(jsonRoot["RDFGraph"]){
			for (var i = 0; i < jsonRoot["RDFGraph"].length; i++){
				var cellId = jsonRoot["RDFGraph"][i]._attr.id._value;
				
				cells[cellId] = {
						"className": "de.scads.gradoop_service.server.helper.constructor.RDFDataSourceConstructor",
						"arguments": {
							"rdfGraphConfig": jsonRoot["RDFGraph"][i]._attr.rdfGraphConfig._value,
							"identifier": jsonRoot["RDFGraph"][i]._attr.identifier._value
						},
						"generatedId": getGeneratedId()
				};
			}
		}
		
		if(jsonRoot["Filter"]){
			for (var i = 0; i < jsonRoot["Filter"].length; i++){
				var cellId = jsonRoot["Filter"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.FilteringConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.filteringConfig = jsonRoot["Filter"][i]._attr.filteringConfig._value;			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["Linking"]){
			for (var i = 0; i < jsonRoot["Linking"].length; i++){
				var cellId = jsonRoot["Linking"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.LinkingConstructor';
				cellRepresentation.arguments = {};
				
				var inputsArray = [];
				
				for(var j = 0; j < jsonRoot["Connector"].length; j++){
					// select connectors that points to the current linking cell
					if(jsonRoot["Connector"][j].mxCell[0]._attr.target._value == cellId){
						var previousCellId = jsonRoot["Connector"][j].mxCell[0]._attr.source._value;
						// check if graph cell is an input to the linking cell
						if(getElement(previousCellId)._attr.label._value == "Graph"){
							inputsArray.push(getElement(previousCellId)._attr.identifier._value);
						}
						else{
							inputsArray.push(jsonRoot["Connector"][j]._attr.identifier._value);						
						}
					}
				}
				
				var linkingConfig = {"linkingConfig": JSON.parse(jsonRoot["Linking"][i]._attr.linkingConfig._value), "inputsArray": inputsArray};
				
				cellRepresentation.arguments.linkingConfig = JSON.stringify(linkingConfig);
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["Clustering"]){
			for (var i = 0; i < jsonRoot["Clustering"].length; i++){
				var cellId = jsonRoot["Clustering"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.ClusteringConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.clusteringConfig = jsonRoot["Clustering"][i]._attr.clusteringConfig._value;	
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["Sampling"]){
			for (var i = 0; i < jsonRoot["Sampling"].length; i++){
				var cellId = jsonRoot["Sampling"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.SamplingConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.samplingConfig = jsonRoot["Sampling"][i]._attr.samplingConfig._value;	
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["Grouping"]){
			for (var i = 0; i < jsonRoot["Grouping"].length; i++){
				var cellId = jsonRoot["Grouping"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.GroupingConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.groupingConfig = jsonRoot["Grouping"][i]._attr.grpConfig._value;			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["EdgeFusion"]){
			for (var i = 0; i < jsonRoot["EdgeFusion"].length; i++){
				var cellId = jsonRoot["EdgeFusion"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.EdgeFusionConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.edgeFusionConfig = jsonRoot["EdgeFusion"][i]._attr.edgeFusionConfig._value;			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["VertexFusion"]){
			for (var i = 0; i < jsonRoot["VertexFusion"].length; i++){
				var cellId = jsonRoot["VertexFusion"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.VertexFusionConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.vertexFusionConfig = jsonRoot["VertexFusion"][i]._attr.vertexFusionConfig._value;			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["Cypher"]){
			for (var i = 0; i < jsonRoot["Cypher"].length; i++){
				var cellId = jsonRoot["Cypher"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.CypherConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.formdata = decodeURIComponent(jsonRoot["Cypher"][i]._attr.formdata._value);			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["Combine"]){
			for (var i = 0; i < jsonRoot["Combine"].length; i++){
				var cellId = jsonRoot["Combine"][i]._attr.id._value;				
				
				var cellRepresentation = {};
				
				cellRepresentation.className = 'org.uni_leipzig.biggr.builder.constructors.CombineLogicalGraphsConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.combinationtype = "combine";			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["Overlap"]){
			for (var i = 0; i < jsonRoot["Overlap"].length; i++){
				var cellId = jsonRoot["Overlap"][i]._attr.id._value;				
				
				var cellRepresentation = {};
				
				cellRepresentation.className = 'org.uni_leipzig.biggr.builder.constructors.CombineLogicalGraphsConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.combinationtype = "overlap";			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["Exclude"]){
			for (var i = 0; i < jsonRoot["Exclude"].length; i++){
				var cellId = jsonRoot["Exclude"][i]._attr.id._value;				
				
				var cellRepresentation = {};
				
				cellRepresentation.className = 'org.uni_leipzig.biggr.builder.constructors.CombineLogicalGraphsConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.combinationtype = "exclude";			
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["SchemaGraph"]){
			for (var i = 0; i < jsonRoot["SchemaGraph"].length; i++){
				var cellId = jsonRoot["SchemaGraph"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.SchemaGraphConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}

		if(jsonRoot["ExpandGraph"]){
			for (var i = 0; i < jsonRoot["ExpandGraph"].length; i++){
				var cellId = jsonRoot["ExpandGraph"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.ExpandGraphConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.typePropertyKey = jsonRoot["ExpandGraph"][i]._attr.typePropertyKey._value;
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["WCC"]){
			for (var i = 0; i < jsonRoot["WCC"].length; i++){
				var cellId = jsonRoot["WCC"][i]._attr.id._value;
				
				var cellRepresentation = {};
				cellRepresentation.className = 'de.scads.gradoop_service.server.helper.constructor.WeaklyConnectedComponentsConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		if(jsonRoot["PageRank"]){
			for (var i = 0; i < jsonRoot["PageRank"].length; i++){
				var cellId = jsonRoot["PageRank"][i]._attr.id._value;		
				var iterations = jsonRoot["PageRank"][i]._attr.iterations._value;
				var dampingFactor = jsonRoot["PageRank"][i]._attr.dampingFactor._value;
					
				var cellRepresentation = {};
				cellRepresentation.className = 'org.uni_leipzig.biggr.builder.constructors.PageRankConstructor';
				cellRepresentation.arguments = {};
				cellRepresentation.arguments.propertyKey = "pagerank";
				cellRepresentation.arguments.iterations = iterations ? iterations : 30;
				cellRepresentation.arguments.dampingFactor = dampingFactor ? dampingFactor : 0.85;
				cellRepresentation.generatedId = getGeneratedId();
				cells[cellId] = cellRepresentation;
			}
		}
		
		for (var i = 0; i < jsonRoot["Output"].length; i++){
			var cellId = jsonRoot["Output"][i]._attr.id._value;
			var identifier = jsonRoot["Output"][i]._attr.identifier._value;
			
			if(identifier == null){
				identifier = "DEFAULT_BUILDER_GRAPH";
			}
			
			var cellRepresentation = {};
			cellRepresentation.className = 'org.uni_leipzig.biggr.builder.constructors.JSONDataSinkConstructor';
			cellRepresentation.arguments = {};
			cellRepresentation.generatedId = getGeneratedId();
			cellRepresentation.arguments.path = identifier;
			//cellRepresentation.arguments.path = 'runAtOnce' + Math.floor((Math.random() * 1000) + 1);
			cellRepresentation.arguments.overwrite = true;
			cells[cellId] = cellRepresentation;
		}
		
		var builderConfig = {};
		builderConfig.connections = [];	
		
		for (var k = 0; k < jsonRoot["Connector"].length; k++){
			
			var builderConnection = {};
			
			var fromCellId = jsonRoot["Connector"][k].mxCell[0]._attr.source._value;
			var toCellId = jsonRoot["Connector"][k].mxCell[0]._attr.target._value
			
			builderConnection.from = cells[fromCellId];
			builderConnection.to = cells[toCellId];
			if(getElement(toCellId)._attr.label._value == "Combine" || getElement(toCellId)._attr.label._value == "Overlap"){
				// check if the first connection has already been added
				var firstConnectionExists = false;
				for(var i = 0; i < builderConfig.connections.length; i++){
					if(builderConfig.connections[i].to.generatedId == cells[toCellId].generatedId){
						firstConnectionExists = true;
					}
				}
				builderConnection.fromIndex = firstConnectionExists ? 1 : 0;
			}
			else if(getElement(toCellId)._attr.label._value == "Exclude"){
				var firstConnectorIdentifier = getElement(toCellId)._attr.firstEdge._value;
				var thisConnectorIdentifier = jsonRoot["Connector"][k]._attr.identifier._value;
				builderConnection.fromIndex = (firstConnectorIdentifier === thisConnectorIdentifier) ? 0 : 1;
			}
			else if(getElement(toCellId)._attr.label._value == "Linking"){
				var addedConnectionCount = 0;
				for(var i = 0; i < builderConfig.connections.length; i++){
					if(builderConfig.connections[i].to.generatedId == cells[toCellId].generatedId){
						addedConnectionCount++;
					}
				}
				builderConnection.fromIndex = addedConnectionCount;
			}
			else{
				builderConnection.fromIndex = 0;
			}
			builderConnection.type = "LOGICAL_GRAPH";
			
			builderConnection.identifier = jsonRoot["Connector"][k]._attr.identifier._value;

			builderConfig.connections.push(builderConnection);
		}
		
		return builderConfig;
		
		// TO BE REPLACED LATER
		function getGeneratedId() {
			  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			    return v.toString(16);
			  });
		}
	}
	
	
	function displaySaveAsWorkflowConfig(){
	    $.editor.graph.clearSelection();
	    var opConfig = $('#operatorConfig');
	    opConfig.empty();
	    
	    opConfig.append(
	    		`<div class="input-group">
	            	<span class="input-group-addon" id="basic-addon1" style="min-width:175px">Workflow</span>
	            	<input id="workflowIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
	            </div>`);
	    opConfig.append('<button type="button" id="saveWorkflow" class="btn btn-success">Save</button>');
	    $("#saveWorkflow").on("click", saveWorkflow);
	}

	function displayLoadWorkflowConfig(){
	    $.editor.graph.clearSelection();
	    var opConfig = $('#operatorConfig');
	    opConfig.empty();
	    
	    $.get('rest/workflows/')
        .done(function(workflows){
    		opConfig.append(
    				`<div class="input-group">
    	                <span class="input-group-addon">Workflow</span>
    	                <select id="loadedWorkflows" class="selectpicker" title="..."></select>
    	             </div>`);        	
		    var workflowSelect = $('#loadedWorkflows');
		    
	        for (var i = 0; i < workflows.length; i++) {
	        	workflowSelect.append('<option value="' + workflows[i] + '">' + workflows[i] + '</option>');
	        }
	        workflowSelect.selectpicker('refresh');
	        
	        workflowSelect.on("hidden.bs.select", loadWorkflow)
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
	}
	
	function saveWorkflow(){
		var workflowName = $("#workflowIdentifier").val();
		var workflowConfig = getWorkflowConfig();
		
		$.postJSON('rest/workflow/save/' + workflowName, JSON.stringify(workflowConfig), function (data) {
		    var opConfig = $('#operatorConfig');
		    opConfig.empty();
		});	
	}
	
	function loadWorkflow(){
		var workflowName = $("#loadedWorkflows").val();
		
	    $.get('rest/workflow/load/' + workflowName,
            function (workflowData) {
	    		drawWorkflowGraph(workflowData);
	    	    $('#operatorConfig').empty();
            }
	    );
	}
	
	function clearWorkflow(){		
		editor.graph.getModel().beginUpdate();
		editor.graph.removeCells(editor.graph.getChildVertices(editor.graph.getDefaultParent(), true, true));
		editor.graph.getModel().endUpdate();
	}
	
	function drawWorkflowGraph(workflowData){
		// using generatedId as key to save cell related information
		// this is needed due to cell can be source/target of multiple connections
		var cells = [];
		
		var parent = editor.graph.getDefaultParent();
		var doc = mxUtils.createXmlDocument();		
		
		editor.graph.getModel().beginUpdate();
		
		// clear existing graph
		editor.graph.removeCells(editor.graph.getChildVertices(parent, true, true));
		
		// saving references to created edges to be able to easily repaint them later
		var edges=[];
		
		for(var i = 0; i < workflowData.connections.length; i++){		
			// parse and draw vertexes that are sources of connections
			var workflowVertexFrom = workflowData.connections[i].from;
			if(!cells[workflowVertexFrom.generatedId]){
				parseCellValue(workflowVertexFrom);
			}
			
			// parse and draw vertexes that are targets of connections
			var workflowVertexTo = workflowData.connections[i].to;
			if(!cells[workflowVertexTo.generatedId]){
				parseCellValue(workflowVertexTo);
			}
			
			// construct edges
			var edge = drawConnection();
			
			edges.push(edge);
		}
		
		// setting and executing layout
	    var layout = new mxHierarchicalLayout(editor.graph, mxConstants.DIRECTION_WEST);
	    layout.disableEdgeStyle = false;
	    layout.execute(parent);

	    // edges painted by mxHierarchicalLayout retain their direction what leads to problems 
	    // during further workflow graph modification when moving existing vertexes
	    // we fix this issue by deleting edges(vertexes remain on their positions) and 
	    // drawing them again without direction assigned by the layout
	    
	    // removing edges
	    for(var i = 0; i < edges.length; i++){
			editor.graph.getModel().remove(edges[i]);	    	
	    }
	    
	    // drawing edges
		for(var i = 0; i < workflowData.connections.length; i++){
			var workflowVertexFrom = workflowData.connections[i].from;
			var workflowVertexTo = workflowData.connections[i].to;
			var workflowEdgeIdentifier = workflowData.connections[i].identifier;
			drawConnection();
		}	    
	    editor.graph.getModel().endUpdate();
	    
	    
	    /**
	     * Parses cell information from JSON representation, saves it to cells[] and draws appropriate cell
	     */
		function parseCellValue(workflowVertex){
			
			switch(workflowVertex.className){
				case "org.uni_leipzig.biggr.builder.constructors.JSONDataSourceConstructor":
					var label = "Graph";
					var cellAttributes = { "label": label, "path": workflowVertex.arguments.path, "changed": "false" }				
					var userObjectAttributes = { "label": label, "identifier": workflowVertex.arguments.path, "changed": "false" }
					break;
				case "de.scads.gradoop_service.server.helper.constructor.RDFDataSourceConstructor":
					var label = "RDFGraph";
					var cellAttributes = { "label": label,
										   "rdfGraphConfig": workflowVertex.arguments.rdfGraphConfig,
										   "identifier": workflowVertex.arguments.identifier,
										   "changed": "true"}				
					var userObjectAttributes = { "label": label, 
												 "rdfGraphConfig": workflowVertex.arguments.rdfGraphConfig, 
												 "identifier": workflowVertex.arguments.identifier,
												 "changed": "true"}
					break;	
				case "de.scads.gradoop_service.server.helper.constructor.FilteringConstructor":
					var label = "Filter";
					var cellAttributes = { "label": label, "filteringConfig": workflowVertex.arguments.filteringConfig, "changed": "true"}				
					var userObjectAttributes = { "label": label, "filteringConfig": workflowVertex.arguments.filteringConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.LinkingConstructor":
					var label = "Linking";
					
					var linkingConfig = JSON.stringify(JSON.parse(workflowVertex.arguments.linkingConfig).linkingConfig);
					
					var cellAttributes = { "label": label, "linkingConfig": linkingConfig, "changed": "true"}				
					var userObjectAttributes = { "label": label, "linkingConfig": linkingConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.ClusteringConstructor":
					var label = "Clustering";				
					var cellAttributes = { "label": label, "clusteringConfig": workflowVertex.arguments.clusteringConfig, "changed": "true"}				
					var userObjectAttributes = { "label": label, "clusteringConfig": workflowVertex.arguments.clusteringConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.SamplingConstructor":
					var label = "Sampling";				
					var cellAttributes = { "label": label, "samplingConfig": workflowVertex.arguments.samplingConfig, "changed": "true"}				
					var userObjectAttributes = { "label": label, "samplingConfig": workflowVertex.arguments.samplingConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.GroupingConstructor":
					var label = "Grouping";
					var cellAttributes = { "label": label, "groupingConfig": workflowVertex.arguments.groupingConfig, "changed": "true"}
					var userObjectAttributes = { "label": label, "grpConfig": workflowVertex.arguments.groupingConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.EdgeFusionConstructor":
					var label = "EdgeFusion";
					var cellAttributes = { "label": label, "edgeFusionConfig": workflowVertex.arguments.edgeFusionConfig, "changed": "true"}		
					var userObjectAttributes = { "label": label, "edgeFusionConfig": workflowVertex.arguments.edgeFusionConfig, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.VertexFusionConstructor":
					var label = "VertexFusion";
					var cellAttributes = { "label": label, "vertexFusionConfig": workflowVertex.arguments.vertexFusionConfig, "changed": "true"}
					var userObjectAttributes = { "label": label, "vertexFusionConfig": workflowVertex.arguments.vertexFusionConfig, "changed": "true" }
					break;
				case "de.scads.gradoop_service.server.helper.constructor.CypherConstructor":
					var label = "Cypher";
					var cellAttributes = { "label": label, "formdata": workflowVertex.arguments.formdata, "changed": "true"}
					var userObjectAttributes = { "label": label, "formdata": workflowVertex.arguments.formdata, "changed": "true"}
					break;
				case "org.uni_leipzig.biggr.builder.constructors.CombineLogicalGraphsConstructor":				
					switch(workflowVertex.arguments.combinationtype){
						case "combine":
							var label = "Combine";
							break;
						case "overlap":
							var label = "Overlap";
							break;
						case "exclude":
							var label = "Exclude";
							break;
					}
					var cellAttributes = { "label": label, "changed": "true"}
					var userObjectAttributes = { "label": label, "changed": "true"}
					break;
				case "de.scads.gradoop_service.server.helper.constructor.SchemaGraphConstructor":
					var label = "SchemaGraph";
					var cellAttributes = { "label": label, "changed": "true"}
					var userObjectAttributes = { "label": label, "changed": "true"}		
					break;
				case "de.scads.gradoop_service.server.helper.constructor.ExpandGraphConstructor":
					var label = "ExpandGraph";
					var cellAttributes = { "label": label, "typePropertyKey": workflowVertex.arguments.typePropertyKey, "changed": "true"}				
					var userObjectAttributes = { "label": label, "typePropertyKey": workflowVertex.arguments.typePropertyKey, "changed": "true"}					
					break;
				case "de.scads.gradoop_service.server.helper.constructor.WeaklyConnectedComponentsConstructor":
					var label = "WCC";
					var cellAttributes = { "label": label, "changed": "true"}
					var userObjectAttributes = { "label": label, "changed": "true"}
					break;
				case "org.uni_leipzig.biggr.builder.constructors.PageRankConstructor":
					var label = "PageRank";
					var cellAttributes = { 
							"label": label,
							"propertyKey": workflowVertex.arguments.propertyKey,
							"iterations": workflowVertex.arguments.iterations,
							"dampingFactor": workflowVertex.arguments.dampingFactor,
							"changed": "true"
					}				
					var userObjectAttributes = {
							"label": label,
							"dampingFactor": workflowVertex.arguments.dampingFactor,
							"iterations": workflowVertex.arguments.iterations,
							"changed": "true"
					}
					break;
				case "org.uni_leipzig.biggr.builder.constructors.JSONDataSinkConstructor":
					var label = "Output";
					var cellAttributes = { "label": label, "identifier": workflowVertex.arguments.path, "changed": "false"}				
					var userObjectAttributes = { "label": label, "identifier": workflowVertex.arguments.path, "changed": "false"}
					break;
			}
			
		cells[workflowVertex.generatedId] = cellAttributes;
			
		var userObject = doc.createElement(label);
		for(var key in userObjectAttributes){
			if(userObjectAttributes.hasOwnProperty(key)){
				userObject.setAttribute(key, userObjectAttributes[key]);
			}
		}
		var cell = editor.graph.insertVertex(parent, null, userObject, 30, 30, 80, 40);
		cells[workflowVertex.generatedId].cell = cell;	
		}
		
		/**
		 * Draws connection between two cells and returns corresponding connection object
		 */
	    function drawConnection(){
			var connection = doc.createElement('Connector');
			connection.setAttribute('label', '');
			
			// Exclude operator is handled separately due to setting attributes for connections
			if(workflowData.connections[i].to.className == "org.uni_leipzig.biggr.builder.constructors.CombineLogicalGraphsConstructor"
				&& workflowData.connections[i].to.arguments.combinationtype == "exclude"){
				if(workflowData.connections[i].fromIndex == 0){
					// connection identifiers are not saved in JSON representation of workflow
					// they are replaced with 'A' and 'B' tokens according to operands order
					connection.setAttribute('identifier', 'A');
					cells[workflowVertexTo.generatedId].cell.setAttribute('firstEdge', 'A');
					cells[workflowVertexTo.generatedId].cell.setAttribute('firstCell', cells[workflowVertexFrom.generatedId].cell.getId());					
				}
				else if(workflowData.connections[i].fromIndex == 1){
					connection.setAttribute('identifier', 'B');
				}
				
			}
			else{
				if(workflowEdgeIdentifier == null){
					connection.setAttribute('identifier', '');
				}
				else{
					connection.setAttribute('identifier', workflowEdgeIdentifier);
				}
			}
			
			var edge = editor.graph.insertEdge(
					parent, 
					null, 
					connection, 
					cells[workflowVertexFrom.generatedId].cell, 
					cells[workflowVertexTo.generatedId].cell);
			
			return edge;
	    }
	}
}

Workflow.toggle = function(){
	$('#canvas').empty()
	$('#workflow').slideToggle('100', function(){
		$.forceRedrawNextTime = true;
		
		if( $('#workflow').is(':visible')){
			$('#graph-view').css('height', '62%');
			$('#canvas').css('height', '100%');
			if($('#canvas').is(':visible') && $.paintedGraph){
				drawGraph($.paintedGraph.data, $.paintedGraph.name);
			}
		}
		else{
			$('#graph-view').css('height', '100%');
			$('#canvas').css('height', '100%');
			if($('#canvas').is(':visible') && $.paintedGraph){
                drawGraph($.paintedGraph.data, $.paintedGraph.name);
			}
		}
	});
}
