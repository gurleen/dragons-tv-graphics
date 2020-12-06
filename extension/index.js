'use strict';
const serialport = require('serialport')
const readline = require('@serialport/parser-readline')

module.exports = function (nodecg) {
	const liveData = nodecg.Replicant('liveData')
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
			data = {
				'clockStr': x.slice(1,6),
				'homeScore': x.slice(14, 16),
				'awayScore': x.slice(17,19),
				'shotClock': x.slice(9, 12)
			}
			liveData.value = data
		})
	}
}