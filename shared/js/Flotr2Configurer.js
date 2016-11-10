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

window.Flotr2Configurer = (function () {
    "use strict";

    var Flotr2Configurer = function Flotr2Configurer() {
        this.selectors = [
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

        Flotr2Configurer.prototype.enable = function enable() {
            var graphsFlotr2 = document.body.querySelectorAll(this.selectors);

            for (var i = 0; i < graphsFlotr2.length; i++) {
                graphsFlotr2[i].classList.remove("disabled");
            }
        };

        Flotr2Configurer.prototype.hasSelector = function hasSelector(selector) {
            var i;
            for (i = 0; i < this.selectors.length; i++) {
                if (selector === this.selectors[i]) {
                    return true;
                }
            }
            return false;
        };

        Flotr2Configurer.prototype.configure = function configure(series, options) {
            var i, j, row;
            var graph_type = options.graph_type;
            var fields = options.fields;
            var group_column = fields.group_column;
            var data = {};        //Contains all the series that wil be shown in the graph
            var ticks = [];       //When string are used as group column, we need to format the values
            var series_meta = {}; //Contails the name of the datasets
            var group_column_axis = (graph_type == 'bargraph') ? 'yaxis' : 'xaxis';

            //Group Column type
            var group_column_type = null;
            for (i = 0; i < options.dataset.structure.length && group_column_type == null; i++) {
                var field = options.dataset.structure[i];
                if (field.id == group_column) {
                    group_column_type = field.type;
                }
            }

            //Is the Group Column an interger or a float?
            var group_column_float = false;
            for (i = 0; i < options.dataset.data.length && !group_column_float; i++) {
                row = options.dataset.data[i];
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
                var axisx_field = fields.axisx;
                var axisy_field = fields.axisy;
                var axisz_field = fields.axisz;
                var series_field = fields.series_field;

                for (j = 0; j < options.dataset.data.length; j++) {
                    row = options.dataset.data[j];
                    var serie = row[series_field];
                    data[series.indexOf(serie)].push([Number(row[axisx_field]), Number(row[axisy_field]) , Number(row[axisz_field])]);
                }
            } else {
                for (i = 0; i < series.length; i++) {
                    for (j = 0; j < options.dataset.data.length; j++) {
                        row = options.dataset.data[j];
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
                    HtmlText: htmltext
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

            return flotr2Config;
        };
    };

    return Flotr2Configurer;
})();
