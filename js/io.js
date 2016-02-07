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
 * read and write simulation data
 * handle client-server com.
 */
var io = {
    /**
     * read current simulation and write it to *not-realy* json string without surrounding {}
     * @returns {String} json, simulation part only
     */
    makeSnapshot: function () {
        var json = '{'+ [
            '"cnf":' + cnf.getData(),
            '"arena":' + arena.getData(),
            '"bars":' + bars.getData(),
            '"bank":' + bank.getData(),
            '"player":' + base.getData(Player),
            '"players":' + arena.getPlayerData()
            ].join(',') + '}';
        // print to data-textarea
        $('#inpl_data').val(json);
        return json;
    },
    /**
     * Apply json string to simulation
     * @returns {Boolean}
     */
    applySnapshot: function () {
        var cnfData, arenaData, barsData, bankData, playerData, playersData, data;
        /**
         * parse and get main data objects
         */
        try {
            data = $.parseJSON($('#inpl_data').val());
            cnfData = data.cnf;
            arenaData = data.arena;
            barsData = data.bars;
            bankData = data.bank;
            playerData = data.player;
            playersData = data.players;
        } catch (e) {
            var msg = 'Data corrupted or not complete.';
            alert(msg);
            throw(msg);
        }
        // reset objects
        arena = new Arena();
        bank = new Bank();
        playerBar = new PlayerBar();
        bankBar = new BankBar();
        Arena.linkUI();
        
        /*
         * load and validate Version
         */
        try {
            cnf.setData(cnfData);
            arena.setData(arenaData);
            bars.setData(barsData);
            bank.setData(bankData);
            base.setData(playerData, Player);
            arena.setPlayerData(playersData);
        } catch (e) {
            alert(e);
            throw(e);
        }
        // pre-process data
        bank.calculateRatio();
        arena.render();
        bars.render();
    },
    /**
     * create CSV from Players Data
     * @returns {String}
     */
    getCSV: function () {
        if (!arena.players.length) {
            return 'No Players found';
        }
        var csv = [];
        arena.players.forEach(function (p) {
            csv.push(/\[(.*)\]/.exec(p.getData().split(',').join(';'))[1]);
        });
        return new player().keys().join(';') + '\n\n' + csv.join('\r\n');
    },
    /**
     * does not work on sourceforge due to network permissions
     * load snapshot from pastebin
     * @returns {undefined}
     */
    loadPasteBin: function () {
        var url = 'pastebin.php', id = $('#inpl_pastebin').val();
        if (id) {
            $.get(
                    url,
                    {i: 'AebCyVH2'},
            function (data, e, _this) {
                $('#inpl_data').val(data);
                if (confirm('Data loaded, apply to Simulation?')) {
                    io.applySnapshot(data);
                }
            }
            , 'text')
                    .fail(function (e) {
                        $('#debug').html('').html(e.responseText);
                    }
                    );
        } else {
            alert('The PasteBin ID should have at least one Letter though...');
        }
    },
    /**
     * 
     * @param {object} btn
     * @param {string} msg
     * @returns {undefined}
     */
    success: function (btn, msg) {
        var v = btn.val();
        btn.val(msg).css('color', 'green');
        setTimeout(function () {
            btn.val(v).css('color', 'black');
        }, 1500);
    },
    error: function (e) {
        var msg = [];
        for (var m in e) {
            e.hasOwnProperty(m) && msg.push(e[m]);
        }
        ;
        alert(msg.join('\n'));
    },
    fail: function (html) {
        $('#debug').html('').html(html);
    },
    /**
     * check terms
     * @returns {Boolean}
     */
    terms: function () {
        if (!$('#terms').is(':checked')) {
            alert('You must accept the Terms.');
            return false;
        }
        return true;
    },
    /**
     * add timestamp to url to prevent caching
     * @returns {undefined}
     */
    createUrl: function (url) {
        return url + '?t=' + new Date().getTime();
    },
    /**
     * create user-url from id
     */
    simUrl: function (id) {
        return window.location.origin + '?simulation=' + id;
    },
    /**
     * 
     * @param {number} id
     * @returns {unresolved}
     */
    load: function (id) {
        var node, name, url, msg;
        if (!cnf.numeric(id)) {
            // simple pre-check
            return alert('No valid ID');
        }
        node = $('#sr_' + id);
        name = node.html();
        node.html(name + ' [Loading...]');
        url = this.simUrl(id);
        // load
        $.get(this.createUrl('load/' + id),
                {},
                function (data) {
                    msg = data.msg;
                    if (data.success) {
                        node.html(name + ' [Loaded, Apply Data...]');
                        // setTimeout is only to make "apply Data" text visible
                        setTimeout(function () {
                            try {
                                $('#inpl_loaded_id').val(msg.id);
                                $('#inpl_name').val(msg.name);
                                $('#inpl_desc').val(msg.description);
                                $('#inpl_data').val(msg.data);
                                io.applySnapshot();
                                $('#loaded_url').attr('href', url).html(url);
                                $('#loaded').show();
                                if ($('#load_save').is(':hidden')) {
                                    //$('#btn_load_save').click();
                                }
                            } catch (e) {
                                $('#loaded').show();
                                if ($('#load_save').is(':hidden')) {
                                    $('#btn_load_save').click();
                                }
                                alert('No valid Data revived.');
                                try {
                                    // try to rescue entry
                                    $('#loaded').show();
                                    if ($('#load_save').is(':hidden')) {
                                        $('#btn_load_save').click();
                                    }
                                    $('#inpl_loaded_id').val(id);
                                    $('#loaded_url').attr('href', url).html(url);
                                    // try to add at least a message
                                    $('#inpl_data').val('Data corrupted, please fix it by updating simulation.');
                                    // or the data at best
                                    $('#inpl_data').val('Data corrupted, please fix it by updating simulation or repair Data.\n\n' + msg.data);

                                } catch (e) {
                                    // ignore
                                }
                            }
                            node.html(name);
                            $('#inpl_data').html(msg.data);
                            arena.render();
                        }, 200);
                    } else {
                        io.error(msg);
                    }
                },
                'json'
                ).fail(function (e) {
            io.fail(e.responseText);
        });

    },
    /**
     * 
     * @returns {undefined}
     */
    save: function () {
        if (!this.terms()) {
            return;
        }
        var btn = $('#btn_save'), e = [];
        $.post(this.createUrl('save'),
                {
                    name: $('#inpl_name').val(),
                    passwd: $('#inpl_passwd').val(),
                    description: $('#inpl_desc').val(),
                    data: io.makeSnapshot(),
                },
                function (data, e, _this) {
                    var id, url;
                    if (data.success) {
                        id = data.msg.id;
                        url = io.simUrl(id);
                        $('#inpl_loaded_id').val(id);
                        $('#loaded_url').attr('href', url).html(url);
                        io.success(btn, 'Saved');
                        $('#loaded').show();
                        io.search(data.msg.name);
                    } else {
                        io.error(data.msg);
                    }

                },
                'json'
                ).fail(function (e) {
            io.fail(e.responseText);
        });
    },
    /**
     * 
     * @returns {undefined}
     */
    update: function () {
        if (!this.terms()) {
            return;
        }
        var btn = $('#btn_update');
        $.post(this.createUrl('update'),
                {
                    id: $('#inpl_loaded_id').val(),
                    name: $('#inpl_name').val(),
                    passwd: $('#inpl_passwd').val(),
                    description: $('#inpl_desc').val(),
                    data: io.makeSnapshot(),
                },
                function (data) {
                    if (data.success) {
                        io.success(btn, 'Updated');
                        $('#loaded').show();
                        io.search($('#inpl_name').val());
                    } else {
                        io.error(data.msg);
                    }
                },
                'json'

                ).fail(function (e) {
            io.fail(e.responseText);
        });
    },
    /**
     * search by typing in name field
     * @param {type} name
     * @returns {undefined}
     */
    search: function (name) {
        $.get(this.createUrl('search'),
                {name: name},
        function (html) {
            $('#search_result').html(html);
        },
                'html'

                ).fail(function (e) {
            io.fail(e.responseText);
        });
    },
    /**
     * search by pressing text button
     * @param {type} name
     * @returns {undefined}
     */
    searchLast: function () {
        $.get(this.createUrl('searchlast'),
                {},
                function (html) {
                    $('#search_result').html(html);
                },
                'html'
                )
                .fail(function (e) {
                    io.fail(e.responseText);
                });
    },
    /**
     * search by pressing text button
     * @param {type} name
     * @returns {undefined}
     */
    lessions: function () {
        $.get(this.createUrl('lessions'),
                {},
                function (html) {
                    $('#search_result').html(html);
                },
                'html'
                )
                .fail(function (e) {
                    io.fail(e.responseText);
                });
    },
    /**
     * load on start 
     * @returns {Boolean}
     */
    autoload: function () {
        var url, id;
        try {
            url = window.location;
            id = /.*simulation=([0-9]{1,10})/.exec(url);
            if (id) {
                io.load(id[1]);
                return true;
            }
        } catch (e) {
            // ignore
        }
        return false;
    }
};

