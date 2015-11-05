/*
 * Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global GraphSelector, MashupPlatform, StyledElements, $ */


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
        this.current_graph_type = null;
        this.group_axis_select = null;
        this.series_div = null;
        this.dataset = null;     //The dataset to be used. {structure: {...}, data: {...}, metadata: {...}}
        this.column_info = null;
        this._3axis_alternative = null;

        // Recieve events for the "dataset" input endpoint
        MashupPlatform.wiring.registerCallback('dataset', function (data) {
            this.data_tab.enable();
            showSeriesInfo.call(this, data);
        }.bind(this));

        // Repaint on size change
        MashupPlatform.widget.context.registerCallback(function (changes) {
            if ('widthInPixels' in changes || 'heightInPixels' in changes) {
                this.layout.repaint();
            }
        }.bind(this));
    };

    /* ==================================================================================
     *  PUBLIC METHODS
     * ================================================================================== */

    var build_normal_form_alternative = function build_normal_form_alternative(container) {
        // Create the group column title
        var group_title = document.createElement('h3');
        group_title.innerHTML = 'Axis X';
        container.appendChild(group_title);

        // Create the group column select
        this.group_axis_select = new StyledElements.Select({'class': 'full'});
        this.group_axis_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.group_axis_select);

        // Create the series title
        var series_title = document.createElement('h3');
        series_title.innerHTML = 'Axis Y';
        container.appendChild(series_title);

        // Create the div where the series will be inserted
        this.series_div = document.createElement('div');
        container.appendChild(this.series_div);
    };

    var build_3axis_form_alternative = function build_3axis_form_alternative(container) {
        var group_title;

        // TODO 3-axis graphs (bubble charts)
        group_title = document.createElement('h3');
        group_title.innerHTML = 'Axis X';
        container.appendChild(group_title);
        this.axisx_select = new StyledElements.Select({'class': 'full'});
        this.axisx_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.axisx_select);

        group_title = document.createElement('h3');
        group_title.innerHTML = 'Axis Y';
        container.appendChild(group_title);
        this.axisy_select = new StyledElements.Select({'class': 'full'});
        this.axisy_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.axisy_select);

        group_title = document.createElement('h3');
        group_title.innerHTML = 'Size Axis';
        container.appendChild(group_title);
        this.axisz_select = new StyledElements.Select({'class': 'full'});
        this.axisz_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.axisz_select);

        group_title = document.createElement('h3');
        group_title.innerHTML = 'Series field';
        container.appendChild(group_title);
        this.series_field_select = new StyledElements.Select({'class': 'full'});
        this.series_field_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.series_field_select);

        group_title = document.createElement('h3');
        group_title.innerHTML = 'Name of the bubble';
        container.appendChild(group_title);
        this.id_bubble_select = new StyledElements.Select({'class': 'full'});
        this.id_bubble_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.id_bubble_select);
    };


    var showMsg = function showMsg(msg, type, callback) {
        var alertDiv = document.getElementById("alert");

        if (type.toLowerCase() == "warning") {
            alertDiv.innerHTML = "<strong>Warning: </strong>" + msg;
            alertDiv.className += " alert-warning";
        }else if (type.toLowerCase() == "success") {
            alertDiv.innerHTML = "";
            alertDiv.appendChild(document.createTextNode(msg));
            alertDiv.className += " alert-success";
        }

        setTimeout(function () {
            alertDiv.className = "alert";
            if (callback) {
                callback.call(this);
            }
        }, 2000);
    };

    var enable_mashup_buttons = function enable_mashup_buttons() {
        var elements = this.graph_selector.subcontainer.querySelectorAll(".graph-button.active");
        if (elements.length != 1) {
            window.console.log("Error");
        }
        var elementtype = "." + elements[0].classList[1];
        var searchIn = function searchIn(list, elem) {
            var i;
            for (i = 0; i < list.length; i++) {
                if (elem === list[i]) {
                    return true;
                }
            }
            return false;
        };

        var googleHave = searchIn(selectorsGoogleCharts, elementtype);
        var flotr2Have = searchIn(selectorsFlotr2, elementtype);

        this.googleButton.disable();
        this.flotr2Button.disable();
        if (googleHave) {
            this.googleButton.enable();
        }

        if (flotr2Have) {
            this.flotr2Button.enable();
        }
    };

    var createWorkspace = function createWorkspace(mashupname) {
        if (this.dataset.metadata == null || this.dataset.metadata.id == null || this.dataset.metadata.ckan_server == null) {
            showMsg.call(this, "The data received don't have metadata,  I can't create the workspace", "warning");
        }

        var resource = this.dataset.metadata.id;
        var ckan_server = this.dataset.metadata.ckan_server;

        var preferences = {
            graph_type: this.current_graph_type,
            graph_fields: {
                group_column: this.group_axis_select.getValue()
            },
            graph_series: [],
            resource: resource,
            ckan_server: ckan_server
        };

        if (preferences.graph_type === 'bubblechart') {
            preferences.graph_fields.axisx_field = this.axisx_select.getValue();
            preferences.graph_fields.axisy_field = this.axisy_select.getValue();
            preferences.graph_fields.axisz_field = this.axisz_select.getValue();
            preferences.graph_fields.series_field = this.series_field_select.getValue();
            preferences.graph_fields.id_bubble = this.id_bubble_select.getValue();
            preferences.graph_series = get_bubble_series.call(this);

        }else {
            preferences.graph_series = get_general_series.call(this);
        }

        //We check that there are no fields unfinished
        if (preferences.graph_series.length === 0) {
            showMsg.call(this, "Can not create dashboard, a required field is empty.", "warning");
            return;
        }

        for (var field in preferences.graph_fields) {
            if (preferences.graph_fields[field] == null) {
                showMsg.call(this, "Can not create dashboard, a required field is empty.", "warning");
                return;
            }
        }

        //Convert the preferences that are not text to JSON
        preferences.graph_series = JSON.stringify(preferences.graph_series);
        preferences.graph_fields = JSON.stringify(preferences.graph_fields);

        MashupPlatform.mashup.createWorkspace({
            name: this.nameinput.getValue(),
            mashup: 'CoNWeT/' + mashupname + '/1.0.0',
            preferences: preferences,
            onSuccess: function (workspace) {
                var msg = "Dashboard " + workspace.name + " created successfully.";
                MashupPlatform.widget.log(msg, MashupPlatform.log.INFO);
                showMsg(msg, "success");
            },
            onFailure: function (msg) {
                MashupPlatform.widget.log("Could not create the workspace:\n " + msg);
                showMsg("Could not create the workspace:<br/>" + msg, "warning");
            }
        });
    };

    Widget.prototype.init = function init() {
        this.layout = new StyledElements.Notebook({'class': 'se-notebook-crumbs'});
        this.layout.insertInto(document.body);

        var chart_tab = this.layout.createTab({name: "1. Chart", closable: false});
        this.data_tab = this.layout.createTab({name: "2. Data", closable: false});
        this.workspace_tab = this.layout.createTab({name: "3. Dashboard", closable: false});
        this.data_tab.disable();
        this.workspace_tab.disable();
        this.workspace_tab.getTabElement().addEventListener("click", enable_mashup_buttons.bind(this), false);

        var mashup_panel = document.createElement('div');
        mashup_panel.className = "mashup_panel";
        var temp_p = document.createElement('p');
        temp_p.appendChild(document.createTextNode("If you have finished, you can create a new dashboard now."));
        mashup_panel.appendChild(temp_p);

        var temp_d = document.createElement("label");
        temp_d.appendChild(document.createTextNode("Name:  "));

        this.nameinput = new StyledElements.TextField();
        this.nameinput.setValue("CKAN Wirecloud View").appendTo(temp_d);

        mashup_panel.appendChild(temp_d);

        this.googleButton = new StyledElements.Button({text: 'Create dashboard with Google Graph', class: 'btn-success'});
        this.googleButton.insertInto(mashup_panel);

        this.workspace_tab.appendChild(mashup_panel);

        this.googleButton.addEventListener("click", function () {
            createWorkspace.call(this, "CKAN Wirecloud Google View");
        }.bind(this));

        this.googleButton.disable();

        this.flotr2Button = new StyledElements.Button({text: 'Create dashboard with flotr Graph', class: 'btn-success'});
        this.flotr2Button.insertInto(mashup_panel);

        this.workspace_tab.appendChild(mashup_panel);

        this.flotr2Button.addEventListener("click", function () {
            createWorkspace.call(this, "CKAN Wirecloud flotr2 view");
        }.bind(this));

        this.flotr2Button.disable();

        // create the data selection tab
        // The graph selection tab depends on the data selection tab, so it must be build first
        this.data_form_alternatives = new StyledElements.Alternatives();
        this.data_tab.appendChild(this.data_form_alternatives);

        this.normal_form_alternative = this.data_form_alternatives.createAlternative();
        build_normal_form_alternative.call(this, this.normal_form_alternative);

        this._3axis_alternative = this.data_form_alternatives.createAlternative();
        build_3axis_form_alternative.call(this, this._3axis_alternative);

        // Create the graph selection tab
        this.graph_selector = new GraphSelector(chart_tab, function (graph_type) {
            this.current_graph_type = graph_type;

            if (this.current_graph_type === 'bubblechart') {
                this.data_form_alternatives.showAlternative(this._3axis_alternative);
            } else {
                this.data_form_alternatives.showAlternative(this.normal_form_alternative);
            }
            create_graph_config.call(this);
        }.bind(this));

        update_available_wiring.call(this);
        MashupPlatform.wiring.registerStatusCallback(update_available_wiring.bind(this));
        // Repaint the layout (needed)
        this.layout.repaint();
    };

    /* ==================================================================================
     *  PRIVATE METHODS
     * ================================================================================== */

    var update_available_wiring = function update_available_wiring() {
        // Check that endpoints are connected
        disable_all.call(this);
        if (MashupPlatform.widget.outputs["flotr2-graph-config"].connected) {
            enable_graphs_flotr2.call(this);
        }
        if (MashupPlatform.widget.outputs['googlecharts-graph-config'].connected) {
            enable_graphs_googlecharts.call(this);
        }
    };

    var get_general_series = function get_general_series() {
        var series_checkboxes = document.getElementsByName('series');
        var i;
        var series = [];

        //Get the selected checkboxes
        for (i = 0; i < series_checkboxes.length; i++) {
            if (series_checkboxes[i].checked) {
                series.push(series_checkboxes[i].value);
            }
        }

        return series;
    };

    var get_bubble_series = function get_bubble_series() {
        var series_field = this.series_field_select.getValue();
        var series = {};
        var row;

        for (var i = 0; i < this.dataset.data.length; i++) {
            row = this.dataset.data[i];
            series[row[series_field]] = true;
        }

        return Object.keys(series);
    };

    var create_graph_config = function create_graph_config() {
        var series;

        if (this.current_graph_type === 'bubblechart') {
            series = get_bubble_series.call(this);
        } else {
            series = get_general_series.call(this);
        }

        if (series.length > 0) {
            this.workspace_tab.enable();
            create_flotr2_config.call(this, series);
            create_google_charts_config.call(this, series);
        }
    };

    var disable_all = function disable_all() {
        $(".graph-button").each(function (i, obj) {
            obj.classList.add("disabled");
        });
    };

    var selectorsFlotr2 = [
        '.lineargraph',
        '.linechart',
        '.radarchart',
        '.areagraph',
        '.areachart',
        '.columngraph',
        '.columnchart',
        '.columnchart-stacked',
        '.bargraph',
        '.barchart',
        '.barchart-stacked',
        '.scattergraph',
        '.bubblechart',
        '.piegraph',
        '.piechart'
    ];

    var selectorsGoogleCharts = [
        '.lineargraph',
        '.linechart',
        '.linechart-smooth',
        '.combochart',
        '.areagraph',
        '.areachart',
        '.areachart-stacked',
        '.steppedareachart',
        '.columngraph',
        '.columnchart',
        '.columnchart-stacked',
        '.histogram',
        '.bargraph',
        '.barchart',
        '.barchart-stacked',
        '.scattergraph',
        '.scatterchart',
        '.bubblechart',
        '.piegraph',
        '.piechart',
        '.piechart-3d',
        '.donutchart',
        '.geograph',
        '.geochart',
        '.geochart-markers'
    ];

    var enable_graphs_flotr2 = function enable_graphs_flotr2() {
        var graphsFlotr2 = document.body.querySelectorAll(selectorsFlotr2);

        for (var i = 0; i < graphsFlotr2.length; i++) {
            graphsFlotr2[i].classList.remove("disabled");
        }
    };

    var enable_graphs_googlecharts = function enable_graphs_googlecharts() {
        var graphsGoogle = document.body.querySelectorAll(selectorsGoogleCharts);

        for (var j = 0; j < graphsGoogle.length; j++) {
            graphsGoogle[j].classList.remove("disabled");
        }
    };

    var create_flotr2_config = function create_flotr2_config(series) {
        var i, j, row;
        var graph_type = this.current_graph_type;
        var group_column = this.group_axis_select.getValue();
        var data = {};        //Contains all the series that wil be shown in the graph
        var ticks = [];       //When string are used as group column, we need to format the values
        var series_meta = {}; //Contails the name of the datasets
        var group_column_axis = (graph_type == 'bargraph') ? 'yaxis' : 'xaxis';

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
            data[i] = [];
            series_meta[i] = {
                label: series[i]
            };
        }

        if (graph_type === 'bubblechart') {
            var axisx_field = this.axisx_select.getValue();
            var axisy_field = this.axisy_select.getValue();
            var axisz_field = this.axisz_select.getValue();
            var series_field = this.series_field_select.getValue();

            for (j = 0; j < this.dataset.data.length; j++) {
                row = this.dataset.data[j];
                var serie = row[series_field];
                data[series.indexOf(serie)].push([Number(row[axisx_field]), Number(row[axisy_field]) , Number(row[axisz_field])]);
            }
        } else {
            for (i = 0; i < series.length; i++) {
                for (j = 0; j < this.dataset.data.length; j++) {
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
                    if (graph_type === 'bargraph') {
                        data[i].push([Number(row[series[i]]), group_column_value]);
                    } else {
                        data[i].push([group_column_value, Number(row[series[i]])]);
                    }
                }
            }
        }

        //FlotR2 configuration
        var htmltext = false;
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

        if (['linechart', 'areachart'].indexOf(graph_type) !== -1) {
            flotr2Config.config.lines = {
                show: true,
                fill: graph_type === 'areachart'
            };

        } else if (graph_type === 'radarchart') {
            flotr2Config.config.radar = {
                show: true
            };
            flotr2Config.config.grid = {
                circular: true,
                minorHorizontalLines: true
            };

        } else if (['columnchart', 'columnchart-stacked', 'barchart', 'barchart-stacked'].indexOf(graph_type) !== -1) {
            var horizontal = ['barchart', 'barchart-stacked'].indexOf(graph_type) !== -1;
            var stacked = ['columnchart-stacked', 'barchart-stacked'].indexOf(graph_type) !== -1;

            flotr2Config.config.bars = {
                show: true,
                horizontal: horizontal,
                stacked: stacked,
                barWidth: 0.5,
                lineWidth: 1,
                shadowSize: 0
            };

        } else if (graph_type === 'bubblechart') {
            flotr2Config.config.bubbles = {
                show: true,
                baseRadius: 5
            };

        } else if (graph_type === 'piechart') {
            flotr2Config.config.pie = {
                show: true,
                explode: 6
            };
        }

        MashupPlatform.wiring.pushEvent('flotr2-graph-config', JSON.stringify(flotr2Config));
    };

    var parse_google_data = function parse_google_data(column, value) {
        if (this.column_info[column].type === 'number') {
            return Number(value);
        } else {
            return value;
        }
    };

    var create_google_charts_config = function create_google_charts_config(series) {
        var i, j, dataset_row, row;
        var graph_type = this.current_graph_type;
        var group_column = this.group_axis_select.getValue();
        var data = [];        //Contains all the series that wil be shown in the graph

        // Format data
        if (graph_type === 'bubblechart') {
            var axisx_field = this.axisx_select.getValue();
            var axisy_field = this.axisy_select.getValue();
            var axisz_field = this.axisz_select.getValue();
            var series_field = this.series_field_select.getValue();
            var id_bubble = this.id_bubble_select.getValue();

            // Header
            data.push([id_bubble, axisx_field, axisy_field, series_field, axisz_field]);
            // Data
            for (j = 0; j < this.dataset.data.length; j++) {
                row = this.dataset.data[j];
                var serie = row[series_field];
                data.push([row[id_bubble], Number(row[axisx_field]), Number(row[axisy_field]), serie, Number(row[axisz_field])]);
            }
        } else {
            data.push([group_column].concat(series));
            for (i = 0; i < this.dataset.data.length; i++) {
                dataset_row = this.dataset.data[i];
                row = [parse_google_data.call(this, group_column, dataset_row[group_column])];
                for (j = 0; j < series.length; j++) {
                    row.push(parse_google_data.call(this, series[j], dataset_row[series[j]]));
                }
                data.push(row);
            }
        }

        // Google Charts base configuration
        var googlechartsConfig = {
            options: {},
            data: data
        };

        // Chart specific configurations
        if (['linechart', 'linechart-smooth'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'LineChart';
            if (graph_type === 'linechart-smooth') {
                googlechartsConfig.options.curveType = 'function';
            }

        } else if (graph_type === 'combochart') {
            // TODO
            googlechartsConfig.type = 'ComboChart';
            googlechartsConfig.options.seriesType = 'bars';
            googlechartsConfig.options.series =  googlechartsConfig.type = 'line';
            // END TODO

        } else if (['areachart', 'areachart-stacked'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'AreaChart';
            googlechartsConfig.options.isStacked = graph_type === 'areachart-stacked';

        } else if (graph_type === 'steppedareachart') {
            googlechartsConfig.type = 'SteppedAreaChart';

        } else if (['columnchart', 'columnchart-stacked'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'ColumnChart';
            googlechartsConfig.options.isStacked = graph_type === 'columnchart-stacked';

        } else if (['barchart', 'barchart-stacked'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'BarChart';
            googlechartsConfig.options.isStacked = graph_type === 'barchart-stacked';

        } else if (graph_type === 'histogram') {
            googlechartsConfig.type = 'Histogram';

        } else if (graph_type === 'scatterchart') {
            googlechartsConfig.type = 'ScatterChart';

        } else if (graph_type === 'bubblechart') {
            googlechartsConfig.type = 'BubbleChart';
            googlechartsConfig.options.bubble = {textStyle: {fontSize: 11}};

        } else if (['piechart', 'piechart-3d', 'donutchart'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'PieChart';
            googlechartsConfig.options.is3D = graph_type === 'piechart-3d';
            if (graph_type === 'donutchart') {
                googlechartsConfig.options.pieHole = 0.5;
            }

        } else if (['geochart', 'geochart-markers'].indexOf(graph_type) !== -1) {
            googlechartsConfig.type = 'GeoChart';
            if (graph_type === 'geochart-markers') {
                googlechartsConfig.displayMode = 'markers';
            }
        }

        MashupPlatform.wiring.pushEvent('googlecharts-graph-config', JSON.stringify(googlechartsConfig));
    };

    var showSeriesInfo = function showSeriesInfo(dataset_json) {
        this.dataset = JSON.parse(dataset_json);
        this.column_info = {};

        // Fields Name
        var fields = [];
        for (var i = 0; i < this.dataset.structure.length; i++) {
            var id = this.dataset.structure[i].id;
            if (id !== '_id') {
                fields.push(id);
            }
            this.column_info[id] = this.dataset.structure[i];
        }

        // Create the elements in the selector
        var entries = [];
        for (i = 0; i < fields.length; i++) {
            entries.push({label: fields[i], value: fields[i]});
        }

        this.group_axis_select.clear();
        this.group_axis_select.addEntries(entries);

        // TODO
        this.axisx_select.clear();
        this.axisx_select.addEntries(entries);
        this.axisy_select.clear();
        this.axisy_select.addEntries(entries);
        this.axisz_select.clear();
        this.axisz_select.addEntries(entries);
        this.series_field_select.clear();
        this.series_field_select.addEntries(entries);
        this.id_bubble_select.clear();
        this.id_bubble_select.addEntries(entries);
        // END TODO

        // Add the series
        this.series_div.innerHTML = '';
        for (i = 0; i < fields.length; i++) {

            /* TODO check if this make sense */
            if (this.column_info[fields[i]].type !== 'number') {
                continue;
            }
            var label = document.createElement('label');

            var checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('name', 'series');
            checkbox.setAttribute('value', fields[i]);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(fields[i]));

            this.series_div.appendChild(label);
            this.series_div.appendChild(document.createElement('br'));

            checkbox.addEventListener('change', create_graph_config.bind(this));
        }
    };

    return Widget;

})();
