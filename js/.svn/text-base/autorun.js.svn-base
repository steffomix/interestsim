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

/**
 * autorun
 */
var autorun = {
    running: 0,
    run: function () {
        var node, length;
        if (!this.running) {
            this.running = 1;
            this._run();
        } else {
            this.running = 0;
        }
        // switch button
        node = $('#btn_engage_auto');
        node.attr('value', (this.running ? 'Stop Auto-Sim.' : 'Start Auto-Sim.'));
        node.css('color', (this.running ? 'darkred' : 'darkgreen'));
        // measure max bars length
        bars.measure();
        arena.prepareAutorun();
    },
    _run: function () {
        if (this.running) {
            var _this = this;
            setTimeout(function () {
                _this._run();
            }, cnf.autoEngage);
            arena.engage();
        } else {
            // render input fields
            arena.engage();
            arena.hideUltra();
        }
    }
};


