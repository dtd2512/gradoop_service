
function QueryPanel(divID, callback){
	var that=this;
this.panelID=divID;
//this.recommendCallback=callback;
	$("#"+that.panelID).append("<table id='queryTable_"+that.panelID+"'>");
	$('#queryTable_'+that.panelID).append("<tr id='row_0"+"_"+that.panelID+"'>");
	$('#row_0'+'_'+that.panelID).append("<td id='0_0_"+that.panelID+"' class='table-td'>");
	$('#0_0_'+that.panelID).append("<div id='0_0_"+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style=' float: left; margin-right: 5px; display: inline-block;' class='notfilled'></div><div id='0_0_"+that.panelID+"_div_has'  style='float: right; margin-right: 5px'>has </div>");

	$('#queryTable_'+that.panelID).append("<tr id='row_1"+"_"+that.panelID+"'>");


	
	

var uniqueIDCounter=0;
var types=[];
var typeCounts=[];
var edges=[];
  var schema;
  
  var typeIndex=[];
	var propertyIndex=[];
	var backwardIndex={};
	backwardIndex.types=[];
  
	this.initSchemaIndices= function initSchemaIndices(inputschema){
		schema=inputschema;
		for(var type=0; type<schema.types.length; type++){
			properties=schema.types[type].propertys;
			typeIndex[schema.types[type].uri]=schema.types[type];
			if(properties.length==undefined){
				properties=[properties];
				schema.types[type].propertys=[schema.types[type].propertys]
			}
			for(var prop=0; prop<properties.length; prop++){

				propertyIndex[properties[prop].uri]=properties[prop];
				//propertyIndex[properties[prop].uri].values=[];
				propertyIndex[properties[prop].uri].parentType=schema.types[type].uri;
				if(properties[prop].techtype=="out_edge"){
					if(properties[prop].associatedURIs && !properties[prop].associatedURIs.push)properties[prop].associatedURIs=[properties[prop].associatedURIs];
					
					for(key in properties[prop].associatedURIs){
						var aTypeURI=properties[prop].associatedURIs[key];
						if(backwardIndex.types[aTypeURI]==undefined)backwardIndex.types[aTypeURI]=[];//init array
						backwardIndex.types[aTypeURI].push(properties[prop]);
					}
					
				}
			}
		}
	}
  
  this.addStartingType= function(){
		var types=[];
		types.push({value: 'test', text: '--chooseType--',  test:'yes' })
		for(var index=0; index<schema.types.length; index++){
			types.push( {value: schema.types[index].uri, text: schema.types[index].name})
		}
	    $('#0_0'+'_'+that.panelID+'_div').editable({
	    	unsavedclass:null,
	        value: 'test',
	        mode: 'inline',
	        showbuttons: false,
	        url: that.showProperties,
	        source: types
	    });
	    $('#'+0+'_'+0+'_'+that.panelID+'_div').attr("parent",-1); // trying to set the parent.
	}
  
  this.readQuery = function(cellID, predecessor, prepredecessor){
	  typeCounts=[];
	  var div1= $('#'+cellID+'_div');
	  var current;
	  
	  
	 if(div1.attr("ready")=="yes"){
	  if(div1.attr("kind")!="value" && div1.attr("kind")!="date" ){
		  console.log(div1.attr("kind")+":"+div1.attr("uri"));
		  if(div1.attr("kind")=="type"){
			  var type={};
			  var uri=div1.attr("uri");
			  if( typeCounts[uri]==undefined){ 
				  typeCounts[uri]=1;
			  	  type.uri=div1.attr("uri");
			  }else{
				  typeCounts[uri]++;
				  type.uri=div1.attr("uri")+"#"+ typeCounts[uri];
			  }
			  type.id=div1.attr("uniqueid");
			  type.included="true"; //all types included..
			  current=type;
			  that.types.push(current);
			  if(predecessor!=undefined && (predecessor.auri!=undefined ||predecessor.buri!=undefined)){
				 if(predecessor.auri==undefined)
				  predecessor.auri=type.uri;
				 else
				   predecessor.buri=type.uri;
			  }
		  }
		 if(div1.attr("kind")=="property"){
			 if(!div1.attr("anypath")){
			if(propertyIndex[div1.attr("uri")].techtype=="out_edge"){//create an edge in the edgeList
				var edge={};
			
				if(div1.attr("backwards")!=undefined){
					edge.buri=predecessor.uri;
				}else{
					edge.auri=predecessor.uri;
				}
				edge.uri=div1.attr("uri");
				that.edges.push(edge);
				current=edge;
			}else{
			 	var afilter={};
				current =afilter;
				afilter.prop=div1.attr("uri");
			 	if(predecessor.propFilter==undefined) 
				 	predecessor.propFilter=[];
			 	predecessor.propFilter.push(current);
			}
		  }else{
			  //TODO implement anypath.. an edge should be added that is then computed by shortest path on the server..
		  }
		}
	  }else{
		//	set value and comparison "value" : val,
		//	"comparison" : "expression"
		if(div1.attr("kind")=="date"){
			var value=div1.text();
			 predecessor.comparison="expression";
			 predecessor.value=">="+transformDate(value);
			  var div2= $('#'+cellID+'_div_3');
			  
			  //add a second property to reflect the date behavior
			  var value2=div2.text();
			 var afilter={};
				afilter.prop=predecessor.prop;
				afilter.comparison="expression";
				afilter.value="<="+transformDate(value2);
			 	prepredecessor.propFilter.push(afilter);
		}else{
			var value=div1.text();
			if(predecessor!=undefined){
			if(value[0]==">" || value[0]=="<"){
					 predecessor.comparison="expression";
					 predecessor.value=value;
				 } else{
					 predecessor.comparison="equal";
					 predecessor.value=value;
			}
		}
			//	set value and comparison "value" : val,
			//	"comparison" : "expression"
		}
		
		  console.log(div1.attr("kind")+ ":"+div1.text());
	  }
	 }
	  
	
	  for(anid in children[cellID]){
			childCellID= children[cellID][anid]
			var div2= $('#'+childCellID+'_div');		
			that.readQuery(children[cellID][anid], current, predecessor);
		}
	  
  }
  
  
  transformDate = function(adate){

	  return   Date.parseExact(adate, 'dd.MM.yyyy').toString('yyyyMMdd');
  }
  
//#####################################
  this.drawLines =  function(cellID){

	  if(cellID==undefined)cellID="0_0_"+that.panelID;
	  that.makeElementsDraggable();
//	  that.makeElementDropZones();
	 	var padding=3;
			var div1= $('#'+cellID+'_div');
			if($('#'+cellID+'_div_has').length)
				var div1= $('#'+cellID+'_div_has');
		
			
			 $('body').append("<svg id=\"lineContainer"+""+"\" height=\"500\" width=\"1000\" style=\"position: absolute; top: 0px;	pointer-events: none; left: 0px;\">"+
		  			 
		  	  	"</svg>");

			for(anid in children[cellID]){
				childCellID= children[cellID][anid]
				var div2= $('#'+childCellID+'_div');
				if(div2.offset()!=undefined){
				var myLine =  d3.select("#lineContainer").append("svg:line")
		  	    .attr("x1", div1.offset().left + div1.width()+padding)
		  	    .attr("y1", div1.offset().top+div1.height()/2)
		  	    .attr("x2", div2.offset().left-padding)
		  	    .attr("y2",  div2.offset().top+div2.height()/2)
		  	    .style("stroke", "rgb(6,120,155)");  
				
				that.drawLines(children[cellID][anid]);
				}
			}
		}

  
	var values=[];
	var rowCounts=[];
	
var children=[];	
//##########################################################################################################################
	
//##########################################################################################################################
this.showProperties = function(result, rowIndex, choosenProp){
	
	var id=result.name.split("_");
	var x= parseInt(id[0]);
	var y= parseInt(id[1]);
	var cellID=id[0]+"_"+id[1]+'_'+that.panelID;
	$('#'+cellID+"_div").removeClass( "notfilled" );
	$('#'+cellID+"_div").attr("uri",result.value);
	$('#'+cellID+"_div").attr("uniqueid",uniqueIDCounter);
	
	$('#'+cellID+"_div").attr("kind","type");
	$('#'+cellID+"_div").attr("ready", "yes");
	$('#'+cellID+"_div").addClass( "draggable" );
	$('#'+cellID+"_div").data("typePath",result.value);
	
	uniqueIDCounter++;
	
	if(rowIndex!=undefined)
		x=rowIndex;
	
	currentType=typeIndex[result.value];
	//collect the values..
	
	//data1=currentType.propertys;
	

	//console.log("test"+currentType.uri);
	
	y++;
	
	row= $('#row_'+x+'_'+that.panelID);
	
	
	cell=$('#'+x+'_'+y+'_'+that.panelID);
	if(!cell.length){
		that.appendCell(row, x,y);
	}else{ // tries to remove the whole subtree.
		that.removeChildren(cellID);
		row.append("<td id='"+x+"_"+y+'_'+that.panelID+"'></td>");
	}
	cell= $('#'+x+'_'+y+'_'+that.panelID);
	
	//check if there is already a chooseProperty present..
	if(children[cellID]==undefined || children[cellID].length<=1||
			!($('#'+children[cellID][children[cellID].length-1]+'_div').text()=="--choose--") || children[cellID][children[cellID].length-1]==choosenProp){
	
	cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style='margin-right:5px;display: inline-block;' class='notfilled'></div>");

	$('#'+x+'_'+y+'_'+that.panelID+'_div').attr("parent",currentType.uri);
	$('#'+x+'_'+y+'_'+that.panelID+'_div').attr("parentCell",result.name);
	
	
	if(children[cellID]==undefined){
		children[cellID]=[];
	}
	children[cellID].push(x+'_'+y+'_'+that.panelID);
	
	var properties=[];
	properties.push({value: 0, text: '--choose--'})
//	properties.push({value: 1, text: '**'})
	for(index=0; index<currentType.propertys.length; index++){
		properties.push( {value: currentType.propertys[index].uri, text: currentType.propertys[index].name })
	}
	///TODO ERIC
if(backwardIndex.types[currentType.uri]!=undefined){
	for(index=0; index<	backwardIndex.types[currentType.uri].length; index++){
		properties.push( {value: "!"+backwardIndex.types[currentType.uri][index].uri, text: "<--"+backwardIndex.types[currentType.uri][index].name })
	}
}
	
    $('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
    	unsavedclass:null,
        value: 0,
        mode: 'inline',
        showbuttons: false,
        url: that.showTypes,
        source: properties
    });
	}
	
	setTimeout(that.redraw, 300);
};	

this.redraw = function(){
	 $('#lineContainer').remove();
	 that.drawLines("0_0"+'_'+that.panelID);
	 if(that.recommendCallback!=undefined)
		 that.recommendCallback(that);
}

this.removeChildren = function(cellID){
 	var currentCell=cellID;
	for(anid in children[currentCell]){
		var cell= $('#'+children[currentCell][anid]);
		 cell.remove();
		that.removeChildren(children[currentCell][anid]);

		
	}
	children[currentCell]=[];
}


this.appendCell= function(row, x, y){
	s=0;
	cell=$('#'+x+'_'+s+'_'+that.panelID)
	while(s<=y){
		if(!cell.length)
			row.append("<td id='"+x+"_"+s+'_'+that.panelID+"' style='padding-right: 30px; padding-left: 10px;'></td>");
		s++;
		cell=$('#'+x+'_'+s+'_'+that.panelID)
	}
}
var rowcounter=0;
//#######################################################################

this.showTypes = function(result){
	
	var backwards=false;
	var anypath=false;
	var id=result.name.split("_");
	var x= parseInt(id[0]);
	var y= parseInt(id[1]);
	var currentProp;
	if(result.value.substring(0,1)=="!"){
		currentProp=propertyIndex[result.value.substring(1)];
		backwards=true;
		
	}else if(result.value=="1"){
		anypath=true;;
	}
	else{
		currentProp=propertyIndex[result.value];
	}
	
	
	
	var cellID= x+'_'+y+'_'+that.panelID;
	
	if(result.value=="0"){ // back to "-Choose-"
		$('#'+cellID+"_div").addClass( "notfilled" );
		$('#'+cellID+"_div").attr("ready", "no");
		$('#'+cellID+"_div").removeClass( "draggable" );
		that.removeChildren(cellID);	
		row.append("<td id='"+x+"_"+y+'_'+that.panelID+"' class='table-td'></td>");
		setTimeout(that.redraw, 300);
		return;
	}else{
	
	$('#'+cellID+"_div").removeClass( "notfilled" );
	if(!anypath){$('#'+cellID+"_div").attr("uri",currentProp.uri);}else{
		$('#'+cellID+"_div").attr("anypath","yes");
		$('#'+cellID+"_div").addClass( "draggable" );
	}
	$('#'+cellID+"_div").attr("kind","property");
	$('#'+cellID+"_div").attr("ready", "yes");
	$('#'+cellID+"_div").addClass( "draggable" );
	$('#'+cellID+"_div").data("typePath",$('#'+result.name).attr("parent")+"/"+currentProp.uri);
	}
	if(backwards)$('#'+cellID+"_div").attr("backwards", "yes");
	else{
		if($('#'+cellID+"_div").attr("backwards")!=undefined)
			$('#'+cellID+"_div").removeAttr("backwards");
	}
	
	cell=$('#'+x+'_'+y+'_'+that.panelID);
	//cell.append("<div id='"+x+"_"+y+"_add' >add</div>");
 	//$('#'+x+'_'+y+'_add').click(handleAddProperty);
 	
 	parentType=$('#'+result.name).attr("parent");
 	parentCell=$('#'+result.name).attr("parentCell");
 	
	data={value:parentType, name:parentCell};
	
	rowcounter=	rowcounter+1;
	$('#queryTable'+'_'+that.panelID).append("<tr id=row_"+rowcounter+'_'+that.panelID+"></tr>")
	that.showProperties(data, rowcounter, cellID);
 
	y++;
		
	//console.log("test"+ propertyIndex[result.value].uri);
	row= $('#row_'+x+'_'+that.panelID);
	if(!row.length){
		//TODO create a new Row
	}
	cell=$('#'+x+'_'+y+'_'+that.panelID);
	if(!cell.length){
		row.append("<td id='"+x+"_"+y+'_'+that.panelID+"' class='table-td'></td>");
		cell=$('#'+x+'_'+y+'_'+that.panelID);
	}else{
	/*	s=y;
		while(cell.length){
			cell.remove();
			s++;
			cell= $('#'+x+'_'+s);
		}*/
		that.removeChildren(cellID);	
		row.append("<td id='"+x+"_"+y+'_'+that.panelID+"' class='table-td'></td>");
		cell= $('#'+x+'_'+y+'_'+that.panelID);
	}
	
	if(children[cellID]==undefined){
		children[cellID]=[];
	}
	children[cellID].push(x+'_'+y+'_'+that.panelID);
	
	
	if(anypath){
		
		
		var types=[];
		types.push({value: 'test', text: '--chooseType--',  test:'yes' })
		for(index=0; index<schema.types.length; index++){
			types.push( {value: schema.types[index].uri, text: schema.types[index].name})
		}
	
	cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style=' float: left; margin-right: 5px; display: inline-block;' class='editable editable-click notfilled'></div><div id='"+x+"_"+y+'_'+that.panelID+"_div_has' style='float: right; margin-right: 5px'>has </div>");
	
	
    $('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
    	unsavedclass:null,
        value: 'test',
        mode: 'inline',
        showbuttons: false,
        url: that.showProperties,
        source: types
    });
	
	}else{
	if(currentProp.techtype=="out_edge"){
		
		if(backwards){
			var referencingType=typeIndex[currentProp.parentType];
			cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style=' float: left; margin-right: 5px; display: inline-block;' class='editable editable-click draggable'>"+ referencingType.name+"</div><div id='"+x+"_"+y+'_'+that.panelID+"_div_has' style='float: right; margin-right: 5px'>has </div>");
			//$("#row_1").append("<td><div id='type_"+counter+"' style='width:150px;'>"+typeIndex[currentProp.uri].name+"</div></td>");
			data={value:referencingType.uri, name:x+"_"+y+'_'+that.panelID};
	
			$('#'+x+'_'+y+'_'+that.panelID+"_div").data("typePath",referencingType.uri);
			
			that.showProperties(data);
		}
		else if(currentProp.associatedURIs!=undefined &&  currentProp.associatedURIs.length==1){ 
		
		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style=' float: left; margin-right: 5px; display: inline-block;' class='editable editable-click draggable'>"+ typeIndex[currentProp.associatedURIs[0]].name+"</div><div id='"+x+"_"+y+'_'+that.panelID+"_div_has' style='float: right; margin-right: 5px'>has </div>");
		//$("#row_1").append("<td><div id='type_"+counter+"' style='width:150px;'>"+typeIndex[currentProp.uri].name+"</div></td>");
		data={value:currentProp.associatedURIs[0], name:x+"_"+y+'_'+that.panelID};
		
		$('#'+x+'_'+y+'_'+that.panelID+"_div").data("typePath",typeIndex[currentProp.associatedURIs[0]].uri);
		that.showProperties(data);
		}
		else if(currentProp.associatedURIs!=undefined && currentProp.associatedURIs.length>1){ //for more than one associated URIs. a list would be good..

			cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div' data-type='select' data-pk='1'  data-title='Select status' style=' float: left; margin-right: 5px; display: inline-block;' class='editable editable-click notfilled'></div><div id='"+x+"_"+y+'_'+that.panelID+"_div_has' style='float: right; margin-right: 5px'>has </div>");
			
			var types=[];
			types.push({value: 'test', text: '--chooseType--',  test:'yes' })
			
			for(key in currentProp.associatedURIs){
				types.push( {value: currentProp.associatedURIs[key], text: typeIndex[currentProp.associatedURIs[key]].name})
			}
		    $('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
		    	unsavedclass:null,
		        value: 'test',
		        mode: 'inline',
		        showbuttons: false,
		        url: that.showProperties,
		        source: types
		    });
		  
		
		
		}
	}
	if(currentProp.techtype=="xsd:string"){
		//showValues({value:currentProp.uri});
		var myValues= propertyIndex[currentProp.uri].values;
		
		if(values != undefined & values.length!=0){
				myValueEntries=[];
				myValueEntries.push({value: 0, text: 'Select Value'});
				for (f in myValues) {
					var entry=myValues[f];
					if(entry.length>100)
						entry=entry.substring(0,100)+"...";
					myValueEntries.push({value: myValues[f], text: entry});
				}
				cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div'  data-type='select' data-pk='1'  data-title='Select status' style='float: left; margin-right: 5px; display: inline-block;' class='notfilled'></div>");
				
				$('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
			    	unsavedclass:null,
			        value: 0,
			        mode: 'inline',
			        showbuttons: false,
			        url: that.showValues,
			        source: myValueEntries
			    });
				
				$('#'+x+'_'+y+'_'+that.panelID+"_div").attr("kind","value");
		}else{
			cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div'   style='float: left; margin-right: 5px; display: inline-block;' class='notfilled'>text</div>");
			$('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
		    	unsavedclass:null,
		    	type: 'text',
		        mode: 'inline',
		        showbuttons: false,
		        url: that.showValues,
		        onblur: 'submit'
		    });
			$('#'+x+'_'+y+'_'+that.panelID+"_div").attr("kind","value");
		}
		
	}
	if(currentProp.techtype=="xsd:integer"){		
		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div'   style='float: left; margin-right: 5px; display: inline-block;' class='notfilled'>0</div>");
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
	    	unsavedclass:null,
	    	type: 'text',
	        mode: 'inline',
	        showbuttons: false,
	        url: that.showValues,
	        onblur: 'submit'
	    });
		$('#'+x+'_'+y+'_'+that.panelID+"_div").attr("kind","value");
	}
	if(currentProp.techtype=="xsd:double"){		
		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div'   style='float: left; margin-right: 5px; display: inline-block;' class='notfilled'>1.0</div>");
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
	    	unsavedclass:null,
	    	type: 'text',
	        mode: 'inline',
	        showbuttons: false,
	        url: that.showValues,
	        onblur: 'submit'
	    });
		$('#'+x+'_'+y+'_'+that.panelID+"_div").attr("kind","value");
	}
	if(currentProp.techtype=="xsd:date"){		
//		cell.append("<div id='"+x+"_"+y+"_div'   style='float: left; margin-right: 5px; display: inline-block;' data-type='date' data-viewformat='dd.mm.yyyy' data-pk='1' data-title='Setup event date and time'>some date..</div>");
		
		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div'   style='float: left; margin-right: 5px; display: inline' data-type='date' data-viewformat='dd.mm.yyyy' data-pk='1' data-placement='right' data-title='When you want vacation to start?' class='notfilled editable editable-click' ></div>");

		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div_3'   style='float: right;' data-type='date' data-viewformat='dd.mm.yyyy' data-pk='1' data-placement='right' data-title='When you want vacation to start?' class='editable editable-click notfilled' ></div>");
		cell.append("<div id='"+x+"_"+y+'_'+that.panelID+"_div_2'   style='float: right;margin-left:5px;margin-right:5px' >to</div>");
		
		
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable({
			 mode: 'inline',
			datepicker: {
	            todayBtn: 'linked'
	        },
		 	url: that.showValues,
		 	onblur: 'submit'
	    });
		$('#'+x+'_'+y+'_'+that.panelID+'_div_3').editable({
			 mode: 'inline',
			datepicker: {
	            todayBtn: 'linked'
	        },
	        url: that.showValues,
	        onblur: 'submit'
	    });
		$('#'+x+'_'+y+'_'+that.panelID+"_div").attr("kind","date");
	
	}
	
	
	}
};



this.showValues = function(result){
	setTimeout(that.redraw, 300);
	$('#'+result.name).removeClass( "notfilled" );
	$('#'+result.name).attr("ready", "yes");
}


this.fillQueryPanel=function (query){
	
	if(query.types.length==undefined)query.types=[query.types];
	
	//$('#queryTable').append("<tr id=row_"+rowcounter+"></tr>")
	var x=0;//rows
	var y=0;//columns
	var current=query.types[0];
	that.addStartingType();
	
	that.fillType(x,y,current.uri,query);
}

this.fillType=function (x, y, uri, query){
	var current=that.getType(uri, query);
	if(current.visited)
		return;
	current.visited=true;
	
	var currentID=x+'_'+y+'_'+that.panelID;
	
	$('#'+x+'_'+y+'_'+that.panelID+'_div').editable('setValue', current.uri.split('#')[0]);
	data={value:current.uri.split('#')[0], name:currentID};
	that.showProperties(data);
	y++;
	
	var propfilters=current.propFilter;
	if(propfilters!=undefined){
		if(propfilters.length==undefined)propfilters=[propfilters];
	
	for(var index in propfilters){
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable('setValue', propfilters[index].prop);
		data={value:propfilters[index].prop, name:x+'_'+y+'_'+that.panelID+"_div"};
		that.showTypes(data);
		var z=y+1;
		$('#'+x+'_'+z+'_'+that.panelID+'_div').editable('setValue', propfilters[index].value);
		that.showValues({"name":x+'_'+z+'_'+that.panelID+'_div'});
		x++;
	}
	}
	
	
	var nextEdges=that.getNextEdges(current, query);
	for(var index in nextEdges){
		if(!nextEdges[index].visited){
			nextEdges[index].visited=true;
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable('setValue', nextEdges[index].uri);
		data={value:nextEdges[index].uri, name:x+'_'+y+'_'+that.panelID+"_div"};
		that.showTypes(data);
		that.fillType(x,y+1, nextEdges[index].buri, query)
		x++;
		}
	}
	var backEdges=that.getBackEdges(current, query);
	for(var index in backEdges){
		if(!backEdges[index].visited){
			backEdges[index].visited=true;
		$('#'+x+'_'+y+'_'+that.panelID+'_div').editable('setValue', "!"+backEdges[index].uri);
		data={value:"!"+backEdges[index].uri, name:x+'_'+y+'_'+that.panelID+"_div"};
		that.showTypes(data);
		that.fillType(x,y+1, backEdges[index].auri, query);
		x++;
		}
	}
	
}
this.getType=function (uri, query){
	for(var key in query.types){
		if(query.types[key].uri==uri){
			return query.types[key]
		}
	}	
}

this.getNextEdges =function (type, query){
	var result=[];
	if(query.edges==undefined) query.edges=[];
	if(query.edges.length==undefined) query.edges=[query.edges];
	for(var key in query.edges){
		if(query.edges[key].auri==type.uri){
			result.push(query.edges[key])
		}
	}
	return result;
	
}

this.getBackEdges=function (type, query){
	var result=[];
	for(key in query.edges){
		if(query.edges[key].buri==type.uri){
			result.push(query.edges[key])
		}
	}
	return result;
	
}


//####################################################draggable#########

this.makeElementsDraggable = function () {
//	$(".draggable").draggable({cancel:false,//required to make a button draggable
//		delay : 10,
//		/* revert: true, */
//	        helper: "clone",
//	        start: function(event, ui) {  
//	        	$(ui.helper).addClass("ui-draggable-helper"); 
//	        	ui.helper[0].style.color="white"
//	        	ui.helper[0].style.border="1px dotted #000";
//	        	ui.helper[0].style.backgroundColor="#00669c";
//	        }
//	});
	
	if(that.makedraggable!= undefined)
		that.makedraggable();
	
}

this.makeElementDropZones= function (xCreated, yCreated){

	$( "#kpi" ).droppable( {
      drop: that.handleDrop,
      accept: ".draggable",
      activeClass: "textarea", 
  } );
	}
	
	
var bindingList=[];
	
this.handleDrop = function handleDrop(event, ui ){

var draggable = ui.draggable;
	
	console.log(event.target.id);
	console.log(draggable[0].id);
	

	var element=$("#"+draggable[0].id);
	var alias="$"+element.text();
	
	alias=alias.replace('.','');
	  if(element.attr("kind")=="type"){
	//	  alert("type:"+element.attr("uri"))
		  var binding={}
			binding.typeURI=element.attr("uri");
		 	 binding.id=element.attr("uniqueid");
		  	binding.alias=alias;
			bindingList.push(binding);
		  
	  } if(element.attr("kind")=="property"){
		//  alert("prop:"+element.attr("parent") + "->" +element.attr("uri"))
		  var binding={}
			binding.typeURI=element.attr("parent");
		  	binding.id=$("#"+element.attr("parent")+"_div").attr("uniqueid");
		  	binding.propURI=element.attr("uri");
		  	binding.alias=alias;
			bindingList.push(binding);
	  }
	$("#kpi").val($("#kpi").val()+alias);
	
	
	
	
	}
}
