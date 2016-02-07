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
 * Player Class constructor
 * @returns {player}
 */
var Player = function () {
    this.id = 0;
    this.node = {};
    // trade info container, only for user-information
    this.tradeAction = '';
    // current credit container
    this.credit = {
        taken: 0,
        paid: 0,
        interestPaid: 0,
        interest: 0
    };
    this.age = 0;
    this.maxAge = Math.round(Math.random() * (cnf.playerMaxAge.max - cnf.playerMaxAge.min)) + cnf.playerMaxAge.min;
    // player runs one round without action but marked as dead
    // overwrites base.isDead where it is needed in base.trade()
    this.isDead = false;
    // money and materials
    this.money = this.rnd(cnf.newPlayerMoney.min, cnf.newPlayerMoney.max);
    this.materials = this.rnd(cnf.newPlayerMaterials.min, cnf.newPlayerMaterials.max);
};
// global player id counter
Player.players = 0;
Player.births = 0;
Player.deaths = 0;

/**
 * keys to save and load
 * @returns {Array}
 */
Player.keys = function () {
    return ["players", "births", "deaths"];
};


/**
 * keys to save and load
 * don't change or all current saves are messed up
 * @returns {Array}
 */
Player.prototype.keys = function () {
    return ['id', 'age', 'maxAge', 'money', 'materials', 'credit.taken', 'credit.paid', 'credit.interestPaid', 'credit.interest']
};

/**
 * Called by user through arena.engage() on every engage or auto-engage
 */
Player.prototype.engage = function () {
    var sell;
    if (this.isDead) {
        Player.deaths++;
        return arena.removePlayer(this);
    }
    // birth, die if populate
    if (this.live()) {
        // harvest and rott materials
        this.harvest();
        // clear trade action information
        //this.tradeAction = '';
        // trade
        if (cnf.playerTradeActivity > 0 && Math.random() * 100 < (cnf.playerTradeActivity + (this.credit.taken > 0 ? cnf.playerTradeActivity * 2 : 0))) {
            // trade more and try to sell when taken a credit
            sell = (this.credit.taken > 0 || this.money < 0) && Math.random() > .4 ? true : false;
            this.trade(sell);
        }
        // try to get some credit
        bank.giveCredit(this);
    } else {
        this.isDead = true;
    }
};

/**
 * harvest some materials stuff
 * @returns {undefined}
 */
Player.prototype.harvest = function () {
    if (this.credit.taken > 0) {
        // player works harder with a credit
        this.materials += this.round(Math.random() * cnf.playerHarvesting * (cnf.playerHarvesting > 0 ? 1.5 : 0.5));
    } else {
        // player works normal
        this.materials += this.round(Math.random() * cnf.playerHarvesting);
    }
    // materials can't rott into negative
    if (this.materials < 0) {
        this.materials = 0;
    }
};

/**
 * birth, die or suicide
 * @returns {Boolean} false if player died
 */
Player.prototype.live = function () {
    // die only when players populate
    if (cnf.playerPopulate < 1) {
        return true;
    }
    // too old?
    if (++this.age > this.maxAge) {
        this.die();
        return false;
    }
    // birth new player
    if (cnf.playerPopulate > 0 && Math.abs(this.money) > 100 + cnf.newPlayerMoney.max * 2 && Math.abs(this.materials) > 100 + cnf.newPlayerMaterials.max * 2) {
        if (this.money > this.materials / 10) {
            Player.births += arena.addPlayer() ? 1 : 0;
            return true;
        }
    }
    // allow to live longer
    return true;
};

/**
 * when a player dies, his money, material and credit goes to other players
 * or when no other player is left, the bank get it
 * @returns {undefined}
 */
Player.prototype.die = function () {
    var he, he1, he2, c1 = 0, c2 = 0, mo1 = 0, mo2 = 0, credit, materials, rest, money;
    arena.playerDied(this);
    if (arena.alive() >= 2) {
        if (arena.alive() == 2) {
            he, rest;
            do {
                he = arena.getRandomPlayer(false);
            } while (he == this);
            // give heritage own money
            he.money += this.money;
            he.materials += this.materials;
            // let pay heritage outstanding credit
            he.credit.taken += this.credit.taken - this.credit.paid;
            this.tradeAction = this.name() + ' got his Money, his Credit and hhis Materials';
        } else {
            // split heir into 2 pieces
            money = Math.round(this.money * 100);
            materials = Math.round(this.materials / 2);
            credit = this.credit.taken - this.credit.paid;
            // find two inheriting players
            do {
                he1 = arena.getRandomPlayer(false);
                he2 = arena.getRandomPlayer(false);
            } while (he1 == he2 || he1 == this || he2 == this);
            // split money in half without creating half pennys
            if (money != 0) {
                if (money % 2 != 0) {
                    mo1 = mo2 = Math.round((money - 1) / 2) / 100;
                    mo1 += .01;
                    he1.money += mo1;
                    he2.money += mo2;
                } else {
                    mo1 = mo2 = Math.round(money / 2) / 100;
                    he1.money += mo1;
                    he2.money += mo2;
                }
            }
            // split credit in half without creating half credits
            if (credit != 0) {
                if (credit % 2 != 0) {
                    c1 = c2 = (credit - 1) / 2;
                    c1++;
                    he1.credit.taken += c1;
                    he2.credit.taken += c2;
                } else {
                    c1 = c2 = credit / 2;
                    he1.credit.taken += c1;
                    he2.credit.taken += c2;
                }
            }
            // split half materials in two pieces, the other half always get lost
            he1.materials += materials;
            he2.materials += materials;
            this.tradeAction = this.name() + ' and ' + this.name() + ' got his Money, his Credit and his Materials.';
        }
    } else {
        // last player died, give all back to bank even it's negative
        bank.money += this.money;
        this.money = 0;
        // destroy by credits created money
        if (this.credit.taken > 0) {
            rest = this.credit.taken - this.credit.paid;
            bank.money -= rest;
            bank.allGivenCredits -= rest;
        }
        // give materials to bank
        bank.materials += this.materials;
        this.tradeAction = 'The Bank got his Money and his Materials, destroyed the Money that was created due to his Credit.';
    }
};
/**
 * visible name for display
 * @returns {String}
 */
Player.prototype.name = function () {
    return 'Player ' + this.id;
};
/**
 * html attribute id
 * @returns {String}
 */
Player.prototype.htmlId = function () {
    return 'player_' + this.id;
};
/**
 * create html for render
 */
Player.prototype.getHtml = function () {
    // get next color
    var c, color, html;
    if (cnf.playerPopulate > 0) {
        c = 225 + Math.round(this.id % 4) * 10;
        color = 'rgb(' + c + ',' + c + ',' + c + ')';
    } else {
        color = 'rgb(255,255,255)';
    }

    html = '<table>'
            + '<tr><th rowspan="4" style="min-width:8em; width: 2%; background-color: ' + color + '"><p>' + (this.isDead ? '&#8224; <s>' + this.name() + '</s>' : this.name()) + '</p>' + this._renderAge() + '</th><td style="min-width:6em">Money: </td><td>' + this.renderInput('money', this.round(this.money), 5) + '</td><td><div style="background-color: ' + (this.round(this.money) > 0 ? 'yellow' : 'red') + '; width:' + playerBar.scale(Math.abs(this.round(this.money))) + 'px">&nbsp</div></td></tr>'
            + '<tr><td>Credit: </td><td><span title="Credit Taken">T:' + this.renderInput('credit.taken', this.credit.taken, 3) + '</span><span title="Credit Paid"> P:' + this.renderInput('credit.paid', this.credit.paid, 5) + '</span><span title="Interest"> I:' + this.renderInput('credit.interest', this.credit.interest, 3) + '</span><span title="Interest paid"> Ip:' + this.credit.interestPaid.toFixed(2) + '</span></td><td><div style="background-color: orange; width:' + playerBar.scale(this.credit.taken - this.credit.paid) + 'px">&nbsp</div></td></tr>'
            + '<tr><td style="width: 1%">Materials: </td><td  style="min-width:12em; width: 2%">' + this.renderInput('materials', this.round(this.materials), 5) + '</td><td style="width: 90%"><div style="background-color: darkgreen; width:' + playerBar.scale(this.materials) + 'px">&nbsp</div></td></tr>'
            + '<tr><td>Trade: </td><td id="tradeInfo_' + this.htmlId() + '" colspan="2" style="min-width: 30em">' + this.tradeAction + '</td></tr>'
            + '</table>';
    return html;
};
/**
 * render fancy age colors
 * @returns {String}
 */
Player.prototype._renderAge = function () {
    if (cnf.playerPopulate < 1) {
        return '';
    }
    var t, scale = 255 / this.maxAge, red = Math.round(this.age * scale), green = Math.round(255 - this.age * scale);
    if (autorun.running) {
        t = '<p><small><span style="color: rgb(' + red + ',' + green + ',0)">Age: </span>' + this.age + '/' + this.renderInput('maxAge', this.maxAge, 4) + '</small></p>';
    } else {
        t = '<p><small><span style="color: rgb(' + red + ',' + green + ',0)">Age: </span>' + this.age + '/' + this.renderInput('maxAge', this.maxAge, 4) + '</p>';
    }
    return t;
};
/**
 * apply rendered html to dom
 * @returns {undefined}
 */
Player.prototype.render = function () {
    // don't fade players death message
    if (!this.isDead) {
        // get old data for fadeOut
        var node = $('#tradeInfo_' + this.htmlId()), newInfo = node.html() != this.tradeAction, oc = node.css('opacity');
        // replace html
        this.node.html(this.getHtml());
        // continue fadeOut
        node = $('#tradeInfo_' + this.htmlId());
        if (!newInfo) {
            node.css('opacity', oc - (oc > .2 ? .1 : 0));
        }
        node.fadeTo(1000, .2);
        if (!autorun.running) {
            this.activateInput('maxAge');
            this.activateInput('money');
            this.activateInput('materials');
            this.activateInput('credit.taken');
            this.activateInput('credit.paid');
            this.activateInput('credit.interest');
        }
    } else {
        // render html
        $('#' + this.htmlId()).html(this.getHtml());
    }
};

/**
 * 
 * @returns {Number} vertical position of player
 */
Player.prototype.vPos = function () {
    return this.node.offset().top;
};
/**
 * hide player
 * @returns {undefined}
 */
Player.prototype.hide = function () {
    this.node.html('');
};
/**
 * check if player is hidden
 * @returns {Boolean}
 */
Player.prototype.hidden = function () {
    return this.node.is(':hidden');
};

Player.prototype.renderInput = function (k, v, size) {
    return autorun.running ? v : '<input style="margin: -1px .1em; padding: 0px 0px" type="text" id="' + this.htmlId() + '_' + k + '" value="' + v + '" size="' + size + '" />';
};

Player.prototype.activateInput = function (k) {
    var _this = this;
    $('#' + this.htmlId() + '_' + k.replace('.', '\\.')).change(function () {
        var node = $(this), k = node.attr('id').split('_')[2], v = node.val();
        if (k == 'money') {
            _this.money = cnf.numeric(v) ? Math.round(v * 100) / 100 : _this.money;
        } else if (k == 'materials') {
            _this.materials = cnf.numeric(v) ? Math.abs(Math.round(v)) : _this.materials;
        } else if (k == 'credit.taken') {
            _this.credit.taken = cnf.numeric(v) ? Math.abs(Math.round(v)) : _this.credit.taken;
        } else if (k == 'credit.paid') {
            _this.credit.paid = cnf.numeric(v) ? Math.min(Math.abs(Math.round(v)), _this.credit.taken) : _this.credit.paid;
        } else if (k == 'credit.interest') {
            _this.credit.interest = cnf.numeric(v) ? Math.min(100, Math.max(-100, Math.round(v))) : _this.credit.interest;
        } else if (k == 'maxAge') {
            _this.maxAge = cnf.numeric(v) ? Math.abs(Math.round(v)) : _this.maxAge;
        }
        bank.calculateRatio();
        bank.calculateRequiredMaterials();
        bank.calculateRequiredMoney();
        bank.render();
        _this.render();
    });
};

