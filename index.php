<?php
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

$t = round(time()/60);
?><!doctype html>
    <head>
        <meta charset="utf-8">
        <title>Finance System Interest Simulator</title>

        <meta http-equiv="cache-control" content="max-age=0" />
        <meta http-equiv="cache-control" content="no-cache" />
        <meta http-equiv="expires" content="0" />
        <meta http-equiv="expires" content="Tue, 01 Jan 2010 1:00:00 GMT" />
        <meta http-equiv="pragma" content="no-cache" />
        
        <link rel="stylesheet" href="css/normalize.min.css">
        <link rel="stylesheet" href="css/main.css?t=<?php echo $t ?>">
        <script src="js/vendor/modernizr-2.8.3.min.js"></script>
    </head>
    <body>
        
        <noscript><h2>This Page require Javascript beeng enabled to run the Simulation</h2></noscript>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.js" ></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.11.2.js"><\/script>')</script>
        
        <?php
        // update at most every hour
        foreach(array('arena', 'autorun', 'bank', 'bars', 'base', 'cnf', 'handler', 'io', 'player', 'start') as $f){
            ?>
        <script src="js/<?php echo $f ?>.js?t=<?php echo $t ?>"></script>
        <?php
        }
        ?>
        
        <!-- sim -->
        <div id="debug"></div>
        <div id="simulation">
            <div><a href="https://sourceforge.net/projects/interestsim/" target="_blank">Finance System Interest Simulator on SourceForge</a> v5.2 preview</div><br>
        <div style="white-space: nowrap" id="menu">
            <input style="margin-left: 5em" id="btn_load_save" type="button" value="Load or Save Simulation" >
        </div>
        <div id="load_save" style="padding: 1em; text-align: center">
        <table class="sourceforge">
            <tr>
                <td colspan="2" style="text-align: center">
                    <b><big>Load and save on <a href="http://sourceforge.net/p/forge/documentation/Project%20Database/" target="_blank">SF-Project Database</a></big></b><br>
                    Note: Unused Saves expire and will be deleted after 3 Years.<br>
                    
                </td>
                <td rowspan="4" style="text-align: center; vertical-align: top; min-width: 20em">
                    Click a search-result to load or
                    <span id="btn_last_saves" class="text-btn">show last saves</span> or <span id="btn_lessions" class="text-btn">lessions.</span>
                    <div id="search_result" ></div>
                </td>
                <td rowspan="4">For longer storage press <br>
                    <input type="button" id="btn_read" value="Read Simulation Data"><br>
                    copy the Data and save it on your own Disc.<br>
                    By clicking <span id="btn_csv" class="text-btn">here</span> youn can get a CSV from Players.
                    <br>
                    <textarea cols="60" rows="15" id="inpl_data"></textarea><br>
                    <input type="button" id="btn_apply" value="Apply Data to Simulation"><br>
                    <small><i>From wherever the Data above comes, I'll be brave and try to apply it!</i></small>
                </td>
            </tr>
            <tr>
                <td style="text-align: right"><b>Name/Search:</b> </td>
                <td style="text-align: left">
                    <input type="text" id="inpl_name" size="40"/><input type="hidden" id="inpl_loaded_id" value="0"/>
                </td>
                
            </tr>
            <tr>
                <td style="text-align: right; vertical-align: top"><b>Password: </b><br>
                    <small><i>You'll need this to save your Changes.<br>
                    <span style="color: darkred"><b>But Beware!</b> This is not a secure Connection. <br>
                        <b>Do not use your main Password!</b></span></i></small><br><br>
                        <input id="btn_show_passwd" type="button" value="Show Password" />
                        
                </td>
                <td style="vertical-align: top">
                    <input type="password" size="40" id="inpl_passwd" style="display:block; float:left"/><input type="text" size="40" id="inpl_passwd2" style="display:hidden; display:block; float:left"/><br>
                    <br>
                    <input type="button" id="btn_save" value="Save new Simulation"><br>
                    <div id="loaded">
                        <div style="margin: .5em -1px"><a href="#" id="loaded_url"></a></div>
                        <input type="button" id="btn_update" value="Update current Simulation"><br><br>
                    </div>
                    
                    <input type="checkbox" id="terms"> I accept that all my Data<br>
                        will be <b>public for everyone</b><br>
                        and there is<br>
                        <b>no way to recover a lost Password.</b>
                </td>
                 
            </tr>
            <tr>
                <td style="text-align: right">Description: <br>
                    <small><i>Optional</i></small>&nbsp;</td>
                <td><textarea cols="40" rows="4" id="inpl_desc"></textarea></td>
                
            </tr>
        </table>
        </div>
        <div id="options" style="margin:  5px">
            <table>
                <tr>
                    <td style="padding-right: 0em"><input id="btn_engage" type="button" value="Simulate" class="help" title="Start single Simulation Step."> or <input class="help" title="Start/Stop endless Simulation loop." style="font-weight: bold; color: darkgreen; font-size: larger" type="button" id="btn_engage_auto" value="Start Auto-Sim."> with</td>
                    <td><input id="inpv_autoEngage" type="text" size="4" value="20" class="help" title="1000ms (millisec.) = 1sec."> ms </td>
                    <td colspan="2" style="text-align: center"><input class="help" title="Read Settings, put into URL and reload Site/Simulation with them." type="button" id="btn_restart" value="Restart with current Settings."></td>
                    <td colspan="4"><input class="help" title="Share Simulation whith current Settings." type="button" id="btn_create_url" value="Create URL"><input type="text" id="outp_create_url" size="70"></td>

                </tr>
                <tr>
                    <td class="options_bank help" title="How fast harvest or rot the Bank its Materials."><span style="float: left"><b>Bank Harvesting</b> -100/+100 </span><input class="help" style="float: right" type="checkbox" id="ck_bankAutoWaste" title="Auto-waste every Step 10% of not required Materials." checked/> </td><td><input id="inpv_bankHarvesting" type="text" size="4" value="-1"></td>
                    <td class="options_bank help" title="How often the Bank trade Materials from other Players."><b>Bank Trade activity</b> 0-100 </td><td><input id="inpv_bankTradeActivity" type="text" size="4" value="5"></td>
                    <td class="options_bank help" title="The Range of Interest, the Bank take for Credit. The pay-off Rate is always 1."><span style="float: left"><b>Bank Interest</b> -100/+100 </span><input class="help" style="float: right" type="checkbox" id="ck_bankAutoInterest" title="Auto-Interest: Get maximum from players harvesting." checked/> </td><td><input id="inpv_bankInterest" type="text" size="4" value="5"></td>
                    <td></td><td></td>
                </tr>
                <tr>
                    <td class="options_player help" title="How fast harvest or rotting Players their Marterials."><b>Player Harvesting</b> -100-100 </td><td><input id="inpv_playerHarvesting" type="text" size="4" value="1"></td>
                    <td class="options_player help" title="How often players try to buy Materials from Players or Bank. With running Credit they try to sell and do it even faster."><b>Players Trade activity</b> 0-100 </td><td><input id="inpv_playerTradeActivity" type="text" size="4" value="5"></td>
                    <td class="options_player help" title="How often Players try to get Credit. They can't get more as they have Materials."><b>Players Credit activity</b> 0-100 </td><td><input id="inpv_playerCreditActivity" type="text" size="4" value="5"></td>
                    <td><input type="button" id="btn_moreOptions" value="Show more Options"></td><td></td>
                </tr>
                <tr class="moreOptions" ><td colspan="8" style="hight: 10px"></td></tr>
                <tr class="moreOptions">
                    <td class="options_player help" title="Create Players from Start."><b>Start with Players</b> 0-100 </td><td><input id="inpv_playerStart" type="text" size="4" value="0"></td>
                    <td class="options_player help" title="How fast Players populate. 0 = no populate and no death."><b>Populate new Players</b> 0-100 </td><td style="padding-right: 2em"><input id="inpv_playerPopulate" type="text" size="4" value="5"></td>
                    <td class="options_player help" title="Stop populationg at given player-count."><b>Max Players populate</b> 0-500 </td><td style="padding-right: 2em"><input id="inpv_maxPlayers" type="text" size="4" value="250"></td>
                    <td class="options_player help" title="How much Money get new Players from Start."><b>New Player Money</b> min,max </td><td style="padding-right: 2em"><input id="inpr_newPlayerMoney" type="text" size="4" value="0,0"></td>
                </tr>
                <tr class="moreOptions">
                    <td class="options_player help" title="Take given % of Money from each Player, cut through playercount and deploy back to Players."><b>Players rebalance Money</b> 0-100%</td><td><input id="inpv_playerRebalanceMoney" type="text" size="4" value="0"></td>
                    <td class="options_player help" title="Take given % of Materials from each Player, cut through playercount and deploy back to Players."><b>Players rebalance Materials</b> 0-100% </td><td><input id="inpv_playerRebalanceMaterials" type="text" size="4" value="0"></td>
                    <td class="options_player help" title="How much Money get new Players from Start."><b>New Player Materials</b> min,max </td><td><input id="inpr_newPlayerMaterials" type="text" size="4" value="0,0"></td>
                    <td class="options_player help" title="When Player Populate-Option is at least 1, Players can die in given Range of Simulation-Steps."><b>Player max age</b> 1-much </td><td><input id="inpr_playerMaxAge" type="text" size="4" value="800,1000"></td>
                </tr>
                <tr class="moreOptions">
                    <td class="options_bank help" title="How much Money the Bank deploy back to Players - for free."><b>Bank deploy Money</b> 0%-100% </td><td><input id="inpv_deployMoney" type="text" size="4" value="0"></td>
                    <td class="options_bank help" title="How much Materials the Bank deploy back to Players - for free."><b>Bank deploy Materials</b> 0%-100% </td><td><input id="inpv_deployMaterials" type="text" size="4" value="0"></td>
                    <td class="options_bank help" title="How much Materials needs the Bank to be able to create Money for a Credit."><b>Required Materials and Money</b> 0-100% </td><td><input id="inpv_bankMinAssets" type="text" size="4" value="5"></td>
                    <td></td><td></td>
                </tr>
            </table>
        </div>
        <div id="bank"></div>
        <table width="100%">
            <tr id="bars_container" class="help" title="Autoscale difference of Bank/Player-Bars">
                <td><input type="checkBox" id="lock_bars" class="help" title="Lock Bars to same scale" /></td>
                <td style="vertical-align: middle">Players</td>
                <td width="99%" style="vertical-align: middle; margin: 0px .2em; padding: 0px 5px;" >
                    <div style="width: 100%; padding: 0px; background-color: #ddd;">
                        <div id="bars_ratio" class="ratio-bar ratio-left ratio-bank"></div>
                        <div class="ratio-bar ratio-right ratio-player"></div>
                    </div>
                </td>
                <td style="vertical-align: middle">Bank</td>
            </tr>
        </table>
        <div id="players"></div>
        </div>
        <div id="ultra" style="text-align: center">Ultra fast reached. Rendering of players skipped.</div>
    </body>
</html>
