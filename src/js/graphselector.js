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

    var graph_types = [
        'lineargraph',
        'areagraph',
        'columngraph',
        'bargraph',
        'scattergraph',
        'piegraph',
        'geograph'
    ];

    var graph_types_info = {
        lineargraph: {
            label: 'Linear Graph',
            subtypes: [
                {id: 'linechart', label: "Line Chart"},
                {id: 'linechart-smooth', label: "Smoothed Lines Chart"},
                {id: 'combochart', label: "Combo Chart"},
                {id: 'radarchart', label: "Radar Chart"}
            ]
        },
        areagraph: {
            label: 'Area Graph',
            subtypes: [
                {id: 'areachart', label: "Area Chart"},
                {id: 'areachart-stacked', label: "Area Chart Stacked"},
                {id: 'steppedareachart', label: "Stepped Area Chart"}
            ]
        },
        columngraph: {
            label: 'Column Graph',
            subtypes: [
                {id: 'columnchart', label: "Column Chart"},
                {id: 'columnchart-stacked', label: "Column Chart Stacked"},
                {id: 'histogram', label: "Histogram"}
            ]
        },
         bargraph: {
            label: 'Bar Graph',
            subtypes: [
                {id: 'barchart', label: "Bar Chart"},
                {id: 'barchart-stacked', label: "Bar Chart Stacked"}
            ]
        },
         scattergraph: {
            label: 'Scatter Graph',
            subtypes: [
                {id: 'scatterchart', label: "Scatter Chart"},
                {id: 'bubblechart', label: "Bubble Chart"}
            ]
        },
        piegraph: {
            label: 'Pie Graph',
            subtypes: [
                {id: 'piechart', label: "Pie Chart"},
                {id: 'piechart-3d', label: "Pie Chart 3D"},
                {id: 'donutchart', label: "Donut Chart"}
            ]
        },
        geograph: {
            label: 'Geo Graph',
            subtypes: [
                {id: 'geochart', label: "Geo Chart"},
                {id: 'geochart-markers', label: "Geo Chart Markers"}
            ]
        }
    };

    /**
     * Create a new instance of class GraphSelector.
     * @class
     */
    var GraphSelector = function GraphSelector(element, onclick) {
        this.container = document.createElement('div');
        this.container.className = "container-basicgraphs";
        element.appendChild(this.container);

        this.subcontainer = document.createElement('div');
        this.subcontainer.className = "container-subgraphs";
        element.appendChild(this.subcontainer);

        for (var i = 0; i < graph_types.length; i++) {

            var newImage = document.createElement('img');
            newImage.className = "graph-button " + graph_types[i];
            newImage.setAttribute("src", "images/" + graph_types[i] + ".png");

            build_graph_subtypes.call(this, onclick, graph_types[i]);
            newImage.addEventListener("click", display_graph_subtypes.bind(this, graph_types[i]));

            this.container.appendChild(newImage);
        }

        display_graph_subtypes.call(this, 'lineargraph');
        on_graphsubtype_click.call(this, onclick, 'linechart');
    };

    var build_graph_subtypes = function build_graph_subtypes(onclick, id) {
        var graph = graph_types_info[id];

        var subtype_container = document.createElement('div');
        subtype_container.className = id;

        for (var i = 0; i < graph.subtypes.length; i++) {
            var newImage = document.createElement('img');
            newImage.className = "graph-button " + graph.subtypes[i].id;
            newImage.setAttribute("src", "images/subtypes/" + graph.subtypes[i].id + ".png");
            newImage.addEventListener("click", on_graphsubtype_click.bind(this, onclick, graph.subtypes[i].id), true);

            subtype_container.appendChild(newImage);
        }
        this.subcontainer.appendChild(subtype_container);
    };

    var display_graph_subtypes = function display_graph_subtypes(id) {
        var i;

        // Manage the graph type
        // Remove old active element in graph container
        var old_graph_active_elements = this.container.querySelectorAll('.active');
        for (i = 0; i < old_graph_active_elements.length; i++) {
            old_graph_active_elements[i].classList.remove("active");
        }

        // Add new active element in graph container
        var new_graph_active_element = this.container.querySelector('.' + id);
        new_graph_active_element.classList.add("active");

        // Manage the subtype container
        // Remove old active element in subtype container
        var old_active_element = this.subcontainer.querySelectorAll('div.active');
        for (i = 0; i < old_active_element.length; i++) {
            old_active_element[i].classList.remove("active");
        }

        // Add old active element in subtype container
        var new_active_element = this.subcontainer.querySelector('div.' + id);
        new_active_element.classList.add("active");
    };

    var on_graphsubtype_click = function on_graphsubtype_click(onclick, graph_subtype) {
        // Manage the subtype container
        var old_active_element = this.subcontainer.querySelectorAll('.graph-button.active');
        for (var i = 0; i < old_active_element.length; i++) {
            old_active_element[i].classList.remove("active");
        }

        var new_active_element = this.subcontainer.querySelector('.graph-button.' + graph_subtype);
        new_active_element.classList.add("active");

        onclick(graph_subtype);
    };

    window.GraphSelector = GraphSelector;

})();