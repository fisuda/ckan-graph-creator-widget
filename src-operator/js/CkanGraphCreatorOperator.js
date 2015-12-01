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

/*global MashupPlatform, Flotr2Configurer, GoogleChartConfigurer*/
/*exported CkanGraphCreatorOperator*/

window.CkanGraphCreatorOperator = (function () {
    "use strict";

    /*********************************************************
     ************************CONSTANTS*************************
     *********************************************************/

    /*********************************************************
     ************************VARIABLES*************************
     *********************************************************/

    /********************************************************/
    /**********************CONSTRUCTOR***********************/
    /********************************************************/

    var CkanGraphCreatorOperator = function CkanGraphCreatorOperator () {
        this.layout = null;
        this.group_title = null;
        this.series_title = null;
        this.group_axis_select = null;
        this.series_div = null;
        this.dataset = null;     //The dataset to be used. {structure: {...}, data: {...}}
        this.column_info = null;
        this._3axis_alternative = null;

        this.current_graph_type = MashupPlatform.prefs.get('graph_type');

        this.Flotr2Config = new Flotr2Configurer();
        this.GoogleChartConfig = new GoogleChartConfigurer();
        // Recieve events for the "dataset" input endpoint
        MashupPlatform.wiring.registerCallback('dataset', showSeriesInfo.bind(this));

    };

    /*********************************************************
     **************************PRIVATE*************************
     *********************************************************/

    var showSeriesInfo = function showSeriesInfo(dataset_json) {
        this.dataset = JSON.parse(dataset_json);
        this.column_info = {};

        for (var i = 0; i < this.dataset.structure.length; i++) {
            var id = this.dataset.structure[i].id;
            this.column_info[id] = this.dataset.structure[i];
        }

        create_graph_config.call(this);
    };

    var get_general_series = function get_general_series() {
        //Get the series from prefs
        return JSON.parse(MashupPlatform.prefs.get('graph_series'));
    };

    var get_bubble_series = function get_bubble_series() {
        return JSON.parse(MashupPlatform.prefs.get('graph_series'));
    };

    var create_graph_config = function create_graph_config() {
        var series;

        if (this.current_graph_type === 'bubblechart') {
            series = get_bubble_series.call(this);
        } else {
            series = get_general_series.call(this);
        }

        if (series.length > 0) {
            if (MashupPlatform.operator.outputs["flotr2-graph-config"].connected) {
                create_flotr2_config.call(this, series);
            }
            if (MashupPlatform.operator.outputs["googlecharts-graph-config"].connected) {
                create_google_charts_config.call(this, series);
            }
        }
    };

    var create_flotr2_config = function create_flotr2_config(series) {
        var config = this.Flotr2Config.configure(series, {
            graph_type: this.current_graph_type,
            dataset: this.dataset,
            fields: JSON.parse(MashupPlatform.prefs.get('graph_fields'))
        });

        MashupPlatform.wiring.pushEvent('flotr2-graph-config', JSON.stringify(config));
    };

    var create_google_charts_config = function create_google_charts_config(series) {
        var config = this.GoogleChartConfig.configure(series, {
            graph_type: this.current_graph_type,
            dataset: this.dataset,
            column_info: this.column_info,
            fields: JSON.parse(MashupPlatform.prefs.get('graph_fields'))
        });

        // group_column: this.group_column,
        //     axisx: this.axisx_select,
        //     axisy: this.axisy_select,
        //     axisz: this.axisz_select,
        //     id_bubble: this.id_bubble

        MashupPlatform.wiring.pushEvent('googlecharts-graph-config', JSON.stringify(config));

    };

    /****************************************/
    /************AUXILIAR FUNCTIONS**********/
    /****************************************/

    /* test-code */
    CkanGraphCreatorOperator.prototype = {
    };

    /* end-test-code */

    return CkanGraphCreatorOperator;

})();
