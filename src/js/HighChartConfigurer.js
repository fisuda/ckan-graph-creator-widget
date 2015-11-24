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

(function () {
    "use strict";

    var HighChartConfigurer = function HighChartConfigurer() {
        this.selectors = [
            '.piegraph',
            '.piechart'
        ];
    };

    HighChartConfigurer.prototype.enable = function enable() {
        var graphsHighcharts = document.body.querySelectorAll(this.selectors);

        for (var j = 0;  j < graphsHighcharts.length; j++) {
            graphsHighcharts[j].classList.remove("disabled");
        }
    };

    var parseData = function parseData(column_info, column, value) {
        if (column_info[column].type === 'number') {
            return Number(value);
        } else {
            return value;
        }
    };

    HighChartConfigurer.prototype.configure = function configure(series, options) {
        var graph_type = options.graph_type;
        var group_column = options.group_axis_select.getValue();
        var series_title = options.series_title;
        var column_info = options.column_info;
        var dataset = options.dataset;
        var config = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                labelFormat: "{name} <b>{percentage:.1f}%</b>",
                y: 0,
                x: 0,
                navigation: {
                    activeColor: '#3E576F',
                    animation: true,
                    arrowSize: 12,
                    inactiveColor: '#CCC',
                    style: {
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '12px'
                    }
                },
                title: {
                    text: "Click to hide"
                }
            },
            title: {
                text: series_title
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.y}'
                    }
                }
            }
        };

        var j, i;
        var datasets = dataset.data;
        var rawdata = [];

        for (i = 0; i < series.length; i++) {
            var nameRow = series[i];
            var serieInfo = {
                name: nameRow,
                data: []
            };

            for (j = 0; j < datasets.length; j++) {
                var value = parseData(column_info, nameRow, datasets[j][nameRow]);
                var dD = [datasets[j][group_column], value];
                serieInfo.data.push(dD);
            }
            rawdata.push(serieInfo);
        }

        if (graph_type === 'piechart') {
            config = configPieChart(config, rawdata, dataset.metadata);
        }
        if (graph_type === 'piechart-3d') {
            config = config3dPieChart(config, rawdata, dataset.metadata);
        }
        if (graph_type === 'donutchart') {
            config = configDonutChart(config, rawdata, dataset.metadata);
        }
        if (graph_type === 'columnchart') {
            config = configBarChart(config, rawdata, dataset.metadata);
        }
        return config;
    };



    var flatData = function flatData(data) {
        var dataN = {};
        var i, j;

        for (i = 0; i < data.length; i++) {
            var dataRow = data[i];
            for (j = 0; j < dataRow.data.length; j++) {
                var name = dataRow.data[j][0];
                dataN[name] = (dataN[name] || 0) + dataRow.data[j][1];
            }
        }

        var dataList = [];
        for (var key in dataN) {
            if (dataN.hasOwnProperty(key)) {
                dataList.push([key, dataN[key]]);
            }
        }
        return dataList;
    };

    var drillDownData = function drillDownData(data) {
        var outdata = [];
        var drills = [];
        var i, j;

        for (i = 0; i < data.length; i++) {
            var dataRow = data[i];
            var nameRow = dataRow.name;
            var serieInfo = {
                name: nameRow,
                drilldown: nameRow,
                y: 0
            };
            var drillI = {
                name: nameRow,
                id: nameRow,
                data: dataRow.data
            };
            for (j = 0; j < dataRow.data.length; j++) {
                serieInfo.y = serieInfo.y + dataRow.data[j][1];
            }
            drills.push(drillI);
            outdata.push(serieInfo);
        }

        return {
            data: outdata,
            drills: drills
        };
    };

    var configBarChart = function configBarChart(config, data, metadata) {
        config.chart.type = 'column';
        config.xAxis = {
            type: 'category'
        };
        config.plotOptions.series = {
            borderWidth: 0,
            dataLabels: {
                enabled: true,
                format: '{point.y}'
            }
        };
        config.legend = {
            enabled: false
        };

        var dataP = drillDownData(data);
        var outdata = dataP.data, drills = dataP.drills;

        config.series = [{
            name: metadata.name || "",
            colorByPoint: true,
            data: outdata
        }];
        config.drilldown = {
            series: drills
        };

        return config;
    };

    // var configStackedBar = function configStackedBar(config, data, metadata) {

    // };

    var config3dPieChart = function config3dPieChart(config, data, metadata) {
        config.chart.type = 'pie';
        config.chart.options3d = {
            enabled: true,
            alpha: 40,
            beta: 0,
            depth: 40
        };

        config.plotOptions.pie = {
            allowPointSelect: true,
            cursor: 'pointer',
            depth: 35,
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        };

        config.series = [{
            type: 'pie',
            name: metadata.name || "",
            data: flatData(data)
        }];

        return config;
    };

    var configDonutChart = function configDonutChart(config, data, metadata) {
        config.chart.type = 'pie';
        config.plotOptions.pie = {
            allowPointSelect: true,
            cursor: 'pointer',
            depth: 35,
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        };

        config.series = [{
            name: metadata.name || "",
            colorByPoint: true,
            data: flatData(data),
            innerSize: '60%'
        }];
        return config;
    };


    var configPieChart = function configPieChart(config, data, metadata) {
        config.chart.type = 'pie';
        config.plotOptions.pie = {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        };

        var dataP = drillDownData(data);
        var outdata = dataP.data, drills = dataP.drills;

        config.series = [{
            name: metadata.name || "",
            colorByPoint: true,
            data: outdata
        }];
        config.drilldown = {
            series: drills
        };

        return config;
    };

    window.HighChartConfigurer = HighChartConfigurer;
})();
