$(document).ready(function() {
	var socket = io.connect('https://streamer.cryptocompare.com/');
	//Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
	//Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
	//For aggregate quote updates use CCCAGG as market
	var subscription = ['5~CCCAGG~DOGE~USD', '5~CCCAGG~DOGE~BTC', '5~CCCAGG~BTC~USD', '5~CCCAGG~ETH~USD'];
	socket.emit('SubAdd', {
		subs: subscription
	});
	socket.on("m", function(message) {
		var messageType = message.substring(0, message.indexOf("~"));
		var res = {};
		if (messageType == CCC.STATIC.TYPE.CURRENTAGG) {
			res = CCC.CURRENT.unpack(message);
			dataUnpack(res);
		}
	});

	square('container');

	// var chart = $('#container').highcharts();
	// console.log('chart: ' + chart);
	// window.setInterval(addData($('#container').highcharts().series[0], getRndInteger(1,20)), 2000);
	// addData($('#container').highcharts().series[0], 20);
	// addData($('#container').highcharts().series[0], 30);
	// addData($('#container').highcharts().series[0], 40);
});

function displayData(current, from, to, tsym, fsym) {
	console.log(current);
	var priceDirection = current.FLAGS;
	for (var key in current) {
		if (key == 'CHANGE24HOURPCT') {
			$('#' + key + '_' + from + '_' + to).text(' (' + current[key] + ')');
		} else if (key == 'LASTVOLUMETO' || key == 'VOLUME24HOURTO') {
			$('#' + key + '_' + from + '_' + to).text(CCC.convertValueToDisplay(tsym, current[key]));
		} else if (key == 'LASTVOLUME' || key == 'VOLUME24HOUR' || key == 'OPEN24HOUR' || key == 'OPENHOUR' || key == 'HIGH24HOUR' || key == 'HIGHHOUR' || key == 'LOWHOUR' || key == 'LOW24HOUR') {
			$('#' + key + '_' + from + '_' + to).text(CCC.convertValueToDisplay(fsym, current[key]));
		} else {
			$('#' + key + '_' + from + '_' + to).text(current[key]);
		}
	}

	$('#PRICE_' + from + '_' + to).removeClass();
	if (priceDirection & 1) {
		$('#PRICE_' + from + '_' + to).addClass("up");
	} else if (priceDirection & 2) {
		$('#PRICE_' + from + '_' + to).addClass("down");
	}

	if (from === 'BTC' && to === 'USD')
		addData($('#container').highcharts().series[0], current['PRICE']);

	// addData($('#container').highcharts().series[0], {
	// 	name: current['LASTMARKET'],
	// 	data: [new Date().getTime(), current['PRICE']]
	// });

	if (current['PRICE'] > current['OPEN24HOUR']) {
		$('#CHANGE24HOURPCT_' + from + '_' + to).removeClass();
		$('#CHANGE24HOURPCT_' + from + '_' + to).addClass("up");
	} else if (current['PRICE'] < current['OPEN24HOUR']) {
		$('#CHANGE24HOURPCT_' + from + '_' + to).removeClass();
		$('#CHANGE24HOURPCT_' + from + '_' + to).addClass("down");
	}
};

var currentPrice = {};

function dataUnpack(data) {
	var from = data['FROMSYMBOL'];
	var to = data['TOSYMBOL'];
	var fsym = CCC.STATIC.CURRENCY.getSymbol(from);
	var tsym = CCC.STATIC.CURRENCY.getSymbol(to);
	var pair = from + to;
	console.log(data);

	if (!currentPrice.hasOwnProperty(pair)) {
		currentPrice[pair] = {};
	}

	for (var key in data) {
		currentPrice[pair][key] = data[key];
	}

	if (currentPrice[pair]['LASTTRADEID']) {
		currentPrice[pair]['LASTTRADEID'] = parseInt(currentPrice[pair]['LASTTRADEID']).toFixed(0);
	}
	currentPrice[pair]['CHANGE24HOUR'] = CCC.convertValueToDisplay(tsym, (currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']));
	currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";
	displayData(currentPrice[pair], from, to, tsym, fsym);
};

function square(containerId) {
	Highcharts.stockChart(containerId, {
		exporting: {
			enabled: false
		},

		rangeSelector: {
			allButtonsEnabled: true,
			selected: 5
		},

		yAxis: {
			labels: {
				formatter: function() {
					return (this.value > 0 ? ' + ' : '') + this.value + '%';
				}
			},
			plotLines: [{
				value: 0,
				width: 2,
				color: 'silver'
			}]
		},

		plotOptions: {
			series: {
				compare: 'percent',
				showInNavigator: true
			}
		},

		tooltip: {
			pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
			valueDecimals: 2,
			split: true
		},

		series: [{
			name: 'tratata',
			data: []
		}]
	});
}

function addData(series, data) {
	series.addPoint([new Date().getTime(), data], true, false);
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}