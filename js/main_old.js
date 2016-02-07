$(function() {

    /**
     * Player Class constructor
     * @returns {player}
     */
    var player = function() {
        // set own id and increase global player-id
        this.id = ++player.players;
        // apply not jet rendered player to html dom
        arena.playersNode.append('<div id="' + this.htmlId() + '" class="player"></div>');
        // set node for faster render
        this.node = $('#' + this.htmlId());
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
    player.players = 0;
    player.births = 0;
    player.deaths = 0;
    /**
     * keys to save and load
     * @returns {Array}
     */
    player.keys = function(){
        return ["players","births","deaths"];
    };
    /**
     * keys to save and load
     * @returns {Array}
     */
    player.prototype.keys = function(){
        return ['id', 'age', 'maxAge', 'money', 'materials', 'credit.taken', 'credit.paid', 'credit.interestPaid', 'credit.interest'];
    };
    /**
     * Called by user through arena.engage() on every engage or auto-engage
     */
    player.prototype.engage = function() {
        var sell;
        if (this.isDead) {
            player.deaths++;
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
        // flatten calc errors
        this.money = this.round(this.money);
        this.materials = this.round(this.materials);

    };

    /**
     * harvest some materials stuff
     * @returns {undefined}
     */
    player.prototype.harvest = function() {
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
    player.prototype.live = function() {
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
                player.births += arena.addPlayer() ? 1 : 0;
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
    player.prototype.die = function() {
        var he, he1, he2, c1 = 0, c2 = 0, mo1 = 0, mo2 = 0, credit, materials, rest, money;
        arena.playerDied(this);
        if (arena.alive() >= 2) {
            if (arena.alive() < 3) {
                he, rest;
                do {
                    he = arena.getRandomPlayer(false);
                } while (he == this);
                // give heritage own money
                he.money += this.money;
                he.materials += Math.round(this.materials / 2);
                // let pay heritage outstanding credit
                he.credit.taken += this.credit.taken - this.credit.paid;
                this.tradeAction = this.name() + ' got his Money, his Credit and half of his Materials';
            } else {
                // split heir into 2 pieces
                money = Math.round(this.money * 100);
                materials = Math.round(this.materials / 4);
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
                this.tradeAction = this.name() + ' and ' + this.name() + ' got his Money, his Credit and half of his Materials.';
            }
        } else {
            // last player died, give all back to bank even it's negative
            bank.money += this.money;
            this.money = 0;
            // destroy by credits created money
            if (this.credit.taken > 0) {
                rest = this.credit.taken - this.credit.paid;
                bank.money -= rest;
                bank.given -= rest;
            }
            // give materials to bank
            bank.materials += Math.round(this.materials / 2);
            this.tradeAction = 'The Bank got his Money and half of his Materials, destroyed the Money that was created due to his Credit.';
        }
    };

    player.prototype.name = function() {
        return 'Player ' + this.id;
    };

    player.prototype.htmlId = function() {
        return 'player_' + this.id;
    };
    /**
     * ohh I have forgotten what that all means...
     */
    player.prototype.getHtml = function() {
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
    player.prototype._renderAge = function() {
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
    player.prototype.render = function() {
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
    player.prototype.vPos = function() {
        return this.node.offset().top;
    };
    /**
     * hide player
     * @returns {undefined}
     */
    player.prototype.hide = function() {
        this.node.html('');
    };
    /**
     * check if player is hidden
     * @returns {Boolean}
     */
    player.prototype.hidden = function() {
        return this.node.is(':hidden');
    };

    player.prototype.renderInput = function(k, v, size) {
        return autorun.running ? v : '<input style="margin: -1px .1em; padding: 0px 0px" type="text" id="' + this.htmlId() + '_' + k + '" value="' + v + '" size="' + size + '" />';
    };

    player.prototype.activateInput = function(k) {
        var _this = this;
        $('#' + this.htmlId() + '_' + k.replace('.', '\\.')).change(function() {
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
            bank.render();
            _this.render();
        });
    };

    /**
     * Bank
     */
    var bank = {
        // id of html dom node
        // this.render() need this
        id: 'bank',
        // well a bank can't be dead
        // but arena.getRandomPlayer ask for this
        isDead: false,
        // own money and matrials
        money: 0,
        materials: 0,
        // given credit and visual bar size
        given: 0,
        // holds trade information for user
        tradeAction: '',
        // whole current money in simulation
        allMoney: 0,
        // whole current materials in simulation
        allMaterials: 0,
        // count all players positive money
        allPlayersDeposit: 0,
        // count all players negative money
        allPlayersDept: 0,
        // all players materials
        allPlayersMaterials: 0,
        // holds money/materials ratio
        // used to calc price of materials
        // indicate inflation/deflation
        moneyDeployed: 0,
        materialsDeployed: 0,
        playersBalancedMoney: 0,
        playersBalancedMaterials: 0,
        ratio: 1,
        // when playersRabalanceMoney was too low
        // to deploy it is stored here for next try
        restPlayerBalance: 0,
        
        name: function() {
            return 'Bank';
        },
        htmlId: function() {
            return 'bank';
        },
        /**
         * keys to save and load
         * @returns {Array}
         */
        keys: function(){
            return ["money","materials","given"];
        },
        /**
         * Called by user through arena.engage() on every engage or auto-engage
         */
        engage: function() {
            // fix odd js math
            this.money = this.round(this.money);
            // harvest and rott materials
            this.harvest();
            // clear trade information for user
            //this.tradeAction = '';
            // try to trade
            if (Math.random() * 100 < cnf.bankTradeActivity) {
                // try to sell a bit when there are too much Materials
                // + buy, - sell
                var buySell = 0;
                buySell += this.given < this.materials / 100 * cnf.bankMinAssets ? -1 : 1;

                var sell = this.materials > this.given ? Math.random() > .4 : Math.random() > .6;



                this.trade(sell);
            }
            this.demandCredits();
            this.deployMaterials();
            this.deployMoney();
            this.playerRebalanceMoney();
            this.playerRebalanceMaterials();
            this.money = this.round(this.money);
            this.materials = this.round(this.materials);
        },
        /**
         * demand players credits
         * @returns {undefined}
         */
        demandCredits: function() {
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
                    this.given -= pay;
                    // rollback credit if all paid
                    if (c.taken > 0 && c.paid >= c.taken) {
                        // reset player credit
                        c.taken = c.paid = c.interest = c.interestPaid = 0;
                    }
                }
            }
        },
        /**
         * harvest some materials stuff
         * @returns {undefined}
         */
        harvest: function() {
            this.materials += this.round(Math.random() * cnf.bankHarvesting);
            // materials can't rott into negative
            if (this.materials < 0) {
                this.materials = 0;
            }
        },
        /**
         * deploy bougth materials to players
         * @returns {undefined}
         */
        deployMaterials: function() {
            this.materialsDeployed = 0;
            if (cnf.deployMaterials > 0) {
                if (this.materials - this.money * this.ratio > arena.alive()) {
                    var _this = this, amount = Math.floor(this.materials / arena.alive() / 100 * cnf.deployMaterials);
                    if (amount > 0) {
                        this.materialsDeployed = amount;
                        arena.players.forEach(function(p) {
                            if (p !== _this && !p.isDead) {
                                p.materials += amount;
                                _this.materials -= amount;
                            }
                        });
                    }
                }
            }
        },
        /**
         * deploy incoming interest back to players
         * @returns {undefined}
         */
        deployMoney: function() {
            // reset user-info
            this.moneyDeployed = 0;
            // deploy money
            if (cnf.deployMoney > 0) {
                // deploy money only when money > given credits
                if (this.money - this.given - arena.alive() > 0) {
                    var _this = this, amount = Math.floor((this.money - this.given) / arena.alive() * cnf.deployMoney) / 100;
                    // give at least a penny
                    if (amount >= 0.01) {
                        // user-info
                        this.moneyDeployed = amount;
                        // deploy money
                        arena.players.forEach(function(p) {
                            // don't give money dead players
                            if (!p.isDead) {
                                p.money += amount;
                                _this.money -= amount;
                            }
                        });
                    }
                }
            }
        },
        /**
         * Player rebalance their money
         * take given % from each player, cut through players-count and repay its value
         * @returns {undefined}
         */
        playerRebalanceMoney: function() {
            this.playersBalancedMoney = 0;
            if (cnf.playerRebalanceMoney > 0) {
                var count = arena.alive(), sum = 0, part = 0, _this = this;
                arena.players.forEach(function(p) {
                    if (!p.isDead) {
                        // take given % from player
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
                    arena.players.forEach(function(p) {
                        p.money += part;
                    });
                }
            }
        },
        /**
         * player rebalance their materials 
         * @returns {undefined}
         */
        playerRebalanceMaterials: function() {
            var count = arena.alive(), sum = 0, part = 0;
            if (cnf.playerRebalanceMaterials > 0) {
                arena.players.forEach(function(p) {
                    // take given % from player
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
                    arena.players.forEach(function(p) {
                        p.materials += part;
                    });
                    // notice for user/render
                    this.playersBalancedMaterials = part;
                }
            }
        },
        /**
         * give credit to player as much as he has materials
         * @param {player} p
         * @returns {undefined}
         */
        giveCredit: function(p) {
            var c = p.credit, amount;
            if (c.taken <= 0 && Math.random() * 100 < cnf.playerCreditActivity) {
                // give max as much credit as player has materials and
                // as much bank has required % materials (asstets)
                var bMax = bank.materials / cnf.bankMinAssets * 100;
                var pMax = p.materials;
                amount = Math.round(Math.random() * Math.min(p.materials, bank.materials / cnf.bankMinAssets * 100));
                if (amount > 0) {
                    // set some random interest
                    c.interest = cnf.bankInterest;
                    // notice given credit
                    c.taken = amount;
                    // bank can work with debt-claim like money
                    p.money += amount;
                    // nice bar only only for user-information
                    this.given += amount;
                    // bank can work with dept-claim like money
                    //this.money += amount;
                }
            }
        },
        /**
         * calculate global amounts of money, materials and its ratio
         * @returns {undefined}
         */
        calculateRatio: function() {
            // count all money in simulation
            // begin with this bank
            this.allMoney = this.money;
            this.allMaterials = this.materials;
            this.allPlayersDeposit = 0;
            this.allPlayersDept = 0;
            this.allPlayersMaterials = 0;

            // add all players money and materials
            var _this = this;
            arena.players.forEach(function(p) {
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
            this.ratio = this.allMoney / this.allMaterials;
        },
        /**
         * 
         * @param {string} k key
         * @param {Number} v value
         * @param {Number} size of input field
         * @returns {String} html input
         */
        renderInput: function(k, v, size) {
            return autorun.running ? v : '<input style="margin: -1px .1em; padding: 0px 0px" type="text" id="' + this.htmlId() + '_' + k + '" value="' + v + '" size="' + size + '" />';
        },
        /**
         * 
         * @param {type} k
         * @returns {undefined}
         */
        activateInput: function(k) {
            var _this = this;
            $('#' + this.htmlId() + '_' + k.replace('.', '\\.')).change(function() {
                var node = $(this), k = node.attr('id').split('_')[1], v = node.val();
                if (k == 'money') {
                    _this.money = cnf.numeric(v) ? Math.round(v * 100) / 100 : _this.money;
                } else if (k == 'materials') {
                    _this.materials = cnf.numeric(v) ? Math.abs(Math.round(v)) : _this.materials;
                }
                _this.calculateRatio();
                _this.render();
            });
        },
        /**
         * this is something about...dom?
         * @returns {String}
         */
        getHtml: function() {
            var html = '<table>'
                    + '<tr><th rowspan="' + (5 + (cnf.deployMoney > 0 ? 1 : 0) + (cnf.deployMaterials > 0 ? 1 : 0)) + '" style="min-width:8em"> ' + this.name() + ' </th>'
                    + '<td>Money: ' + this.renderInput('money', this.round(this.money), 5) + '</td><td id="barsReference" ><div style="background-color: ' + (this.money > 0 ? 'yellow' : 'red') + '; width:' + bankBar.scale(Math.abs(this.round(this.money))) + 'px">&nbsp</div></td></tr>'
                    + '<tr><td>Outstanding Debts: ' + (this.given == this.round(this.allMoney) ? this.given : '<span style="color: red" title="Outstanding Debts and All Money should be same">' + this.given + '</span>') + '</td><td><div style="background-color: orange; width:' + bankBar.scale(this.given) + 'px">&nbsp</div></td></tr>'
                    + '<tr><td style="width: 10%; min-width:12em">Materials: ' + this.renderInput('materials', this.round(this.materials), 5) + '</td><td style="width: 90%"><div style="background-color: darkgreen; width:' + bankBar.scale(this.materials) + 'px">&nbsp</div></td></tr>'
                    + (cnf.deployMoney > 0 ?
                            '<tr><td>Deployed Money: ' + this.moneyDeployed + '</td><td><div style="background-color: goldenrod; width:' + bankBar.scale(this.moneyDeployed * 100) + 'px">&nbsp</div></td></tr>'
                            : '')
                    + (cnf.deployMaterials > 0 ?
                            '<tr><td>Deployed Materials: ' + this.materialsDeployed + '</td><td><div style="background-color: darkolivegreen; width:' + bankBar.scale(this.materialsDeployed * 100) + 'px">&nbsp</div></td></tr>'
                            : '')
                    + '<tr><td>Trade: </td><td id="tradeInfo_' + this.htmlId() + '">' + this.tradeAction + '</td></tr>'
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
                    + '<tr><td>All Money: </td><td>' + (this.round(this.allMoney) == this.given ? this.given : '<span style="color: red" title="Outstanding Debts and All Money should be same">' + this.round(this.allMoney) + '</span>') + '</td>'
                    + '<td>All Materials: </td><td>' + this.round(this.allMaterials) + '</td></tr>'
                    + '</table>';
            return html;
        },
        /**
         * render the bank
         * @returns {undefined}
         */
        render: function() {
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
    };

    /**
     * start simulation, holds players, call bank and players engage()
     */
    var arena = {
        // simulation step count by arena::engage()
        step: 0,
        // container for living players
        players: [],
        // count player died this round
        _playersDied: 0,
        // html container for player and bank
        playersNode: $('#players'),
        bankNode: $('#bank'),
        ultraNode: $('#ultra'),
        // speedup autorun
        // the higher the less players will be rendered
        autorunSkip: 3,
        // render/hide all players when changed
        configChanged: false,
        /**
         * needed to boost render performance
         * @returns {Number} vertical position of players container
         */
        updatePlayersPos: function() {
            return (this.playersPos = this.playersNode.offset().top);
        },
        playersPos: 0,
        /**
         * update visible range
         */
        updateVisibleRange: function() {
            var w = $(window), top = w.scrollTop(), bottom = top + w.height();
            return (this.visibleRange = {top: top, bottom: top + bottom});
        },
        visibleRange: {top: 0, bottom: 0},
        cnfChanged: function() {
            this.configChanged = true;
            this.render();
            this.hideUltra();
        },
        resetPlayers: function(){
            this.playersNode.html('');
            this.players = [];
        },
        /**
         * prepare simulation
         * @returns {undefined}
         */
        prepare: function() {
            // read html dom and overwrite with possible values from url
            cnf.readDoc();
            cnf.readUrl();
            // render bank
            bank.money = this.rnd(cnf.newPlayerMoney.min, cnf.newPlayerMoney.max);
            bank.materials = 5;
            bank.render();
            // hide ultra mode message
            this.ultraNode.hide();
            // set visible range for render
            this.updateVisibleRange();
            // set position of players container
            this.updatePlayersPos();
            // create new players if set by user
            for (i = 1; i <= cnf.playerStart; i++) {
                this.players.push(new player(this.node));
            }
        },
        /**
         * current living players
         * @returns {Number}
         */
        alive: function() {
            return this.players.length - this._playersDied;
        },
        /**
         * increase players died current round
         * this.engage reset count to 0
         * @returns {undefined}
         */
        playerDied: function() {
            this._playersDied++;
        },
        /**
         * add player to arena
         * @returns {Boolean} player added
         */
        addPlayer: function() {
            var p;
            if (this.alive() < cnf.maxPlayers) {
                p = new player();
                this.players.push(p);
                // render player to its full visuals and don't waste performance
                if (!autorun.running) {
                    p.render();
                }
                return p;
            }
            return false;
        },
        /**
         * remove player when dead
         * @param {player} p
         * @returns {undefined}
         */
        removePlayer: function(p) {
            var idx;
            if (this.players.length) {
                idx = this.players.indexOf(p);
                if (idx != -1) {
                    this.players.splice(idx, 1);
                }
            }
            $('#' + p.htmlId()).remove();
        },
        /**
         * iter through array which length can change due to player death
         * and engage all players
         * @returns {undefined}
         */
        _playersEngage: function() {
            var p, players;
            // make array copy
            players = [].concat([], this.players);
            // iter through players
            while ((players.length)) {
                p = players.shift();
                p.engage();
                playerBar.max(p.money);
                playerBar.max(p.credit.taken);
                playerBar.max(p.materials);

            }
        },
        // engage bank
        _bankEngage: function() {
            bank.engage();
        },
        // engage whole arena, players first
        // create first player if none existent at start
        engage: function() {
            // reset autoscale
            bankBar.reset();
            playerBar.reset();
            this._playersDied = 0;
            this.step++;
            if (!this.alive()) {
                this.addPlayer();
            } else {
                // breed new players if populate
                if (cnf.playerPopulate > 0 && Math.random() * 100 < cnf.playerPopulate) {
                    this.addPlayer();
                }
            }
            this._playersEngage();
            this._bankEngage();
            // calculate ratio and sumarys
            bank.calculateRatio();
            // autoscale bars
            bankBar.max(bank.money);
            bankBar.max(bank.allPlayersDeposit);
            bankBar.max(bank.allPlayersDept);
            bankBar.max(bank.given);
            bankBar.max(bank.materials);
            bankBar.max(bank.allMaterials);
            bankBar.max(bank.allPlayersMaterials);
            bankBar.ratio();
            playerBar.ratio();
            this.render();
        },
        hideUltra: function() {
            this.ultraNode.hide();
        },
        showUltra: function() {
            this.ultraNode.show();
        },
        /**
         * render user input or changes
         */
        render: function() {
            var l = this.players.length - 1, i = 0, max = 0, rendered = 0;
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
                while (i <= l) {
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
                // render normal as window has space
                bank.render();
                while (i <= l) {
                    this.renderPlayer(this.players[i]);
                    i++;
                }
            }
            // hide possibly shown ultra mesage
            bars.render();
            this.configChanged = false;
        },
        /**
         * 
         * @param {player} p
         * @returns {Boolean} player was rendered
         */
        renderPlayer: function(p) {
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
        },
        /**
         * visual clear players were not rendered while autorun
         * to increase startup speed
         * @returns {undefined}
         */
        prepareAutorun: function() {
            var i = Math.ceil(cnf.autoEngage / this.autorunSkip);
            while (i < this.players.length - 1) {
                this.players[i].hide();
                i++;
            }
        },
        // return a random player eg. for trade
        getRandomPlayer: function(includeBank) {
            if (!includeBank && this.alive() < 1) {
                return;
            }
            var p, players = includeBank ? [].concat(this.players, [bank]) : this.players;
            do {
                p = players[Math.round(Math.random() * (players.length - 1))];
            } while (p.isDead);
            return p;
        }
    };

    var playerBar = {
        _max: 0,
        _ratio: 1,
        scaleAll: .5
    };
    var bankBar = {
        _max: 0,
        _ratio: 1,
        scaleAll: .5
    };
    /**
     * base class of bankBars and playerBars
     * @type type
     */
    var bars = {
        node: $('#bars_ratio'),
        maxLength: 1000,
        scaleSpeed: 20,
        diff: 50,
        lock: false,
        measure: function() {
            var length;
            // get max length for bars
            try {
                length = /[0-9]*/.exec($('#barsReference').css('width'))[0];
            } catch (e) {
                length = 600;
            }
            this.maxLength = (cnf.numeric(length) ? length : 600);
        },
        max: function(n) {
            this._max = Math.max(Math.abs(n), this._max);
        },
        ratio: function() {
            var m = ((this._max == 0 ? 1 : this.maxLength / this._max) - this._ratio) / this.scaleSpeed;
            this._ratio += (cnf.numeric(m) ? m : 0);
        },
        render: function() {
            if(this.lock){
                this.node.css('width', '50%');
            }else{
                var pMax = playerBar._max, bMax = bankBar._max;
                var m = (bMax * (100 / (bMax + pMax)) - this.diff) / this.scaleSpeed;

                this.diff += (cnf.numeric(m) ? m : 0);
                this.node.css('width', 100 - this.diff + '%');
            }

        },
        reset: function() {
            this._max = 0;
        },
        /**
         * scale money bar
         * @param {Number} n
         * @returns {Number}
         */
        scale: function(n) {
            return Math.round(n * (this.lock ? Math.min(playerBar._ratio, bankBar._ratio) : this._ratio) * this.scaleAll);

        }
    };
    // extend bars
    playerBar.__proto__ = bars;
    bankBar.__proto__ = bars;

    /**
     * Base Class with helper methods
     * extends arena, bank, player
     */
    var base = {
        scaleMoney: 1,
        scaleMaterial: 1,
        scaleMoneyBar: function() {
            return;
        },
        scaleMaterialsBar: function() {

        },
        /**
         * calculate random number from given range
         * @param {Number} min
         * @param {Number} max
         * @returns {Number}
         */
        rnd: function(min, max) {
            return Math.round(Math.random() * (max - min)) + min;
        },
        /**
         * round in money style
         * @param {Number} n
         * @returns {Number}
         */
        round: function(n) {
            return Math.round(n * 100) / 100;
        },
        /**
         * 
         * @param {boolean} sell
         * @returns {undefined}
         */
        trade: function(sell) {
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
                }
            }
        }
    };
    /**
     * extend objects and classes
     */
    arena.__proto__ = bank.__proto__ = player.prototype.__proto__ = base;
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
         * @returns {Object} {values: [array of values: n], ranges: [array of ranges: {n min, n max}], data: other values}
         */
        keys: function(){
            var values = [], ranges = [];
            $('[id^=inpv_]').each(function() {
                values.push($(this).attr('id').split('_')[1]);
            });
            $("[id^=inpr_]").each(function() {
                ranges.push($(this).attr('id').split('_')[1]);
            });
            return {values: values, ranges: ranges, version: this.version};
        },
        
        /**
         * read all input fields where begin with 'inpr_' as rang(n,n) or 'inpv_' as value(n)
         * and write into cnf
         * @returns {undefined}
         */
        readDoc: function() {
            var _this = this, node, id, range, keys = this.keys();;
            $("[id^=inpr_]").each(function() {
                node = $(this);
                id = node.attr('id').split('_')[1];
                range = _this.checkRange(node.val());
                if (range) {
                    _this[id] = range;
                    // _this.s += id+': {min: '+range.min+', max: '+range.max+'},\n'; // for dev only

                }
            });
            $('[id^=inpv_]').each(function() {
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
        readUrl: function() {
            var _this = this, values = [], params = window.location.search.substring(1).split('&');
            if (params.length) {
                params.forEach(function(p) {
                    var p = p.split('=');
                    if (p.length == 2) {
                        values.push({k: p[0].trim(), v: p[1].trim()});
                    }
                });
                // read ranges
                $("[id^=inpr_]").each(function() {
                    var node = $(this), id;
                    id = node.attr('id').split('_')[1];
                    values.forEach(function(p) {
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
                $('[id^=inpv_]').each(function() {
                    var node = $(this), id;
                    id = node.attr('id').split('_')[1];
                    values.forEach(function(p) {
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
        createUrl: function() {
            var params = [], url = window.location.href.split('?')[0] + '?';
            $('[id^=inpv_]').each(function() {
                var node = $(this);
                params.push(node.attr('id').split('_')[1] + '=' + node.val());
            });
            $('[id^=inpr_]').each(function() {
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
        validateRange: function(node) {
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
        checkRange: function(t) {
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
        validateValue: function(node) {
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
        numeric: function(n) {
            return (n - 0) == n && ('' + n).trim().length > 0;
        }
    };
    
    /**
    * read and write simulation data
    * handle client-server com.
    */
    var io = {
        /**
         * reads given keys from object
         * @param {Object} obj
         * @param {Array} keys 'key1' ,'key2'...
         * @returns {Array} 
         */
        readObject: function(obj, keys){
            var path, sPath, k, value, values = [];
            while (keys.length) {
                sPath = keys.shift();
                path = sPath.split('.');
                value = obj;
                while (path.length >= 1) {
                    value = value[path.shift()];
                }
                values.push({key: sPath, value: value});
            }
            return values;
        },
        /**
         * 
         * @param {Object} obj
         * @param {Array} values Array of key value pairs [{key: ..., value: ...}{,...}]
         * @returns {undefined}
         */
        writeObject: function(obj, values){
            var pair, path, value;
            while(values.length) {
                pair = values.shift();
                path = pair.key.split('.');
                value = obj;
                while (path.length >= 2) {
                    value = value[path.shift()];
                }
                value[path[0]] = pair.value;
            }
        },
        save: function(){
            $.post('save-sim.php',
            {
                name: $('#inpl_name').val(),
                passwd: $('#inpl_passwd').val(),
                desc: $('#inpl_desc').val(),
                data: $('#inpl_data').val(),
            },
            function(data, b, c, d){
                $('#debug').html('').html(data);
            },
            'text'
                    
            ).fail(function(e){
                $('#debug').html('').html(e.responseText);
            });
        },
        /**
         * read current simulation and write it to *not-realy* json string without surrounding {}
         * @returns {String} json, simulation part only
         */
        makeSnapshot: function() {
            var values = []; format = [], j = '';
            // all simple values
            $('[id^=inpv_]').each(function() {
                var id = $(this).attr('id').split('_')[1];
                values.push('"' + id + '":' + cnf[id]);
            });
            // all ranges
            $('[id^=inpr_]').each(function() {
                var id = $(this).attr('id').split('_')[1];
                values.push('"' + id + '":{"min":' + cnf[id].min + ',"max":' + cnf[id].max + '}');
            });
            j = '"cnf":{' + values.join(',')+'},';
            // bars scale
            j += '"bars":{"player":'+playerBar._ratio+',"bank":'+bankBar._ratio+'},';
            // bank values
            j += '"bank":{"money":' + bank.money + ',"materials":' + bank.materials + ',"given":' + bank.given + ',"ratio":' + bank.ratio + '},';
            // player static
            j += '"player":{"players":' + player.players + ',"births":' + player.births + ',"deaths":' + player.deaths + '},';
            // container for players as string
            values = [];
            arena.players.forEach(function(p) {
                var i = 0, k, id = '', path = '', v = [];
                // make copy of format
                k = p.keys();
                // run through values
                while (k.length) {
                    id = k.shift();
                    path = id.split('.');
                    id = p;
                    while (path.length) {
                        id = id[path.shift()];
                    }
                    v.push(id);
                }

                values.push('['+v.join(',')+']');
            });
            // all players
            j += '"players":['+values.join(',')+']';
            j = '{'+j+'}';
            $('#inpl_data').html(j);
            return j;
        },
        /**
         * Apply json string to simulation
         * @returns {Boolean}
         */
        applySnapshot: function() {
            var data = $('#inpl_data').val(), keySet, cnfData, barsData, bankData, playerData, playersData;
            /**
             * parse and get main data objects
             */
            try{
                data = $.parseJSON(data);
                cnfData = data.cnf;
                barsData = data.bars;
                bankData = data.bank;
                playerData = data.player;
                playersData = data.players;
            }catch(e){
                var msg = 'Loaded Data corrupted or not complete.';
                alert(msg);
                throw(msg);
            };
            /*
             * load and validate Version
             */
            try{
                keySet = this.keys();
                // check if version matches
                if(keySet.version != keySet.version){
                    throw('');
                }
            }catch(e){
                e = 'Version does not match or Version Imformation is corrupted.';
                alert(e);
                throw(e);
            };
            /*
             * load and validate config values linked to user input
             */
            try{
                // write cnf values first
                keySet.values.forEach(function(k){
                    var node = $('#inpv_'+k);
                    if(cnf.validateValue(node)){
                        cnf[k] = cnfData[k];
                    }else{
                        throw(k);
                    }
                });
            }catch(e){
                e = 'Loaded config value corrupted, not in allowed Range or missing.\n(' +e+')';
                alert(e);
                throw(e);
            };
            /*
             * load and validate config ranges linked to user input
             */
            try{
                keySet.ranges.forEach(function(k){
                    var node = $('#inpr_'+k);
                    if(cnf.validateRange(node)){
                        cnf[k] = cnfData[k];
                    }else{
                        throw(k);
                    }
                });
            }catch(e){
                e = 'Loaded range for config corrupted, not in allowed Range or missing.\n(' +e+')';
                alert(e);
                throw(e);
            }
            /*
             * load scale for bars
             */
            try{
                if(cnf.numeric(playerBar._ratio) && cnf.numeric(bankBar._ratio)){
                    playerBar._ratio = barsData.player;
                    bankBar._ratio = barsData.bank;
                }else{
                    throw('');
                }
            }catch(e){
                e = 'Loaded Bars Scale missing, not a number or corrupted.\n(' +e+')';
            }
            /*
             * load bank data and simple validate by number
             */
            try{
                bank.keys().forEach(function(k){
                    if(cnf.numeric(bankData[k])){
                        bank[k] = bankData[k];
                    }else{
                        throw(k);
                    }
                });
            }catch(e){
                e = 'BankData missing, not a number or corrupted: \n(' +e+')';
                alert(e);
                throw(e);
            }
            /*
             * Create Players and load data into them, validated simply by number
             */
            try{
                player.keys().forEach(function(k){
                    if(cnf.numeric(playerData[k])){
                        player[k] = playerData[k];
                    }else{
                        throw(k);
                    }
                });
            }catch(e){
                e = 'BankData missing, not a number or corrupted.\n(' +e+')';
                alert(e);
                throw(e);
            }
            arena.resetPlayers();
            try{
                playersData.forEach(function(pData){
                    var player = arena.addPlayer(), keys = player.keys(), data = [], k;
                    while(keys.length){
                        data.push({key: keys.pop(), value: pData.pop()});
                    }
                    cnf.writeObject(player, data);
                });
            }catch(e){
                alert('Creating Players failed or could not be completed.');
            }
            bank.calculateRatio();
            arena.render();
            bars.render();
        },
        /**
         * create CSV from Players Data
         * @returns {String}
         */
        getCSV: function() {
            var csv = [this.getPlayerKeys().split('; ')];
            arena.players.forEach(function(p) {
                var i = '', f = [], id = '', path = '', values = [];
                // get copy of player keys
                f = cnf.getPlayerKeys();
                // run through values
                while (f.length) {
                    // get player key that may be a path
                    id = f.shift();
                    path = id.split('.');
                    id = p;
                    // go next step into player
                    while (i.length) {
                        id = id[path.shift()];
                    }
                    values.push(id);
                }

                csv.push(values.join(';'));
            });
            return csv.join('\r\n');
        },
        /**
         * load snapshot from pastebin
         * @returns {undefined}
         */
        loadSnapshot: function() {
            
        },
        
        search: function(){
            
        }
    };
    /**
     * autorun
     */
    var autorun = {
        running: 0,
        run: function() {
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
        _run: function() {
            if (this.running) {
                var _this = this;
                setTimeout(function() {
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

    /**
     * add event listeners to user-interface
     */
    
    /**
     * autorun, start and stop
     */
    $('#btn_engage').click(function() {
        // measure max bars length
        bars.measure();
        // run simulation one step
        arena.engage();
    });
    $('#btn_engage_auto').click(function() {
        bars.measure();
        // run simulation endless
        autorun.run($(this));
    });
    $('#btn_restart').click(function() {
        document.location.href = cnf.createUrl() + '&' + new Date().getTime();
    });
    
    /**
     * url creation
     */
    $('#btn_create_url').click(function() {
        $('#outp_create_url').val(cnf.createUrl());
    });
    $("#outp_create_url")
            .focus(function() {
                $(this).select();
            })
            .mouseup(function(e) {
                e.preventDefault();
            });
            
    /**
     * config changed
     */
    $('[id^=inpv_]').each(function() {
        $(this).change(function() {
            cnf.validateValue($(this));
        });
    });
    $('[id^=inpr_]').each(function() {
        $(this).change(function() {
            cnf.validateRange($(this));

        });
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
    var showHide = function(btn, node, hide, show) {
        if(node.is(':hidden')){
            node.show();
            btn.attr('value', hide);
        }else{
            node.hide();
            btn.attr('value', show);
        }
    };
    $('#btn_load_save').click(function() {
        showHide($(this), $('#load_save'), 'Hide Load/Save', 'Show Load/Save');
    }).click();
    $('#btn_pressets').click(function() {
        showHide($(this), $('#pressets'), 'Hide Presets', 'Show Presets');
    }).click();
    $('#btn_moreOptions').click(function() {
        showHide($(this), $('.moreOptions'), 'Hide more Options', 'Show more Options');
    }).click();
    /**
     * save and load
     */
    $('#btn_read').click(function(){
        io.makeSnapshot();
    });
    $('#btn_read2').click(function(){
        io.makeSnapshot();
    });
    $('#btn_apply').click(function(){
        if(confirm('This will replace your current running Simulation.')){
            io.applySnapshot();
        }
    });
    $('#btn_save').click(function(){
        io.save();
    });
    $('#inpl_name').keyup(function(){
        var t = $(this).val();
        if(t.length >= 1){
            io.search(t);
        }
    });
    /**
     * show/hide clear passwd
     */
    $('#inpl_passwd').keyup(function(){
        $('#inpl_passwd2').val($(this).val());
    });
    $('#btn_show_passwd').mousedown(function(){
        $('#inpl_passwd').hide();
        $('#inpl_passwd2').show();
    });
    $('#btn_show_passwd').mouseup(function(){
        $('#inpl_passwd').show();
        $('#inpl_passwd2').hide();
    });
    $('#btn_show_passwd').mouseup();
    
    /**
     * bars
     */
    $('#lock_bars').change(function(){
       bars.lock = $(this).is(':checked');
       arena.render();
    });
    

    $(window).scroll(function() { //detect page scroll
        arena.updateVisibleRange();
        arena.render();
    });

    /**
     * start simulation
     */
    arena.prepare();
});
