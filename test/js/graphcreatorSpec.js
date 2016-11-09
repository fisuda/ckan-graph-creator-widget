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

/* globals $, MockMP */


(function () {

    "use strict";

    var clearDocument = function clearDocument() {
        document.body.innerHTML = "";
    };

    var getWiringCallback = function getWiringCallback(endpoint) {
        var calls = MashupPlatform.wiring.registerCallback.calls;
        var count = calls.count();
        for (var i = count - 1; i >= 0; i--) {
            var args = calls.argsFor(i);
            if (args[0] === endpoint) {
                return args[1];
            }
        }
        return null;
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
            window.MashupPlatform.wiring.registerStatusCallback = function() {};
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

    });

})();
