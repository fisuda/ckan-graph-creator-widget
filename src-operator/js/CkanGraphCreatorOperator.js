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

/* globals MashupPlatform, HighChartConfigurer, GoogleChartConfigurer, Flotr2Configurer */
/* exported CkanGraphCreatorOperator */

window.CkanGraphCreatorOperator = (function () {

    "use strict";

    var CkanGraphCreatorOperator = function CkanGraphCreatorOperator() {

        // Create the graph configurers
        this.HighChartConfig = new HighChartConfigurer();
        this.GoogleChartConfig = new GoogleChartConfigurer();
        this.Flotr2Config = new Flotr2Configurer();

        // Recieve events for the "dataset" input endpoint
        MashupPlatform.wiring.registerCallback('dataset', function (dataset) {

            var options = create_graph_config(dataset);

            if (MashupPlatform.operator.outputs["flotr2-graph-config"].connected) {
                create_flotr2_config.call(this, options);
            }
            if (MashupPlatform.operator.outputs['googlecharts-graph-config'].connected) {
                create_google_charts_config.call(this, options);
            }
            if (MashupPlatform.operator.outputs['highcharts-graph-config'].connected) {
                create_highcharts_config.call(this, options);
            }
        }.bind(this));
    };

    // Create the graph configuration
    var create_graph_config = function create_graph_config(dataset_json) {
        var dataset = JSON.parse(dataset_json);
        var config = JSON.parse(MashupPlatform.prefs.get('configuration'));

        var columns = {};
        var series = config.series;

        if (!config.fromColumnLabels) {
            // Default behaviour

            // Build column info
            for (var i = 0; i < dataset.structure.length; i++) {
                var id = dataset.structure[i].id;
                columns[id] = dataset.structure[i];
            }

        } else {
            // From labels behaviour
            var range = config.range;

            var structure = [];
            structure.push({id: "newGroupedColumn", type: "string"});

            // Build column info
            columns = {
                newGroupedColumn: {id: "newGroupedColumn", type: "string"}
            };
            series.forEach(function (name) {
                columns[name] = {id: name, type: "number"};
                structure.push({id: name, type: "number"});
            });

            // Build new dataset
            var newData = [];
            var expandedColName = config.expandedColName;


            // Create the new set of data to be used
            range.forEach(function (date, index) {
                var row = {newGroupedColumn: date};

                dataset.data.forEach(function (d) {
                    row[d[expandedColName]] = d[date];
                });

                newData.push(row);
            }.bind(this));


            dataset = {
                data: newData,
                structure: structure,
            };
        }

        var title = config.title || "";

        return {
            series: series,
            options: {
                graph_type: config.graph_type,
                dataset: dataset,
                column_info: columns,
                fields: {
                    axisx: config.axisx,
                    axisy: config.axisy,
                    axisz: config.axisz,
                    series_field: config.series_field,
                    id_bubble: config.id_bubble,
                    group_column: config.groupColumn,
                },
                filter: config.filter,
                options: {
                    title: title,
                },
            }
        };
    };

    var create_flotr2_config = function create_flotr2_config(options) {
        var config;
        config = this.Flotr2Config.configure(options.series, options.options);

        MashupPlatform.wiring.pushEvent('flotr2-graph-config', JSON.stringify(config));
    };

    var create_google_charts_config = function create_google_charts_config(options) {
        var config;
        config = this.GoogleChartConfig.configure(options.series, options.options);

        MashupPlatform.wiring.pushEvent('googlecharts-graph-config', JSON.stringify(config));
    };

    var create_highcharts_config = function create_highcharts_config(options) {
        var config;
        config = this.HighChartConfig.configure(options.series, options.options);

        MashupPlatform.wiring.pushEvent('highcharts-graph-config', JSON.stringify(config));
    };

    /* test-code */
    CkanGraphCreatorOperator.prototype = {
    };

    /* end-test-code */

    return CkanGraphCreatorOperator;

})();
