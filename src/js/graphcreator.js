/*
 * Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals GraphSelector, StyledElements, HighChartConfigurer, GoogleChartConfigurer, Flotr2Configurer */


window.Widget = (function () {

    'use strict';

    /**
     * Create a new instance of class Widget.
     * @class
     */
    var Widget = function Widget() {
        this.layout = null;
        this.group_title = null;
        this.current_graph_type = null;
        this.group_axis_select = null;
        this.range_select = null;
        this.series_div = null;
        this.dataset = null;     // Dataset to be used: {structure: {...}, data: {...}, metadata: {...}}
        this.column_info = null;
        this._3axis_alternative = null;

        this.fromColumnLabels = false;

        this.HighChartConfig = new HighChartConfigurer();
        this.GoogleChartConfig = new GoogleChartConfigurer();
        this.Flotr2Config = new Flotr2Configurer();

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
        this.accordion = new StyledElements.Accordion({exclusive: true});
        container.appendChild(this.accordion);
        this.from_column = this.accordion.createContainer({title: "From column values"});
        this.from_labels = this.accordion.createContainer({title: "From column labels"});

        // On expand append the selectors to the current container.
        this.from_column.addEventListener('expandChange', function (expander, expanded) {
            if (expanded) {
                this.from_labels.clear();

                this.from_column.appendChild(group_title);
                this.from_column.appendChild(this.group_axis_select);
                this.from_column.appendChild(series_title);
                this.from_column.appendChild(this.series_div);

                this.fromColumnLabels = false;

                // Plot the chart with the current configuration
                create_graph_config();
            }
        }.bind(this));

        // On expand append the selectors to the current container.
        this.from_labels.addEventListener('expandChange', function (expander, expanded) {
            if (expanded) {
                this.from_column.clear();

                this.from_labels.appendChild(group_title);
                this.from_labels.appendChild(this.group_axis_select);
                this.from_labels.appendChild(this.range_select);
                this.from_labels.appendChild(series_title);
                this.from_labels.appendChild(this.series_select);

                this.fromColumnLabels = true;

                // Plot the chart with the current configuration
                create_graph_config();
            }
        }.bind(this));

        // Create the group column title
        var group_title = document.createElement('h3');
        group_title.innerHTML = 'Axis X';
        this.from_column.appendChild(group_title);

        // Create the group column select
        this.group_axis_select = new StyledElements.Select({'class': 'full'});
        this.group_axis_select.addEventListener('change', create_graph_config.bind(this));

        this.series_select = new StyledElements.Select({'class': 'full'});
        this.series_select.addEventListener('change', create_graph_config.bind(this));

        this.range_select = new StyledElements.Select({'class': 'full'});
        this.range_select.addEventListener('change', create_graph_config.bind(this));

        // Create the series title
        var series_title = document.createElement('h3');
        series_title.innerHTML = 'Axis Y';

        // Create the div where the series will be inserted
        this.series_div = document.createElement('div');

        // Append them to the default container.
        this.from_column.appendChild(group_title);
        this.from_column.appendChild(this.group_axis_select);
        this.from_column.appendChild(series_title);
        this.from_column.appendChild(this.series_div);

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
        group_title.innerHTML = 'Bubble tag';
        container.appendChild(group_title);
        this.id_bubble_select = new StyledElements.Select({'class': 'full'});
        this.id_bubble_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.id_bubble_select);

        group_title = document.createElement('h3');
        group_title.innerHTML = 'Bubble name';
        container.appendChild(group_title);
        this.series_field_select = new StyledElements.Select({'class': 'full'});
        this.series_field_select.addEventListener('change', create_graph_config.bind(this));
        container.appendChild(this.series_field_select);
    };

    var buildFiltersDiv = function buildFiltersDiv() {
        // Clear the div
        this.filterDiv.innerHTML = "";

        // TODO: filters for bubblechart
        if (this.current_graph_type === 'bubblechart') {
            return;
        }


        var titleX = document.createElement("h3");
        titleX.innerHTML = "Filter Axis X";
        var divX = document.createElement("div");

        var titleY = document.createElement("h3");
        titleY.innerHTML = "Filter Axis Y";
        var divY = document.createElement("div");

        var series = get_general_series.call(this);

        if (!this.fromColumnLabels) {
            var XCol = this.group_axis_select.getValue();

            // Build X filters
            this.dataset.data.forEach(function (row) {
                var checkbox = buildCheckbox.call(this, "filtersX", row[XCol]);
                divX.append(checkbox);
                divX.appendChild(document.createElement('br'));
            }.bind(this));
        } else {

            // Build  X filters
            var columnNames = Object.keys(this.column_info);
            var rangeLow = columnNames.indexOf(this.group_axis_select.getValue());
            var rangeHigh = columnNames.indexOf(this.range_select.getValue());
            for (rangeLow; rangeLow < rangeHigh; rangeLow++) {
                var checkbox = buildCheckbox.call(this, "filtersX", this.dataset.structure[rangeLow].id);
                divX.append(checkbox);
                divX.appendChild(document.createElement('br'));
            }

            // Build Y filters
            series.forEach(function (value) {
                var checkbox = buildCheckbox.call(this, "filtersY", value);
                divY.append(checkbox);
                divY.appendChild(document.createElement('br'));
            }.bind(this));
        }

        this.filterDiv.appendChild(titleX);
        this.filterDiv.appendChild(divX);
        this.filterDiv.appendChild(titleY);
        this.filterDiv.appendChild(divY);

        // Update the graph using no filters
        create_graph_config.call(this);
    };

    var buildCheckbox = function buildCheckbox(name, value) {
        var label = document.createElement('label');

        var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('name', name);
        checkbox.setAttribute('value', value);
        checkbox.addEventListener('change', create_graph_config.bind(this));

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(value));

        return label;
    };


    var showMsg = function showMsg(msg, type, callback) {
        var alertDiv = document.getElementById("alert");

        if (type.toLowerCase() == "warning") {
            alertDiv.innerHTML = "<strong>Warning: </strong>" + msg;
            alertDiv.className += " alert-warning";
        } else if (type.toLowerCase() == "success") {
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

        var googleHave = this.GoogleChartConfig.hasSelector(elementtype);
        var flotr2Have = this.Flotr2Config.hasSelector(elementtype);

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
        } else {
            preferences.graph_series = get_general_series.call(this);
        }

        // We check that there are no fields unfinished
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

        // Convert the preferences that are not text to JSON
        preferences.graph_series = JSON.stringify(preferences.graph_series);
        preferences.graph_fields = JSON.stringify(preferences.graph_fields);

        MashupPlatform.mashup.createWorkspace({
            name: this.nameinput.getValue(),
            mashup: 'CoNWeT/' + mashupname + '/1.0.1',
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
        var config_tab = this.layout.createTab({name: "3. Configuration", closable: false});

        this.workspace_tab = this.layout.createTab({name: "4. Dashboard", closable: false});
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


        config_tab.getTabElement().addEventListener("click", buildFiltersDiv.bind(this));
        // Title input field
        var title = document.createElement('h3');
        title.innerHTML = 'Chart title';
        this.titleInput = new StyledElements.TextField({placeholder: "Chart title"});
        this.titleInput.addEventListener("submit", create_graph_config.bind(this));
        config_tab.appendChild(title);
        config_tab.appendChild(this.titleInput);

        this.filterDiv = document.createElement('div');
        config_tab.appendChild(this.filterDiv);

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
            this.Flotr2Config.enable();
        }
        if (MashupPlatform.widget.outputs['googlecharts-graph-config'].connected) {
            this.GoogleChartConfig.enable();
        }
        if (MashupPlatform.widget.outputs['highcharts-graph-config'].connected) {
            this.HighChartConfig.enable();
        }
    };

    var get_general_series = function get_general_series() {
        var series_checkboxes = document.getElementsByName('series');
        var i;
        var series = [];

        if (!this.fromColumnLabels) {
            // Get the selected checkboxes
            for (i = 0; i < series_checkboxes.length; i++) {
                if (series_checkboxes[i].checked) {
                    series.push(series_checkboxes[i].value);
                }
            }
        } else {
            // Get series from column selector
            var col = this.axisy_select.getValue();
            this.dataset.data.forEach(function (row) {
                series.push(row[col]);
            });
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
            if (MashupPlatform.widget.outputs["flotr2-graph-config"].connected) {
                create_flotr2_config.call(this, series);
            }
            if (MashupPlatform.widget.outputs['googlecharts-graph-config'].connected) {
                create_google_charts_config.call(this, series);
            }
            if (MashupPlatform.widget.outputs['highcharts-graph-config'].connected) {
                create_highcharts_config.call(this, series);
            }
        }
    };

    var disable_all = function disable_all() {
        var nodes = document.querySelectorAll(".graph-button");
        Array.prototype.slice.call(nodes).forEach(function (button) {
            button.classList.add("disabled");
        });
    };

    var applyFilters = function applyFilters() {
        var i;
        var x = [];
        var xcheckboxes = document.getElementsByName('filtersX');
        for (i = 0; i < xcheckboxes.length; i++) {
            if (xcheckboxes[i].checked) {
                x.push(xcheckboxes[i].value);
            }
        }

        var y = [];
        var ycheckboxes = document.getElementsByName('filtersY');
        for (i = 0; i < ycheckboxes.length; i++) {
            if (ycheckboxes[i].checked) {
                y.push(ycheckboxes[i].value);
            }
        }

        return {x: x, y: y};
    };

    var create_flotr2_config = function create_flotr2_config(series) {
        var config;
        var filters = applyFilters();

        if (!this.fromColumnLabels) {
            // Default behaviour
            config = this.Flotr2Config.configure(series, {
                graph_type: this.current_graph_type,
                dataset: this.dataset,
                column_info: this.column_info,
                fields: {
                    axisx: this.axisx_select.getValue(),
                    axisy: this.axisy_select.getValue(),
                    axisz: this.axisz_select.getValue(),
                    series_field: this.series_field_select.getValue(),
                    group_column: this.group_axis_select.getValue(),
                },
                filter: filters.x,
                options: {
                    title: this.dataset.metadata.name
                },
            });
        } else {
            // Build chart using column labels
            var columnNames = Object.keys(this.column_info);
            var rangeLow = columnNames.indexOf(this.group_axis_select.getValue());
            var rangeHigh = columnNames.indexOf(this.range_select.getValue());
            var range = [];
            for (rangeLow; rangeLow < rangeHigh; rangeLow++) {
                range.push(this.dataset.structure[rangeLow].id);
            }

            var structure = [];
            structure.push({id: "newGroupedColumn", type: "string"});

            var columns = {
                newGroupedColumn: {id: "newGroupedColumn", type: "string"}
            };
            series.forEach(function (name) {
                columns[name] = {id: name, type: "number"};
                structure.push({id: name, type: "number"});
            });

            var newData  = [];
            var expandedColName = this.series_select.getValue();

            // Create the new set of data to be used
            range.forEach(function (date, index) {
                var row = {newGroupedColumn: date};

                this.dataset.data.forEach(function (d) {
                    row[d[expandedColName]] = d[date];
                });

                newData.push(row);
            }.bind(this));

            // Filter the series
            var filteredSeries = [];
            series.forEach(function (s) {
                if (filters.y.every(function (f) {
                    return f !== s;
            })) {
                    filteredSeries.push(s);
                }
            });

            config = this.Flotr2Config.configure(filteredSeries, {
                graph_type: this.current_graph_type,
                dataset: {data: newData, structure: structure},
                column_info: columns,
                fields: {
                    axisx: this.axisx_select.getValue(),
                    axisy: this.axisy_select.getValue(),
                    axisz: this.axisz_select.getValue(),
                    series_field: this.series_field_select.getValue(),
                    group_column: "newGroupedColumn",
                },
                filter: filters.x,
                options: {
                    title: this.dataset.metadata.name
                },
            });
        }

        MashupPlatform.wiring.pushEvent('flotr2-graph-config', JSON.stringify(config));
    };

    var create_google_charts_config = function create_google_charts_config(series) {
        var config;
        var filters = applyFilters();

        if (!this.fromColumnLabels) {
            // Default behaviour

            config = this.GoogleChartConfig.configure(series, {
                graph_type: this.current_graph_type,
                dataset: this.dataset,
                column_info: this.column_info,
                fields: {
                    axisx: this.axisx_select.getValue(),
                    axisy: this.axisy_select.getValue(),
                    axisz: this.axisz_select.getValue(),
                    series_field: this.series_field_select.getValue(),
                    group_column: this.group_axis_select.getValue(),
                    id_bubble: this.id_bubble_select.getValue(),
                },
                filter: filters.x,
                options: {
                    title: this.dataset.metadata.name
                },
            });
        } else {
            // Build chart using column labels
            var columnNames = Object.keys(this.column_info);
            var rangeLow = columnNames.indexOf(this.group_axis_select.getValue());
            var rangeHigh = columnNames.indexOf(this.range_select.getValue());
            var range = [];
            for (rangeLow; rangeLow < rangeHigh; rangeLow++) {
                range.push(this.dataset.structure[rangeLow].id);
            }

            var columns = {
                newGroupedColumn: {id: "newGroupedColumn", type: "string"}
            };
            series.forEach(function (name) {
                columns[name] = {id: name, type: "number"};
            });

            var newData  = [];
            var expandedColName = this.series_select.getValue();

            // Create the new set of data to be used
            range.forEach(function (date, index) {
                var row = {newGroupedColumn: date};

                this.dataset.data.forEach(function (d) {
                    row[d[expandedColName]] = d[date];
                });

                newData.push(row);
            }.bind(this));

            // Filter the series
            var filteredSeries = [];
            series.forEach(function (s) {
                if (filters.y.every(function (f) {
                    return f !== s;
            })) {
                    filteredSeries.push(s);
                }
            });

            config = this.GoogleChartConfig.configure(filteredSeries, {
                graph_type: this.current_graph_type,
                dataset: {data: newData},
                column_info: columns,
                fields: {
                    axisx: this.axisx_select.getValue(),
                    axisy: this.axisy_select.getValue(),
                    axisz: this.axisz_select.getValue(),
                    series_field: this.series_field_select.getValue(),
                    group_column: "newGroupedColumn",
                },
                filter: filters.x,
                options: {
                    title: this.dataset.metadata.name
                },
            });
        }

        MashupPlatform.wiring.pushEvent('googlecharts-graph-config', JSON.stringify(config));
    };

    var create_highcharts_config = function create_highcharts_config(series) {
        var config;
        var filters = applyFilters.call(this, series);

        if (!this.fromColumnLabels) {

            // Default behaviour
            config = this.HighChartConfig.configure(series, {
                graph_type: this.current_graph_type,
                group_axis_select: this.group_axis_select.getValue(),
                dataset: this.dataset,
                column_info: this.column_info,
                filter: filters.x,
                options: {
                    title: this.dataset.metadata.name
                },
            });
        } else {
            // Build chart using column labels
            var columnNames = Object.keys(this.column_info);
            var rangeLow = columnNames.indexOf(this.group_axis_select.getValue());
            var rangeHigh = columnNames.indexOf(this.range_select.getValue());
            var range = [];
            for (rangeLow; rangeLow < rangeHigh; rangeLow++) {
                range.push(this.dataset.structure[rangeLow].id);
            }

            var columns = {
                newGroupedColumn: {id: "newGroupedColumn", type: "number"}
            };
            series.forEach(function (name) {
                columns[name] = {id: name, type: "number"};
            });

            var newData  = [];
            var expandedColName = this.series_select.getValue();

            // Create the new set of data to be used
            range.forEach(function (date, index) {
                var row = {newGroupedColumn: date};

                this.dataset.data.forEach(function (d) {
                    row[d[expandedColName]] = d[date];
                });

                newData.push(row);
            }.bind(this));

            // Filter the series
            var filteredSeries = [];
            series.forEach(function (s) {
                if (filters.y.every(function (f) {
                    return f !== s;
            })) {
                    filteredSeries.push(s);
                }
            });

            config = this.HighChartConfig.configure(filteredSeries, {
                graph_type: this.current_graph_type,
                dataset: {data: newData},
                column_info: columns,
                group_axis_select: "newGroupedColumn",
                options: {
                    title: this.dataset.metadata.name
                },
                filter: filters.x,
            });
        }

        MashupPlatform.wiring.pushEvent('highcharts-graph-config', JSON.stringify(config));
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

        this.range_select.clear();
        this.range_select.addEntries(entries);

        this.series_select.clear();
        this.series_select.addEntries(entries);

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
            var label = buildCheckbox.call(this, "series", fields[i]);

            this.series_div.appendChild(label);
            this.series_div.appendChild(document.createElement('br'));
        }
    };

    return Widget;

})();
