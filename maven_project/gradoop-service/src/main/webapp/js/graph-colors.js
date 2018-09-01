var floatValues = {};
var colors;

/**
 * get color from overall colormap (colors), if not set, color is set to grey
 * @param type element type (nodes or edges)
 * @param label name of property or label attribute
 * @returns {string} color in hex string
 */
function getColor(type, label, selected) {
    var col;
    if (selected === 'label') {
        if (colors[type][selected] === undefined){
            colors[type][selected] = {};
        }
    }
    else {
        if (colors[type]['properties'][selected] === undefined) {
            colors[type]['properties'][selected] = {};
        }
    }
    col = selected === 'label' ? colors[type][selected][label] : colors[type]['properties'][selected][label];
    return col === undefined ? '#999999' : rgb2Hex(col);
}

/**
 * transforms rgb color to hex color code, rgb need to an array of integers
 * @param color rgb color array
 * @returns {string} color in hex color code
 */
function rgb2Hex(color) {
    var result = '#';
    result += ('0' + color[0].toString(16)).substr(-2);
    result += ('0' + color[1].toString(16)).substr(-2);
    result += ('0' + color[2].toString(16)).substr(-2);
    return result;
}

/**
 * checks if variable can be parsed to Float
 * @param obj variable to be checked
 * @returns {boolean}
 */
function isNumber(obj) {
    return !isNaN(parseFloat(obj))
}

/**
 * checks if array only contains numbers
 * @param array array to be checked
 * @returns {boolean}
 */
function containsNumbers(array) {
    var b = true;
    array.forEach(function (value) {
        if (isNumber(value/1) === false) {
            b = false;
        }
    });
    return b;
}


/**
 * collects all values of a property or label and return them in an array
 * @param prop property or "label", values are collected from
 * @returns {Array} array of property values
 */
function getPropertyValues(elements, prop) {
    var values = [];
    var val;
    elements.forEach(function (ele) {
        if (prop === "label") {
            val = ele['data'][prop];
        }
        else {
            val = ele['data']['properties'][prop];
        }
        if (val && !values.includes(val)) {
            values.push(val);
        }
    })
    return values;
}

/**
 * create new select list
 * @param type element type (node or edge)
 * @returns {Element} select list
 */
function createSelectList(type) {
    var selectList = document.createElement("select");
    selectList.id = type + "-props";
    selectList.name = "Select Property";
    selectList.label = type;
    return selectList;
}

/**
 * title generator for color picker
 * @param type element type (nodes or edges)
 * @returns {*} title
 */
function getTitle(type) {
    var title;
    if (type === "nodes") {
        title = "Node";
    }
    if (type === "edges") {
        title = "Edge";
    }
    return title;
}

/**
 * add  property selector for nodes or edges and color picker for choosen property values
 * @param elements graph nodes or edges
 * @param type type of elements (node or edge)
 * @param ecs html-element to be extended
 */
function addForm(type, ecs){
    ecs.append( "<form id= form-"+type+"-colors class = 'form-inline form-horizontal' >")
    $("#form-"+type+"-colors" ).append("<div id =group-"+type+"-colors class = form-group >");
    var group = $("#group-"+type+"-colors" );
    group.append("<label class = control-label>"+getTitle(type) + " Colors:</label>");
    group.append(createSelectList(type));
}

function colorSelector(elements, type, ecs) {
    var propertySet = getProperties(elements);
    ecs.empty();
    addForm(type,ecs);
    var ele_props = $("#" + type + "-props");
    ele_props.addClass("selectpicker");
    ele_props.addClass("props");
    ele_props.attr('data-width', "180px");
    //ele_props.attr('padding-left', "2px");
    ele_props.append('<option value = label label = ' + type + '>Label</option>');
    propertySet.forEach(function (prop) {
        ele_props.append('<option value = ' + prop + ' label = ' + type + '> ' + prop + '</option>');
    });
    if (viewVivaGraph){
        ecs.append('<div><input type="checkbox" id=' + type + '_cb_label class = "hide_label" name = ' + type + '> hide labels</div>');
    }
    ecs.append('<div><input type="checkbox" id=' + type + '_continous class = "checkb" name = ' + type + '> continuous</div>');
    ecs.append(' <div id=' + type + '-color-picker style = "..."></div>')
    var selected = 'label';
    var cols = $("#" + type + "-color-picker");
    addColorPicker(elements, type, selected, cols);
    $(".checkb").css({'vertical-align': 'text-bottom'});
}

function addClickEvents(){
    $('.props').change(function (event) {
        event.stopPropagation();
        var selected = this.value;
        var type = this.label;
        var cols = $("#" + type + "-color-picker");
        cols.empty();
        addColorPicker(getElements(type), type, selected, cols);
    })
    $(".checkb").click(function () {
        var selected = $('#' + this.name + '-props')[0].value;
        var cols = $("#" + this.name + "-color-picker");
        cols.empty();
        addColorPicker(getElements(this.name), this.name, selected, cols);
    })
    $(".hide_label").click(function(){
        if ($('#'+this.name+'_cb_label').is(":checked")){
            $('span.viva-node-label').hide()
        }
        else{
            $('span.viva-node-label').show()
        }
    })
}

/**
 * update colors of cy-elements
 * @param type element type
 */
function resetColors(type) {
    var selected = $("#" + type + "-props")[0].value;
    if (viewVivaGraph){
        var eleUI;
        $.paintedGraph.data[type].forEach(function (ele) {
            var label = selected === 'label' ? ele.data.label : ele.data.properties[selected];
            eleUI = type === "nodes" ? graphics.getNodeUI(ele.data.id) : graphics.getLinkUI(ele.data.id);
            eleUI.color = getColor(type, label, selected).replace("#", "0x");
        })
        renderer.rerender();
    }
    else{
        var cyelements = getCyElements(type);
        cyelements.forEach(function (ele) {
            var label = selected === 'label' ? ele.data('label') : ele.data('properties')[selected];
            if (type === "nodes") {
                ele.css({'background-color': getColor(type, label, selected)});
            }
            else if (type === "edges") {
                ele.css({'line-color': getColor(type, label, selected)});
            }
        })
    }
}

/**
 * return belonging data elements
 * @param type element type (nodes or edges)
 * @returns {*}
 */
function getElements(type) {
    var ele;
    if (type === "nodes") {
        ele = nodes;
    }
    else if (type === "edges") {
        ele = edges;
    }
    return ele;
}

/**
 * add Color Picker to each property value or in color gradient version (choose min and max value),
 * if continous is checked
 * @param elements graph elements (nodes or edges)
 * @param type element type (node or edge)
 */
function addColorPicker(elements, type, selected, cols) {
    var values = getPropertyValues(elements, selected);
    if ($('#' + type + '_continous').is(':checked')) {
        resetColors(type);
        if (containsNumbers(values) === true) {
            if (floatValues[type] === undefined) {
                floatValues[type] = values.map(function (x) {
                    return parseFloat(x)
                });
            }
            if (floatValues[type].length > 1) {
                var maxColor = getContColor(type, selected, "max");
                var minColor = getContColor(type, selected, "min");
                setAllElementColors(selected, type);
                cols.append("<div><input type='text' class=" + type + "_cont id = " + type + "_max value = "+rgb2Hex([maxColor.r, maxColor.g, maxColor.b])+" name = " + type + "\><button type='button'  class = " + type + "_colpick name = " + type + "_max  id = b_" + type + "_max \>" + Math.max.apply(null, floatValues[type]) + "</button><\div>");
                cols.append("<div><input type='text' class=" + type + "_cont id = " + type + "_min value = "+rgb2Hex([minColor.r, minColor.g, minColor.b])+" name = " + type + "\><button type='button'  class = " + type + "_colpick name = " + type + "_min  id = b_" + type + "_min \>" + Math.min.apply(null, floatValues[type]) + "</button><\div>");
                addSpectrum(type);
            }
            else {
                alert("not enough Values, number of Values need to be at least 2");
            }
        }
        else {
            $('#' + type + '_continous').attr('checked', false);
            alert("Values need to be Numbers");
            addColorPicker(elements, type, selected, cols);
        }
    }
    else {
        resetColors(type);
        var cnt = 0;
        values.forEach(function (value) {
            if (!viewVivaGraph && selected === "label"){
                cols.append(createSelectList(type+"_" + cnt));
                cols.append("<input type='text' class=" + type + "_col id = " + type + "_" + cnt + "  value = " + getColor(type, value, selected) + " name = " + type + "\><button type='button'  class = " + type + "_colpick name = " + type + "_" + cnt + " id = b_" + type + "_" + cnt + "\>" + value + "</button>");
                cols.append("<input type=checkbox id=" + value + "_label class = " + type + "_remove  name = " + type + " label = "+value+">hide<br>");
                setOptions($("#"+type+"_" + cnt + "-props"),type, value);
                $(".selectpicker").selectpicker('refresh');
            }
            else {
                cols.append("<div><input type='text' class=" + type + "_col id = " + type + "_" + cnt + "  value = " + getColor(type, value, selected) + " name = " + type + "\><button type='button'  class = " + type + "_colpick name = " + type + "_" + cnt + " id = b_" + type + "_" + cnt + "\>" + value + "</button><\div>");
            }
            cnt++;
        });
        addSpectrum(type);
    }
}

function getContColor(type, selected, extrema){
    if (colors[type]["properties"][selected] !== undefined && colors[type]["properties"][selected]["continuous"] !== undefined&& colors[type]["properties"][selected]["continuous"][extrema] !== undefined){
        return colors[type]["properties"][selected]['continuous'][extrema];
    }
    else{
        if (extrema === "min"){
            return {r: 255, g: 0, b: 0};
        }
        else if (extrema === "max"){
            return {r: 0, g: 0, b: 255};
        }
    }
}


/**
 * enable Colorpicker (spectrum)
 */
function addSpectrum(type) {
    $("." + type + "_colpick").click(function () {
        $("#" + this.name).spectrum("toggle");
        return false;
    });
    $("." + type + "_cont").spectrum({
        preferredFormat: "hex",
        change: function (color) {
            var selected = $('#' + this.name + '-props')[0].value;
            if (colors[type]["properties"][selected]["continuous"] === undefined) {
                colors[type]["properties"][selected]["continuous"] = {}
            }

            if (this.id === type + "_max") {
                colors[type]["properties"][selected]["continuous"]['max'] = color.toRgb();
            }
            else if (this.id === type + "_min") {
                colors[type]["properties"][selected]["continuous"]['min'] = color.toRgb();
            }
            setAllElementColors(selected, type);
        }
    });
    
    $("." + type + "_col").spectrum({
        preferredFormat: "hex",
        change: function (color) {
            var selected = $('#' + this.name + '-props')[0].value;
            var label = $("#b_" + this.id).text();
            setElementColor(type, color.toHexString(), label, selected);
            updateTableColorsByLabel(label, color.toHexString());
        }
    });
    $("." + type +"_remove").click(function () {
        var label = this.getAttribute('label');
        var hide = this.checked;
        let rows = $('#graph-view-table').find("tr[data-label='" + label + "']");
        if (hide) {
            rows.hide();
        } else {
            rows.show();
        }
        getCyElements(this.name).forEach(function(ele){
            if (ele._private.data.label ===label){
                hide === true ? ele.hide() : ele.show();
            }
        })
    });

    $(".label_"+type).change(function(event) {
        event.stopPropagation();
        var prop = this.value;
        var type = this.name;
        var label = this.getAttribute('label');
        storeLabel(type, label, prop);
        getCyElements(type).filter(function(i, ele){
            if(ele.data("label")===label){
                var l = ele.data("label")=== undefined? "none" :  ele.data("label");
                var p = ele.data("properties")[prop]===undefined? "none" :  ele.data("properties")[prop];
                prop === "none" ? ele.style('content', "") :
                    prop === "label" ? ele.style('content', l) : ele.style('content', p);
            }
        });
    });
}

/**
 * calculates RGB-value of current property value
 * @param val
 * @returns {Array} RGB-Color
 */
function getColorGradient(type, selected, val) {
    var Color = [];
    var maxColor = getContColor(type, selected, "max");
    var minColor = getContColor(type, selected, "min");
    Color.push(Math.round(minColor.r + (maxColor.r - minColor.r) * val));
    Color.push(Math.round(minColor.g + (maxColor.g - minColor.g) * val));
    Color.push(Math.round(minColor.b + (maxColor.b - minColor.b) * val));
    return Color;
}

/**
 * calculates color values of elements in range of min- and maxColor and set edge colors
 * @param selected property of edges to be changed
 */
function setAllElementColors(selected, type) {
    var max = Math.max.apply(null, floatValues[type]);
    var min = Math.min.apply(null, floatValues[type]);
    var shift = 1 / (max - min);
    floatValues[type].forEach(function (val) {
        var c = (val - min) * shift;
        setElementColor(type, rgb2Hex(getColorGradient(type, selected,c)), val.toString(), selected);
    })
}

/**
 * change color of elements (nodes or edges)
 * @param selected property or label to be changed
 * @param hexColor new color
 * @param value property or label value to be changed
 */
function setElementColor(type, hexColor, value, selected) {
    var rgb = hexToRgb(hexColor);
    if (selected === "label") {
        colors[type][selected][value] = [rgb.r, rgb.g, rgb.b];
    }
    else{
        if (colors[type]["properties"][selected] === undefined) {
            colors[type]["properties"][selected] = {}
        }
        if (!$('#' + type + '_continous').is(':checked')) {
            colors[type]["properties"][selected][value] = [rgb.r, rgb.g, rgb.b];
        }
    }
    sessionStorage.setItem(getSelectedDatabase(), JSON.stringify(colors));
    if (viewVivaGraph){
        changeVivaElements(type, value, hexColor, selected)
    }
    else {
        changeCytoElements(type, value, hexColor, selected)
    }
}

function initializeSelectMenu(selectmenu, filenames){
    for (var i = 0; i < filenames.length; i++) {
        selectmenu.append('<option value="' + filenames[i] + '">' + filenames[i] + '</option>');
    }
    selectmenu.selectpicker('refresh');
    selectmenu.on("hidden.bs.select", function(){
        if ($('#color-input').val()!=="") {
            loadColorFile("colors", $('#color-input').val());
        }
    })
}

function loadColorFile(identifier, filename) {
    $.ajax({
        url: "rest/json/" + identifier,
        data: {json: filename},
        cache: false,
        type: 'GET',
        //async:false,
        success: function (data) {
            var labels = getPropertyValues($.paintedGraph.data.nodes, "label")
            if (data === "null") {
                console.log("Info: color file do not exist, colors are drawn from color palette");
                colors = {"nodes": {"properties": {}}, "edges": {"label": {}, "properties": {}}};
                colors["nodes"]["label"] = getColorPalette(labels);
            }
            else {
                colors = JSON.parse(data);
            }
            createModal(colors);
        },
        error: function (error) {
            console.log(error);
        }
    })
}

/**
 * add Color Picker for vertex labels and edge properties
 * @param data current graph
 */
function showLabels() {
    $("#drawing_properties").empty();
    $("#loadColors").empty();
    $("#loadColors").append(
        "<div class=input-group id='colorsInputGroup' style=width:100%>"+
        "<button type='button' id = 'OFD' class='btn btn-success' >Load Colors</button>"+
        "<input id ='iOFD' type='file' onchange=handleFileSelect(this.files) accept='.json' style='display: none' />" +
        "<select id=color-input class='selectpicker' data-width = 100% title='...'></select>"+
        "</div>")

    $.get('rest/filenames/colors')
        .done(function(data){
            initializeSelectMenu($('#color-input'), data)
        });
    floatValues = {};
    addScaleSelector("nodes");
    if (!viewVivaGraph) {
        addScaleSelector("edges");
        colorSelector($.paintedGraph.data.edges, "edges", $("#edge-color-selecter"));
    }
    else{
        $("#scale_edges").empty();
    }
    var save_config = $("#save-color-div");
    save_config.empty();
    save_config.append('<div class="input-group">'+
	            	'<span class="input-group-addon" id="color-addon1" style="min-width:100px">File Name</span>'+
	            	'<input id="colorIdentifier" class="form-control" placeholder="type here..." aria-describedby="color-addon1">'+
	            '</div>')
    save_config.append("<div><button type='button'  class='btn btn-success' id = 'save_colors'\>Save Colors</button>");
    colorSelector($.paintedGraph.data.nodes, "nodes", $("#coloredlabels"));
    addClickEvents();


    $("#OFD").on("click", function() {
        //this.files = null;
        $("#iOFD").trigger("click");
    });

    $("#save_colors").click(function () {
        var filename = $('#colorIdentifier').val();
        /*$.ajax({
            url: "rest/upload/" + getSelectedDatabase(),
            data: jQuery.param({name: filename, file: JSON.stringify(colors)}),
            cache: false,
            contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
            processData: false,
            type: 'POST',
            success: function (data) {
                console.log(data)
            },
            error: function () {
                alert("Upload failed");
            }
        });*/
        $.postJSON("rest/colors/" + filename, JSON.stringify(colors), function(data){
            console.log(data)
        })
        $('#color-input').append('<option value="' + filename + '">' + filename + '</option>')
        $('#color-input').selectpicker('refresh');;
    });

   $('.selectpicker').selectpicker();
}

function getValue(){
    var retVal = prompt("Enter color file name : ", "colormap");
    return retVal;
}

function setOptions(sn, type, value){
    sn.addClass("selectpicker").attr('data-width', "75px");
    sn.addClass("label_" + type);
    sn.attr('name', type);
    sn.attr('label',value);
    if (type ==="edges"){
        sn.append('<option value = none label = ' + type + '> none</option>');
    }
    sn.append('<option value = label label = ' + type + '> Label</option>');

    var props = new Set();
    /*getCyElements(type).filter(function (i, ele) {
        if (ele.data("label") === value) {
            Object.keys(ele.data("properties")).forEach(function(p){
                props.add(p);
            })
        }
    })*/
    getElements(type).forEach(function(ele) {
        if (ele.data.label === value) {
            Object.keys(ele.data.properties).forEach(function(p){
                props.add(p);
            })
        }
    })
    props.forEach(function (prop) {
        sn.append('<option value = ' + prop + ' label = ' + type + '> ' + prop + '</option>');
    });
    sn.selectpicker("val",getStoredLabel(type, value));
}


function addScaleSelector(type){
    if (!$("#scale_"+ type).length) {
        $("#form-props").append("<br><div id = scale_" + type + " class = form-group >");
    }
    else{
        $("#scale_"+ type).empty();
    }
    var scale_div = $("#scale_"+ type);
    scale_div.append("<label class = control-label for = scale-"+type+"-props >Scale "+getTitle(type)+"s: </label>");
    scale_div.append(createSelectList("scale_"+type));
    scale_div.append("<br/>");
    var sn = $("#scale_"+type+"-props");
    sn.addClass("selectpicker").attr('data-width', "180px");
    sn.addClass("scale_"+type);
    sn.attr('name', type);
    //sn.attr('padding-left', "10px");
    sn.append('<option value = none label = '+type+'> none</option>');
    var elements = getElements(type);
    var properties = getProperties(elements);
    properties.add('label');

    properties.forEach(function (prop) {
        var values = getPropertyValues(elements, prop);
        if(containsNumbers(values)===true) {
            sn.append('<option value = ' + prop + ' label = ' + type + '> ' + prop + '</option>');
        }
    });

    $(".scale_"+type).change(function(){
        var prop = this.value;
        var type = this.name;
        var mCount = getMinMaxCount(getElements(type),prop);
        var dif = mCount.max === mCount.min ? 1 : mCount.max-mCount.min;
        if (viewVivaGraph){
            if (type === "nodes") {
                scaleVivaNodes(type, mCount, prop, dif)
            }
            //var count = prop === 'label' ? ele.data('label') : ele.data('properties')[prop];
        }
        else {
            scaleCytoElements(type,mCount, prop, dif)
        }
        colors[type]["scale"] = prop;
    })
    var toselect = colors[type]["scale"];
    sn.val(toselect).change();
}


function getMinMaxCount(elements, property){
    var maxCount = null;
    var minCount = null;
    var vertexCount;
    elements.forEach(function(ele){
        vertexCount = property ==="label" ? Number(ele['data'][property]):Number(ele['data']['properties'][property]);
        if (isNumber(vertexCount) === true){
            if(maxCount ===null){
                maxCount = vertexCount;
                minCount = vertexCount;
            }
            else {
                if(vertexCount > maxCount) {
                    maxCount = vertexCount;
                }
                else if (vertexCount < minCount){
                    minCount = vertexCount;
                }
            }
        }
    })
    return {'max' : maxCount, 'min' : minCount};
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function createModal(result){
    if(result) {
        addFormGroups($("#modal_node_colors"),"nodes", result.nodes);
        addFormGroups($("#modal_edge_colors"),"edges", result.edges);
        $('#myModal').modal('show');
    }
}

function addFormGroups(div, type, eles){
    var cnt =0;
    div.empty();
    div.append("<h5>"+getTitle(type)+"s:</h5>");
    getPropertyValues(getElements(type), "label") .forEach(function(label){
        addFormGroup(div ,label, type, cnt, eles);
        cnt++;
    })
    $(".selectpicker").selectpicker('refresh');

}

function addFormGroup(div, lab,type, cnt, eles){
    div.append("<div class = form-group id = fg_label_"+type+"></div></br>");
    var fg = $('#fg_label_'+type);
    fg.append("<label class = control-label for=label_"+type+"_"+cnt+"-props>"+lab+" </label>");
    fg.append(createSelectList("label_"+type+"_"+cnt));
    setModalSelectOptions($("#label_"+type+"_"+cnt+"-props"), lab, eles);
}

function setModalSelectOptions(sn, lab, eles){
    sn.addClass("selectpicker form-control");
    sn.attr('data-width', "120px");
    sn.attr('label',lab);
    sn.append('<option value = none label = ' + lab + '> none</option>');
    Object.keys(eles.label).forEach(function (label) {
        if (label === lab){
            sn.append('<option  title= "<span class=dot style=background-color:'+rgb2Hex(eles.label[label])+'></span>&nbsp;'+label+'" selected="selected" value = ' +eles.label[label].toString() + ' label = ' + lab + '> ' + label + '</option>');
        }
        else{
            //sn.append('<option value = ' + eles.label[label].toString() + ' label = ' + lab + '>' + label + ' </option>');
            sn.append('<option title= "<span class=dot style=background-color:'+rgb2Hex(eles.label[label])+'></span>&nbsp;'+label+'" value = ' + eles.label[label].toString() + ' label = ' + lab + '>' + label + ' </option>');
        }
        sn.find(":last")[0].style["color"] = rgb2Hex(eles.label[label]);
    });

}


function updateColors() {
    updateTypeColors("nodes");
    updateTypeColors("edges")

}

function updateTypeColors(type){
    colors[type].label = {};
    var cnt=0;
    var labels = getPropertyValues(getElements(type), "label");
    labels.forEach(function(ele){
        var value = $("#label_" + type + "_" + cnt + "-props").find(":selected").val();
        if(value !== undefined && value !== "none") {
            colors[type].label[ele] = JSON.parse("[" + value + "]");
        }
        cnt++;
    });
}

function updateGraph(){
    //colors = result;
    updateColors();
    updateElements();
    if ($.paintedGraph.name !== "DEFAULT_HANDLER_GRAPH" && $.paintedGraph.name !== "DEFAULT_BUILDER_GRAPH") {
        sessionStorage.setItem(getSelectedDatabase().toString(), JSON.stringify(colors));
    }
    if (viewVivaGraph){
        viva_action($.paintedGraph.data);
    }
    else{
        cyto_action();
    }
    showLabels();
    $("#switch-view-btn").prop("disabled", false);
    if (viewAsTable) {
        fillTable();
    }
}

function handleFileSelect(files) {
    var fr = new FileReader();
    fr.onload = function(e) {
        var result = JSON.parse(e.target.result);
        if (isColorFile(result)===true && result) {
            createModal(result);
        }
    }
    fr.readAsText(files.item(0));
}

function isColorFile(file){
    if (file.nodes !== undefined && file.edges !== undefined){
        return true;
    }
    alert("File is not a Color File")
    return false;
}