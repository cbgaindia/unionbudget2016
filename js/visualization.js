var hash = window.location.hash;


$(document).ready(function() {
    init();
}); // end document ready function

function init(){
    resizeContainer($("#content").parent().width());
    loadDatasets();
    // slide out menu
    $(".menu-toggle").on("click", toggleMenu);
    $("#narrative-row button").click(function() {
        if($(this).hasClass('active'))
        $(this).removeClass('active'); //change with .activatebutton
        else
        $("button.active").removeClass("active");
    $(this).addClass('active');
    });

    $("#narrative a.close-box").click(function (event) {
        event.preventDefault();
        removeNarrative();
    });

    $('#narrative-row button').on('click', function(){
        $( "#narrative" ).fadeIn(400);
        $('#narrative div.panel-body').hide();
        $('#' + $(this).data('rel')).show();
        $('#nav-panel #' + $(this).attr('data-filter')).trigger('click');
    });

    $(window).resize(function(){
        resizeContainer($("#content").parent().width());
    });
}

function resizeContainer(width){
    var new_height = $(window).width() < 797 ? Math.max($("#content").parent().width() * 0.75, 320) : 700;
    $("#content").css({"width":width,"height":new_height});
    $("#nav-panel").css({"height": new_height});
}

function loadDatasets(){
    var table_data = {};
    queue()
        .defer(d3.csv, "data/table_list.csv")
        .defer(d3.csv, "data/ministry_of_tribal_affairs.csv")
        .defer(d3.csv, "data/ministry_of_social_justice_and_empowerment.csv")
        .defer(d3.csv, "data/ministry_of_rural_development.csv")
        .defer(d3.csv, "data/urban_poverty.csv")
        .defer(d3.csv, "data/education.csv")
        .defer(d3.csv, "data/health.csv")
        .defer(d3.csv, "data/tax_gdp_buoyancy.csv")
        .defer(d3.csv, "data/annual_estimated_revenue_foregone.csv")
        .defer(d3.csv, "data/composition_and_structure_of_transfer_of_resources_to_states.csv")
        .defer(d3.csv, "data/social_sector_expenditures_by_union_government.csv")
        .defer(d3.csv, "data/social_sector_expenditure_as_share_of_aggregate_disbursements_by_states.csv")
        .await(populateTableData);
    
    function populateTableData(error, table_list, ministry_of_tribal_affairs, ministry_of_social_justice_and_empowerment, ministry_of_rural_development, urban_poverty, education, health, tax_gdp_buoyancy, annual_estimated_revenue_foregone, composition_and_structure_of_transfer_of_resources_to_states, social_sector_expenditures_by_union_government, social_sector_expenditure_as_share_of_aggregate_disbursements_by_states){
        table_data["ministry_of_tribal_affairs"] = ministry_of_tribal_affairs;
        table_data["ministry_of_social_justice_and_empowerment"] = ministry_of_social_justice_and_empowerment;
        table_data["ministry_of_rural_development"] = ministry_of_rural_development; 
        table_data["urban_poverty"] = urban_poverty; 
        table_data["education"] = education;  
        table_data["health"] = health;  
        table_data["tax_gdp_buoyancy"] = tax_gdp_buoyancy;  
        table_data["annual_estimated_revenue_foregone"] = annual_estimated_revenue_foregone;  
        table_data["composition_and_structure_of_transfer_of_resources_to_states"] = composition_and_structure_of_transfer_of_resources_to_states;
        table_data["social_sector_expenditures_by_union_government"] = social_sector_expenditures_by_union_government;
        table_data["social_sector_expenditure_as_share_of_aggregate_disbursements_by_states"] = social_sector_expenditure_as_share_of_aggregate_disbursements_by_states;
        populateNavPanel(table_list, table_data);
    }
    function drawViz(table_list, table_data){
    }       
}
 
function populateNavPanel(table_list, table_data) {
    var categoryTemplate = _.template('<h4 class="hidden-xs"><%- table.name  %></h4><ul class="nav nav-pills nav-stacked layer-toggle-menu hidden-xs <%= table.name_id  %>-menu"><ul>', {variable: 'table'}),
        linearFieldTemplate = _.template('<li><a parent="<%= field.parent  %>" index="<%= field.index_id %>" href="#" field-type="linear"><%- field.index_name %></li>', {variable: 'field'}),
        transposeFieldTemplate = _.template('<li><a parent="<%= table.id  %>" href="#" field-type="transpose"><%- table.field_name %></li>', {variable: 'table'});
    var $panel = $('#nav-panel');
    _.chain(table_list).groupBy('name').each(function (tables){
        _.forEach(tables, function(table){
            table["name_id"] = table.name.toLowerCase().replace(/\W+/g, '-');
            var $menu = $('.' + table.name_id + '-menu');
            if($menu.length == 0){
                $panel.append(categoryTemplate(table));
                $menu = $('.' + table.name_id + '-menu');
            }
            if(table["field_type"] == "linear"){
                var field_index_id = 0;
                _.chain(table_data[table.id]).groupBy('index_name').each(function (fields){
                    _.forEach(fields, function(field){
                        field["parent"] = table["id"];
                        field["index_id"] = field_index_id;
                        field["source"] = table["source"];
                        if(("notes" in field) && field["notes"].match(/[a-z]/i)){
                            field["notes"] = (table["notes"] + " " + field["notes"]).trim() 
                        }else{
                            field["notes"] = table["notes"];
                        }
                        if(!(("unit" in field) || field["unit"].match(/[a-z]/i))){
                            field["unit"] = table["unit"];
                        }
                        $menu.append(linearFieldTemplate(field));
                        field_index_id = field_index_id + 1;
                    });
                });
            }else{
                field_data = table_data[table.id];
                table_data[table.id] = table;
                $menu.append(transposeFieldTemplate(table));
                table_data[table.id]["field_data"] = field_data; 
                table_data[table.id]["index_name"] = table_data[table.id]["field_name"]; 
            }
        });
    });

    $(".layer-toggle-menu > li").on("click", "a", function(e){
        e.preventDefault();
        if (!$(this).parent().hasClass('disabled')){
            currentMetric = getMetric(this, "index");            
            parentMetric = getMetric(this, "parent");
            fieldType = getMetric(this, "field-type"); 
            //getSource(source_data,currentMetric);
            changeDataViz(currentMetric, parentMetric, fieldType, table_data);
            $(".selected").removeClass("selected");
            $(this).parent().addClass("selected");
            $("#legend-panel").show();
            $("#details p.lead").show();
        }
    });
}

function getMetric(obj, metricName){
    return (typeof $(obj).attr(metricName)==="undefined")?null:$(obj).attr(metricName); 
}

function toggleMenu() {
  var $this = $(".menu-toggle");
  if ($this.parent().hasClass("toggled")){
    $this.parent().animate({ "left" : 0 }, 350, function(){ $("#main-container").removeClass("toggled"); });
  } else {
    $this.parent().animate({ "left" : $("#nav-panel").width() }, 350, function(){ $("#main-container").addClass("toggled"); });
    removeNarrative();
  }
}

function removeNarrative() {
  $( "#narrative" ).fadeOut(400);
  $( "#narrative-row button" ).removeClass('active');
}

function changeDataViz(index_id, parent_id, field_type, table_data){
    $("#content").html("");
    selected_table_data = {}; 
    skip_keys = {"index_id":0, "index_name":0, "unit":0, "insights":0, "parent":0, "source":0, "viz_type":0, "alias":0, "notes":0}
    if(field_type == "linear"){
        selected_table_data = table_data[parent_id][index_id]; 
        generateLinearChart(selected_table_data, skip_keys);
    }else{
        selected_table_data = table_data[parent_id];
        generateTransposeChart(selected_table_data, skip_keys);
    }
    $(".unit").html("Unit: " + selected_table_data["unit"]); 
    $("#visualized-measure").html(selected_table_data["index_name"]);
    $("#source-title").html("<b>Source:</b> " + selected_table_data["source"]);
    $("#notes-title").html("<b>Notes:</b> " + selected_table_data["notes"]);
}

function generateLinearChart(selected_table_data, skip_keys){
    chart_data = []
    for (var key in selected_table_data){
        if(!(key in skip_keys) && (key.indexOf('%') === -1)){
            var chart_data_row = {};
            data_value = selected_table_data[key];
            if ((data_value.match(/[0-9]/))){   
                if(data_value.indexOf('.') === -1){  
                    chart_data_row = {"key":key, "value":parseInt(data_value, 10)}; 
                }else{
                    chart_data_row = {"key":key, "value":parseFloat(data_value, 10)}; 
                }
                key_perc = key + "%";
                if(key in selected_table_data){
                    data_value = selected_table_data[key_perc];
                    chart_data_row["value_perc"] = parseFloat(data_value, 10);   
                }
            } 
            if(!(_.isEmpty(chart_data_row))){
                chart_data.push(chart_data_row);
            }
        }
    }
    if((!("viz_type") in selected_table_data) || typeof selected_table_data["viz_type"] === 'undefined' || selected_table_data["viz_type"].trim() == ""){
         selected_table_data["viz_type"] = "simple_bar";
    }
    index_name = selected_table_data["index_name"]; 
    if("alias" in selected_table_data){
        index_name = selected_table_data["alias"]; 
    }  
    this[selected_table_data["viz_type"]](chart_data, index_name, selected_table_data["unit"]);
}

function generateTransposeChart(selected_table_data, skip_keys){
    chart_data = [];
    key_list = [];
    key_hash = {};
    _.forEach(selected_table_data["field_data"], function(field_data){
        var chart_data_row = {};
        chart_data_row = {"key": field_data["index_name"], "value":[]};
        for(var key in field_data){
            if(!(key in skip_keys)){
                key_hash[key] = 0;
                data_value = field_data[key];
                if ((data_value.match(/[0-9]/))){
                    if(data_value.indexOf('.') === -1){  
                        chart_data_row["value"].push(parseInt(data_value, 10)); 
                    }else{
                        chart_data_row["value"].push(parseFloat(data_value, 10)); 
                    }
                }
            }      
        }
        chart_data.push(chart_data_row);
    });
    for(var key in key_hash){
        key_list.push(key);
    }
    this[selected_table_data["viz_type"]](chart_data, key_list, selected_table_data["unit"]);
}

function simple_bar(chart_data, index_name, unit){
    var vertical_pad = 50; 
    var margin = {top: 20, right: 0, bottom: 20, left: 0},
        width = 700 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var xScale = d3.scale.ordinal()
        .domain(d3.range(chart_data.length))
        .rangeRoundBands([0, width], 0.5, 0.25); 
    var yScale = d3.scale.linear()
        .domain([0, d3.max(chart_data, function(d) {return d.value;})])
        .range([0, height-vertical_pad]);
    var key = function(d) {
            return d.key;
    };
    var svg = d3.select("#content")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + vertical_pad);
    svg.selectAll("rect")
        .data(chart_data, key)
        .enter()
        .append("rect")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("x", function(d, i) {
            return xScale(i);
        })
    .attr("y", function(d) {
        return height - yScale(d.value) - vertical_pad;
    })
    .attr("width", xScale.rangeBand())
        .attr("height", function(d) {
            return yScale(d.value);
        })
    .attr("fill", function(d) {
        return "#08519c";
    })

    var texts = svg.selectAll("text")
        .data(chart_data)
        .enter();

    texts.append("text")
        .text(function(d) {
            return d.value;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 ;
        })
    .attr("y", function(d) {
        return height - yScale(d.value) - 35;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-size", "18px")
    .attr("fill", "black");

    texts.append("text")
        .text(function(d) {
            return d.key;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2;
        })
    .attr("y", function(d) {
        return height;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-size", "14px")
    .attr("fill", "Black");
}

function simple_bar_with_line(chart_data, index_name, unit){
    var vertical_pad = 50; 
    var margin = {top: 20, right: 40, bottom: 20, left: 40},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var xScale = d3.scale.ordinal()
        .domain(d3.range(chart_data.length))
        .rangeRoundBands([margin.left, width-margin.right], 0.5, 0.25); 
    var yScale1 = d3.scale.linear()
        .domain([0, d3.max(chart_data, function(d) {return d.value;})])
        .range([height-vertical_pad, 0]);
    var yScale2 = d3.scale.linear()
        .domain([0, d3.max(chart_data, function(d) {return d.value_perc;})])
        .range([height-vertical_pad, 0]);
    var yAxis1 = d3.svg.axis()
        .scale(yScale1)
        .orient("left");
    var yAxis2 = d3.svg.axis()
        .scale(yScale2)
        .orient("right");
    var line = d3.svg.line()
        .x(function(d, i) { return xScale(i) + xScale.rangeBand()/2 + margin.left})
        .y(function(d) { return yScale2(d.value_perc) + vertical_pad/2;});
    var key = function(d) {
            return d.key;
    };
    var svg = d3.select("#content")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + vertical_pad);
    svg.selectAll("rect")
        .data(chart_data, key)
        .enter()
        .append("rect")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("x", function(d, i) {
            return xScale(i);
        })
        .attr("y", function(d) {
            return yScale1(d.value);
        //return height - yScale1(d.value) - vertical_pad;
        })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) {
            return height - yScale1(d.value) - vertical_pad;
            return yScale1(d.value);
        })
        .attr("fill", function(d) {
            return "#08519c";
    })

    svg.append("path")
        .datum(chart_data)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#74c476")
        .attr("stroke-width", 5)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", ("1, 10"))
        .attr("shape-rendering", "optimizeSpeed");
    
    svg.selectAll("circle.line")
        .data(chart_data)
        .enter().append("svg:circle")
        .attr("class", "line")
        .style("fill", "#74c476")
        .attr("cx", line.x())
        .attr("cy", line.y())
        .attr("r", 8);
   
    var texts = svg.selectAll("text")
        .data(chart_data)
        .enter();

    texts.append("text")
        .text(function(d) {
            return d.value;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return yScale1(d.value) + vertical_pad;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-size", "14px")
    .attr("fill", "white");

    texts.append("text")
        .text(function(d) {
            return d.value_perc;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return yScale2(d.value_perc) + vertical_pad/4;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-size", "16px")
    .attr("fill", "Black");
    
    texts.append("text")
        .text(function(d) {
            return d.key;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return height;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-size", "16px")
    .attr("fill", "Black");
    
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 2*margin.left  + "," + vertical_pad/2.5 + ")")
        .call(yAxis1);
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", - height + vertical_pad)
        .attr("dy", "1em")
        .attr("fill", "Black")
        .attr("font-family", "sans-serif") 
        .attr("font-size", "16px")
        .text(index_name + " in " + unit.split("and")[0]);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width  + "," + vertical_pad/2.5 + ")")
        .call(yAxis2);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width + margin.right)
        .attr("x", - height + vertical_pad)
        .attr("dy", "1em")
        .attr("fill", "Black")
        .attr("font-family", "sans-serif") 
        .attr("font-size", "16px")
        .text(index_name + " in " + unit.split("and")[1]);
}

function two_line(chart_data, key_list, unit){
    var vertical_pad = 50;
    var color1 = "#08519c"; 
    var color2 = "#006d2c"; 
    var margin = {top: 20, right: 40, bottom: 20, left: 40},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var xScale = d3.scale.ordinal()
        .domain(d3.range(chart_data.length))
        .rangeRoundBands([margin.left, width-margin.right], 0.5, 0.25); 
    var yScale1 = d3.scale.linear()
        .domain([0, d3.max(chart_data, function(d) {return d.value[0];})])
        .range([height-vertical_pad, 0]);
    var yScale2 = d3.scale.linear()
        .domain([0, d3.max(chart_data, function(d) {return d.value[1];})])
        .range([height-vertical_pad, 0]);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .innerTickSize(-height+vertical_pad)
        .tickFormat(function (d) { return ''; });
    var yAxis1 = d3.svg.axis()
        .scale(yScale1)
        .orient("left");
    var yAxis2 = d3.svg.axis()
        .scale(yScale2)
        .orient("right");
    var line1 = d3.svg.line()
        .x(function(d, i) { return xScale(i) + xScale.rangeBand()/2 + margin.left})
        .y(function(d) { return yScale1(d.value[0]) + vertical_pad/2;});
    var line2 = d3.svg.line()
        .x(function(d, i) { return xScale(i) + xScale.rangeBand()/2 + margin.left})
        .y(function(d) { return yScale2(d.value[1]) + vertical_pad/2;});
    var key = function(d) {
            return d.key;
    };
    var svg = d3.select("#content")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + vertical_pad);
    
    svg.append("path")
        .datum(chart_data)
        .attr("class", "line")
        .attr("d", line1)
        .attr("fill", "none")
        .attr("stroke", color1)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "square")
        .attr("stroke-dasharray", ("1, 10"))
        .attr("shape-rendering", "optimizeSpeed");
    
    svg.append("path")
        .datum(chart_data)
        .attr("class", "line")
        .attr("d", line2)
        .attr("fill", "none")
        .attr("stroke", color2)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "square")
        .attr("stroke-dasharray", ("1, 10"))
        .attr("shape-rendering", "optimizeSpeed");

    svg.selectAll("circle.line1")
        .data(chart_data)
        .enter().append("svg:circle")
        .attr("class", "line")
        .style("fill", color1)
        .attr("cx", line1.x())
        .attr("cy", line1.y())
        .attr("r", 5);
   
    svg.selectAll("circle.line2")
        .data(chart_data)
        .enter().append("svg:circle")
        .attr("class", "line")
        .style("fill", color2)
        .attr("cx", line2.x())
        .attr("cy", line2.y())
        .attr("r", 5);

    var texts = svg.selectAll("text")
        .data(chart_data)
        .enter();

    texts.append("text")
        .text(function(d) {
            return d.value[0];
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return yScale1(d.value[0]) + vertical_pad/4;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-weight", "bold")
    .attr("font-size", "15px")
    .attr("fill", color1);

    texts.append("text")
        .text(function(d) {
            return d.value[1];
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return yScale2(d.value[1]) + vertical_pad;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-weight", "bold")
    .attr("font-size", "15px")
    .attr("fill", color2);
    
    texts.append("text")
        .text(function(d) {
            return d.key;
        })
    .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return xScale(i) + xScale.rangeBand()/2 + margin.left;
        })
    .attr("y", function(d) {
        return height;
    })
    .attr("font-family", "sans-serif") 
    .attr("font-weight", "bold")
    .attr("font-size", "12.5px")
    .attr("fill", "Black");
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("  + margin.left +  "," + (height - vertical_pad/2) + ")")
        .call(xAxis);
    
    svg.selectAll(".tick")
        .style('opacity', 0.1);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (2*margin.left)  + "," + vertical_pad/2 + ")")
        .call(yAxis1);
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left)
        .attr("x", - height + vertical_pad)
        .attr("dy", "1em")
        .attr("fill", color1)
        .attr("font-family", "sans-serif") 
        .attr("font-size", "16px")
        .text(key_list[0] + " in " + unit.split(",")[0]);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width  + "," + vertical_pad/2 + ")")
        .call(yAxis2);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width + margin.right)
        .attr("x", - height + vertical_pad)
        .attr("dy", "1em")
        .attr("fill", color2)
        .attr("font-family", "sans-serif") 
        .attr("font-size", "16px")
        .text(key_list[1] + " in " + unit.split(",")[1]);
}
