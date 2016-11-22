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

/* globals Flotr2Configurer, GoogleChartConfigurer, HighChartConfigurer, MockMP, Widget */


(function () {

    "use strict";

    var clearDocument = function clearDocument() {
        document.body.innerHTML = "";
    };

    window.MashupPlatform = new MockMP.MockMP();

    describe("CKAN Graph Creator widget", function () {

        var widget = null;


        beforeEach(function () {

            window.MashupPlatform.widget.outputs = {
                "flotr2-graph-config": {
                    connected: true
                },
                "googlecharts-graph-config": {
                    connected: true
                },
                "highcharts-graph-config": {
                    connected: true
                }
            };
            window.MashupPlatform.wiring.registerStatusCallback = function () {};
            widget = new Widget();
            widget.init();
            spyOn(widget.layout, 'repaint').and.callThrough();
        });

        afterEach(function () {
            MashupPlatform.reset();
            clearDocument();
        });

        it("registers a callback for the 'dataset' endpoint", function () {
            expect(MashupPlatform.wiring.registerCallback)
            .toHaveBeenCalledWith("dataset", jasmine.any(Function));
        });

        it("registers a widget context callback", function () {
            expect(MashupPlatform.widget.context.registerCallback)
            .toHaveBeenCalledWith(jasmine.any(Function));
        });

        it("redraw the graph container when the horizontal is resized", function () {
            var pref_callback = MashupPlatform.widget.context
            .registerCallback.calls.argsFor(0)[0];
            pref_callback({"widthInPixels": 100});
            expect(widget.layout.repaint).toHaveBeenCalled();
        });

        it("redraw the graph container when the vertical is resized", function () {
            var pref_callback = MashupPlatform.widget.context
            .registerCallback.calls.argsFor(0)[0];
            pref_callback({"heightInPixels": 100});
            expect(widget.layout.repaint).toHaveBeenCalled();
        });

        describe("graphConfigurer", function () {
            var config;
            beforeEach(function () {
                var dataset = {
                    structure: [
                        {type: "string", id: "id"},
                        {type: "number", id: "yValue"},
                        {type: "number", id: "yValue2"},
                    ],
                    data: [
                        {id: "1", yValue: 1, yValue2: 2},
                        {id: "2", yValue: 2, yValue2: 1},
                        {id: "3", yValue: 2, yValue2: 1},
                        {id: "4", yValue: 1, yValue2: 2},
                    ],
                };
                config = {
                    graph_type: "linechart",
                    dataset: dataset,
                    column_info: {id: {type: "string", id: "id"}, yValue: {type: "number", id: "yValue"}, yValue2: {type: "number", id: "yValue2"}},
                    fields: {
                        group_column: "id",
                    },
                    filter: [],
                    options: {
                        title: "goodtitle"
                    },
                };
            });

            describe("HighChartConfigurer", function () {
                var HighChartConfig;
                beforeAll(function () {
                    HighChartConfig = new HighChartConfigurer();
                });

                it("basic linechart", function () {
                    var series = ["yValue"];
                    config.graph_type = "linechart";

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("line");
                    expect(result.series).toEqual([{name: "yValue", data: [["1", 1], ["2", 2], ["3", 2], ["4", 1]]}]);
                });

                it("multiple linechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("line");
                    expect(result.series).toEqual([
                        {name: "yValue", data: [["1", 1], ["2", 2], ["3", 2], ["4", 1]]},
                        {name: "yValue2", data: [["1", 2], ["2", 1], ["3", 1], ["4", 2]]}
                    ]);
                });

                it("basic barchart", function () {
                    var series = ["yValue"];
                    config.graph_type = "barchart";

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("bar");
                    expect(result.series).toEqual([{name: "yValue", data: [["1", 1], ["2", 2], ["3", 2], ["4", 1]]}]);
                });

                it("multiple barchart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "barchart";

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("bar");
                    expect(result.series).toEqual([
                        {name: "yValue", data: [["1", 1], ["2", 2], ["3", 2], ["4", 1]]},
                        {name: "yValue2", data: [["1", 2], ["2", 1], ["3", 1], ["4", 2]]}
                    ]);
                });

                it("piechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "piechart";

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("pie");
                    expect(result.series[0].data).toEqual([
                        {name: "yValue", drilldown: "yValue", y: 6},
                        {name: "yValue2", drilldown: "yValue2", y: 6},
                    ]);
                });

                it("should filter data", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";
                    config.filter = ["2"];

                    var result = HighChartConfig.configure(series, config);

                    expect(result.chart.type).toEqual("line");
                    expect(result.series).toEqual([
                        {name: "yValue", data: [["1", 1], ["3", 2], ["4", 1]]},
                        {name: "yValue2", data: [["1", 2], ["3", 1], ["4", 2]]}
                    ]);
                });
            });

            describe("GoogleChartConfigurer", function () {
                var GoogleChartConfig;
                beforeAll(function () {
                    GoogleChartConfig = new GoogleChartConfigurer();
                });

                it("basic linechart", function () {
                    var series = ["yValue"];
                    config.graph_type = "linechart";

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("LineChart");
                    expect(result.data).toEqual([["id", "yValue"], ["1", 1], ["2", 2], ["3", 2], ["4", 1]]);
                });

                it("multiple linechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("LineChart");
                    expect(result.data).toEqual([["id", "yValue", "yValue2"], ["1", 1, 2], ["2", 2, 1], ["3", 2, 1], ["4", 1, 2]]);
                });

                it("basic barchart", function () {
                    var series = ["yValue"];
                    config.graph_type = "barchart";

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("BarChart");
                    expect(result.data).toEqual([["id", "yValue"], ["1", 1], ["2", 2], ["3", 2], ["4", 1]]);
                });

                it("multiple barchart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "barchart";

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("BarChart");
                    expect(result.data).toEqual([["id", "yValue", "yValue2"], ["1", 1, 2], ["2", 2, 1], ["3", 2, 1], ["4", 1, 2]]);
                });

                it("piechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "piechart";

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("PieChart");
                    expect(result.data).toEqual([["item", "value"], ["yValue", 6], ["yValue2", 6]]);
                });

                it("should filter data", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";
                    config.filter = ["2"];

                    var result = GoogleChartConfig.configure(series, config);

                    expect(result.type).toEqual("LineChart");
                    expect(result.data).toEqual([["id", "yValue", "yValue2"], ["1", 1, 2], ["3", 2, 1], ["4", 1, 2]]);
                });
            });

            describe("Flotr2Configurer", function () {
                var Flotr2Config;
                beforeAll(function () {
                    Flotr2Config = new Flotr2Configurer();
                });

                it("basic linechart", function () {
                    var series = ["yValue"];
                    config.graph_type = "linechart";

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.lines.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}});
                    expect(result.data).toEqual({0: [[0, 1], [1, 2], [2, 2], [3, 1]]});
                });

                it("multiple linechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.lines.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}, 1: {label: "yValue2"}});
                    expect(result.data).toEqual({
                        0: [[0, 1], [1, 2], [2, 2], [3, 1]],
                        1: [[0, 2], [1, 1], [2, 1], [3, 2]]
                    });
                });

                it("basic barchart", function () {
                    var series = ["yValue"];
                    config.graph_type = "barchart";

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.bars.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}});
                    expect(result.data).toEqual({0: [[0, 1], [1, 2], [2, 2], [3, 1]]});
                });

                it("multiple barchart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "barchart";

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.bars.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}, 1: {label: "yValue2"}});
                    expect(result.data).toEqual({
                        0: [[0, 1], [1, 2], [2, 2], [3, 1]],
                        1: [[0, 2], [1, 1], [2, 1], [3, 2]]
                    });
                });

                it("piechart", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "piechart";

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.pie.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}, 1: {label: "yValue2"}});
                    expect(result.data).toEqual({
                        0: [[0, 6]],
                        1: [[0, 6]]
                    });
                });

                it("should filter data", function () {
                    var series = ["yValue", "yValue2"];
                    config.graph_type = "linechart";
                    config.filter = ["2"];

                    var result = Flotr2Config.configure(series, config);

                    expect(result.config.lines.show).toBeTruthy();
                    expect(result.datasets).toEqual({0: {label: "yValue"}, 1: {label: "yValue2"}});
                    expect(result.data).toEqual({
                        0: [[0, 1], [2, 2], [3, 1]],
                        1: [[0, 2], [2, 1], [3, 2]]
                    });
                });
            });
        });
    });
})();
