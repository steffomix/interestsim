/*
 * Copyright (C) 2013 Stefan Brinkmann (http://sourceforge.net/users/steff-o-mat)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var handler = {
    prepare: function () {
        /**
         * autorun, start and stop
         */
        $('#btn_engage').click(function () {
            // measure max bars length
            bars.measure();
            // run simulation one step
            arena.engage();
        });
        $('#btn_engage_auto').click(function () {
            bars.measure();
            // run simulation endless
            autorun.run($(this));
        });
        $('#btn_restart').click(function () {
            document.location.href = cnf.createUrl() + '&' + new Date().getTime();
        });

        /**
         * save and load
         */
        $('#btn_read').click(function () {
            io.makeSnapshot();
        });
        $('#btn_csv').click(function () {
            $('#inpl_data').val(io.getCSV());
        });
        $('#btn_apply').click(function () {
            if (confirm('This will replace your current running Simulation.')) {
                io.applySnapshot();
            }
        });
        $('#btn_load_pastebin').click(function () {
            io.loadPasteBin();
        });
        $('#btn_save').click(function () {
            io.save();
        });
        $('#btn_update').click(function () {
            io.update();
        });
        $('#btn_last_saves').click(function () {
            io.searchLast();
        });
        $('#btn_lessions').click(function () {
            io.lessions();
        });
        $('#inpl_name').keyup(function () {
            var t = $(this).val();
            if (t.length >= 2) {
                io.search(t);
            }
        });
        /**
         * url creation
         */
        $('#btn_create_url').click(function () {
            $('#outp_create_url').val(cnf.createUrl());
        });
        $("#outp_create_url")
                .focus(function () {
                    $(this).select();
                })
                .mouseup(function (e) {
                    e.preventDefault();
                });

        /**
         * config changed
         */
        $('[id^=inpv_]').each(function () {
            $(this).change(function () {
                cnf.validateValue($(this));
            });
        });
        $('[id^=inpr_]').each(function () {
            $(this).change(function () {
                cnf.validateRange($(this));

            });
        });
        
        $('#ck_bankAutoWaste').change(function(){
            !$(this).is(':checked') && $('#inpv_bankHarvesting').val(cnf.bankHarvesting);
        });
        $('#ck_bankAutoInterest').change(function(){
            !$(this).is(':checked') && $('#inpv_bankInterest').val(cnf.bankInterest);
        });
        
        /**
         * open/close pressets and 
         */
        /**
         * show hide helper
         * @param {Object} btn clicked button
         * @param {Object} node node to hide or show
         * @param {type} hide 'hide...' text for the button
         * @param {string} show 'show...' text for the button
         * @returns {undefined}
         */
        var showHide = function (btn, node, hide, show) {
            if (node.is(':hidden')) {
                node.show();
                btn.attr('value', hide);
            } else {
                node.hide();
                btn.attr('value', show);
            }
        };
        $('#btn_load_save').click(function () {
            showHide($(this), $('#load_save'), 'Hide Load/Save', 'Show Load/Save');
        }).click();
        $('#btn_pressets').click(function () {
            showHide($(this), $('#pressets'), 'Hide Presets', 'Show Presets');
        }).click();
        $('#btn_moreOptions').click(function () {
            showHide($(this), $('.moreOptions'), 'Hide more Options', 'Show more Options');
        }).click();
        /**
         * show/hide clear passwd
         */
        $('#inpl_passwd').keyup(function () {
            $('#inpl_passwd2').val($(this).val());
        });
        $('#btn_show_passwd').mousedown(function () {
            $('#inpl_passwd').hide();
            $('#inpl_passwd2').show();
        });
        $('#btn_show_passwd').mouseup(function () {
            $('#inpl_passwd').show();
            $('#inpl_passwd2').hide();
        });
        $('#btn_show_passwd').mouseup();

        /**
         * bars
         */
        $('#lock_bars').change(function () {
            bars.lock = $(this).is(':checked');
            arena.render();
        });
        
        // hide update area
        $('#loaded').hide();

        $(window).scroll(function () { //detect page scroll
            arena.updateVisibleRange();
            arena.render();
        });
    }

}

