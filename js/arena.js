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
 * start simulation, holds players, call bank and players engage()
 */
function Arena() {
    // simulation step count by arena::engage()
    this.step = 0;
    // container for living players
    this.players = [];
    // count player died this round
    this._playersDied = 0;
    // html container for player and bank
    this.playersNode = {};
    this.bankNode = {};
    this.ultraNode = {};
    // speedup autorun
    // the higher the less players will be rendered
    this.autorunSkip = 3;
    // render/hide all players when changed
    this.configChanged = false;
    // visible range to render in
    // {top = window.scrollTop(), bottom: window.scrollTop() + window.height()}
    this.visibleRange = {top: 0, bottom: 0};
    // vertical position of players container
    // updated by arena.updatePlayersPos()
    this.playersPos = 0;
}


Arena.linkUI = function(){
    // set dom objects
    bars.node = $('#bars_ratio');
    arena.playersNode = $('#players');
    arena.bankNode = $('#bank');
    arena.ultraNode = $('#ultra');
    // bank autowaste
    bank.nodeInputHarvest = $('#inpv_bankHarvesting');
    bank.nodeCheckboxAutowaste = $('#ck_bankAutoWaste');
    //autoInterest
    bank.nodeInputInterest = $('#inpv_bankInterest')
    bank.nodeCheckboxAutointerest = $('#ck_bankAutoInterest');
}
/**
 * saved values
 * @returns {unresolved}
 */
Arena.prototype.keys = function () {
    return ['step'];
}
/**
 * get data from all players
 * @returns {String} json part of player data as array
 */
Arena.prototype.getPlayerData = function () {
    var data = [];
    if (this.players.length) {
        this.players.forEach(function (p) {
            data.push(p.getData());
        });
        return '[' + data.join(',') + ']';
    } else {
        return '[]';
    }
}
/**
 * create players and set data into
 * @param {array} data
 * @returns {undefined}
 */
Arena.prototype.setPlayerData = function (data) {
    data.forEach(function (d) {
        arena.spawnPlayer(d);
    });
}
/**
 * needed to boost render performance
 * @returns {Number} vertical position of players container
 */
Arena.prototype.updatePlayersPos = function () {
    return (this.playersPos = this.playersNode.offset().top);
}
/**
 * update visible range
 */
Arena.prototype.updateVisibleRange = function () {
    var w = $(window), top = w.scrollTop(), bottom = top + w.height();
    return (this.visibleRange = {top: top, bottom: top + bottom});
}
/**
 * config changed handler
 * @returns {undefined}
 */
Arena.prototype.cnfChanged = function () {
    this.configChanged = true;
    this.render();
    this.hideUltra();
}
/**
 * delete all players before loading
 * @returns {undefined}
 */
Arena.prototype.resetPlayers = function () {
    this.playersNode.html('');
    this.players = [];
}
/**
 * prepare simulation onLoad Document
 * @returns {undefined}
 */
Arena.prototype.prepare = function () {
    // hide ultra mode message
    arena.ultraNode.hide();
    // set visible range for render
    arena.updateVisibleRange();
    // set position of players container
    arena.updatePlayersPos();
}
/**
 * current living players
 * @returns {Number}
 */
Arena.prototype.alive = function () {
    return this.players.length - this._playersDied;
}
/**
 * increase players died current round
 * this.engage reset count to 0
 * @returns {undefined}
 */
Arena.prototype.playerDied = function () {
    this._playersDied++;
}
/**
 * spawn player at runtime or on loading simulation
 * @param {number} id optional
 * @returns {undefined}
 */
Arena.prototype.spawnPlayer = function (data) {
    var p = new Player();
    if (data) {
        p.setData(data);
        Player.players = Math.max(p.id, Player.players) + 1;
    } else {
        p.id = Player.players++;
    }

    // apply not jet rendered player to html dom
    this.playersNode.append('<div id="' + p.htmlId() + '" class="player"></div>');
    // set node for faster render
    p.node = $('#' + p.htmlId());
    this.players.push(p);
}
/**
 * add player to arena at runtime
 * @returns {Boolean} player added
 */
Arena.prototype.addPlayer = function (forceCreate) {
    var p;
    if (forceCreate || this.alive() < cnf.maxPlayers) {
        p = this.spawnPlayer();
        // make sure player is rendered
        if (!autorun.running) {
            p.render();
        }
    }
}
/**
 * remove player when dead
 * @param {player} p
 * @returns {undefined}
 */
Arena.prototype.removePlayer = function (p) {
    var idx;
    if (this.players.length) {
        idx = this.players.indexOf(p);
        if (idx != -1) {
            this.players.splice(idx, 1);
        }
    }
    $('#' + p.htmlId()).remove();
}
/**
 * iter through array which length can change due to player death
 * and engage all players
 * @returns {undefined}
 */
Arena.prototype._playersEngage = function () {
    var p, players;
    // make array copy
    players = [].concat([], this.players);
    // iter through players
    while (players.length) {
        p = players.shift();
        p.engage();
        // fix math
        p.money = p.round(p.money);
        p.materials = p.round(p.materials);
        // set values for scale bars
        playerBar.max(p.money);
        playerBar.max(p.credit.taken);
        playerBar.max(p.materials);
    }
}
/**
 * engange bank
 * @returns {undefined}
 */
Arena.prototype._bankEngage = function () {
    bank.engage();
}
/**
 * engage whole arena, players first
 * create first player if none existent at start
 * @returns {undefined}
 */
Arena.prototype.engage = function () {
    // reset autoscale
    bankBar.reset();
    playerBar.reset();
    this._playersDied = 0;
    this.step++;
    // add players
    if (!this.alive()) {
        // let living at least on player
        this.addPlayer();
    } else {
        // breed new players if populate
        if (cnf.playerPopulate > 0 && Math.random() * 100 < cnf.playerPopulate) {
            this.addPlayer();
        }
    }
    this._playersEngage();
    this._bankEngage();
    this.scaleBars();
    bank.money = this.round(bank.money);
    bank.materials = this.round(bank.materials);
    bank.sizedPlayers.money = this.round(bank.sizedPlayers.money);
    bank.sizedPlayers.materials = this.round(bank.sizedPlayers.materials);
    // render whole simulation
    this.render();
    // if bankrupt, end autorun and alert message
    this.checkBankrupt();
}
/**
 * check whether bank is bankrupt
 * @returns {undefined}
 */
Arena.prototype.checkBankrupt = function () {
    if (bank.money <= 0.1 && bank.materials <= 0.1 && bank.allGivenCredits <= 0.1) {
        !autorun.running && alert('Bank is Bankrupt.\nNo more Assets available to create Credits.');
        if (autorun.running) {
            autorun.run();
        }
    }
}
/**
 * 
 * @returns {undefined}
 */
Arena.prototype.scaleBars = function () {

    // autoscale bars
    bankBar.max(bank.money);
    bankBar.max(bank.allPlayersDeposit);
    bankBar.max(bank.allPlayersDept);
    bankBar.max(bank.allGivenCredits);
    bankBar.max(bank.materials);
    bankBar.max(bank.allMaterials);
    bankBar.max(bank.allPlayersMaterials);
    bankBar.max(bank.requiredMaterials);
    bankBar.ratio();
    playerBar.ratio();
}
/*
 * hide speed info below player list on slow autorun
 * @returns {undefined}
 */
Arena.prototype.hideUltra = function () {
    this.ultraNode.hide();
}
/**
 * show speed info below player list on fast autorun
 * @returns {undefined}
 */
Arena.prototype.showUltra = function () {
    this.ultraNode.show();
}
/**
 * render with some performance enhancements on autorun
 */
Arena.prototype.render = function () {
    var playerCount = this.players.length - 1, i = 0, max = 0, rendered = 0;
    if (autorun.running) {
        // skip whole render below 15ms in ultra fast mode
        if (cnf.autoEngage < 15 && this.step % (15 - cnf.autoEngage) != 0) {
            return;
        }
        // start render with bank
        bank.render();
        // detec visible range
        this.updateVisibleRange();
        this.updatePlayersPos();
        // skip rendering players to increase speed
        max = Math.min(20, cnf.autoEngage / 2);
        while (i <= playerCount) {
            if (++rendered > max) {
                // shown entering ultra speed mode
                this.showUltra();
                // hide other players that may not rendered any more
                // or break
                if (this.configChanged) {
                    this.players[i].hide();
                    i++;
                    continue;
                }
                break;
            }
            this.hideUltra();
            // render normal as window has space
            this.renderPlayer(this.players[i]);
            i++;
        }
    } else {
        // hide ultra-speed mode message
        this.hideUltra();
        // render normal as window has space
        bank.render();
        while (i <= playerCount) {
            this.renderPlayer(this.players[i]);
            i++;
        }
    }
    // hide possibly shown ultra mesage
    bars.render();
    this.configChanged = false;
}
/**
 * 
 * @param {player} p
 * @returns {Boolean} player was rendered
 */
Arena.prototype.renderPlayer = function (p) {
    var pos = p.vPos();
    if (pos < this.visibleRange.top) {
        return false;
    }
    if (p.vPos() < this.visibleRange.bottom - this.visibleRange.top) {
        p.render();
        return true;
    }
    // hide player
    p.hide();
    return false;
}
/**
 * visual clear players were not rendered while autorun
 * to increase startup speed
 * @returns {undefined}
 */
Arena.prototype.prepareAutorun = function () {
    var i = Math.ceil(cnf.autoEngage / this.autorunSkip);
    while (i < this.players.length - 1) {
        this.players[i].hide();
        i++;
    }
}
/**
 * return a random player eg. for trade
 * @param {boolean} includeBank
 * @returns {bank|player}
 */
Arena.prototype.getRandomPlayer = function (includeBank) {
    if (!includeBank && this.alive() < 1) {
        return;
    }
    var p, players = includeBank ? [].concat(this.players, [bank]) : this.players;
    do {
        p = players[Math.round(Math.random() * (players.length - 1))];
    } while (p.isDead);
    return p;
}


arena = new Arena();

