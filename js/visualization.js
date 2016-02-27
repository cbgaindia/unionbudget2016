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
        .defer(d3.csv, "data/composition_and_structure_of_transfer_of_resources_to_states.csv")
        .defer(d3.csv, "data/social_sector_expenditures_by_union_government.csv")
        .defer(d3.csv, "data/social_sector_expenditure_as_share_of_aggregate_disbursements_by_states.csv")
        .await(populateTableData);
        //.await(drawViz(table_list, composition_and_structure_of_transfer_of_resources_to_states));
    function populateTableData(error, table_list, composition_and_structure_of_transfer_of_resources_to_states, social_sector_expenditures_by_union_government, social_sector_expenditure_as_share_of_aggregate_disbursements_by_states){
        table_data["composition_and_structure_of_transfer_of_resources_to_states"] = composition_and_structure_of_transfer_of_resources_to_states
        table_data["social_sector_expenditures_by_union_government"] = social_sector_expenditures_by_union_government
        table_data["social_sector_expenditure_as_share_of_aggregate_disbursements_by_states"] = social_sector_expenditure_as_share_of_aggregate_disbursements_by_states
        populateNavPanel(table_list, table_data);
    }
    function drawViz(table_list, table_data){
    }       
}
 
function populateNavPanel(table_list, table_data) {
    var categoryTemplate = _.template('<h4 class="hidden-xs"><%- table.name  %></h4><ul class="nav nav-pills nav-stacked layer-toggle-menu hidden-xs <%= table.id  %>-menu"><ul>', {variable: 'table'}),
        fieldTemplate = _.template('<li><a parent="<%= field.parent  %>" index="<%= field.index_id %>" href="#"><%- field.index_name %></li>', {variable: 'field'});
    var $panel = $('#nav-panel');
    _.chain(table_list).groupBy('name').each(function (tables){
        _.forEach(tables, function(table){
            $panel.append(categoryTemplate(table));
            var $menu = $('.' + table.id + '-menu');
            var field_index_id = 0;
            _.chain(table_data[table.id]).groupBy('index_name').each(function (fields){
                _.forEach(fields, function(field){
                    field["parent"] = table["id"];
                    field["index_id"] = field_index_id;
                    field["source"] = table["source"];
                    $menu.append(fieldTemplate(field));
                    field_index_id = field_index_id + 1;
                });
            });
        });
    });

    $(".layer-toggle-menu > li").on("click", "a", function(e){
        e.preventDefault();
        if (!$(this).parent().hasClass('disabled')){
            currentMetric=(typeof $(this).attr("index")==="undefined")?null:$(this).attr("index");
            parentMetric=(typeof $(this).attr("parent")==="undefined")?null:$(this).attr("parent");
            //getSource(source_data,currentMetric);
            changeDataViz(currentMetric, parentMetric, table_data);
            $(this).parent().addClass("selected").siblings().removeClass("selected");
            $("#legend-panel").show();
            $("#details p.lead").show();
        }
    });
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

function changeDataViz(index_id, parent_id, table_data){
    $("#content").html(""); 
    $(".unit").html("Unit: " + table_data[parent_id][index_id]["unit"]); 
    $("#visualized-measure").html(table_data[parent_id][index_id]["index_name"]);
    $("#source-title").html("<i>Source:</i> " + table_data[parent_id][index_id]["source"]);
    index = parseInt(index_id);
    skip_keys = {"index_id":0, "index_name":0, "unit":0, "insights":0, "parent":0, "source":0}
    chart_data = []
    for (var key in table_data[parent_id][index]){
        if(!(key in skip_keys)){
            data_value = table_data[parent_id][index][key]
            if(data_value.indexOf('.') === -1){  
                chart_data.push({"key":key, "value":parseInt(data_value, 10)}); 
            }else{
                chart_data.push({"key":key, "value":parseFloat(data_value, 10)}); 
            }
        }
    }
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

    console.log(chart_data);
}
