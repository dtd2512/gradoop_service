/*******************************************************
 * Graph Linking
 *******************************************************/
function loadLinkingOperatorConfigForm(opConfig) {
    var sourceGraph = getSelectedDatabase();	
	
    $.get("rest/keys/" + sourceGraph)
    .done(function (data) {
        $.get('rest/databases/')
        .done(function(targetGraphOptions){
        	loadLinkingOperatorConfigFormHelper(opConfig, sourceGraph, data, targetGraphOptions);
        });	
    });
}

function loadLinkingOperatorConfigFormHelper(opConfig, data, fillForm) {
    
	// creating basic layout
	opConfig.append(getLinkingOptions());
    opConfig.append(getModalWindow());

    function getVertexPropertyTree(identifier){
    	
    	var vertexPropertyTree = {};
    	
    	for(var j = 0; j < data.length; j++){
    		if(data[j].identifier == identifier){
    			var metaData = JSON.parse(data[j].metaData);
    		}
    	}
    	
		for (var vertexLabelIndex in metaData.vertexLabels) {
			vertexPropertyTree[metaData.vertexLabels[vertexLabelIndex]] = [];
		}
		for (var vertexKeyIndex in metaData.vertexKeys) {
			var vertexKey = metaData.vertexKeys[vertexKeyIndex];
			for (var labelIndex in vertexKey.labels){
				vertexPropertyTree[vertexKey.labels[labelIndex]].push([vertexKey.name,vertexKey.numerical]);
			}
		}
		
		return vertexPropertyTree;
	}

    for (var i = 0; i < data.length; i++) {
        $("#sourceGraph").append('<option value="' + data[i].identifier + '">' + data[i].identifier + '</option>');
        $("#targetGraph").append('<option value="' + data[i].identifier + '">' + data[i].identifier + '</option>');        
    }

    $("#sourceGraph").selectpicker("refresh");
    $("#targetGraph").selectpicker("refresh");

    $("#sourceGraph").on("change", function(e){
    	
    	$("#sourceLabel").empty();
    	$("#sourceAttribute").empty();

    	if($(this).val() != ""){
        	var vertexPropertyTree = getVertexPropertyTree($(this).val());

        	for (var label in vertexPropertyTree){
        		$("#sourceLabel").append(`<option value="${label}">${label}</option>`);
        	}
        	
            $("#sourceLabel").off("change", sourceLabelOnChangeHandler).on("change", {"vertexPropertyTree": vertexPropertyTree}, sourceLabelOnChangeHandler);
    	}
    	
        $("#sourceLabel").selectpicker("refresh");
    	$("#sourceAttribute").selectpicker("refresh");
    });

    function sourceLabelOnChangeHandler(e){
    	var vertexPropertyTree = e.data.vertexPropertyTree;
    	$("#sourceAttribute").empty();
    	
    	for(var i in vertexPropertyTree[$(this).val()]){
    		var option = `<option value="${vertexPropertyTree[$(this).val()][i][0]}">${vertexPropertyTree[$(this).val()][i][0]}</option>`;
    		$('#sourceAttribute').append(option);
    	}
    	$('#sourceAttribute').selectpicker('refresh');
    }
    
    $("#targetGraph").on("change", function(e){
    	
    	$("#targetLabel").empty();
    	$("#targetAttribute").empty();
    	
    	if($(this).val() != ""){
        	var vertexPropertyTree = getVertexPropertyTree($(this).val());

        	for (var label in vertexPropertyTree){
        		$("#targetLabel").append(`<option value="${label}">${label}</option>`);
        	}
        	
        	$("#targetLabel").off("change", targetLabelOnChangeHandler).on("change", {"vertexPropertyTree": vertexPropertyTree}, targetLabelOnChangeHandler);
    	}
    	
        $("#targetLabel").selectpicker("refresh");
    	$("#targetAttribute").selectpicker("refresh");
    });

    function targetLabelOnChangeHandler(e){
    	var vertexPropertyTree = e.data.vertexPropertyTree;
    	$("#targetAttribute").empty();
    	
    	for(var i in vertexPropertyTree[$(this).val()]){
    		var option = `<option value="${vertexPropertyTree[$(this).val()][i][0]}">${vertexPropertyTree[$(this).val()][i][0]}</option>`;
    		$('#targetAttribute').append(option);
    	}
    	$('#targetAttribute').selectpicker('refresh');
    }   
	
    // refresh needed in order appropriate picker to be loaded when linking is used for the first time
    $("#sourceGraph").selectpicker("refresh");
    $("#sourceLabel").selectpicker("refresh");
    $("#sourceAttribute").selectpicker("refresh"); 
    $("#targetGraph").selectpicker("refresh");
    $("#targetLabel").selectpicker("refresh");
    $("#targetAttribute").selectpicker("refresh");
    $("#similarityMethodName").selectpicker("refresh");
    $("#similarityId, #conditionOperator").selectpicker("refresh");

    $("#similarityMethodName").selectpicker("val", "EDIT_DISTANCE");
    $("#weight").selectpicker("val", "1");
    
    $(document).on('change', 'input[type=radio][name=blockingMethod]', function (event) {
        var selected = $('input[name=blockingMethod]:checked', '#blockingMethod').val();
        
        var blockingComponentConfig = $("#blockingComponentConfig");
        var windowSizeConfig = $("#windowSizeConfig");
    	blockingComponentConfig.empty();
    	windowSizeConfig.empty();
    	
        switch(selected){
        case "CARTESIAN_PRODUCT":
        	break;
        case "STANDARD_BLOCKING":
        	blockingComponentConfig.append(getKeyGenerationComponentOptions());
        	break;
        case "SORTED_NEIGHBORHOOD":
        	windowSizeConfig.append(
    	        	`<div class="input-group"  style="width:600px">
        			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">Window size</span>
        			<input id="windowSize" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" >
	        	</div>`);
        	blockingComponentConfig.append(getKeyGenerationComponentOptions());
        	break;
        default:
        	break;
        }
    });
    $(document).on('change', 'input[type=radio][name=keyGenerationComponent]', function (event) {
        var selected = $('input[name=keyGenerationComponent]:checked', '#keyGenerationComponent').val();
       
        var kgcOptions = $("#kgc-options");
        kgcOptions.empty();
        
        switch(selected){
        case "FULL_ATTRIBUTE":
        	kgcOptions.append(
    			`<div id="kgcAttributeInputGroup" class="input-group" style="width:600px;float:left">
	    			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">Attribute</span>
					<select id="kgc-attribute" class="selectpicker" title="..." data-width="300px"></select>
    	        </div>`);
        	break;
        case "PREFIX_LENGTH":
        	kgcOptions.append(
        			`<div id="kgcAttributeInputGroup" class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Attribute</span>
						<select id="kgc-attribute" class="selectpicker" title="..."></select>
        	        </div>
        	        <div class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Prefix length</span>
    	    			<input id="kgc-prefix-length" class="form-control" placeholder="1" aria-describedby="basic-addon1">
        	        </div>`);
        	break;
        case "QGRAMS":
        	kgcOptions.append(
        			`<div id="kgcAttributeInputGroup" class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">Attribute</span>
						<select id="kgc-attribute" class="selectpicker" title="..."></select>
        	        </div>
        	        <div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">qgramNo</span>
    	    			<input id="kgc-qgramNo" class="form-control" placeholder="3" aria-describedby="basic-addon1" >
        	        </div>
        	        <div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">threshold</span>
    	    			<input id="kgc-qgramThreshold" class="form-control" placeholder="0.5" aria-describedby="basic-addon1" >
        	        </div>`);
        	break;
        case "WORD_TOKENIZER":
        	kgcOptions.append(
        			`<div id="kgcAttributeInputGroup" class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Attribute</span>
						<select id="kgc-attribute" class="selectpicker" title="..."></select>
        	        </div>
        	        <div class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Tokenizer</span>
    	    			<input id="kgc-tokenizer" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" >
        	        </div>`);
        	break;
        default:
        	break;
        }
        
        var attributes = [];
        
        for(var i = 0; i < data.length; i++){
        	var metadata = JSON.parse(data[i].metaData);
        	for(var j = 0; j < metadata.vertexKeys.length; j++){
        		attributes.push(metadata.vertexKeys[j].name);
        	}
        }
        
        var uniqueAttributes = [];
        $.each(attributes, function(i, elem){
            if($.inArray(elem, uniqueAttributes) === -1) uniqueAttributes.push(elem);
        });
        
        for(var k = 0; k < uniqueAttributes.length; k++){
    		var option = `<option value="${uniqueAttributes[k]}">${uniqueAttributes[k]}</option>`;
    		$('#kgc-attribute').append(option);
        }
        
        $("#kgc-attribute").selectpicker("refresh");
    });
    
    $("#similarityMethodName").on('changed.bs.select', function(){
    	var similarityComponentConfig = $("#similarityComponentConfig");
    	similarityComponentConfig.empty();
    	
    	var similarityMethodName = $("#similarityMethodName").val();
    	
    	switch(similarityMethodName){
    	case "JAROWINKLER":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:600px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">Threshold</span>
    	    			<input id="sm-threshold" class="form-control" placeholder="0.5" aria-describedby="basic-addon1">
        	        </div>`);
    		break;
    	case "TRUNCATE_BEGIN":
    	case "TRUNCATE_END":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:600px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">Length</span>
    	    			<input id="sm-length" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
        	        </div>`); 
        	break;
    	case "QGRAMS":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">Length</span>
    	    			<input id="sm-length" class="form-control" placeholder="1" aria-describedby="basic-addon1" style="width:100px">
        	        </div>
        	        <div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">Padding</span>
    	    			<input id="sm-padding" class="form-control" placeholder="true" aria-describedby="basic-addon1" style="width:100px">
        	        </div>
        	        <div id="qgramsMethodInputGroup" class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:66px">Method</span>
						<select id="sm-secondMethod" class="selectpicker" title="..." data-width="375px">
				     		<option value="OVERLAP" selected>OVERLAP</option>
				     		<option value="JACARD">JACARD</option>
				     		<option value="DICE" selected>DICE</option>					     	
				     	</select>
        	        </div>`);
    	    $("#sm-secondMethod").selectpicker("refresh");
    		break;
    	case "MONGE_ELKAN":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Tokenizer</span>
    	    			<input id="sm-tokenizer" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" style="width:150px">
        	        </div>
        	        <div class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">Threshold</span>
    	    			<input id="sm-threshold" class="form-control" placeholder="0.5" aria-describedby="basic-addon1" style="width:150px">
        	        </div>`);    		
    		break;
    	case "EXTENDED_JACCARD":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">Tokenizer</span>
    	    			<input id="sm-tokenizer" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" style="width:100px">
        	        </div>
        	        <div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">Threshold</span>
    	    			<input id="sm-threshold" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" style="width:100px">
        	        </div>
        	        <div class="input-group" style="width:200px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:75px">JW-Thresh.</span>
    	    			<input id="sm-jaroWinklerThreshold" class="form-control" placeholder="type here..." aria-describedby="basic-addon1" style="width:100px">
        	        </div>`);     		
    		break;
    	case "LONGEST_COMMON_SUBSTRING":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:125px">MinLength</span>
    	    			<input id="sm-minLength" class="form-control" placeholder="1" aria-describedby="basic-addon1" style="width:150px">
        	        </div>
        	        <div id="lcsMethodInputGroup" class="input-group" style="width:300px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:126px">Method</span>
						<select id="sm-secondMethod" class="selectpicker" title="..." data-width="375px">
				     		<option value="OVERLAP">OVERLAP</option>
				     		<option value="JACARD">JACARD</option>
				     		<option value="DICE" selected>DICE</option>					     	
				     	</select>
        	        </div>`);
    	    $("#sm-secondMethod").selectpicker("refresh");
    		break;
    	case "NUMERICAL_SIMILARITY_MAXDISTANCE":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:600px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">MaxToleratedDistance</span>
    	    			<input id="sm-maxToleratedDis" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
        	        </div>`);    		
    		break;
    	case "NUMERICAL_SIMILARITY_MAXPERCENTAGE":
    		similarityComponentConfig.append(
    				`<div class="input-group" style="width:600px;float:left">
    	    			<span class="input-group-addon" id="basic-addon1" style="min-width:200px">MaxToleratedPercentage</span>
    	    			<input id="sm-maxToleratedPercentage" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
        	        </div>`);
    		break;
    	default:
    		break;
    	}
    });
    
	function setBlockingConfugirationItemHandlers(){
	    $(".blockingConfigurationItem").off("mouseover").on("mouseover", function(e){
	    	$(this).find("a").css("visibility", "visible");
	    });
	    $(".blockingConfigurationItem").off("mouseout").on("mouseout", function(e){
	    	$(this).find("a").css("visibility", "hidden");
	    });
		$(".blockingConfigurationItem").off("click").on("click", function(e){
			// separating anchor from div event handling
			if($(e.target).hasClass("close")){
				return;
			}
			// write config to the item, that was previously selected
			$(".blockingConfigurationItem").each(function(i){
				if( $(this).css("background-color") == "rgb(238, 238, 238)" ){	
					// write value only if blocking method has been selected
					if($('input[name=blockingMethod]:checked', '#blockingMethod').length){
						$(this).attr("data-config", JSON.stringify(getBlockingConfigItem()));
					}
				}
			});
			
			// deselecting checked blocking method
			$('input[name=blockingMethod]:checked', '#blockingMethod').prop("checked", false);
			
	        $("#blockingComponentConfig").empty();
	        $("#windowSizeConfig").empty();
			
			// filling the form back
			var currentConfig = $(this).attr("data-config");
			if(currentConfig != ""){
				currentConfig = JSON.parse($(this).attr("data-config"));
				
				$("#blockingMethod input").each(function(i){
					if( $(this).val() == currentConfig.blockingMethod ){
						$(this).prop("checked", true).change();
					}
				});
				
				if(currentConfig.windowSize !== -1){
					$("#windowSize").val(currentConfig.windowSize);
				}
				
				if(currentConfig.keyGenerationComponent.keyGenerationMethod){
					$("#keyGenerationComponent input").each(function(i){
						if( $(this).val() == currentConfig.keyGenerationComponent.keyGenerationMethod ){
							$(this).prop("checked", true).change();
						}
					});
					if(currentConfig.keyGenerationComponent.attribute !== ""){
						$("#kgc-attribute").val(currentConfig.keyGenerationComponent.attribute);
						$("#kgc-attribute").selectpicker("refresh");
					}
					if(currentConfig.keyGenerationComponent.prefixLength !== -1){
						$("#kgc-prefix-length").val(currentConfig.keyGenerationComponent.prefixLength);
					}
					if(currentConfig.keyGenerationComponent.qgramNo !== 0){
						$("#kgc-qgramNo").val(currentConfig.keyGenerationComponent.qgramNo);
					}
					if(currentConfig.keyGenerationComponent.qgramThreshold !== -1.0){
						$("#kgc-qgramThreshold").val(currentConfig.keyGenerationComponent.qgramThreshold);
					}
					if(currentConfig.keyGenerationComponent.tokenizer !== ""){
						$("#kgc-tokenizer").val(currentConfig.keyGenerationComponent.tokenizer);
					}					
				}			
			}
			
			$(".blockingConfigurationItem").css("background-color", "#fff");
			$(this).css("background-color", "#eee");
	    });
		
		// select first remaining element after currently selected blocking config item is deleted
		$(".blockingConfigurationItem a").on("click", function(e){
			// timeout needed to ensure correct execution order with the bootstrap handler
			if($(e.target).parent().css("background-color") == "rgb(238, 238, 238)"){
				setTimeout(function(){
					if($(e.target).parent().html() === $(".blockingConfigurationItem").first().html()){
						// we select second element, because the first one is about to be deleted
						$($(".blockingConfigurationItem").get(1)).triggerHandler("click");
					}
					else {
						$(".blockingConfigurationItem").first().triggerHandler("click");
					}
				}, 1);
			}
		});
	}

	function setSimilarityConfugirationItemHandlers(){
	    $(".similarityConfigurationItem").off("mouseover").on("mouseover", function(e){
	    	$(this).find("a").css("visibility", "visible");
	    });
	    $(".similarityConfigurationItem").off("mouseout").on("mouseout", function(e){
	    	$(this).find("a").css("visibility", "hidden");
	    });
		$(".similarityConfigurationItem").off("click").on("click", function(e){	
			// separating anchor from div event handling
			if($(e.target).hasClass("close")){
				return;
			}
			// write config to the item, that was previously selected
			$(".similarityConfigurationItem").each(function(i){
				// check if configuration item is empty to ensure correct refilling of form
				if( $(this).css("background-color") == "rgb(238, 238, 238)" && !isEmptySimilarityConfiguration() ){	
					$(this).attr("data-config", JSON.stringify(getSimilarityConfigItem()));					
				}
			});

	        $("#sourceGraph").selectpicker('val', "...");			
	        $("#sourceLabel").selectpicker('val', "...");
	        $("#sourceAttribute").selectpicker('val', "...");
	        $("#targetGraph").selectpicker('val', "...");
	        $("#targetLabel").selectpicker('val', "...");
	        $("#targetAttribute").selectpicker('val', "...");	
	        $("#weight").val("");	        
	        $("#similarityMethodName").selectpicker('val', "...");
	        
	        $("#similarityComponentConfig").empty();
		
			// filling the form back
			var currentConfig = $(this).attr("data-config");
			
			if(currentConfig != ""){
				currentConfig = JSON.parse($(this).attr("data-config"));
				
				$("#sourceGraph").selectpicker('val', currentConfig.sourceGraph).change();
		        $("#sourceLabel").selectpicker('val', currentConfig.sourceLabel).change();
		        $("#sourceAttribute").selectpicker('val', currentConfig.sourceAttribute);
		        $("#targetGraph").selectpicker('val', currentConfig.targetGraph).change();
		        $("#targetLabel").selectpicker('val', currentConfig.targetLabel).change();
		        $("#targetAttribute").selectpicker('val', currentConfig.targetAttribute);
		        $("#weight").val(currentConfig.weight);      
		        $("#similarityMethodName").selectpicker('val', currentConfig.similarityMethod).change();
		        
				if(currentConfig.threshold !== -1){
					$("#sm-threshold").val(currentConfig.threshold);
				}		        
				if(currentConfig.length !== -1){
					$("#sm-length").val(currentConfig.length);
				}
				if(currentConfig.padding !== -1){
					$("#sm-padding").val(currentConfig.padding);
				}
				if(currentConfig.secondMethod){
					$("#sm-secondMethod").val(currentConfig.secondMethod);
				}
				if(currentConfig.tokenizer !== ""){
					$("#sm-tokenizer").val(currentConfig.tokenizer);
				}
				if(currentConfig.jaroWinklerThreshold !== -1){
					$("#sm-jaroWinklerThreshold").val(currentConfig.jaroWinklerThreshold);
				}
				if(currentConfig.minLength !== -1){
					$("#sm-minLength").val(currentConfig.minLength);
				}
				if(currentConfig.maxToleratedDis !== -1){
					$("#sm-maxToleratedDis").val(currentConfig.maxToleratedDis);
				}
				if(currentConfig.maxToleratedPercentage !== -1){
					$("#sm-maxToleratedPercentage").val(currentConfig.maxToleratedPercentage);
				}
			}
	        
			$(".similarityConfigurationItem").css("background-color", "#fff");
			$(this).css("background-color", "#eee");
	    });
		
		// select first remaining element after currently selected blocking config item is deleted		
		$(".similarityConfigurationItem a").on("click", function(e){
			// separating anchor from div event handling			
			if(!$(e.target).hasClass("close")){
				return;
			}
			// timeout needed to ensure correct execution order with the bootstrap handler
			if($(e.target).parent().css("background-color") == "rgb(238, 238, 238)"){
				setTimeout(function(){
					if($(e.target).parent().html() === $(".similarityConfigurationItem").first().html()){
						// we select second element, because the first one is about to be deleted
						$($(".similarityConfigurationItem").get(1)).triggerHandler("click");
					}
					else {
						$(".similarityConfigurationItem").first().triggerHandler("click");
					}
				}, 1);
			}
			setTimeout(function(){refreshSimilaritiesList();}, 400);
		});
	}
	
	function isEmptySimilarityConfiguration(){
        if($("#sourceGraph").selectpicker('val')){
        	return false;
        }
		if($("#sourceLabel").selectpicker('val')){
        	return false;
        }
        if($("#sourceAttribute").selectpicker('val')){
        	return false;
        }
        if($("#targetGraph").selectpicker('val')){
        	return false;
        }
        if($("#targetLabel").selectpicker('val')){
        	return false;
        }
        if($("#targetAttribute").selectpicker('val')){
        	return false;
        }
        if($("#weight").val() !== ""){
        	return false;
        }
//        if($("#similarityMethodName").selectpicker('val')){
//        	return false;
//        }
        
        return true;
	}
	
	// refreshes list of similarities available as options for rule components
	function refreshSimilaritiesList(){
		var similarityOptions = $("#similarityId");
		similarityOptions.empty();
		$(".similarityConfigurationItem").each(function(i){
			var configIndex = $(this).find("span").html().substring(3);
			similarityOptions.append(`<option value="sim${configIndex}">sim${configIndex}</option>`);	
		});
		similarityOptions.selectpicker("refresh");
	}
	
	// calling for the first time to initialize for items already present
	setBlockingConfugirationItemHandlers();
	setSimilarityConfugirationItemHandlers();
    refreshSimilaritiesList();
    
	var blockingConfigurationItemNumber = 2;
	
    $("#addBlockingConfiguration").on("click", function(e){
    	var buttonHTML = 
			`<div class="alert alert-secondary alert-dismissable fade in blockingConfigurationItem" data-config="" style="float:left;height:34px;width:70px;border:1px solid #ccc;margin: 0px;padding:8px 0px 0px 30px;font-size:14px;position:relative;">
				<a href="#" class="close" data-dismiss="alert" aria-label="close" style="top: 4px; right: 3px; float: none; position: absolute; visibility: hidden;">×</a>
				<span>${blockingConfigurationItemNumber}</span>
			</div>`;
    	$("#blockingConfigurations").append(buttonHTML);
    	
    	blockingConfigurationItemNumber++;
    	
    	// initializing for newly created item
    	setBlockingConfugirationItemHandlers();
    	
    	// switching to newly created item
    	$(".blockingConfigurationItem").last().click();
    });

	var similarityConfigurationItemNumber = 2;
    
    $("#addSimilarityConfiguration").on("click", function(e){
    	var buttonHTML = 
			`<div class="alert alert-secondary alert-dismissable fade in similarityConfigurationItem" data-config="" style="float:left;height:34px;width:70px;border:1px solid #ccc;margin: 0px;padding:8px 0px 0px 21px;font-size:14px;position:relative;">
				<a href="#" class="close" data-dismiss="alert" aria-label="close" style="top: 4px; right: 3px; float: none; position: absolute; visibility: hidden;">×</a>
				<span>sim${similarityConfigurationItemNumber}</span>
			</div>`;
    	$("#similarityConfigurations").append(buttonHTML);
    	
    	similarityConfigurationItemNumber++;
    	
    	// initializing for newly created item
    	setSimilarityConfugirationItemHandlers();
    	
    	// switching to newly created item
    	$(".similarityConfigurationItem").last().click();
    	
    	// refreshing list of similarities in selection rule template
    	refreshSimilaritiesList();
    	
    	$("#similarityMethodName").selectpicker("val", "EDIT_DISTANCE");
    	$("#weight").selectpicker("val", "1");
    });    
    
    // initializing aggregation threshold slider
    $("#aggregationThresholdSlider").bootstrapSlider();
    $("#aggregationThresholdSlider").on("slide", function(e) {
    	$("#aggregationThresholdSpan").text(e.value);
    });
    
    // enabling bootstrap tooltips on the page
    $('[data-toggle="tooltip"]').tooltip();

    // toggling aggregation rule overlay
    $("#aggregationRuleEnabled").on("change", function(){
    	$("#aggregationRuleOverlay").toggle();
    });
    
    // toggling selection rules overlay
    $("#selectionRuleEnabled").on("change", function(){
    	$("#selectionRuleOverlay").toggle();
    });
    
    $("#addOrChangeSelectionCondition").on("click", addSelectionCondition);
    
    if(fillForm){
    	fillForm();
    }
}

function getLinkingOptions(){
	return `<button type="button" class="btn btn-info" data-toggle="modal" data-target="#linkConfig" style="margin-top:15px">Configure</button>`;
}

//<div class="checkbox">
//<label>
//	<input id="bidirectional" type="checkbox" checked disabled readonly>BiDirectionalOutput
//</label>
//</div>


function getModalWindow() {
    var modal = 
		`<!-- Modal -->
		<div id="linkConfig" class="modal fade" role="dialog">
			<div class="modal-dialog" style="width:1300px">
				<!-- Modal content-->
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal">&times;</button>
						<h4 class="modal-title">Linking Configuration</h4>
					</div>
					<div class="modal-body">
						<div>
							<div class="input-group" style="float:left;width:600px">
						    	<span class="input-group-addon" id="basic-addon1" style="min-width:150px">Output Graph</span>
						    	<input id="outputIdentifier" class="form-control" placeholder="type here..." aria-describedby="basic-addon1">
							</div>
							<div class="input-group" style="float:left;width:600px;margin-left:20px">
							    <span class="input-group-addon" id="basic-addon1" style="min-width:150px">Link Edge Attribute</span>
							    <input id="edgeLabel" class="form-control" placeholder="similarity" aria-describedby="basic-addon1">
							</div>
						</div>
						<div class="checkbox" style="margin-top:40px">
							<label>
								<input id="keepCurrentEdges" type="checkbox" readonly>keepCurrentEdges
							</label>
						</div>
						<div style="height:34px; margin:20px auto 20px; padding-left:10px; border: 2px solid #cccccc;border-radius:4px;background-color:#ffffff;text-align:center">
							<p style="height:30px;line-height:30px;font-size:16px">Blocking configuration</p>
						</div>
						<div id="blockingConfigurations" class="btn-group" role="group" aria-label="...">
							<div class="alert alert-secondary alert-dismissable fade in blockingConfigurationItem" data-config="" style="float:left;height:34px;width:70px;border:1px solid #ccc;margin: 0px;padding:8px 0px 0px 30px;font-size:14px;position:relative;background-color:#eee">
								<a href="#" class="close" data-dismiss="alert" aria-label="close" style="top:4px;right:3px;float:none;position:absolute;visibility:hidden">&times;</a>
								<span>1</span>
							</div>						
						</div>
						<button id="addBlockingConfiguration" type="button" class="btn btn-default" style="height:34px;width:34px;padding:0px 1px 1px 0px;">+</button>
						<div style="margin-top:15px">
						<div style="height:30px;position:relative">
							<div style="float:left">
								<form id="blockingMethod" >
									<label class="radio-inline">
										<input type="radio" name="blockingMethod" value="CARTESIAN_PRODUCT" checked="checked">CARTESIAN_PRODUCT
									</label>
									<label class="radio-inline">
										<input type="radio" name="blockingMethod" value="STANDARD_BLOCKING">STANDARD_BLOCKING
									</label>
									<label class="radio-inline">
										<input type="radio" name="blockingMethod" value="SORTED_NEIGHBORHOOD">SORTED_NEIGHBORHOOD
									</label>
								</form>
							</div>
    						<div id="windowSizeConfig" style="float:left;margin:-5px 0px 0px 105px">
    						</div>
    					</div>
							<div id="blockingComponentConfig" style="position:relative">
							</div>
						</div>
						
						<div style="margin:50px auto 20px; height:34px; padding-left:10px; border: 2px solid #cccccc;border-radius:4px;background-color:#ffffff;text-align:center">
							<p style="height:30px;line-height:30px;font-size:16px">Similarity configuration</p>
						</div>
						<div id="similarityConfigurations" class="btn-group" role="group" aria-label="...">
							<div class="alert alert-secondary alert-dismissable fade in similarityConfigurationItem" data-config="" style="float:left;height:34px;width:70px;border:1px solid #ccc;margin: 0px;padding:8px 0px 0px 21px;font-size:14px;position:relative;background-color:#eee">
								<a href="#" class="close" data-dismiss="alert" aria-label="close" style="top:4px;right:3px;float:none;position:absolute;visibility:hidden">&times;</a>
								<span>sim1</span>
							</div>						
						</div>						
						<button id="addSimilarityConfiguration" type="button" class="btn btn-default" style="height:34px;width:34px;padding:0px 1px 1px 0px;">+</button>						
						<div style="min-height:78px;margin-top:20px">
							<div id="sourceInputGroup" class="input-group" style="float:left;width:600px">
						        <span class="input-group-addon" id="basic-addon1" style="min-width:200px">Source graph/label/attribute</span>
								<select id="sourceGraph" class="selectpicker" title="..." data-width="125px"></select>
								<select id="sourceLabel" class="selectpicker" title="..." data-width="125px"></select>
								<select id="sourceAttribute" class="selectpicker" title="..." data-width="125px"></select>							
					        </div>
					        <div id="targetInputGroup" class="input-group" style="float:left;width:600px;margin-left:20px">
						        <span class="input-group-addon" id="basic-addon1" style="min-width:200px">Target graph/label/attribute</span>
								<select id="targetGraph" class="selectpicker" title="..." data-width="125px"></select>							
								<select id="targetLabel" class="selectpicker" title="..." data-width="125px"></select>
								<select id="targetAttribute" class="selectpicker" title="..." data-width="125px"></select>
					        </div>
							<div id="similarityMethodInputGroup" class="input-group" style="float:left;width:600px;margin-top:10px">
						        <span class="input-group-addon" id="basic-addon1" style="min-width:201px">Similarity method</span>
								<select id="similarityMethodName" class="selectpicker" title="..." data-width="375px">
						     		<option value="JAROWINKLER">JAROWINKLER</option>
							     	<option value="TRUNCATE_BEGIN">TRUNCATE_BEGIN</option>
							     	<option value="TRUNCATE_END">TRUNCATE_END</option>
							     	<option value="EDIT_DISTANCE">EDIT_DISTANCE</option>
							     	<option value="QGRAMS">QGRAMS</option>
							     	<option value="MONGE_ELKAN">MONGE_ELKAN</option>
							     	<option value="EXTENDED_JACCARD">EXTENDED_JACCARD</option>
							     	<option value="LONGEST_COMMON_SUBSTRING">LONGEST_COMMON_SUBSTRING</option>
							     	<option value="NUMERICAL_SIMILARITY_MAXDISTANCE">NUMERICAL_SIMILARITY_MAXDISTANCE</option>
							     	<option value="NUMERICAL_SIMILARITY_MAXPERCENTAGE">NUMERICAL_SIMILARITY_MAXPERCENTAGE</option>							     	
						     	</select>
					        </div>
					        <div class="input-group" style="float:left;width:351px;margin-left:20px;margin-top:10px">
			    				<span class="input-group-addon" id="basic-addon1" style="min-width:200px">Weight</span>
			    				<input id="weight" class="form-control" aria-describedby="basic-addon1" placeholder="1">
							</div>
				        </div>
						<div id="similarityComponentConfig">
						</div>
						<div style="margin: 94px auto 20px; height:34px; padding-left:10px; border: 2px solid #cccccc;border-radius:4px;background-color:#ffffff;text-align:center">
							<p style="height:30px;line-height:30px;font-size:16px">Selection configuration</p>
						</div>
						<div class="checkbox" style="margin-top:10px">
							<label>
								<input id="aggregationRuleEnabled" type="checkbox" checked>aggregationRuleEnabled
							</label>
						</div>
						<div>
							<div style="float:left">
								<form id="aggregationStrategy" style="font-size:14px">
									<label class="radio-inline">
										<input type="radio" name="aggregationStrategy" value="ARITHMETIC_AVERAGE" checked>Arithmetic average
									</label>
									<label class="radio-inline">
										<input type="radio" name="aggregationStrategy" value="WEIGHTED_AVERAGE">Weighted average
									</label>
								</form>
							</div>
							
							<span id="aggregationThresholdLabel" style="font-size:14px;display:block;float:left;width:200px;margin:5px auto auto 150px">Aggregation threshold: <span id="aggregationThresholdSpan">0.50</span></span>
							<div style="padding-top:2px">
								<input id="aggregationThresholdSlider" type="text" data-slider-min="0.00" data-slider-max="1.00" data-slider-step="0.01" data-slider-value="0.5"/>
							</div>
						</div>
						<div id="aggregationRuleOverlay" style="display:none;position:relative;height:25px;margin-top:-25px;background-color:white;opacity:0.6;z-index:3">
						</div>
						<div class="checkbox" style="margin-top:40px">
							<label>
								<input id="selectionRuleEnabled" type="checkbox" checked>selectionRuleEnabled
							</label>
						</div>
						<div style="height:50px">
							<div id="selectionRuleTemplate" class="input-group" style="float:left;width:595px">
						        <span class="input-group-addon" id="basic-addon1" style="min-width:205px">simId/operator/threshold</span>
								<select id="similarityId" class="selectpicker" title="..." data-width="100px"></select>
								<select id="conditionOperator" class="selectpicker" title="..." data-width="165px">
									<option value="EQUAL">EQUAL</option>
									<option value="SMALLER">SMALLER</option>
									<option value="GREATER">GREATER</option>
									<option value="GREATER_EQUAL">GREATER_EQUAL</option>
									<option value="SMALLER_EQUAL">SMALLER_EQUAL</option>
									<option value="NOT_EQUAL">NOT_EQUAL</option>
								</select>
								<input id="conditionThreshold" class="form-control" aria-describedby="basic-addon1" style="width:100px">						
					    	</div>
							<button id="addOrChangeSelectionCondition" type="button" class="btn btn-default" style="display:block;float:left;width:65px;background-color:#eee;" >ADD</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:55px;margin-left:10px;background-color:#eee" onclick="addOpenParenthesisRuleComponent()">(</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:55px;background-color:#eee;" onclick="addCloseParenthesisRuleComponent()">)</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:55px;background-color:#eee;" onclick="addAndOperatorRuleComponent()" data-toggle="tooltip" title="expression in parenthesis is evaluated from right to left, ADD and OR have the same operator precedence. Use parenthesis if you want to ensure other operator precedence">AND</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:55px;background-color:#eee;" onclick="addOrOperatorRuleComponent()">OR</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:45px;background-color:#eee;margin-left:10px;" onclick="moveLeft()" data-toggle="tooltip" title="move left">&lt;=</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;width:45px;background-color:#eee;" onclick="moveRight()" data-toggle="tooltip" title="move right">=&gt;</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;background-color:#eee;margin-left:10px;" onclick="clearRuleComponents()">CLEAR</button>
							<button type="button" class="btn btn-default" style="display:block;float:left;margin-left:10px;background-color:#eee;" onclick="deleteRuleComponents()">DELETE</button>
							<div id="selectionRuleMenuOverlay" style="display:none;position:relative;background-color:white;opacity:0.6;z-index:2;height: 50px;width: 320px;margin.left: 600px;margin-left: 660px"></div>
						</div>
    					<div id="ruleComponents" style="height:50px">
    						<div id="sourceInputGroup" class="input-group" style="float:left;width:205px;height:34px;border:1px solid #ccc;border-radius:4px;">
						        <span class="input-group-addon" id="basic-addon1" style="min-width:205px;border-width:0px;">Selection rule</span>						
					    	</div>
						</div>
						<div id="selectionRuleOverlay" style="display:none;position:relative;height:100px;margin-top:-100px;background-color:white;opacity:0.6;z-index:3">
						</div>
					</div>
						<div class="modal-footer">
						<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>`;

    return modal;
}

function addSelectionCondition(){
	var similarity = $("#similarityId").val();
	var operator = $("#conditionOperator").val();
	var threshold = $("#conditionThreshold").val();
	
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
	
	if(similarity != "" && operator != "" && threshold != ""){
		$("#ruleComponents").append(
				`<button type="button" class="btn btn-default" 
				data-conditionId ="con${addSelectionCondition.index}" data-similarity="${similarity}" data-operator="${operator}" data-threshold="${threshold}" 
				style="display:block;float:left">${similarity} ${shortOperator} ${threshold}</button>`);
		addSelectionCondition.index++;
	}
	addRuleComponentsHandler();
}
addSelectionCondition.index = 1;

function changeSelectionCondition(){
	var similarity = $("#similarityId").val();
	var operator = $("#conditionOperator").val();
	var threshold = $("#conditionThreshold").val();
	
	var selection = $("#ruleComponents button.selectedRuleComponent");
	
	selection.attr("data-similarity", similarity);
	selection.attr("data-operator", operator);
	selection.attr("data-threshold", threshold);
	
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
	
	selection.html(`${similarity} ${shortOperator} ${threshold}`);
	selection.removeClass("selectedRuleComponent");
	selection.css("background-color", "#fff");
	
	clearSelectionRuleTemplate();
	$("#addOrChangeSelectionCondition").html("ADD");
	$("#selectionRuleMenuOverlay").hide();
}

function addOpenParenthesisRuleComponent(){
	$("#ruleComponents").append(
			`<button type="button" class="btn btn-default" style="display:block;float:left">(</button>`);
	addRuleComponentsHandler();
}

function addCloseParenthesisRuleComponent(){
	$("#ruleComponents").append(
			`<button type="button" class="btn btn-default" style="display:block;float:left">)</button>`);
	addRuleComponentsHandler();
}

function addAndOperatorRuleComponent(){
	$("#ruleComponents").append(
			`<button type="button" class="btn btn-default" style="display:block;float:left">AND</button>`);
	addRuleComponentsHandler();
}
function addOrOperatorRuleComponent(){
	$("#ruleComponents").append(
			`<button type="button" class="btn btn-default" style="display:block;float:left">OR</button>`);
	addRuleComponentsHandler();
}

function moveLeft(){
	$("#ruleComponents button").each(function(i){
		if($(this).hasClass("selectedRuleComponent")){
			
			var previousElement = $(this).prev().get(0);

			// we can swap only with rule elements, that are BUTTON elements
			if( $(previousElement).prop('nodeName') !== "DIV" ){

			    previousElement.parentNode.insertBefore(this, previousElement);
			    this.parentNode.insertBefore(previousElement, this.nextSibling);
			}
		}
	});
}

function moveRight(){
	$("#ruleComponents button").each(function(i){
		if($(this).hasClass("selectedRuleComponent")){
			var nextElement = $(this).next().get(0);
			
			if( $(nextElement).prop('nodeName') === "BUTTON" ){
				this.parentNode.insertBefore(nextElement, this);
				nextElement.parentNode.insertBefore(this, nextElement.nextSibling);	
			}
		}
	});
}

function deleteRuleComponents(){
	$("#ruleComponents button").each(function(i){
    	// check if CONDITION rule component has been selected
		if( $(this).hasClass("selectedRuleComponent") 
			&& typeof $(this).attr("data-similarity") !== typeof undefined 
			&& $(this).attr("data-similarity") !== false){
			
			$(this).remove();
			
    		$("#addOrChangeSelectionCondition").html("ADD");
    		$("#addOrChangeSelectionCondition").off("click").on("click", addSelectionCondition);
			clearSelectionRuleTemplate();
			$("#selectionRuleMenuOverlay").hide();
			
			// adjusting select width
		    $("#selectionRuleTemplate div").each(function(i){
		    	if( i == 0) $(this).css("width", "100");
		    	else $(this).css("width", "165");
		    });
		}
		else if($(this).hasClass("selectedRuleComponent")){
			$(this).remove();
		}
	});

}

function clearRuleComponents(){
	$("#ruleComponents button").remove();
}

function addRuleComponentsHandler(){
    $("#ruleComponents button").off("click").on("click", function(){
    	var currentElement = $(this);
    	currentElement.toggleClass("selectedRuleComponent");
    	
    	if( currentElement.hasClass("selectedRuleComponent") ){
    		currentElement.css("background-color", "#eee");
    	}
    	else{
    		currentElement.css("background-color", "#fff");
    	}
    	
    	// check if CONDITION rule component has been selected
    	if( typeof currentElement.attr("data-similarity") !== typeof undefined 
    			&& currentElement.attr("data-similarity") !== false
    			&& currentElement.hasClass("selectedRuleComponent")){
    		$("#similarityId").val(currentElement.attr("data-similarity"));;
    		$("#similarityId").selectpicker("refresh");
    		$("#conditionOperator").val(currentElement.attr("data-operator"));
    		$("#conditionOperator").selectpicker("refresh");
    		$("#conditionThreshold").val(currentElement.attr("data-threshold"));
    		$("#addOrChangeSelectionCondition").html("SAVE");
    		$("#addOrChangeSelectionCondition").off("click").on("click", changeSelectionCondition);
    		$("#selectionRuleMenuOverlay").show();
    	}
    	else{
    		clearSelectionRuleTemplate();
    		$("#addOrChangeSelectionCondition").html("ADD");
    		$("#addOrChangeSelectionCondition").off("click").on("click", addSelectionCondition);
    		$("#selectionRuleMenuOverlay").hide();
    	}
    	
    	$("#ruleComponents button").each(function(i){
    		if( $(this)[0] != currentElement[0]){
    			$(this).removeClass("selectedRuleComponent");
    			$(this).css("background-color", "#fff");
    		}
    	});
    });
}

function clearSelectionRuleTemplate(){
	$("#similarityId").val("...");;
	$("#similarityId").selectpicker("refresh");
	$("#conditionOperator").val("...");
	$("#conditionOperator").selectpicker("refresh");
	$("#conditionThreshold").val("");
}


function getKeyGenerationComponentOptions(){
	var options = 
		`<div style="width:600px">
			<form id="keyGenerationComponent" style="margin-top:20px">
				<label class="radio-inline">
					<input type="radio" name="keyGenerationComponent" value="FULL_ATTRIBUTE">FULL_ATTRIBUTE
				</label>
				<label class="radio-inline">
					<input type="radio" name="keyGenerationComponent" value="PREFIX_LENGTH">PREFIX_LENGTH
				</label>
				<label class="radio-inline">
					<input type="radio" name="keyGenerationComponent" value="QGRAMS">QGRAMS
				</label>
				<label class="radio-inline">
					<input type="radio" name="keyGenerationComponent" value="WORD_TOKENIZER">WORD_TOKENIZER
				</label>
			</form>
		</div>	
		<div id="kgc-options" style="position:absolute;top:-8px;left:620px">
    	</div>`;
	
	return options;
}

function getLinkingConfig(){

    var settings = {
        "blockingComponents": getBlockingComponents(),
        "similarityComponents": getSimilarityComponents(),
        "selectionComponent":getSelectionComponent(),
    	"keepCurrentEdges":$("#keepCurrentEdges").is(":checked"),   	
    	"edgeLabel":($("#edgeLabel").val() == "") ? "similarity" : $("#edgeLabel").val(),
    	//"bidirectional":$("#bidirectional").is(":checked"),
    	"aggregationRuleEnabled":$("#aggregationRuleEnabled").is(":checked"),
    	"selectionRuleEnabled":$("#selectionRuleEnabled").is(":checked"),
    };

    var linkingConfig = {"linkSpec": settings};
    
    return linkingConfig;
}

function getBlockingComponents(){
    var blockingComponents = [];
    
    // get previously saved blocking configs
    $(".blockingConfigurationItem").each(function(i){
    	var configIndex = $(this).find("span").html();
    	var configItem = $(this).attr("data-config");
    	if(configItem !== "") {
    		blockingComponents[configIndex] = JSON.parse(configItem);
    	}
    });
    
    // get currently selected blocking config
	$(".blockingConfigurationItem").each(function(i){
		if( $(this).css("background-color") === "rgb(238, 238, 238)" ){	
			var configIndex = $(this).find("span").html();
			blockingComponents[configIndex] = getBlockingConfigItem();
		}
	});
	
	// removing null elements from the array
	blockingComponents = $.grep(blockingComponents,function(e){ return e == 0 || e });
	
	return blockingComponents;
}

function getBlockingConfigItem(){
	var blockingConfig = {
		"blockingMethod": $('input[name=blockingMethod]:checked', '#blockingMethod').val(),
    	"windowSize": ($("#windowSize").length && $("#windowSize").val() !== "") ? $("#windowSize").val() : -1,
        	"keyGenerationComponent": {
        		"keyGenerationMethod": $('input[name=keyGenerationComponent]:checked', '#keyGenerationComponent').val(),
        		"attribute": $("#kgc-attribute").length ? $("#kgc-attribute").val() : "",
        		"prefixLength": ($("#kgc-prefix-length").length && $("#kgc-prefix-length").val() !== "") ? $("#kgc-prefix-length").val() : ($("#kgc-prefix-length").val() == "" ? $("#kgc-prefix-length").attr("placeholder") : -1),
        		"qgramNo": ($("#kgc-qgramNo").length && $("#kgc-qgramNo").val() !== "") ? $("#kgc-qgramNo").val() : ($("#kgc-qgramNo").val() == "" ? $("#kgc-qgramNo").attr("placeholder") : -1),
        		"qgramThreshold": ($("#kgc-qgramThreshold").length && $("#kgc-qgramThreshold").val() !== "") ? $("#kgc-qgramThreshold").val() : ($("#kgc-qgramThreshold").val() == "" ? $("#kgc-qgramThreshold").attr("placeholder") : -1),
        		"tokenizer": $("#kgc-tokenizer").length ? $("#kgc-tokenizer").val() : ""
        	}
	};
	return blockingConfig;
}

function getSimilarityComponents(){
    var similarityComponents = [];
    
    // get previously saved similarity configs
    $(".similarityConfigurationItem").each(function(i){
    	var configIndex = $(this).find("span").html().substring(3);
    	var configItem = $(this).attr("data-config");
    	if(configItem !== "") {
    		similarityComponents[configIndex] = JSON.parse(configItem);
    	}
    });
    
    // get currently selected similarity config
	$(".similarityConfigurationItem").each(function(i){
		if( $(this).css("background-color") === "rgb(238, 238, 238)" ){	
			var configIndex = $(this).find("span").html().substring(3);
			similarityComponents[configIndex] = getSimilarityConfigItem();
		}
	});
	
	// removing null elements from the array
	similarityComponents = $.grep(similarityComponents,function(e){ return e == 0 || e });
	
	return similarityComponents;
}

function getSimilarityConfigItem(){
	
	var similarityConfigId;
	$(".similarityConfigurationItem").each(function(i){
		if( $(this).css("background-color") === "rgb(238, 238, 238)" ){	
			similarityConfigId = $(this).find("span").html();
		}
	});
	
	var similarityConfig = {
			"id":similarityConfigId,
        	"sourceGraph":$('#sourceGraph').val(), 
        	"targetGraph":$('#targetGraph').val(),			
        	"sourceLabel":$('#sourceLabel').val(), 
        	"targetLabel":$('#targetLabel').val(),
    		"sourceAttribute":$('#sourceAttribute').val(), 
        	"targetAttribute":$('#targetAttribute').val(),
        	"weight": ($("#weight").length && $("#weight").val() !== "") ? $("#weight").val() : ($("#weight").val() == "" ? $("#weight").attr("placeholder") : -1),
    		"similarityMethod":$("#similarityMethodName").val(),
    		"threshold":($("#sm-threshold").length && $("#sm-threshold").val() !== "") ? $("#sm-threshold").val() : ($("#sm-threshold").val() == "" ? $("#sm-threshold").attr("placeholder") : -1),
    		"length":($("#sm-length").length && $("#sm-length").val() !== "") ? $("#sm-length").val() : ($("#sm-length").val() == "" ? $("#sm-length").attr("placeholder") : -1),
    		"padding":($("#sm-padding").length && $("#sm-padding").val() !== "") ? $("#sm-padding").val() : ($("#sm-padding").val() == "" ? $("#sm-padding").attr("placeholder") : -1),
    		"secondMethod":$("#sm-secondMethod").val(),
    		"tokenizer":$("#sm-tokenizer").length ? $("#sm-tokenizer").val() : "",
    		"jaroWinklerThreshold":($("#sm-jaroWinklerThreshold").length && $("#sm-jaroWinklerThreshold").val() !== "") ? $("#sm-jaroWinklerThreshold").val() : ($("#sm-jaroWinklerThreshold").val() == "" ? $("#sm-jaroWinklerThreshold").attr("placeholder") : -1),
    		"minLength":($("#sm-minLength").length && $("#sm-minLength").val() !== "") ? $("#sm-minLength").val() : ($("#sm-minLength").val() == "" ? $("#sm-minLength").attr("placeholder") : -1),
    		"maxToleratedDis":($("#sm-maxToleratedDis").length && $("#sm-maxToleratedDis").val() !== "") ? $("#sm-maxToleratedDis").val() : ($("#sm-maxToleratedDis").val() == "" ? $("#sm-maxToleratedDis").attr("placeholder") : -1),
    		"maxToleratedPercentage":($("#sm-maxToleratedPercentage").length && $("#sm-maxToleratedPercentage").val() !== "") ? $("#sm-maxToleratedPercentage").val() : ($("#sm-maxToleratedPercentage").val() == "" ? $("#sm-maxToleratedPercentage").attr("placeholder") : -1),
    };
	return similarityConfig;
}

function getSelectionComponent(){
	var selectionConfig = { 
		"aggregationStrategy":$('input[name=aggregationStrategy]:checked', '#aggregationStrategy').val(),
		"aggregationThreshold":$("#aggregationThresholdSlider").val(),
		"ruleComponents":getRuleComponents()
	};
	return selectionConfig; 
}

function getRuleComponents(){
	var ruleComponents = [];
	
	$("#ruleComponents button").each(function(i){
		var item = $(this);
		var ruleComponent = {};
		
		switch(item.html()){
		case "(":
			ruleComponent.componentType = "OPEN_PARENTHESIS";
			break;
		case ")":
			ruleComponent.componentType = "CLOSE_PARENTHESIS";
			break;
		case "AND":
			ruleComponent.componentType = "SELECTION_OPERATOR_AND";
			break;
		case "OR":
			ruleComponent.componentType = "SELECTION_OPERATOR_OR";
			break;
		default:
			ruleComponent.componentType = "CONDITION";
			ruleComponent.conditionId = item.attr("data-conditionId");
			ruleComponent.similarityFieldId = item.attr("data-similarity");
			ruleComponent.operator = item.attr("data-operator");
			ruleComponent.threshold = item.attr("data-threshold");
			break;
		}
		ruleComponents.push(ruleComponent);
	});
	
	// handling the case when no rule components have been defined
	// necessary if selectionRuleEnabled flag was set, but no rules were chosen
	if(ruleComponents.length == 0){
		var ruleComponent = {};
		ruleComponent.componentType = "COMPUTED_EXPRESSION_TRUE";
		ruleComponents.push(ruleComponent);
	}
	
	return ruleComponents;
}
