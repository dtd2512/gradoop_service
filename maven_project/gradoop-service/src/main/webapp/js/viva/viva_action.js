var renderer, layout, prev_node_id = undefined, prev_node_color, prev_node_size;
var maxVertexCount, currentGraph, graphics;

function viva_action(data) {
    if (cy) {
        cy.destroy();
    }
    useDefaultLabel = true;
    useForceLayout = true;
    $("#infos").empty();

    var nodeSize = getVertexSize();
    var graph = Viva.Graph.graph();

    maxVertexCount = 0;

    data.nodes.forEach(function (t) {
        graph.addNode(t.data.id, t);
    });
    data.edges.forEach(function (t) {
        graph.addLink(t.data.source, t.data.target);
    });
    graphics = Viva.Graph.View.webglGraphics();
// first, tell webgl graphics we want to use custom shader
// to render nodes:
    var circleNode = buildCircleNodeShader();
    graphics.setNodeProgram(circleNode);

// second, change the node ui model, which can be understood
// by the custom shader:
    graphics.node(function (node) {
        var nodeColor = getColor("nodes",node.data.data.label, "label").replace('#', '0x');
        return new WebglCircle(nodeSize, nodeColor);
    });
    $('#canvas').empty();
    $('#canvas').style = "overflow: hidden";
    $('#canvas').css({position:"relative"});

    layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength: 80,
        springCoeff: 0.0002,
    });
    renderer = Viva.Graph.View.renderer(graph, {
        container: document.getElementById('canvas'),
        graphics: graphics,
        layout : layout
    });


    var domLabels = generateDOMLabels(graph);
    graphics.placeNode(function(ui, pos) {
        // This callback is called by the renderer before it updates
        // node coordinate. We can use it to update corresponding DOM
        // label position;
        // we create a copy of layout position
        var domPos = {
            x: pos.x,
            y: pos.y
        };
        // And ask graphics to transform it to DOM coordinates:
        graphics.transformGraphToClientCoordinates(domPos);
        // then move corresponding dom label to its own position:
        var nodeId = ui.node.id;
        var labelStyle = domLabels[nodeId].style;
        console.log(labelStyle)
        labelStyle.left = domPos.x + 'px';
        labelStyle.top = domPos.y + 'px';
    });

    var events = Viva.Graph.webglInputEvents(graphics, graph);
    events.click(function (node, e) {
        showNodeTip(node, e);
        window.setTimeout(function(){
            $("#nodetip").remove()}, 3000)
    });

    renderer.run();
    currentGraph = graph;
    setTimeout(function() {
        renderer.pause();
        }, 10000);

}

function generateDOMLabels(graph) {
    // this will map node id into DOM element
    var labels = Object.create(null);
    var container = document.getElementById('canvas');
    //var ctx = container.getContext("2d");
    graph.forEachNode(function(node) {
        var label = document.createElement('span');
        label.classList.add('viva-node-label');
        label.innerText = node.data.data.label;
        labels[node.id] = label;
        container.appendChild(label);
    });

    // NOTE: If your graph changes over time you will need to
    // monitor graph changes and update DOM elements accordingly
    return labels;
}


function showNodeTip(node, event){
    $("#nodetip").remove();
    var qtipText = '';
    for (var key in node.data.data) {
        if (key != 'properties' && key != 'pie_parameters') {
            qtipText += key + ' : ' + node.data.data[key] + '<br>';
        }
    }
    var properties = node.data.data.properties;
    for (var property in properties) {
        if (properties.hasOwnProperty(property)) {
            qtipText += property + ' : ' + properties[property] + '<br>';
        }
    }
    var div = $('<div id="nodetip" class="tooltip-wrapper">')
        .css({
            "left": event.clientX + 'px',
            "top": event.clientY + 'px',
            "z-index": 11
        })
        .append(qtipText)
        .appendTo(document.body);
}

/**
 * change color of specific vivagraph elements
 * @param type element type
 * @param value current property or label value
 * @param hexColor new color
 * @param selected property or label
 */
function changeVivaElements(type, value, hexColor, selected){
    var eleUI;
    if (selected === "label") {
        $.paintedGraph.data[type].forEach(function (ele) {
            if ( ele.data.label === value) {
                eleUI = type === "nodes" ? graphics.getNodeUI(ele.data.id) : graphics.getLinkUI(ele.data.id);
                eleUI.color = hexColor.replace("#", "0x");
            }
        })
    }
    else{
        $.paintedGraph.data[type].forEach(function (ele) {
            if ( ele.data.properties[selected] === value) {
                eleUI = type === "nodes" ? graphics.getNodeUI(ele.data.id) : graphics.getLinkUI(ele.data.id);
                eleUI.color = hexColor.replace("#", "0x");
            }
        })
    }
    renderer.rerender();
}

function scaleVivaNodes(type,mCount, prop, dif){
    var eleUI;
    $.paintedGraph.data[type].forEach(function (ele) {
        var count = prop === 'label' ? ele.data.label : ele.data.properties[prop];
        eleUI = graphics.getNodeUI(ele.data.id);
        if ( count != null) {
            count = (count - mCount.min) / (dif) + 0.1;
            eleUI.size = 0.4*calculateWidth(type, count);
        }
        else{
            eleUI.size = getVertexSize();
        }
    })
    renderer.rerender();
}


