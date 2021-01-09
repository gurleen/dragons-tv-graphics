'use strict';
const serialport = require('serialport')
const readline = require('@serialport/parser-readline')
const jsftp = require("jsftp");
var parser = require('xml2json');
const fs = require('fs');
const { performance } = require('perf_hooks');

const ftp = new jsftp({
  host: "198.74.56.146",
  port: 21, // defaults to 21
  user: "drexel", // defaults to "anonymous"
  pass: "dragons" // defaults to "@anonymous"
});

function timeDelta(x, y) {
    var xs = x.split(':')
    var ys = y.split(':')
    var xmin = xs[0]
    var xsec = xs[1]
    var ymin = ys[0]
    var ysec = ys[1]

    var min = xmin - ymin
    var sec = xsec - ysec
    if(sec < 0) {
        min -= 1
        sec += 60
    }
    return [min, sec]
}



function pollFTP(replicant) {
    var str = ""; // Will store the contents of the file
    ftp.get("drexelmbb.xml", (err, socket) => {

        if (err) {
            return;
        }

        socket.on("data", d => {
            str += d.toString();
        });

        socket.on("close", err => {
            if (err) {
                console.error("There was an error retrieving the file.");
            }

            var stats = parser.toJson(str, {object: true});
            var period = parseInt(stats.bbgame.status.period) - 1
            var clock = stats.bbgame.status.clock
            var plays = stats.bbgame.plays.period[period].play

            var homePlays = plays.filter(play =>  play.vh == "H" && play.type != "FT" && ["GOOD", "MISS"].includes(play.action)).reverse()
            var awayPlays = plays.filter(play =>  play.vh == "V" && play.type != "FT" && ["GOOD", "MISS"].includes(play.action)).reverse()

            var homeFgIdx = homePlays.findIndex(play => play.action == "GOOD")
            var awayFgIdx = awayPlays.findIndex(play => play.action == "GOOD")
            var lastHomeFg = homePlays[homeFgIdx]
            var lastAwayFg = awayPlays[awayFgIdx]
            var hDelta = timeDelta(lastHomeFg.time, clock)
            var aDelta = timeDelta(lastAwayFg.time, clock)

            var nextHomeFgIdx = homePlays.slice(homeFgIdx).findIndex(play => play.action == "GOOD")
            var nextAwayFgIdx = awayPlays.slice(awayFgIdx).findIndex(play => play.action == "GOOD")

            var rv = {
                home: {
                    lastFg: lastHomeFg,
                    missedFgSince: homeFgIdx,
                    timeSinceLastFg: hDelta,
                },
                away: {
                    lastFg: lastAwayFg,
                    missedFgSince: awayFgIdx,
                    timeSinceLastFg: aDelta
                }
            }
            stats.trends = rv
            replicant.value = stats
        });

        socket.resume();
    });
}


module.exports = function (nodecg) {
    const liveData = nodecg.Replicant('liveData')
    const liveStat = nodecg.Replicant('liveStat')

    liveData.value = {
        'clockStr': "10:00",
        'homeScore': "12",
        'awayScore': "10",
        'shotClock': "30"
    }
    if(process.platform == "win32") {
        const port = new serialport('COM1')
        const parser = port.pipe(new readline({delimiter: '\x04'}))
        parser.on('data', (x) => {
            var cleanedData = {
                'clockStr': x.slice(1,6),
                'homeScore': x.slice(14, 16),
                'awayScore': x.slice(17,19),
                'shotClock': x.slice(9, 12)
            }
            liveData.value = cleanedData
        })
    }

    setTimeout(pollFTP, 1000, liveStat)
}