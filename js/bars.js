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
 * base class of bankBars and playerBars
 * @type type
 */
var bars = {
    getData: function () {
        return '[' + [this.diff, playerBar._ratio, bankBar._ratio].join(',') + ']';
    },
    setData: function (data) {
        var i = 0;
        try {
            // check numeric
            data.forEach(function (v) {
                if (!cnf.numeric(v)) {
                    throw('Value Data[' + i + '] not numeric.');
                }
                i++;
            });
            this.diff = data[0];
            playerBar._ratio = data[1];
            bankBar._ratio = data[2];
        } catch (e) {
            throw('Bars Data corrupted or missing:\n' + e);
        }
    },
    node: $('#bars_ratio'),
    maxLength: 1000,
    scaleSpeed: 20,
    diff: 50,
    lock: false,
    measure: function () {
        var length;
        // get max length for bars
        try {
            length = /[0-9]*/.exec($('#barsReference').css('width'))[0];
        } catch (e) {
            length = 600;
        }
        this.maxLength = (cnf.numeric(length) ? length : 600);
    },
    max: function (n) {
        this._max = Math.max(Math.abs(n), this._max);
    },
    ratio: function () {
        var m = ((this._max == 0 ? 1 : this.maxLength / this._max) - this._ratio) / this.scaleSpeed;
        this._ratio += (cnf.numeric(m) ? m : 0);
    },
    render: function () {
        if (this.lock) {
            this.node.css('width', '50%');
        } else {
            var pMax = playerBar._max, bMax = bankBar._max;
            var m = (bMax * (100 / (bMax + pMax)) - this.diff) / this.scaleSpeed;

            this.diff += (cnf.numeric(m) ? m : 0);
            this.node.css('width', 100 - this.diff + '%');
        }

    },
    reset: function () {
        this._max = 0;
    },
    /**
     * scale money bar
     * @param {Number} n
     * @returns {Number}
     */
    scale: function (n) {
        return Math.round(n * (this.lock ? Math.min(playerBar._ratio, bankBar._ratio) : this._ratio) * this.scaleAll);

    }
};


function PlayerBar() {
    this._max = 0;
    this._ratio = 1;
    this.scaleAll = .5;
}
function BankBar() {
    this._max = 0;
    this._ratio = 1;
    this.scaleAll = .5;
}

PlayerBar.prototype = BankBar.prototype = bars;

playerBar = new PlayerBar();
bankBar = new BankBar();
