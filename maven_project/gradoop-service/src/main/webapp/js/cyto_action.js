var storedLabels = {"nodes": {}, "edges":{}};
/**
 * The cytoscape graph object
 */
var cy;

function buildCytoscape() {
    return cytoscape({
        container: document.getElementById('canvas'),
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                // define label content and font
                'content': function (node) {
                    var key = getStoredLabel("nodes", node._private.data.label);
                    var labelString = getLabel(node, key, useDefaultLabel);

                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#scale-vertices').is(':checked')) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 1000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'text-valign': 'center',
                'color': 'black',
                // set background color according to color map
                'background-color': function (node) {

                    var label = getLabel(node, vertexLabelKey, useDefaultLabel);
                    return getColor("nodes", label, "label");
                },

                /* size of vertices can be determined by property count
                 count specifies that the vertex stands for
                 1 or more other vertices */
                'width': function (node) {
                    if ($('#scale-vertices').is(':checked')) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            //console.log(node.name+": "+count);
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 100000 / Math.PI) + 'px';
                        }
                    }
                    return getVertexSize();
                },
                'height': function(node) {
                    if ($('#scale-vertices').is(':checked')) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 100000 / Math.PI) + 'px';
                        }
                    }
                    return getVertexSize();
                },
                'text-wrap': 'wrap'
            })
            .selector('edge')
            .css({
                'curve-style': 'bezier',
                // layout of edge and edge label
                'content': function (edge) {
                    var key = getStoredLabel("edges", edge._private.data.label);
                    var labelString = getLabel(edge, key, useDefaultLabel);
                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#scale-edges').is(':checked')) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 1000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'line-color': function (edge) {
                    var label = getLabel(edge, edgeLabelKey, useDefaultLabel);
                    return getColor("edges", label, "label");
                },
                // width of edges can be determined by property count
                // count specifies that the edge represents 1 or more other edges
                'width': function (edge) {
                    if ($('#scale-edges').is(':checked')) {
                        var count = edge.data('properties')['count'];
                        if (count != null) {
                            count = count / maxEdgeCount;
                            return Math.sqrt(count * 100);
                        }
                    }
                    return 2;
                },
                'opacity':getEdgeOpacity(),
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#000'
            })
            // properties of edges and vertices in special states, e.g. invisible or faded
            .selector('.faded')
            .css({
                'opacity': 0.25,
                'text-opacity': 0
            })
            .selector('.invisible')
            .css({
                'opacity': 0,
                'text-opacity': 0
            }),
        ready: function () {
            window.cy = this;
            cy.elements().unselectify();
            /* if a vertex is selected, fade all edges and vertices
             that are not in direct neighborhood of the vertex */
            cy.on('tap', 'node', function (e) {
                var node = e.cyTarget;
                var neighborhood = node.neighborhood().add(node);

                //remove existing tooltip  - if existing
                $("#nodetip").remove();
                //construct tip-text
                var qtipText = '';
                for (var key in node._private.data) {
                    if (key != 'properties' && key != 'pie_parameters') {
                        qtipText += key + ' : ' + this.data(key) + '<br>';

                    }
                }
                var properties = node._private.data.properties;
                for (var property in properties) {
                    if (properties.hasOwnProperty(property)) {
                        qtipText += property + ' : ' + properties[property] + '<br>';
                    }
                }

                var div = $('<div id="nodetip" class="tooltip-wrapper">')
                    .css({
                        "left": e.originalEvent.clientX + 'px',
                        "top": e.originalEvent.clientY + 'px'
                    })
                    .append(qtipText)
                    .appendTo(document.body);

                cy.elements().addClass('faded');
                neighborhood.removeClass('faded');
            });

            cy.on('tap', 'edge', function (e) {
                var edge = e.cyTarget;
                //remove existing tooltip  - if existing
                $("#nodetip").remove();
                //construct tip-text
                var qtipText = '';
                for (var key in edge._private.data) {
                    if (key != 'properties' && key != 'pie_parameters') {
                        qtipText += key + ' : ' + this.data(key) + '<br>';

                    }
                }
                var properties = edge._private.data.properties;
                for (var property in properties) {
                    if (properties.hasOwnProperty(property)) {
                        qtipText += property + ' : ' + properties[property] + '<br>';
                    }
                }

                var div = $('<div id="nodetip" class="tooltip-wrapper">')
                    .css({
                        "left": e.originalEvent.clientX + 'px',
                        "top": e.originalEvent.clientY + 'px'
                    })
                    .append(qtipText)
                    .appendTo(document.body);

            });

            // remove fading by clicking somewhere else
            cy.on('tapstart zoom', function (e) {
                if (e.cyTarget === cy) {
                    cy.elements().removeClass('faded');
                    $("#nodetip").remove();
                }

            });
        }
    });
}

function setEleCounts(){
    //cy = buildCytoscape();
    // set containing all distinct labels (property key specified by vertexLabelKey)
    //var labels = new Set();
    // compute maximum count of all vertices, used for scaling the vertex sizes
    maxVertexCount = 0;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var vertexCount = Number(node['data']['properties']['count']);
        if ((vertexCount != null) && (vertexCount > maxVertexCount)) {
            maxVertexCount = vertexCount;
        }
        /*if (!useDefaultLabel && vertexLabelKey != 'label') {
            labels.add(node['data']['properties'][vertexLabelKey]);
        } else {
            labels.add(node['data']['label']);
        }*/
    }
    // compute maximum count of all edges, used for scaling the edge sizes
    maxEdgeCount = 0;
    for (var j = 0; j < edges.length; j++) {
        var edge = edges[j];
        var edgeCount = Number(edge['data']['properties']['count']);
        if ((edgeCount != null) && (edgeCount > maxEdgeCount)) {
            maxEdgeCount = edgeCount;
        }
    }
    /*
    // hide the loading gif
    $('#loading').hide();
    // update vertex and edge count
    var rows = '';
    rows += '<tr><td>Vertex Count</td><td>:</td><td>'
        + nodes.length + '</td></tr>';
    rows += '<tr><td>Edge Count</td><td>:</td><td>'
        + edges.length + '</td></tr>';
    $('#stats').html(rows);
*/
}

function cyto_action() {
    setEleCounts();
    cy = buildCytoscape();
    cy.elements().remove();
    cy.add(nodes);
    cy.add(edges);
    cy.layout(chooseLayout());
    changed = false;
}

/**
 * return belonging cy elements
 * @param type element type (nodes or edges)
 * @returns {*}
 */
function getCyElements(type) {
    var cyEle;
    if (type === "nodes") {
        cyEle = cy.nodes();
    }
    else if (type === "edges") {
        cyEle = cy.edges();
    }
    return cyEle;
}


function scaleCytoElements(type,mCount, prop, dif){
    var cyelements = getCyElements(type);
    cyelements.forEach(function (ele) {
        var count = prop === 'label' ? ele.data('label') : ele.data('properties')[prop];
        if (count != null) {
            count = (count - mCount.min) / dif + 0.1;
            var vsize = calculateWidth(type, count);
            //var fsize = Math.max(2, Math.sqrt(count * 1000 / Math.PI));
            ele.style("width", vsize);
            if (type === "nodes") {
                ele.style("height", vsize);
            }
            //ele.style("font-size", fsize);
        }
        else {
            var esize = getElementSize(type);
            ele.style("width", esize);
            if (type === "nodes") {
                ele.style("height", esize);
            }
            //ele.style("font-size", '10px');
        }
    })
}

/**
 * change color of specific cytoscape elements
 * @param type element type
 * @param value current property or label value
 * @param hexColor new color
 * @param selected property or label
 */
function changeCytoElements(type, value, hexColor, selected){
    var cyElements = getCyElements(type)
    if (selected === 'label') {
        var eles = cyElements.filter("[" + selected + "='" + value + "']");
        type == "nodes" ? eles.css({'background-color': hexColor}) : eles.css({'line-color': hexColor});
    }
    else {
        var eles = cyElements.filter(function (num, ele) {
            return ele.data('properties')[selected] == value;
        });
        type == "nodes" ? eles.css({'background-color': hexColor}) : eles.css({'line-color': hexColor});
    }
}
/**
 * Get the label of the given element, either the default label ('label') or the value of the
 * given property key
 * @param element the element whose label is needed
 * @param key key of the non-default label
 * @param useDefaultLabel boolean specifying if the default label shall be used
 * @returns {string} the label of the element
 */
function getLabel(element, key, useDefaultLabel) {
    if (key ==="none"){
        return '';
    }
    var label = '';
    if (key === 'undefined' || key === 'label') {
        label += element.data('label');
    } else {
        label += element.data('properties')[key];
    }
    return label;
}

function chooseLayout() {
// options for the force layout
    var cose = {
        name: 'cose',

        // called on `layoutready`
        ready: function () {
        },

        // called on `layoutstop`
        stop: function () {
        },

        // whether to animate while running the layout
        animate: true,

        // number of iterations between consecutive screen positions update (0 ->
        // only updated on the end)
        refresh: 4,

        // whether to fit the network view after when done
        fit: true,

        // padding on fit
        padding: 30,

        // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        boundingBox: undefined,

        // whether to randomize node positions on the beginning
        randomize: true,

        // whether to use the JS console to print debug messages
        debug: false,

        // node repulsion (non overlapping) multiplier
        nodeRepulsion: 8000000,

        // node repulsion (overlapping) multiplier
        nodeOverlap: 10,

        // ideal edge (non nested) length
        idealEdgeLength: 1,

        // divisor to compute edge forces
        edgeElasticity: 100,

        // nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 5,

        // gravity force (constant)
        gravity: 250,

        // maximum number of iterations to perform
        numIter: 100,

        // initial temperature (maximum node displacement)
        initialTemp: 200,

        // cooling factor (how the temperature is reduced between consecutive iterations
        coolingFactor: 0.95,

        // lower temperature threshold (below this point the layout will end)
        minTemp: 1.0
    };

    var random = {
        name: 'random',
        fit: false, // whether to fit to viewport
        padding: 30, // fit padding
        boundingBox: {x1: 0, y1: 0, w: 5000, h: 5000}, // constrain layout bounds; { x1, y1, x2, y2 }
        // or { x1, y1, w, h }
        animate: false, // whether to transition the node positions
        animationDuration: 0, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled
        ready: undefined, // callback on layoutready
        stop: undefined // callback on layoutstop
    };

    var radialRandom = {
        name: 'preset',
        positions: function (node) {

            var r = Math.random() * 1000001;
            var theta = Math.random() * 2 * (Math.PI);
            return {
                x: Math.sqrt(r) * Math.sin(theta),
                y: Math.sqrt(r) * Math.cos(theta)
            };
        },
        zoom: undefined,
        pan: undefined,
        fit: true,
        padding: 30,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        ready: undefined,
        stop: undefined
    };

    // if (useForceLayout) {
    return cose;
    // } else {
    //     return radialRandom;
    // }
}
