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
 * Base Class with helper methods
 * extends arena, bank, player
 */
var base = {
    /**
     * calculate random number from given range
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    rnd: function (min, max) {
        return Math.round(Math.random() * (max - min)) + min;
    },
    /**
     * round in money style
     * @param {Number} n
     * @returns {Number}
     */
    round: function (n) {
        return Math.round(n * 100) / 100;
    },
    /**
     * 
     * @param {boolean} sell
     * @returns {boolean} true if a trade was performed
     */
    trade: function (sell) {
        var p1, p2, amount, price;
        if (this.money > 0 && arena.alive() >= 2) {
            // get a random player or bank
            do {
                p1 = arena.getRandomPlayer(true);
            } while (p1 === this || p1.isDead);
            // player has credit and makes better business now
            if (sell) {
                p2 = p1;
                p1 = this;
            } else {
                p2 = this;
            }
            // buy 1/4 from other stock or with 1/4 from own money, depends on what is less
            amount = Math.round(Math.min(p1.materials, p2.money / bank.ratio) / 2);
            // trade at least 1
            if (amount > 0) {
                // exchange money and materials
                price = this.round(amount * bank.ratio);
                p2.money -= price;
                p1.money += price;
                p2.materials += amount;
                p1.materials -= amount;
                // write some user-information about the happening
                if (sell) {
                    p1.tradeAction = 'Sold ' + amount + ' Materials to ' + p2.htmlId() + ' for ' + price + ' Money';
                } else {
                    p2.tradeAction = 'Bought ' + amount + ' Materials from ' + p1.htmlId() + ' for ' + price + ' Money';
                }
                return true;
            }
        }
        return false;
    },
    

    /**
     * set loaded data
     * @param {array} data
     * @param {object} target where the data belongs to, defaults to this
     * @returns {undefined}
     */
    setData: function (data, context) {
        var keys, path, value, obj;
        if(!context){
            context = this;
        }
        keys = context.keys();
        try{
            while (keys.length) {
                path = keys.pop().split('.');
                obj = context;
                while (path.length >= 2) {
                    obj = obj[path.shift()];
                }
                value = data.pop();
                obj[path[0]] = value;
            }
        }catch(e){
            throw(e);
        }
    },

    /**
     * read data for saving
     * @returns {String}
     */
    getData: function (context) {
        var path, keys, values = [], obj;
        if(!context){
            context = this;
        }
        keys = context.keys();
        // run through values
        while (keys.length) {
            path = keys.shift().split('.');
            obj = context;
            while (path.length) {
                obj = obj[path.shift()];
            }
            values.push(obj);
        }
        return'[' + values.join(',') + ']';
    }
}



