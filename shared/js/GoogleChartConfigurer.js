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

window.GoogleChartConfigurer = (function () {
    "use strict";

    var GoogleChartConfigurer = function GoogleChartConfigurer() {
        this.selectors = [
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

        var parseData = function parseData(column_info, column, value) {
            if (column_info[column].type === 'number') {
                return Number(value);
            } else {
                return value;
            }
        };

        GoogleChartConfigurer.prototype.enable = function enable() {
            /* TODO */
            // var graphsGoogle = document.body.querySelectorAll(this.selectors);

            // for (var j = 0; j < graphsGoogle.length; j++) {
            //     graphsGoogle[j].classList.remove("disabled");
            // }
        };

        GoogleChartConfigurer.prototype.configure = function configure(series, options) {
            var i, j, dataset_row, row;
            var graph_type = options.graph_type;
            var fields = options.fields;
            var column_info = options.column_info;
            var group_column = fields.group_column;
            var data = [];        //Contains all the series that wil be shown in the graph

            // Format data
            if (graph_type === 'bubblechart') {
                var axisx_field = fields.axisx;
                var axisy_field = fields.axisy;
                var axisz_field = fields.axisz;
                var series_field = fields.series_field;
                var id_bubble = fields.id_bubble;

                // Header
                data.push([id_bubble, axisx_field, axisy_field, series_field, axisz_field]);
                // Data
                for (j = 0; j < options.dataset.data.length; j++) {
                    row = options.dataset.data[j];
                    var serie = row[series_field];
                    data.push([row[id_bubble], Number(row[axisx_field]), Number(row[axisy_field]), serie, Number(row[axisz_field])]);
                }
            } else {
                data.push([group_column].concat(series));
                for (i = 0; i < options.dataset.data.length; i++) {
                    dataset_row = options.dataset.data[i];
                    row = [parseData(column_info, group_column, dataset_row[group_column])];
                    for (j = 0; j < series.length; j++) {
                        row.push(parseData(column_info, series[j], dataset_row[series[j]]));
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

            return googlechartsConfig;
        };
    };

    return GoogleChartConfigurer;
})();
