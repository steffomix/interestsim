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
 * extend objects and classes
 */
$(function () {
    // extend objects and classes
    Arena.prototype.__proto__ = Bank.prototype.__proto__ = Player.prototype.__proto__ = base;
    
    Arena.linkUI();
    
    // read html dom and overwrite with possible values from url
    cnf.readDoc();
    cnf.readUrl();
    /**
     * start simulation
     */
    handler.prepare();
    bank.prepare();
    arena.prepare();
    io.searchLast();
    // autoload from url id
    if(!io.autoload()){
        // create new players if set by user
        for (var i = 1; i <= cnf.playerStart; i++) {
            arena.addPlayer(true);
        }
        arena.render();
    }

})





