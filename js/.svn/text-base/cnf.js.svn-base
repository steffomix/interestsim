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
 * sim-config and runtime vars
 */
var cnf = {
    /**
     * all these variables are read and from html dom and set or overwritten on simulation start
     */
    version: 4,
    autoEngage: 150,
    maxPlayers: 25,
    playerStart: 0,
    playerPopulate: 10,
    playerMaxAge: {min: 200, max: 300},
    newPlayerMoney: {min: 0, max: 0},
    newPlayerMaterials: {min: 0, max: 0},
    bankHarvesting: 0,
    bankInterest: 5,
    bankMinAssets: 5,
    bankTradeActivity: 5,
    deployMoney: 0,
    deployMaterials: 0,
    playerHarvesting: 1,
    playerTradeActivity: 5,
    playerCreditActivity: 10,
    playerRebalanceMoney: 0,
    playerRebalanceMaterials: 0,
    /**
     * keys to save and load
     * does not include 'version'
     * @returns {Object} {values: [array of values: n], ranges: [array of ranges: {n min, n max}], data: other values}
     */
    keys: function () {
        var values = [], ranges = [];
        $('[id^=inpv_]').each(function () {
            values.push($(this).attr('id').split('_')[1]);
        });
        $("[id^=inpr_]").each(function () {
            ranges.push($(this).attr('id').split('_')[1]);
        });
        return {values: values, ranges: ranges};
    },
    getData: function () {
        var keys = this.keys(), v = [], _this = this;
        v.push('"version":' + this.version);
        keys.values.forEach(function (id) {
            v.push('"' + id + '":' + _this[id]);
        });
        // all ranges
        keys.ranges.forEach(function (id) {
            v.push('"' + id + '":{"min":' + _this[id].min + ',"max":' + _this[id].max + '}');
        });
        return '{' + v.join(',') + '}';
    },
    /**
     * set 
     * @param {type} data
     * @returns {undefined}
     * @throw message 'values' || 'ranges'
     */
    setData: function (data) {
        var keys = this.keys(), _this = this;
        // write cnf values
        keys.values.forEach(function (k) {
            var node = $('#inpv_' + k);
            if (_this.validateValue(node)) {
                _this[k] = data[k];
            } else {
                throw('values');
            }
        });
        // write cnf ranges
        keys.ranges.forEach(function (k) {
            var node = $('#inpr_' + k);
            if (_this.validateRange(node)) {
                _this[k] = data[k];
            } else {
                throw('ranges');
            }
        });
    },
    /**
     * read all input fields where begin with 'inpr_' as rang(n,n) or 'inpv_' as value(n)
     * and write into cnf
     * @returns {undefined}
     */
    readDoc: function () {
        var _this = this, node, id, range, keys = this.keys();
        ;
        $("[id^=inpr_]").each(function () {
            node = $(this);
            id = node.attr('id').split('_')[1];
            range = _this.checkRange(node.val());
            if (range) {
                _this[id] = range;
                // _this.s += id+': {min: '+range.min+', max: '+range.max+'},\n'; // for dev only

            }
        });
        $('[id^=inpv_]').each(function () {
            var node = $(this), id, val;
            id = node.attr('id').split('_')[1];
            val = node.val();
            if (_this.numeric(val)) {
                _this[id] = val.trim() - 0;
                // _this.s += id+': '+val+',\n'; // for dev only
            }
        });
    },
    /**
     * same as @readDoc() but read values from url and overwrites values and ranges a second time
     * @returns {undefined}
     */
    readUrl: function () {
        var _this = this, values = [], params = window.location.search.substring(1).split('&');
        if (params.length) {
            params.forEach(function (p) {
                var p = p.split('=');
                if (p.length == 2) {
                    values.push({k: p[0].trim(), v: p[1].trim()});
                }
            });
            // read ranges
            $("[id^=inpr_]").each(function () {
                var node = $(this), id;
                id = node.attr('id').split('_')[1];
                values.forEach(function (p) {
                    var range;
                    if (p.k == id) {
                        range = _this.checkRange(p.v);
                        if (range) {
                            _this[id] = range;
                            node.val(p.v);
                        }
                    }
                });
            });
            // read values
            $('[id^=inpv_]').each(function () {
                var node = $(this), id;
                id = node.attr('id').split('_')[1];
                values.forEach(function (p) {
                    if (p.k == id) {
                        if (_this.numeric(p.v)) {
                            _this[id] = p.v - 0;
                            node.val(p.v);
                        }
                    }
                });
            });
        }
    },
    /**
     * create url from given settings in user-interface
     * @returns {string}
     */
    createUrl: function () {
        var params = [], url = window.location.href.split('?')[0] + '?';
        $('[id^=inpv_]').each(function () {
            var node = $(this);
            params.push(node.attr('id').split('_')[1] + '=' + node.val());
        });
        $('[id^=inpr_]').each(function () {
            var node = $(this);
            params.push(node.attr('id').split('_')[1] + '=' + node.val());
        });
        return url + params.join('&');
    },
    /**
     * input value changed handler
     * set value to cnf and notify arena
     * @param {object} node
     * @returns {undefined}
     */
    validateRange: function (node) {
        var id = node.attr('id').split('_')[1], val, range, changed = false, valid = false;
        val = node.val().trim();
        range = this.checkRange(val);
        if (range) {
            changed = this[id].min != range.min || this[id].max != range.max;
            this[id] = range;
            valid = true;
        }
        // notify arena
        if (changed) {
            $('#inpr_' + id).val(cnf[id].min + ',' + cnf[id].max);
            arena.cnfChanged(id, range);
        }
        return valid;
    },
    /**
     * validate user-input against string "n,n"
     * put the lower to min and the higher to max
     * @param {string} t
     * @returns {object|Number}
     */
    checkRange: function (t) {
        var ta, min, max;
        if (t.indexOf(',') >= 0) {
            ta = t.split(',');
            min = ta[0].trim();
            max = ta[1].trim();
            if (this.numeric(min) && this.numeric(max)) {
                return {min: Math.abs(Math.round(Math.min(min, max))), max: Math.abs(Math.round(Math.max(min, max)))};
            }
        }
        return 0;
    },
    /**
     * input value changed handler
     * set value to cnf  and notify arena
     * @param {object} node
     * @returns {undefined}
     */
    validateValue: function (node) {
        var id = node.attr('id').split('_')[1], val, nVal, valid = false;
        val = node.val().trim();
        if (this.numeric(val)) {
            switch (id) {
                // 1-5000 +-1
                case 'autoEngage':
                    nVal = Math.round(Math.abs(Math.max(1, Math.min(5000, val))));
                    valid = true;
                    break;
                    // 0-10000 +-1
                case 'maxPlayers':
                    nVal = Math.round(Math.abs(Math.max(0, Math.min(10000, val))));
                    valid = true;
                    break;
                    // ~unlimited +-1
                case 'playerMaxAge':
                    nVal = Math.round(Math.abs(Math.max(1, Math.min(100000000, val))));
                    valid = true;
                    break;
                    // -100 - 100 +-1
                case 'bankInterest':
                    // allow negative interest
                    nVal = Math.round(Math.max(-100, Math.min(100, val)));
                    valid = true;
                    break;
                    // 0-100 +-1
                case 'playerTradeActivity':
                case 'playerCreditActivity':
                case 'bankTradeActivity':
                case 'playerPopulate':
                case 'bankMinAssets':
                    nVal = Math.round(Math.abs(Math.max(0, Math.min(100, val))));
                    valid = true;
                    break;
                    // reset only
                case 'playerRebalanceMoney':
                    if (val < .1) {
                        bank.restPlayerBalance = 0;
                    }
                    // don't break!
                    // -100 - 100 +-0.1
                case 'playerHarvesting':
                case 'bankHarvesting':
                case 'playerRebalanceMoney':
                case 'playerRebalanceMaterials':
                    nVal = Math.round(Math.max(-100, Math.min(100, val)) * 100) / 100;
                    valid = true;
                    break;
                    // 0-100 +-0.1
                case 'bankMinAssets':
                    nVal = Math.round(Math.abs(Math.max(0, Math.min(100, val))) * 100) / 100;
                    valid = true;
                    break;
                    // 
                default:
                    nVal = Math.round(Math.abs(val));
                    valid = true;
            }
        }
        if (nVal != this[id]) {
            node.val(nVal);
            this[id] = nVal;
            // notify arena
            arena.cnfChanged(id, nVal);
        }
        return valid;
    },
    /**
     * check if n is a number
     * @param {mixed} n
     * @returns {Boolean}
     */
    numeric: function (n) {
        return (n - 0) == n && ('' + n).trim().length > 0;
    }
};


