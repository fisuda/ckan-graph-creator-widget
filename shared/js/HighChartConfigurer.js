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
            '.lineargraph',
            '.linechart',
            '.linechart-smooth',
            '.piegraph',
            '.piechart',
            '.donutchart',
            '.columngraph',
            '.columnchart',
            '.columnchart-stacked',
            '.areagraph',
            '.areachart',
            '.areachart-stacked',
            '.bargraph',
            '.barchart',
            '.barchart-stacked',
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
        var group_column = options.fields.group_column;
        var column_info = options.column_info;
        var dataset = options.dataset;
        var filter = options.filter;
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
                labelFormat: "{name}",
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
            },
            title: {
                text: options.options.title
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
                // Check if the filter is passed
                if (filter.every(function (f) {
                    return f !== datasets[j][group_column];
                })) {
                    var value = parseData(column_info, nameRow, datasets[j][nameRow]);
                    var dD = [datasets[j][group_column], value];
                    serieInfo.data.push(dD);
                }
            }
            rawdata.push(serieInfo);
        }

        if (graph_type === 'piechart') {
            config = configPieChart(config, rawdata);
        }
        if (graph_type === 'piechart-3d') {
            config = config3dPieChart(config, rawdata);
        }
        if (graph_type === 'donutchart') {
            config = configDonutChart(config, rawdata);
        }
        if (graph_type === 'linechart') {
            config = configTimelineChart(config, rawdata);
        }
        if (graph_type === 'linechart-smooth') {
            config = configTimelineChart(config, rawdata);
            config.chart.type = "spline"; // Same config as lineChart but spline type
        }
        if (graph_type === 'areachart') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "area"; // Same config as lineChart but area type
        }
        if (graph_type === 'areachart-stacked') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "area"; // Same config as lineChart but area type
            config.plotOptions.area = { // Enable stacking
                stacking: 'normal',
            };
        }
        if (graph_type === 'columnchart') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "column"; // Same config as lineChart but area type
        }
        if (graph_type === 'columnchart-stacked') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "column"; // Same config as lineChart but area type
            config.plotOptions.column = { // Enable stacking
                stacking: 'normal',
            };
        }
        if (graph_type === 'barchart') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "bar"; // Same config as lineChart but area type
        }
        if (graph_type === 'barchart-stacked') {
            config = configTimelineChart(config, rawdata, series);
            config.chart.type = "bar"; // Same config as lineChart but area type
            config.plotOptions.series = { // Enable stacking
                stacking: 'normal',
            };
        }

        return config;
    };

    // Clean data
    var timelineData = function timelineData(data) {
        var dataList = {};
        dataList.timestamps = [];
        data.forEach(function (row) {
            row.data.forEach(function (d){
                dataList.timestamps.push(d[0]); // Build timestamps list
                d = d[1]; // Build data list
            });
        });

        dataList.data = data;

        return dataList;
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

    var configTimelineChart = function configTimelineChart (config, data, series) {
        config.chart.type = 'line';
        var dataList = timelineData(data);

        config.series = [];
        dataList.data.forEach(function (d, i) {
            config.series.push({
                name: d.name,
                data: d.data,
            });
        });

        config.xAxis = {
            categories: dataList.timestamps
        };

        config.plotOptions.series = {
            borderWidth: 0,
            dataLabels: {
                enabled: true,
                format: '{point.y}'
            }
        };

        return config;
    };

    var configBarChart = function configBarChart(config, data) {
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
            colorByPoint: true,
            data: outdata
        }];
        config.drilldown = {
            series: drills
        };

        return config;
    };

    var config3dPieChart = function config3dPieChart(config, data) {
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

        config.tooltip = {
            pointFormat: '<b>{point.percentage:.1f}%</b>'
        };

        var dataP = drillDownData(data);
        var outdata = dataP.data, drills = dataP.drills;

        config.series = [{
            type: "pie",
            data: outdata
        }];
        config.drilldown = {
            series: drills
        };

        return config;
    };

    var configDonutChart = function configDonutChart(config, data) {
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

        config.tooltip = {
            pointFormat: '<b>{point.percentage:.1f}%</b>'
        };

        var dataP = drillDownData(data);
        var outdata = dataP.data, drills = dataP.drills;

        config.series = [{
            colorByPoint: true,
            data: outdata,
            innerSize: '60%'
        }];

        config.drilldown = {
            series: drills
        };

        return config;
    };


    var configPieChart = function configPieChart(config, data) {
        config.chart.type = 'pie';
        config.plotOptions.pie = {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        };

        config.tooltip = {
            pointFormat: '<b>{point.percentage:.1f}%</b>'
        };

        var dataP = drillDownData(data);
        var outdata = dataP.data, drills = dataP.drills;

        config.series = [{
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
