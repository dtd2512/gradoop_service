var vertexLabelKey;
var edgeLabelKey;



/**
 * True, if the graph layout should be force based
 * @type {boolean}
 */
var useForceLayout = true;

/**
 * True, if the default label should be used
 * @type {boolean}
 */
var useDefaultLabel = true;

/**
 * Contains the list of databases in regard to the last rest query
 * @type {Array}
 */
var currentDatabases = [];

/**
 * Show a table instead of the graph.
 * @type {boolean}
 */
var viewAsTable = false;

/**
 * use vivagraph to draw graph instead of cytoscape
 * @type {boolean}
 */
var viewVivaGraph = false;

/**
 * Runs when the DOM is ready
 */
$(document).ready(function () {
    $('#graph-view-table').hide();


        // Prepare sorting functionality for table.
    $("span.order-selection").on("click", function (event) {
        reorderTableBy($(event.target));
    });
    $.currentTableOrder = {
        nodes: {
            by: "id",
            descending: false
        },
        edges: {
            by: "id",
            descending: false
        }
    };

    // get the available graphs
    // if the request is a success, add them to the database propertyKeys menu
    $.get('rest/databases/')
        .done(initializeDatabaseMenu)
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });

    $("#databases").change(function(){
        $("#operations").change();
        loadgraph();
    });

    $("#vertex_size").bootstrapSlider();
    $("#edge_opacity").bootstrapSlider();
    $("#label_size").bootstrapSlider();

    //Build a first instance of the cytoscape graph object
    //cy = buildCytoscape();
    
    //showOperatorConfig("pattern");


    $("#confirmupload").click(function(e){
       if ($("#uploadIdentifier").val().length==0){
           error: { alert("output graph name is missing");};
        }
        else{
          val = $("#uploadIdentifier").val();

          if($('#databases option[value="' + val + '"]').length !== 0){
              alert("Folder exists. Please choose another name.")
          }
          else {

              graphsfiles = $("#uploadformgraphs input")[0].files;
              for (i = 0; i < graphsfiles.length; i++) {
                  uploadqueue.push({file: graphsfiles[i], type: "graphs"})
              }
              ;
              verticesfiles = $("#uploadformvertices input")[0].files;
              for (i = 0; i < verticesfiles.length; i++) {
                  uploadqueue.push({file: verticesfiles[i], type: "vertices"})
              }
              ;
              edgesfiles = $("#uploadformedges input")[0].files;
              for (i = 0; i < edgesfiles.length; i++) {
                  uploadqueue.push({file: edgesfiles[i], type: "edges"})
              }
              ;


              if (graphsfiles.length > 0 && verticesfiles.length > 0 && edgesfiles.length > 0) {
                  queuedUpload($("#uploadIdentifier").val(), uploadqueue);
                  $('#upload').modal('hide');
                  $.get('rest/databases/').done(initializeDatabaseMenu);
              }
              else {
                  error: {
                      alert("not enough input arguments");
                  }
              }
          }
       }

    });

});

function updateElements(){
    $("#label_size").bootstrapSlider('setValue', "10");
    if (!viewVivaGraph){
        if (colors.nodes.size!==undefined && colors.nodes.size.cyto !== undefined){
            //$('#vertex_size').val(colors.nodes.size.cyto)
            $("#vertex_size").bootstrapSlider('setValue', colors.nodes.size.cyto);
        }
        else {
            //$('#vertex_size').val("60");
            $("#vertex_size").bootstrapSlider('setValue', "60");
        }

    }
    else{
        if (colors.nodes.size!==undefined && colors.nodes.size.viva !== undefined){
            //$('#vertex_size').val(colors.nodes.size.viva)
            $("#vertex_size").bootstrapSlider('setValue', colors.nodes.size.viva);
        }
        else {
           // $('#vertex_size').val("20");
            $("#vertex_size").bootstrapSlider('setValue', "20");
        }
    }
}

function switchDrawing(){
    if (viewVivaGraph){
        viewVivaGraph = false;
        $('#switch-draw').html("VivaGraph");
        cy = buildCytoscape();

    }
    else {
        viewVivaGraph = true;
        $('#switch-draw').html("Cytoscape");
        $('#edge-color-selecter').empty();

    }
    if ($.paintedGraph) {
        //updateElements();
        drawGraph($.paintedGraph.data, $.paintedGraph.name);
    }
}

function loadgraph() {
	Workflow.clearCellFormat();
	
    // show the loading spinner
    //$('#loading').show();
    var databaseName = getSelectedDatabase();
    $.get('rest/graph/' + databaseName+";sampling="+getSelectedSampling()+";threshold="+getThreshold())
        .done(function (data) {
            useDefaultLabel = true;
            useForceLayout = false;
            drawGraph(data, getSelectedDatabase());
            changed = true;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
}

//
///**
// * Function for initializing the database propertyKeys menu. Adds on-click listener to the elements.
// * @param databases list of all available databases
// */
function initializeDatabaseMenu(databases, select) {
    databases.sort();
    var databaseSelect = $('#databases');

    databaseSelect.empty();

	for (var i = 0; i < databases.length; i++) {
		databaseSelect.append(`<option value="${databases[i]}">${databases[i]}</option>`);
	}    
    databaseSelect.selectpicker('refresh');
    
    databaseSelect.val(select);
    databaseSelect.selectpicker('refresh');

    currentDatabases = databases;

    // on click, the dropdown menus open, this has to be done here so it is done only once
    $('.dropDown').find('dt a').on('click', function () {
        $(this).closest('.dropDown').find('ul').slideToggle('fast');
    });

    // hide dropdown menus when something else is clicked
    $(document).bind('click', function (e) {
        var $clicked = $(e.target);
        if (!$clicked.parents('#vertexPropertyKeys').length)
            $('#vertexPropertyKeys').find('dd ul').hide();
        if (!$clicked.parents('#edgePropertyKeys').length)
            $('#edgePropertyKeys').find('dd ul').hide();
        if (!$clicked.parents('#vertexFilters').length)
            $('#vertexFilters').find('dd ul').hide();
        if (!$clicked.parents('#edgeFilters').length)
            $('#edgeFilters').find('dd ul').hide();
        if (!$clicked.parents('#vertexAggrFuncs').length)
            $('#vertexAggrFuncs').find('dd ul').hide();
        if (!$clicked.parents('#edgeAggrFuncs').length)
            $('#edgeAggrFuncs').find('dd ul').hide();
    });

    // update node size immediatly
    $('#vertex_size').on('slide', function() {
        updateNodeSize();
    });
    /*$('#vertex_size').bind('input', function() {
        updateNodeSize();
    });*/
    // update edge opacity immediatly
    $('#edge_opacity').on('slide',function () {
        updateEdgeOpacity();
    })
    /*$('#edge_opacity').bind('input', function() {
        updateEdgeOpacity();
    });*/

    $('#label_size').on('slide', function() {
        updateFontSize();
    });
}


/**
 * get the selected database
 * @returns {string} database name
 */
function getSelectedDatabase() {
    return $('#databases').find(':selected').text();
}

function getSelectedSampling() {
    return $('#samplings').find(':selected').text();
}

function getThreshold() {
    return $('#sampling_threshold').val();
}

function getVertexSize() {
    return $('#vertex_size').val();
}

function getFontSize() {
    return $('#label_size').val();
}


function getElementSize(type){
    if (type === "nodes"){
        return getVertexSize()
    }
    else{
        return '2px';
    }
}


function getEdgeOpacity() {
    return $('#edge_opacity').val();
}

function calculateWidth(type, count){
    if (type === "nodes"){
        return Math.max(2, Math.sqrt(count * 100000 / Math.PI));;
    }
    else if(type === "edges"){
        return Math.sqrt(count * 100);
    }
}

function updateFontSize(){
    if (!viewVivaGraph) {
        cy.nodes().forEach(function (n) {
            n.style("font-size", getFontSize());
        });
    }
    else{
        $(".viva-node-label").css({"font-size" : getFontSize()});
        renderer.rerender();
    }
}

function updateNodeSize(){
    if($.paintedGraph) {
        if (viewVivaGraph) {
            var eleUI;
            $.paintedGraph.data.nodes.forEach(function (ele) {
                eleUI = graphics.getNodeUI(ele.data.id);
                eleUI.size = getVertexSize();
            })
            renderer.rerender();
        }
        else {
            cy.nodes().forEach(function (n) {
                n.style("width", getVertexSize());
                n.style("height", getVertexSize());
                //n.style("font-size", '10px');
            });
        }
        if (colors.nodes["size"] === undefined){
            colors.nodes["size"] = {}
        }
        viewVivaGraph===true? colors.nodes["size"]["viva"] = getVertexSize() : colors.nodes["size"]["cyto"] = getVertexSize();
    }
}

function updateEdgeOpacity() {
    if ($.paintedGraph) {
        if (!viewVivaGraph) {
            cy.edges().forEach(function (e) {
                e.style("opacity", getEdgeOpacity());
                e.style("width", '2px');
                e.style("font-size", '10px');
            });
        }
    }
}

function updateDrawing() {
        updateNodeSize();
        updateEdgeOpacity();
}

function queuedUpload(database, files){
  if(files.length < 1) return;
  formData = new FormData();
  entry = files.shift();
  formData.append("file",entry.file);
  $.ajax({
      url: "rest/upload/"+database+"/"+entry.type,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success: function(data){ console.log(data); queuedUpload(database, files); },
      error: function(){ alert("Upload failed"); },
  });
}

var uploadqueue=[];

/**
 * Switch between graph and table view.
 */
function switchGraphView() {
    // Workaround: Redraw the graph when the table view was active when the graph was first loaded.
    let forceSwitch = $.forceRedrawNextTime || false;
    console.log("Switching view to " + (viewAsTable ? "graph" : "table"));
    if ($('#switch-view-btn').prop("disabled") && !forceSwitch) {
        return;
    }
    if (viewAsTable) {
        $("#nodetip").show();
        $('#graph-view-table').hide();
        //$('#graph-view-canvas').show();
        $('#canvas').show();
        $('#switch-view-btn').html("View as table");
        $('#switch-draw').prop("disabled",false);
        viewAsTable = false;
        if (forceSwitch) {
            console.log("Forcing redraw.");
            setTimeout(function(){if($.paintedGraph) drawGraph($.paintedGraph.data, $.paintedGraph.name);}, 200);
        }
    } else {
        fillTable();
        $("#nodetip").hide();
        //$('#graph-view-canvas').hide();
        $('#canvas').hide();
        $('#graph-view-table').show();
        $('#switch-view-btn').html("View as graph");
        $('#switch-draw').prop("disabled",true);
        viewAsTable = true;

    }
}

//
///**
// * Hide all vertices and edges, that have a NULL property.
// */
//function hideNullGroups() {
//    var vertexKeys = getSelectedVertexKeys();
//    var edgeKeys = getSelectedEdgeKeys();
//
//    var nodes = cy.nodes();
//    var edges = cy.edges();
//
//
//    for (var i = 0; i < nodes.length; i++) {
//        var node = nodes[i];
//        for (var j = 0; j < vertexKeys.length; j++) {
//            if (node.data().properties[vertexKeys[j]] == 'NULL') {
//                node.remove();
//                break;
//            }
//        }
//    }
//
//    for (var k = 0; k < edges.length; k++) {
//        var edge = edges[k];
//        for (var l = 0; l < edgeKeys.length; l++) {
//            if (edge.data().properties[edgeKeys[l]] == 'NULL') {
//                edge.remove();
//                break;
//            }
//        }
//    }
//}
//
///**
// * Function to hide all disconnected vertices (vertices without edges).
// */
//function hideDisconnected() {
//    var nodes = cy.nodes();
//
//    for (var i = 0; i < nodes.length; i++) {
//
//        var node = nodes[i];
//        if (cy.edges('[source="' + node.id() + '"]').length == 0) {
//            if (cy.edges('[target="' + node.id() + '"]').length == 0 ) {
//                node.remove();
//            }
//        }
//    }
//}
//
///**
// * Function that is called when the NONE filter is selected
// */
//function NONEFilterSelected() {
//
//    var edgeFilters = $('#edgeFilters');
//    var edgePropertyKeys = $('#edgePropertyKeys');
//    var edgeAggrFuncs = $('#edgeAggrFuncs');
//    var multiSel = edgeFilters.find('dt a .multiSel');
//
//    // check if the NONE filters check box is checked
//    if ($(this).is(':checked')) {
//        // disable all other edge filters
//        edgeFilters.find('.checkbox[value!="NONE"]')
//            .attr('disabled', true)
//            .attr('checked', false);
//
//        // disable all edge property keys and edge aggregation functions
//        edgePropertyKeys.find('.checkbox')
//            .attr('disabled', true);
//
//        edgeAggrFuncs.find('.checkbox')
//            .attr('disabled', true);
//
//        // remove all currently selected edge filters, hide instructions and show NONE filter insted
//        multiSel.find('span:not(.instruction)').remove();
//        edgeFilters.find('.instruction').hide();
//        multiSel.append('<span title="NONE">NONE</span>');
//
//    } else {
//        // enable all edge filters, edge property keys and edge aggregation functions
//        edgeFilters.find('.checkbox')
//            .attr('disabled', false);
//
//        edgePropertyKeys.find('.checkbox')
//            .attr('disabled', false);
//
//        edgeAggrFuncs.find('.checkbox')
//            .attr('disabled', false);
//
//        // hide the NONE filter span and show the instructions
//        multiSel.find('span[title="NONE"]').remove();
//        edgeFilters.find('.instruction').show();
//    }
//}
//
///**
// * hide all edges, at the moment this is never called
// */
//function hideEdges() {
//    cy.edges().remove();
//    }