/*global MashupPlatform, StyledElements*/

(function () {

    'use strict';

    var layout, group_title, series_title, graph_select, group_axis_select, series_div;

    var dataset = null;     //The dataset to be used. {structure: {...}, data: {...}}

    var LINES = 'Lines';
    var LINES_POINTS = 'Lines and Points';
    var POINTS = 'Points';
    var BARS = 'Bars';
    var COLUMNS = 'Columns';
    var GRAPH_TYPES = [LINES, LINES_POINTS, POINTS, BARS, COLUMNS];

    var createGraph = function createGraph() {

        var i, row;
        var graph_type = graph_select.getValue();
        var group_column = group_axis_select.getValue();
        var series = [];      //Contains all the series data
        var data = {};        //Contains all the series that wil be shown in the graph
        var ticks = [];       //When string are used as group column, we need to format the values
        var series_meta = {}; //Contails the name of the datasets
        var show_lines = (graph_type == LINES || graph_type == LINES_POINTS) ? true : false;
        var show_points = (graph_type == POINTS || graph_type == LINES_POINTS) ? true : false;
        var group_column_axis = graph_type == BARS ? 'yaxis' : 'xaxis';

        var series_checkboxes = document.getElementsByName('series');

        //Get the selected checkboxes
        for (i = 0; i < series_checkboxes.length; i++) {
            if (series_checkboxes[i].checked) {
                series.push(series_checkboxes[i].value);
            }
        }

        //Group Column type
        var group_column_type = null;
        for (i = 0; i < dataset.structure.length && group_column_type == null; i++) {
            var field = dataset.structure[i];
            if (field.id == group_column) {
                group_column_type = field.type;
            }
        }

        //Is the Group Column an interger or a float?
        var group_column_float = false;
        for (i = 0; i < dataset.data.length && !group_column_float; i++) {
            row = dataset.data[i];
            if (row[group_column] % 1 !== 0) {
                group_column_float = true;
            }
        }

        //Create the series
        for (i = 0; i < series.length; i++) {

            var serie = [];
            var serie_name = series[i];

            for (var j = 0; j < dataset.data.length; j++) {
                row = dataset.data[j];
                var group_column_value = row[group_column];

                //Numbers codified as strings must be transformed in real JS numbers
                //Just in case the previous widget/operator hasn't done it.
                switch (group_column_type) {
                    case 'number':
                        group_column_value = Number(group_column_value);
                        break;
                    default:
                        //Ticks should be only introduced once
                        if (i === 0) {
                            ticks.push([j, group_column_value]);
                        }
                        group_column_value = j;
                        break;
                }

                //In the bars graph the data should be encoded the other way around
                //Transformation into numbers is automatic since a graph should be
                //build with numbers
                if (graph_type === BARS) {
                    serie.push([Number(row[serie_name]), group_column_value]);
                } else {
                    serie.push([group_column_value, Number(row[serie_name])]);
                }
            }

            data[i] = serie;
            series_meta[i] = {
                label: serie_name,
                points: {show: show_points},
                lines: {show: show_lines}
            };
        }

        //FlotR2 configuration
        var htmltext = /*group_column_type != numeric : true : */false;
        var flotr2Config = {
            config: {
                mouse: {
                    track: true,
                    relative: true
                },
                HtmlText: htmltext,
            },
            datasets: series_meta,
            data: data
        };

        //Configure the group column (X except for when selected graph is a Bar chart)
        flotr2Config.config[group_column_axis] = {
            labelsAngle: 45,
            ticks: ticks.length !== 0 ? ticks : null,
            noTicks: data[0].length,
            title:  group_column,
            showLabels: true,
            //If the group_column data contains at least one float: 2 decimals. Otherwise: 0
            tickDecimals: group_column_float ? 2 : 0
        };

        //Configure the bar chart
        if (graph_type === BARS || graph_type === COLUMNS) {
            var horizontal = graph_type === BARS ? true : false;

            flotr2Config.config.bars = {
                show: true,
                horizontal: horizontal,
                barWidth: 0.6,
                lineWidth: 1,
                shadowSize: 0
            };
        }

        MashupPlatform.wiring.pushEvent('graphConfig', JSON.stringify(flotr2Config));
    };

    var showSeriesInfo = function showSeriesInfo(dataset_json) {

        // Clear the current information
        group_axis_select.clear();
        series_div.innerHTML = '';

        // The information is saved globally
        dataset = JSON.parse(dataset_json);

        // Fields Name
        var fields = [];
        for (var i = 0; i < dataset.structure.length; i++) {
            var id = dataset.structure[i].id;
            if (id !== '_id') {
                fields.push(id);
            }
        }

        // Create the elements in the selector
        var entries = [];
        for (i = 0; i < fields.length; i++) {
            entries.push({label: fields[i], value: fields[i]});
        }

        group_axis_select.addEntries(entries);

        // Capture select change
        group_axis_select.addEventListener('change', createGraph);

        // Add the series
        for (i = 0; i < fields.length; i++) {

            var label = document.createElement('label');

            var checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('name', 'series');
            checkbox.setAttribute('value', fields[i]);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(fields[i]));

            series_div.appendChild(label);
            series_div.appendChild(document.createElement('br'));

            checkbox.addEventListener('change', createGraph);
        }

    };

    var init = function init() {
        layout = new StyledElements.BorderLayout();
        layout.insertInto(document.body);

        //Create the graph selector
        var graph_select_title = document.createElement('h3');
        graph_select_title.innerHTML = 'Graph Type';
        layout.getCenterContainer().appendChild(graph_select_title);

        //Create the select
        graph_select = new StyledElements.StyledSelect({'class': 'full'});
        graph_select.addEventListener('change', createGraph);
        layout.getCenterContainer().appendChild(graph_select);

        //Append types
        var entries = [];
        GRAPH_TYPES.forEach(function (type) {
            entries.push({label: type, value: type});
        });
        graph_select.addEntries(entries);

        //Create the group column title
        group_title = document.createElement('h3');
        group_title.innerHTML = 'Group Column (Axis 1)';
        layout.getCenterContainer().appendChild(group_title);

        //Create the group column select
        group_axis_select = new StyledElements.StyledSelect({'class': 'full'});
        group_axis_select.addEventListener('change', createGraph);
        layout.getCenterContainer().appendChild(group_axis_select);

        //Create the series title
        series_title = document.createElement('h3');
        series_title.innerHTML = 'Series (Axis 2)';
        layout.getCenterContainer().appendChild(series_title);

        //Create the div where the series will be inserted
        series_div = document.createElement('div');
        layout.getCenterContainer().appendChild(series_div);

        //Repaint the layout (needed)
        layout.repaint();

        //Recieve events for the "dataset" input endpoint
        MashupPlatform.wiring.registerCallback('dataset', showSeriesInfo);

        //Repaint on size change
        MashupPlatform.widget.context.registerCallback(function (changes) {
            if ('widthInPixels' in changes || 'heightInPixels' in changes) {
                layout.repaint();
            }
        });
    };

    //Start the execution when the DOM is enterely loaded
    document.addEventListener('DOMContentLoaded', init.bind(this), true);
})();
