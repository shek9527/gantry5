"use strict";

var ready        = require('elements/domready'),
    map          = require('prime/map')(),
    merge        = require('mout/object/merge'),
    forEach      = require('mout/array/forEach'),
    trim         = require('mout/string/trim'),
    $            = require('../utils/elements.utils'),
    asyncForEach = require('../utils/async-foreach');

var Map         = map,
    Assignments = {
        toggleSection: function(e, element, index, array) {
            if (e.type.match(/^touch/)) { e.preventDefault(); }
            if (element.parent('[data-g-global-filter]')) { return Assignments.globalToggleSection(e, element); }
            if (element.matches('label')) { return Assignments.treatLabel(e, element); }

            var card    = element.parent('.card'),
                toggles = Map.get(card),
                save    = $('[data-save]'),
                mode    = element.data('g-assignments-check') == null ? 0 : 1;

            if (!toggles || !toggles.inputs) {
                var inputs = card.search('.enabler input[type=hidden]');

                if (!toggles) { toggles = Map.set(card, { inputs: inputs }).get(card); }
                if (!toggles.inputs) { toggles = Map.set(card, merge(Map.get(card), { inputs: inputs })).get(card); }
            }

            // if necessary we should move to asyncForEach for an asynchronous loop, else forEach
            asyncForEach(toggles.inputs, function(item) {
                item = $(item);

                if (item.parent('label').compute('display') == 'none') { return; }

                item.value(mode).emit('change');
                $('body').emit('change', { target: item });
            }, function() {
                if (typeof index !== 'undefined' && typeof array !== 'undefined' && (index + 1 == array.length)) {
                    save.disabled(false);
                }
            });
        },

        filterSection: function(e, element, value) {
            if (element.parent('[data-g-global-filter]')) { return Assignments.globalFilterSection(e, element); }

            var card        = element.parent('.card'),
                onlyEnabled = $('[data-assignments-enabledonly]'),
                items       = Map.get(card) || Map.set(card, { labels: card.search('label .settings-param-title') }).get(card);

            value = value || element.value();

            if (!items || !items.labels) {
                var labels = card.search('label .settings-param-title');

                if (!items) { items = Map.set(card, { labels: labels }).get(card); }
                if (!items.labels) { items = Map.set(card, merge(Map.get(card), { labels: labels })).get(card); }
            }

            items = $(items.labels);

            if (!value && !onlyEnabled.checked()) {
                card.style('display', 'inline-block');
                return items.search('!> label').style('display', 'block');
            }

            var count = 0, off = 0, on = 0, text, match;
            asyncForEach(items, function(item, i) {
                item = $(item);
                text = trim(item.text());
                match = text.match(new RegExp("^" + value + '|\\s' + value, 'gi'));

                if (onlyEnabled.checked()) {
                    match = Number(!!match) & Number(item.parent('label').find('.enabler input[type="hidden"]').value());
                }

                if (match) {
                    var group = item.parent('[data-g-assignments-parent]');
                    if (group && (group = group.data('g-assignments-parent'))) {
                        var parentGroup = item.parent('.card').find('[data-g-assignments-group="' + group + '"]');
                        if (parentGroup) { parentGroup.style('display', 'block'); }
                    }

                    item.parent('label').style('display', 'block');
                    on++;
                } else {
                    item.parent('label').style('display', 'none');
                    off++;
                }

                count++;
                if (count == items.length) {
                    card.style('display', !on ? 'none' : 'inline-block');
                }
            });
        },

        filterEnabledOnly: function(e, element) {
            var global = $('[data-g-global-filter] input[type="text"]');
            Assignments.globalFilterSection(e, global, element);
        },

        treatLabel: function(event, element) {
            if (event && event.stopPropagation && event.preventDefault) {
                event.stopPropagation();
                event.preventDefault();
            }

            if ($(event.target).matches('.knob, .toggle')) { return; }
            var input = element.find('input[type="hidden"]:not([disabled])');
            if (!input) { return; }

            var value = input.value();
            value = !!+value;
            input.value(Number(!value)).emit('change');
            $('body').emit('change', { target: input });

            return false;
        },

        globalToggleSection: function(e, element) {
            var mode   = element.data('g-assignments-check') == null ? '[data-g-assignments-uncheck]' : '[data-g-assignments-check]',
                save   = $('[data-save]'),
                search = $('#assignments .card ' + mode);

            if (!search) { return; }

            save.disabled(true);
            // if necessary we should move to asyncForEach for an asynchronous loop
            asyncForEach(search, function(item, index, array) {
                Assignments.toggleSection(e, $(item), index, array);
            });
        },

        globalFilterSection: function(e, element) {
            var value       = element.value(),
                onlyEnabled = $('[data-assignments-enabledonly]'),
                search      = $('#assignments .card .search input[type="text"]');

            if (!search && !onlyEnabled.checked()) { return; }

            asyncForEach(search, function(item) {
                Assignments.filterSection(e, $(item), value);
            });
        }
    };

ready(function() {
    var body = $('body');

    body.delegate('input', '#assignments .search input[type="text"]', Assignments.filterSection);
    body.delegate('click', '#assignments .card label, #assignments [data-g-assignments-check], #assignments [data-g-assignments-uncheck]', Assignments.toggleSection);
    body.delegate('touchend', '#assignments .card label, #assignments [data-g-assignments-check], #assignments [data-g-assignments-uncheck]', Assignments.toggleSection);
    body.delegate('change', '[data-assignments-enabledonly]', Assignments.filterEnabledOnly);
});

module.exports = {};
