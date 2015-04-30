/*
 *     Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 */

/*global $ */


(function () {

    "use strict";

    jasmine.getFixtures().fixturesPath = 'src/test/fixtures/';

    var dependencyList = [
        'script',
        'div#jasmine-fixtures',
        'div.jasmine_html-reporter'
    ];

    var clearDocument = function clearDocument() {
        $('body > *:not(' + dependencyList.join(', ') + ')').remove();
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

    describe("CKAN Graph Creator widget", function () {

        var widget = null;

        beforeEach(function () {
            loadFixtures('index.html');
            MashupPlatform.wiring.registerCallback.calls.reset();
            MashupPlatform.widget.context.registerCallback.calls.reset();

            widget = new Widget();
            widget.init();
            spyOn(widget.layout, 'repaint').and.callThrough();
        });

        afterEach(function () {
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
