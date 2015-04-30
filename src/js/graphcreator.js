/*
 *     Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 */

/* jshint unused:false */
/* global MashupPlatform, StyledElements */


window.Widget = (function () {

    'use strict';

    /**
     * Create a new instance of class Widget.
     * @class
     */
    var Widget = function Widget() {
        this.layout = null;
        this.group_title = null;
        this.series_title = null;
        this.graph_select = null;
        this.group_axis_select = null;
        this.series_div = null;
        this.dataset = null;     //The dataset to be used. {structure: {...}, data: {...}}

        // Recieve events for the "dataset" input endpoint
        MashupPlatform.wiring.registerCallback('dataset', showSeriesInfo.bind(this));

        // Repaint on size change
        MashupPlatform.widget.context.registerCallback(function (changes) {
            if ('widthInPixels' in changes || 'heightInPixels' in changes) {
                this.layout.repaint();
            }
        }.bind(this));
    };

    /* ==================================================================================
     *  CONSTANTS
     * ================================================================================== */

    var LINES = 'Lines';
    var LINES_POINTS = 'Lines and Points';
    var POINTS = 'Points';
    var BARS = 'Bars';
    var COLUMNS = 'Columns';
    var GRAPH_TYPES = [LINES, LINES_POINTS, POINTS, BARS, COLUMNS];
    var GOOGLECHARTS_TYPE_MAPPING = {
            'Lines': 'LineChart',
            'Lines and Points': 'LineChart',
            'Points': 'ScatterChart',
            'Bars': 'BarChart',
            'Columns': 'ColumnChart'
    };

    /* ==================================================================================
     *  PUBLIC METHODS
     * ================================================================================== */

    Widget.prototype.init = function init() {
        this.layout = new StyledElements.StyledNotebook();
        this.layout.insertInto(document.body);

        var chart_tab = this.layout.createTab({name: "Chart", closable: false});

        // Create the select
        this.graph_select = new StyledElements.StyledSelect({'class': 'full'});
        this.graph_select.addEventListener('change', create_graph_config);
        chart_tab.appendChild(this.graph_select);

        // Append types
        var entries = [];
        GRAPH_TYPES.forEach(function (type) {
            entries.push({label: type, value: type});
        });
        this.graph_select.addEntries(entries);

        var data_tab = this.layout.createTab({name: "Data", closable: false});

        // Create the group column title
        this.group_title = document.createElement('h3');
        this.group_title.innerHTML = 'Group Column (Axis 1)';
        data_tab.appendChild(this.group_title);

        // Create the group column select
        this.group_axis_select = new StyledElements.StyledSelect({'class': 'full'});
        this.group_axis_select.addEventListener('change', create_graph_config);
        data_tab.appendChild(this.group_axis_select);

        // Create the series title
        this.series_title = document.createElement('h3');
        this.series_title.innerHTML = 'Series (Axis 2)';
        data_tab.appendChild(this.series_title);

        // Create the div where the series will be inserted
        this.series_div = document.createElement('div');
        data_tab.appendChild(this.series_div);

        // Repaint the layout (needed)
        this.layout.repaint();

        // Recieve events for the "dataset" input endpoint
        //MashupPlatform.wiring.registerCallback('dataset', showSeriesInfo);

        // Repaint on size change
        //MashupPlatform.widget.context.registerCallback(function (changes) {
        //    if ('widthInPixels' in changes || 'heightInPixels' in changes) {
        //        this.layout.repaint();
        //    }
        //});
    };

    /* ==================================================================================
     *  PRIVATE METHODS
     * ================================================================================== */

    var create_graph_config = function create_graph_config() {

        var series_checkboxes = document.getElementsByName('series');
        var series = [];

        //Get the selected checkboxes
        for (var i = 0; i < series_checkboxes.length; i++) {
            if (series_checkboxes[i].checked) {
                series.push(series_checkboxes[i].value);
            }
        }
        if (series.length > 0) {
            create_flotr2_config(series);
            create_google_charts_config(series);
        }
    };

    var create_flotr2_config = function create_flotr2_config(series) {

        var i, row;
        var graph_type = this.graph_select.getValue();
        var group_column = this.group_axis_select.getValue();
        var data = {};        //Contains all the series that wil be shown in the graph
        var ticks = [];       //When string are used as group column, we need to format the values
        var series_meta = {}; //Contails the name of the datasets
        var show_lines = (graph_type == LINES || graph_type == LINES_POINTS) ? true : false;
        var show_points = (graph_type == POINTS || graph_type == LINES_POINTS) ? true : false;
        var group_column_axis = graph_type == BARS ? 'yaxis' : 'xaxis';

        //Group Column type
        var group_column_type = null;
        for (i = 0; i < this.dataset.structure.length && group_column_type == null; i++) {
            var field = this.dataset.structure[i];
            if (field.id == group_column) {
                group_column_type = field.type;
            }
        }

        //Is the Group Column an interger or a float?
        var group_column_float = false;
        for (i = 0; i < this.dataset.data.length && !group_column_float; i++) {
            row = this.dataset.data[i];
            if (row[group_column] % 1 !== 0) {
                group_column_float = true;
            }
        }

        //Create the series
        for (i = 0; i < series.length; i++) {

            var serie = [];
            var serie_name = series[i];

            for (var j = 0; j < this.dataset.data.length; j++) {
                row = this.dataset.data[j];
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

        MashupPlatform.wiring.pushEvent('flotr2-graph-config', JSON.stringify(flotr2Config));
    };

    var create_google_charts_config = function create_google_charts_config(series) {

        var i, j, dataset_row, row;
        var graph_type = this.graph_select.getValue();
        var group_column = this.group_axis_select.getValue();
        var data = [];        //Contains all the series that wil be shown in the graph
        var show_points = (graph_type == POINTS || graph_type == LINES_POINTS) ? true : false;

        //var seriesInput = JSON.parse(series); // Parsear los datos que se reciben para que se pueda dibujar la gráfica

        // Format data
        data.push([group_column].concat(series)); // Modificar series
        for (i = 0; i < this.dataset.data.length; i++) {
            dataset_row = this.dataset.data[i];
            row = [dataset_row[group_column]];
            for (j = 0; j < series.length; j++) {
                row.push(dataset_row[series[j]]);
            }
            data.push(row);
        }

        // Google Charts configuration
        var googlechartsConfig = {
            type: GOOGLECHARTS_TYPE_MAPPING[graph_type],
            options: {},
            data: data
        };

        //Configure the bar chart
        if (graph_type === LINES_POINTS) {
            googlechartsConfig.options.pointSize = 3;
        }

        MashupPlatform.wiring.pushEvent('googlecharts-graph-config', JSON.stringify(googlechartsConfig));
    };

    var showSeriesInfo = function showSeriesInfo(dataset_json) {

        this.dataset = JSON.parse(dataset_json);

        // Fields Name
        var fields = [];
        for (var i = 0; i < this.dataset.structure.length; i++) {
            var id = this.dataset.structure[i].id;
            if (id !== '_id') {
                fields.push(id);
            }
        }

        // Create the elements in the selector
        var entries = [];
        for (i = 0; i < fields.length; i++) {
            entries.push({label: fields[i], value: fields[i]});
        }

        this.group_axis_select.clear();
        this.group_axis_select.addEntries(entries);

        // Add the series
        this.series_div.innerHTML = '';
        for (i = 0; i < fields.length; i++) {

            var label = document.createElement('label');

            var checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('name', 'series');
            checkbox.setAttribute('value', fields[i]);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(fields[i]));

            this.series_div.appendChild(label);
            this.series_div.appendChild(document.createElement('br'));

            checkbox.addEventListener('change', create_graph_config);
        }
    };

    return Widget;

})();
