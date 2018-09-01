var nodes, edges;
///**
// * function called when the server returns the data
// * @param data graph data
// */
function drawGraph(data, name) {
    $.get('rest/databases/').done(function(rdata){
        initializeDatabaseMenu(rdata, name);
    });
    //console.log("Drawing graph.");
    // If the table view is active when a new graph is loaded,
    // make sure to redraw it when switching back to graph view.
    // Drawing it now may result in the graph not being drawn correctly.
    $.forceRedrawNextTime = viewAsTable;

    // Disable the switch button until the data is ready
    $("#switch-view-btn").prop("disabled", true);
    
	// copy of graph drawn to use during workflow toggle redraw
	$.paintedGraph = {};
	$.paintedGraph.data = data;
	$.paintedGraph.name = name;
	$("#nodetip").remove();
    // buffer the data to speed up redrawing
    bufferedData = data;
    nodes = data.nodes;
    edges = data.edges;

    if (data.nodes.length > 1000){
        viewVivaGraph = true;
        $('#switch-draw').attr('disabled','disabled');
    }
    else{
        $('#switch-draw').removeAttr('disabled');
    }

    getColorsAndDrawNodes();
    //$("#databases").val($.paintedGraph.name);

}



function getProperties(elements) {
    var propertySet = new Set();
    elements.forEach(function (ele) {
        Object.keys(ele['data']['properties']).forEach(function (key) {
            propertySet.add(key.toString());
        })
    })
    return propertySet;
}


function getColorsAndDrawNodes() {
    var graphname = $.paintedGraph.name;
    var colorstring = sessionStorage.getItem(graphname);
    if (colorstring) {
        colors = JSON.parse(colorstring);
        updateElements();
        if (!viewVivaGraph) {
            //cytoscape
            cyto_action();
        }
        else{
            viva_action($.paintedGraph.data);
        }
        showLabels();

        $("#switch-view-btn").prop("disabled", false);
        if (viewAsTable) {
            fillTable();
        }
    }
    else {
        $.ajax({
            url: "rest/graph/",
            data: {
                graph: graphname,
                json: 'colormap'
            },
            cache: false,
            type: 'GET',
            //async:false,
            success: function (data) {
                //console.log(data);
                var labels = getPropertyValues($.paintedGraph.data.nodes, "label")
                if (data ==="null"){
                    console.log("Info: color file do not exist, colors are drawn from color palette");
                    colors = {"nodes": {"properties": {}}, "edges": {"properties": {}, "label":{}}};
                    colors["nodes"]["label"] = getColorPalette(labels);
                }
                else{
                    colors = JSON.parse(data);
                }
                if (graphname !== "DEFAULT_HANDLER_GRAPH" && graphname !== "DEFAULT_BUILDER_GRAPH") {
                    sessionStorage.setItem(graphname, JSON.stringify(colors));
                }
                updateElements();
                if (!viewVivaGraph) {
                    cyto_action();
                }
                else{
                    viva_action($.paintedGraph.data);
                }
                showLabels();
                $("#switch-view-btn").prop("disabled", false);
                if (viewAsTable) {
                    fillTable();
                }
            },
            error: function (error) {
                console.log(error);
            }
        });
    }
    //updateDrawing();
}

function getStoredLabel(type, label){
    var value = storedLabels[type][label];
    if (value === undefined) {
        return type === "nodes" ? "label" : "none";
    }
    else {
        return value;
    }
}

/**
 * store selected labels or properties of select menues
 * @param type nodes or edges
 * @param label label or property
 * @param value label or property value
 */
function storeLabel(type, label, value){
    storedLabels[type][label] = value;
}



/**
 * Generate a random color for each label
 * @param labels array of labels
 */


function getColorPalette(labels) {
    var colorMap = {};
    var cpalette = labels.size < 65 ? palette('mpn65', labels.size) : palette('mpn65', 65);
    var cnt = 0;
    labels.forEach(function (label) {
        if (cnt <65) {
            var col = hexToRgb(cpalette[cnt]);
            colorMap[label] =  [col.r, col.g, col.b];
            cnt++;
        }
        else {
            var r = 0;
            var g = 0;
            var b = 0;
            while (r + g + b < 382) {
                r = Math.floor((Math.random() * 255));
                g = Math.floor((Math.random() * 255));
                b = Math.floor((Math.random() * 255));
            }
            colorMap[label] =  [r, g, b];
        }
    });
    return colorMap;
}

/**
 * Add a custom Qtip to the vertices and edges of the graph.
 */
function addQtip() {
    cy.elements().qtip({
        content: function () {
            var qtipText = '';
            for (var key in this.data()) {
                if (key != 'properties' && key != 'pie_parameters') {
                    qtipText += key + ' : ' + this.data(key) + '<br>';

                }
            }
            var properties = this.data('properties');
            for (var property in properties) {
                if (properties.hasOwnProperty(property)) {
                    qtipText += property + ' : ' + properties[property] + '<br>';
                }
            }
            return qtipText;
        },
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'MyQtip'
        }
    });
}



/**
 * Fill table with graph data.
 */
function fillTable() {
    let data = $.paintedGraph.data;
    if (typeof ($.tableData) !== 'undefined' && $.tableData === $.paintedGraph) {
        console.log("Table is up-to-date. Ignoring.");
        return;
    }
    let col = function (content) {
        return $('<td>' + content + '</td>');
    };
    let convertAttr = function(properties) {
        return Object.keys(properties).sort().map(function(key) {
            return key + ": " + properties[key];
        }).join('<br>');
    };
    let colorDot = function (color) {
        return $('<span class="colored-dot pull-right" style="background: ' + color + ';"></span>');
    };
    let tableNodes = $('#graph-nodes-table-body');
    tableNodes.empty();
    data.nodes.sort(comparatorBy($.currentTableOrder.nodes.by,$.currentTableOrder.nodes.descending)).forEach(function (n) {
        let newRow = $('<tr></tr>');
        newRow.append(col(n.data.id));
        newRow.append(col(n.data.label).append(colorDot(getColor("nodes",n.data.label, "label"))));
        newRow.append(col(convertAttr(n.data.properties)));
        //Workaround: Store label as additional data-attribute.
        newRow.attr('data-label', n.data.label);
        tableNodes.append(newRow);
    });
    let tableEdges = $('#graph-edges-table-body');
    tableEdges.empty();
    data.edges.sort(comparatorBy($.currentTableOrder.edges.by,$.currentTableOrder.edges.descending)).forEach(function (e) {
        let newRow = $('<tr></tr>');
        newRow.append(col(e.data.id));
        newRow.append(col(e.data.label).append(colorDot(getColor("edges", e.data.label, "label"))));
        newRow.append(col(e.data.source));
        newRow.append(col(e.data.target));
        newRow.append(col(convertAttr(e.data.properties)));
        //Workaround: Store label as additional data-attribute.
        newRow.attr('data-label', e.data.label);
        tableEdges.append(newRow);
    });
    $('#switch-view-btn').removeClass("disabled");
    $.tableData = data;
}

/**
 * Update table colors of nodes and edges with a certain label to a certain color.
 *
 * @param label The label to select nodes and edges by.
 * @param color The new color.
 */
function updateTableColorsByLabel(label, color) {
    $("#graph-view-table").find("tr[data-label='" + label + "'] span.colored-dot").css("background", color);
}

///**
// * Check if the selected property keys, filters and aggregation functions have changed. If not, redraw the graph.
// * This is implemented to ensure that no accidental redraws happen.
// */
//function redrawIfNotChanged() {
//    if (!changed) {
//        useDefaultLabel = false;
//        useForceLayout = true;
//        drawGraph(bufferedData);
//    }
//}

/**
 * Get suitable function for comparing table rows.
 *
 * @param fieldName Name of the field to compare.
 * @param descending Use descending order.
 * @returns {Function} A function used by Array.sort
 */
function comparatorBy(fieldName, descending) {
    let typeExtractor;
    switch (fieldName) {
        case "id": case "source": case "target":
            typeExtractor = function (input) {
                return parseInt(input, 16);
            };
            break;
        default:
            typeExtractor = function (input) {
                return input;
            };
            break;
    }
    return function (left, right) {
        let valLeft = typeExtractor(left.data[fieldName]);
        let valRight = typeExtractor(right.data[fieldName]);
        if (valLeft > valRight) {
            return descending ? -1 : 1;
        } else if (valLeft < valRight) {
            return descending ? 1 : -1;
        } else {
            return 0;
        }
    }
}

/**
 * Order the table by a certain field.
 * @param field The span of the button clicked.
 */
function reorderTableBy(field) {
    let fieldName = field.attr("data-field");
    let type = field.attr("data-types");
    if ($.currentTableOrder[type].by === fieldName) {
        $.currentTableOrder[type].descending = !$.currentTableOrder[type].descending;
    } else {
        $.currentTableOrder[type].by = fieldName;
        $.currentTableOrder[type].descending = false;
    }
    // Update symbols in table header.
    $("span.order-selection").each(function (index, element) {
        let col = $(element);
        col.removeClass("glyphicon-sort glyphicon-sort-by-order glyphicon-sort-by-order-alt");
        if (col.attr("data-types") === type) {
            if (col.attr("data-field") === fieldName) {
                col.addClass($.currentTableOrder[type].descending ?
                    "glyphicon-sort-by-order-alt" : "glyphicon-sort-by-order");
            } else {
                col.addClass("glyphicon-sort");
            }
        } else {
            let colType = col.attr("data-types");
            if ($.currentTableOrder[colType].by === col.attr("data-field")) {
                col.addClass($.currentTableOrder[colType].descending ?
                    "glyphicon-sort-by-order-alt" : "glyphicon-sort-by-order");
            } else {
                col.addClass("glyphicon-sort");
            }
        }
    });
    // Force reload table.
    $.tableData = {};
    fillTable();
}