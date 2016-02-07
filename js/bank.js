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
 * Bank
 */
function Bank () {
    // id of html dom node
    // this.render() need this
    this.id = 'bank';
    // well a bank can't be dead
    // but arena.getRandomPlayer ask for this
    this.isDead = false;
    // own money and matrials
    this.money = 0;
    this.materials = 0;
    // materials needed to give credits
    this.requiredMaterials = 0;
    // Money that should be available for players
    this.requiredMoney = 0;
    // given credit and visual bar size
    this.allGivenCredits = 0;
    // holds trade information for user
    this.tradeAction = '';
    // holds informations from sizing players
    this.sizedPlayers = {materials: 0, money: 0, players: 0};
    // store id's of players from one engage-round
    this.tempSizedPlayers = [];
    // detect new action and fade info if nothing happend
    this.allInterestTaken = 0;
    // whole current money in simulation
    this.allMoney = 0;
    // whole current materials in simulation
    this.allMaterials = 0;
    // count all players positive money
    this.allPlayersDeposit = 0;
    // count all players negative money
    this.allPlayersDept = 0;
    // all players materials
    this.allPlayersMaterials = 0;
    // holds money/materials ratio
    // used to calc price of materials
    // indicate inflation/deflation
    this.moneyDeployed = 0;
    this.materialsDeployed = 0;
    this.playersBalancedMoney = 0;
    this.playersBalancedMaterials = 0;
    this.ratio = 1;
    // when playersRabalanceMoney was too low
    // to deploy it is stored here for next try
    this.restPlayerBalance = 0,
    /*
     * autowaste
     */
    this.nodeInputHarvest = {};
    this.nodeCheckboxAutowaste = {};
    /*
     * Auto Interest
     */
    this.calculatedInterest = 5;
    this.nodeInputInterest = {};
    this.nodeCheckboxAutointerest = {};
}
/**
 * display name for user
 * @returns {String}
 */
Bank.prototype.name = function () {
    return 'Bank';
}
/**
 * html id name
 * @returns {String}
 */
Bank.prototype.htmlId = function () {
    return 'bank';
}
/**
 * keys to save and load
 * @returns {Array}
 */
Bank.prototype.keys = function () {
    return ['money', 'materials', 'allGivenCredits', 'allInterestTaken', 'sizedPlayers.materials', 'sizedPlayers.money', 'sizedPlayers.players'];
}
/**
 * prepare onLoad document
 * @returns {undefined}
 */
Bank.prototype.prepare = function(){
    // render bank
    this.money = this.rnd(cnf.newPlayerMoney.min, cnf.newPlayerMoney.max);
    this.materials = 50;
    this.calculateRatio();
    this.calculateRequiredMoney();
    this.calculateRequiredMaterials();
    this.calculateInterest();
    this.render();
}
/**
 * reset some values to default
 * @returns {undefined}
 */
Bank.prototype.prepareEngage = function () {
    this.tempSizedPlayers = [];
}
/**
 * Called by user through arena.engage() on every engage or auto-engage
 */
Bank.prototype.engage = function () {
    this.prepareEngage();
    this.harvest();
    this.deployMaterials();
    this.deployMoney();
    this.calculateInterest();
    this.demandCredits();
    this.playerRebalanceMoney();
    this.playerRebalanceMaterials();
    this.considerTrade();
    this.calculateRatio();
    this.calculateRequiredMaterials();
    this.calculateRequiredMoney();
    this.autoWasteMaterials();
}
/**
 * autowaste materials if checked
 * @returns {undefined}
 */
Bank.prototype.autoWasteMaterials = function () {
    var waste;
    if (this.nodeCheckboxAutowaste.is(':checked')) {
        waste = this.round(this.requiredMaterials < 0 ? this.requiredMaterials / 10 * -1 : 0);
        this.nodeInputHarvest.val(waste * -1);
        this.materials -= waste;
    }
}
/**
 * auto- or fixed Interest
 * @returns {number}
 */
Bank.prototype.calculateInterest = function () {
    var ratio, add, cur;
    if (this.nodeCheckboxAutointerest.is(':checked')) {
        cur = parseFloat(this.nodeInputInterest.val());
        if (isNaN(cur)) {
            cur = cnf.bankInterest;
        }
        ratio = (this.allPlayersDeposit*2) / (this.allPlayersDept * -1); // balance is 2 (double deposit as dept)
        if (isFinite(ratio)) {
            cur += (ratio - cur) / 10; //+= (ratio > cur ? .1 : -.1);
            cur = this.round(Math.max(Math.min(cur, 100), -100));
            this.nodeInputInterest.val(cur);
            this.calculatedInterest = cur;
        } else {
            this.calculatedInterest = cnf.bankInterest;
            this.nodeInputInterest.val(cnf.bankInterest);
        }
        //nodeInputInterest
    } else {
        this.calculatedInterest = cnf.bankInterest;
        this.nodeInputInterest.val(cnf.bankInterest);
    }

}
/**
 * calculate whether required materials(assets) are positive or negative
 * @returns {undefined}
 */
Bank.prototype.calculateRequiredMaterials = function () {
    var r = this.round(this.materials - (this.allGivenCredits / 100 * cnf.bankMinAssets) / this.ratio) * -1;
    this.requiredMaterials = (isNaN(r) ? 0 : r);
}
/**
 * calculate whether recomended money is positive or negative
 * @returns {undefined}
 */
Bank.prototype.calculateRequiredMoney = function () {
    var r = this.round(this.money - ((this.allPlayersDeposit) / 100 * cnf.bankMinAssets)) * -1;
    this.requiredMoney = (isNaN(r) ? 0 : r);
}
/**
 * solve the question of life: sell or buy
 * @returns {undefined}
 */
Bank.prototype.considerTrade = function () {
    /*
     * trade szenarios
     */
    if ((this.money > this.requiredMoney && this.requiredMaterials > this.materials) // too much money
            || (this.money > this.allGivenCredits && this.money > this.requiredMoney) // too much money
            || (this.money > 0 && this.allGivenCredits <= .1 && this.materials <= .1) // too less assets, near bankrupt
            ) {
        // buy every step
        this.trade(false);
    } else if (this.requiredMoney > 0 && this.requiredMaterials < 0) { // too much materials, too less money
        // try to get money from materials
        this.trade(true);
    } else if (this.money > this.requiredMoney && Math.random() * 100 < cnf.bankTradeActivity) { // random trade/sell but a bit more buy
        // try more buy than sell
        this.trade(Math.random() > .8);
    } else if (Math.random() * 100 < cnf.bankTradeActivity) { // normal random trade/sell
        // balanced buy and sell
        this.trade(Math.random() > .5);
    } else {
        // do nothing
    }
}
/**
 * demand players credits
 * @returns {undefined}
 */
Bank.prototype.demandCredits = function () {
    var i, c, p, rest, itr, pay;
    // players have to pay of their credits
    // iterate through all players and look for open credits
    for (i = 0; i < arena.players.length; i++) {
        // current player
        p = arena.players[i];
        // players credit data
        c = p.credit;
        if (!p.isDead && c.taken > 0 && c.paid < c.taken) {
            // get rest credit
            rest = c.taken - c.paid;
            // interest of rest credit
            itr = this.round(c.interest / 100);
            // get next rate to pay
            pay = Math.min(1, rest);

            // size materials from player if needed
            if (p.money <= 0 && this.ratio > 0.0001 && Math.random() > 0.5) {
                this.sizeMaterials(p, pay + itr);
            }

            // player pay rate and interest to bank
            p.money -= pay + itr;
            // register paid credit in users credit-data
            c.paid += pay;
            c.interestPaid += itr;
            // fix math errors
            p.money = this.round(p.money);
            c.interestPaid = this.round(c.interestPaid);
            // bank remove debt-claim
            // this.money -= pay;
            // get the interest
            this.money += itr;
            // adjust visual bar
            this.allGivenCredits -= pay;
            // log taken interest
            this.allInterestTaken = this.round(this.allInterestTaken + itr);

            // rollback credit if all paid
            if (c.taken > 0 && c.paid >= c.taken) {
                // reset player credit
                c.taken = c.paid = c.interest = 0;
            }
        }
    }
}
/**
 * when player hasn't enougth money, the bank buys materials as much as needed
 * and as much as bank has money
 * @param {player} player
 * @param {number} worth
 * @returns {undefined}
 */
Bank.prototype.sizeMaterials = function (player, worth) {
    // don't buy more as this.requiredMoney allow
    var w = Math.min(worth, (this.requiredMoney >= 0 ? 0 : this.requiredMoney * -1));
    // calculate the maximum amount of materials to get from player
    var mat = Math.min(Math.floor(w * 100 / this.ratio) / 100, player.materials);
    // calculate the price for the materials
    var mon = this.round(mat * this.ratio);
    // trade
    player.materials -= mat;
    this.materials += mat;
    player.money += mon;
    this.money -= mon;
    // log size action
    this.sizedPlayers.players++;
    this.sizedPlayers.money += mon;
    this.sizedPlayers.materials += mat;
    // log sized players for this engage-round
    this.tempSizedPlayers.push(player.id);

}
/**
 * give credit to player as much as he has materials
 * @param {player} p
 * @returns {undefined}
 */
Bank.prototype.giveCredit = function (p) {
    var c = p.credit, amount;
    if (c.taken <= 0 && Math.random() * 100 < cnf.playerCreditActivity) {
        // give max as much credit as player has materials and
        // as much bank has required % materials (asstets)
        var bMax = bank.materials - this.requiredMaterials;
        var pMax = (p.money + p.materials * this.ratio) / 0.5;
        amount = Math.round(Math.random() * Math.min(p.materials, bank.materials / cnf.bankMinAssets * 100));
        if (amount > 0) {
            // set interest
            c.interest = this.calculatedInterest;
            // notice given credit
            c.taken = amount;
            // bank can work with debt-claim like money
            p.money += amount;
            // nice bar only only for user-information
            this.allGivenCredits += amount;
            // bank can work with dept-claim like money
            //this.money += amount;
        }
    }
}
/**
 * harvest some materials stuff
 * @returns {undefined}
 */
Bank.prototype.harvest = function () {
    this.materials += this.round(Math.random() * cnf.bankHarvesting);
    // materials can't rott into negative
    if (this.materials < 0) {
        this.materials = 0;
    }
}
/**
 * deploy bougth materials to players
 * @returns {undefined}
 */
Bank.prototype.deployMaterials = function () {
    this.materialsDeployed = 0;
    if (cnf.deployMaterials > 0) {
        if (this.materials - this.money * this.ratio > arena.alive()) {
            var _this = this, amount = Math.floor(this.materials / arena.alive() / 100 * cnf.deployMaterials);
            if (amount > 0) {
                this.materialsDeployed = amount;
                arena.players.forEach(function (p) {
                    if (p !== _this && !p.isDead) {
                        p.materials += amount;
                        _this.materials -= amount;
                    }
                });
            }
        }
    }
}
/**
 * deploy incoming interest back to players
 * @returns {undefined}
 */
Bank.prototype.deployMoney = function () {
    // reset user-info
    this.moneyDeployed = 0;
    // deploy money
    if (cnf.deployMoney > 0) {
        // deploy money only when money > given credits
        if (this.money - this.allGivenCredits - arena.alive() > 0) {
            var _this = this, amount = Math.floor((this.money - this.allGivenCredits) / arena.alive() * cnf.deployMoney) / 100;
            // give at least a penny
            if (amount >= 0.01) {
                // user-info
                this.moneyDeployed = amount;
                // deploy money
                arena.players.forEach(function (p) {
                    // don't give money dead players
                    if (!p.isDead) {
                        p.money += amount;
                        _this.money -= amount;
                    }
                });
            }
        }
    }
}
/**
 * Player rebalance their money
 * take given % from each player, cut through players-count and repay its value
 * @returns {undefined}
 */
Bank.prototype.playerRebalanceMoney = function () {
    this.playersBalancedMoney = 0;
    if (cnf.playerRebalanceMoney > 0) {
        var count = arena.alive(), sum = 0, part = 0, _this = this;
        arena.players.forEach(function (p) {
            if (!p.isDead) {
                // take allGivenCredits % from player
                part = Math.floor(_this.round(p.money) * cnf.playerRebalanceMoney) / 100;
                p.money -= part;
                // put part on stack
                sum += Math.round(part * 100) / 100;
            }
        });
        // add rest from last rebalance
        // that was stored on bank
        sum += this.restPlayerBalance;
        this.money -= this.restPlayerBalance;
        // sum may be too low to deploy without creating half pennys -> math errors
        if (sum * 100 <= count) {
            this.restPlayerBalance = sum;
            this.money += sum;
            return;
        }
        // cut stack in parts of players count
        part = this.playersBalancedMoney = Math.round(Math.floor(sum / count * 100)) / 100;
        // notice rest and put on bank for next try
        this.restPlayerBalance = sum - part * count;
        this.money += this.restPlayerBalance;
        // give money back to players
        if (part > 0) {
            arena.players.forEach(function (p) {
                p.money += part;
            });
        }
    }
}
/**
 * player rebalance their materials 
 * @returns {undefined}
 */
Bank.prototype.playerRebalanceMaterials = function () {
    var count = arena.alive(), sum = 0, part = 0;
    if (cnf.playerRebalanceMaterials > 0) {
        arena.players.forEach(function (p) {
            // take allGivenCredits % from player
            // even from dead players
            part = Math.floor(p.materials * cnf.playerRebalanceMaterials) / 100;
            if (p.materials >= part) {
                p.materials -= part;
            }
            // put part on stack
            sum += Math.round(part * 100) / 100;
        });
        // move point to support 0.01 materials
        sum *= 100;
        if (sum >= count) {
            // cut through count players 
            // and throw away the rest (it goes damaged or whatever)
            part = Math.floor(sum / count);
            // move point back
            part /= 100;
            arena.players.forEach(function (p) {
                p.materials += part;
            });
            // notice for user/render
            this.playersBalancedMaterials = part;
        }
    }
}
/**
 * calculate global amounts of money, materials and its ratio
 * @returns {undefined}
 */
Bank.prototype.calculateRatio = function () {
    // count all money in simulation
    // begin with this bank
    this.allMoney = this.money;
    this.allMaterials = this.materials;
    this.allPlayersDeposit = 0;
    this.allPlayersDept = 0;
    this.allPlayersMaterials = 0;

    // add all players money and materials
    var _this = this;
    arena.players.forEach(function (p) {
        if (!p.isDead) {
            _this.allMoney += p.money;
            _this.allMaterials += p.materials;
            _this.allPlayersMaterials += p.materials;
            if (p.money > 0) {
                _this.allPlayersDeposit += p.money;
            } else {
                _this.allPlayersDept += p.money;
            }
        }
    });
    // calc money/materials ratio
    this.ratio = Math.abs(this.allMoney / this.allMaterials);
}
/**
 * 
 * @param {string} k key
 * @param {Number} v value
 * @param {Number} size of input field
 * @returns {String} html input
 */
Bank.prototype.renderInput = function (k, v, size) {
    return autorun.running ? v : '<input style="margin: -1px .1em; padding: 0px 0px" type="text" id="' + this.htmlId() + '_' + k + '" value="' + v + '" size="' + size + '" />';
}
/**
 * 
 * @param {type} k
 * @returns {undefined}
 */
Bank.prototype.activateInput = function (k) {
    var _this = this;
    $('#' + this.htmlId() + '_' + k.replace('.', '\\.')).change(function () {
        var node = $(this), k = node.attr('id').split('_')[1], v = node.val();
        if (k == 'money') {
            _this.money = cnf.numeric(v) ? Math.round(v * 100) / 100 : _this.money;
        } else if (k == 'materials') {
            _this.materials = cnf.numeric(v) ? Math.abs(Math.round(v)) : _this.materials;
        }
        _this.calculateRatio();
        _this.render();
    });
}
/**
 * this is something about...dom?
 * @returns {String}
 */
Bank.prototype.getHtml = function () {
    var html = '<table>'
            + '<tr><th rowspan="' + (5 + (cnf.deployMoney > 0 ? 1 : 0) + (cnf.deployMaterials > 0 ? 1 : 0) + (cnf.bankMinAssets > 0 ? 2 : 0)) + '" style="min-width:8em"> ' + this.name() + ' </th>'
            + '<td>Money: ' + this.renderInput('money', this.round(this.money), 5) + '</td><td id="barsReference" ><div style="background-color: ' + (this.money > 0 ? 'yellow' : 'red') + '; width:' + bankBar.scale(Math.abs(this.round(this.money))) + 'px">&nbsp</div></td></tr>'
            + '<tr><td style="cursor:help" title="Outstanding Debts and All Money should be same">Outstanding Debts: ' + (this.allGivenCredits == this.round(this.allMoney) ? this.allGivenCredits : '<span style="color: red;">' + this.allGivenCredits + '</span>') + '</td><td><div style="background-color: orange; width:' + bankBar.scale(this.allGivenCredits) + 'px">&nbsp</div></td></tr>'
            + '<tr><td style="width: 10%; min-width:20em">Materials: ' + this.renderInput('materials', this.round(this.materials), 5) + '</td><td style="width: 90%"><div style="background-color: darkgreen; width:' + bankBar.scale(this.materials) + 'px">&nbsp</div></td></tr>'
            + (cnf.bankMinAssets > 0 ?
                    '<tr><td style="width: 10%; min-width:12em; cursor:help" title="' + cnf.bankMinAssets + '% of all Players Money">Required Money:<span  style="color: ' + (this.requiredMaterials > 0 ? 'red' : 'green') + ';"> ' + this.requiredMoney + '</span> / ' + this.round((this.allMoney - this.money) / 100 * cnf.bankMinAssets) + '</td><td style="width: 90%"><div style="background-color: ' + (this.requiredMoney > 0 ? 'red' : 'yellow') + '; width:' + bankBar.scale(Math.abs(this.requiredMoney)) + 'px">&nbsp</div></td></tr>'
                    + '<tr><td style="width: 10%; min-width:12em; cursor:help" title="' + cnf.bankMinAssets + '% in worth of outstanding Depts">Required Materials:<span style="color: ' + (this.requiredMaterials > 0 ? 'red' : 'green') + ';"> ' + this.requiredMaterials + '</span> / ' + this.round((this.allGivenCredits / 100 * cnf.bankMinAssets) / this.ratio) + '</td><td style="width: 90%"><div style="background-color: ' + (this.requiredMaterials > 0 ? 'red' : 'darkgreen') + '; width:' + bankBar.scale(Math.abs(this.requiredMaterials)) + 'px">&nbsp</div></td></tr>'
                    : '')
            + (cnf.deployMoney > 0 ?
                    '<tr><td>Deployed Money: ' + this.moneyDeployed + '</td><td><div style="background-color: goldenrod; width:' + bankBar.scale(this.moneyDeployed * 100) + 'px">&nbsp</div></td></tr>'
                    : '')
            + (cnf.deployMaterials > 0 ?
                    '<tr><td>Deployed Materials: ' + this.materialsDeployed + '</td><td><div style="background-color: darkolivegreen; width:' + bankBar.scale(this.materialsDeployed * 100) + 'px">&nbsp</div></td></tr>'
                    : '')
            + '<tr><td>Trade: <br>Sized Players: <br>All taken Interest: </td><td>'
            + '<span id="tradeInfo_' + this.htmlId() + '">' + this.tradeAction + '</span><br>'
            + '<span id="sizeInfo">Sized ' + this.round(this.sizedPlayers.materials) + ' Materials for ' + this.round(this.sizedPlayers.money) + ' Money from ' + this.sizedPlayers.players + ' Players. This round from: <span style="font-size: 0.7em">' + this.tempSizedPlayers.join(', ') + '</span></span><br>'
            + '<span id="interestInfo">' + this.round(this.allInterestTaken) + '</span></td></tr>'
            + '<tr><td style="height: 8px" colspan="2"></td></tr>'

            + '<tr><th rowspan="' + (4 + (cnf.playerRebalanceMoney > 0 ? 1 : 0) + (cnf.playerRebalanceMaterials > 0 ? 1 : 0)) + '" style="min-width:6em"> Players </th>'
            + '<td>Deposit: ' + this.round(this.allPlayersDeposit) + '</td><td><div style="background-color: yellow; width:' + bankBar.scale(this.allPlayersDeposit) + 'px">&nbsp</div></td></tr>'
            + '<tr><td>Dept: ' + this.round(this.allPlayersDept) + '</td><td><div style="background-color: red; width:' + bankBar.scale(this.allPlayersDept * -1) + 'px">&nbsp</div></td></tr>'
            + '<tr><td>Materials: ' + this.round(this.allPlayersMaterials) + '</td><td><div style="background-color: darkgreen; width:' + bankBar.scale(this.allPlayersMaterials) + 'px">&nbsp</div></td></tr>'
            + (cnf.playerRebalanceMoney > 0 ?
                    '<tr><td>Balanced Money: ' + this.playersBalancedMoney + '</td><td><div style="background-color: goldenrod; width:' + bankBar.scale(this.playersBalancedMoney * 100) + 'px">&nbsp</div></td></tr>'
                    : '')
            + (cnf.playerRebalanceMaterials > 0 ?
                    '<tr><td>Balanced Materials: ' + this.playersBalancedMaterials + '</td><td><div style="background-color: goldenrod; width:' + bankBar.scale(this.playersBalancedMaterials * 100) + 'px">&nbsp</div></td></tr>'
                    : '')
            + '<tr><td style="height: 8px" colspan="2"></td></tr>'

            + '<tr><th style="min-width:6em"> Simulation</th><td style="padding: 0px" colspan="2"><table>'
            + '<tr><td>Sim-Step: </td><td style="min-width: 5em">' + arena.step + '</td>'
            + '<td>Players: </td><td style="min-width: 5em">' + arena.alive() + '</td>'
            + '<td rowspan="2">Ratio: </td><td rowspan="2">You can buy 1 Material for ' + this.ratio.toFixed(4) + ' Money' + '</td></tr>'
            + '<tr><td>All Money: </td><td title="Outstanding Debts and All Money should be same" style="cursor:help">' + (this.round(this.allMoney) == this.allGivenCredits ? this.allGivenCredits : '<span style="color: red;">' + this.round(this.allMoney) + '</span>') + '</td>'
            + '<td>All Materials: </td><td>' + this.round(this.allMaterials) + '</td></tr>'
            + '</table>';
    return html;
}
/**
 * render the bank
 * @returns {undefined}
 */
Bank.prototype.render = function () {
    var node, newInfo, oc;
    // get old data for fadeOut
    node = $('#tradeInfo_' + this.htmlId());
    newInfo = node.html() != this.tradeAction;
    oc = node.css('opacity');
    // replace html
    $('#' + this.htmlId()).html(this.getHtml());
    // continue fadeOut
    node = $('#tradeInfo_' + this.htmlId());
    if (!newInfo) {
        node.css('opacity', oc - (oc > .2 ? .1 : 0));
    }
    node.fadeTo(1000, .2);
    if (!autorun.running) {
        this.activateInput('money');
        this.activateInput('materials');
    }
}

bank = new Bank();

