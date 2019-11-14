var total;
var totalSrcPower;
var totalLoadPower;
var pie_bar_chart;
var priceData;
var energyConfig = {
    // config for the energy stacked area graph
    chart: {
            type: 'areaspline',
            marginLeft: 40, // Keep all charts left aligned
            spacingTop: 20,
            spacingBottom: 20,
            backgroundColor: "transparent"      
    },
    legend:{
        enabled: false
    },
    title: {
        style: {
            fontWeight: 'bold'
        },
        align: "left",
        text: 'Generation (MW)',
        fontSize: 18,
    },
    tooltip: {
        crosshairs: [{
          width: 2,
          color: 'red',
          zIndex: 3
        }],
        shared: true,
        formatter: function () {
            return Highcharts.dateFormat('%e %b. %I:%M %P',
            new Date(this.points[0].x)) + ' Total '+ this.points[0].total + ' MW'
        },
        positioner: function () {
            return {
                // right aligned
                x: this.chart.chartWidth - this.label.width,
                y: 10 // align to title
            };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        shadow: false,
        style: {
            fontSize: '10px'
        },
        snap: 100,
        enabled: false
    },
    plot: {
        tooltip:{
            visible: false
        },
        aspect: "spline",
        stacked: true
    },
    plotarea: {
        margin: "dynamic"
    },
    xAxis: {
        type: 'datetime',
        minorTickInterval: 1000*60*30,
        dateTimeLabelFormats: {
            day: '%a \n %d %b'
        },
        tickInterval:24*3600*1000,
        crosshair: {
            color: '#CA5131',
            width: 1,
            zIndex: 5
        },
        events: {
            setExtremes: syncExtremes
        }
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            formatter: function (){
                return this.value;
            },
            align: 'left',
            reserveSpace: false,
            x: 5,
            y: -3
        },
        tickInterval: 1000,
        showLastLabel: false,
        min: -300
    },
    plotOptions: {
        series: {
            stacking: "normal",
            states: {
                inactive: {
                    opacity: 1
                },
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

var priceConfig = {
    // config for the price line graph
    chart: {
            type: 'line',
            marginLeft: 40, // Keep all charts left aligned
            spacingTop: 20,
            spacingBottom: 20        
    },
    legend:{
        enabled: false
    },
    title: {
        align: "left",
        text: 'Price ($/MWh)',
        fontSize: 18,
    },
    tooltip: {
        crosshairs: [{
          width: 1,
          color: 'red',
          zIndex: 3
        }],

        enabled: false

      },
    xAxis: {
        visible: false
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            align: 'left',
            reserveSpace: false,
        },
    },
    plotOptions: {
        line: {
            step: 'left',
            color: "red",
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

var tempConfig = {
    // config for the temperature line graph
    chart: {
        type: "line",
        marginLeft: 40, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20        
    },
    credits: {
        enabled: false
    },
    title: {
        align: "left",
        text: 'Temperature (\u2109)',
        fontSize: 18,
    },
    legend:{
        enabled: false
    },
    tooltip: {
        crosshairs: [{
          width: 1,
          color: 'red',
          zIndex: 3
        }],
        enabled: false
      },
    xAxis: {
        visible: false
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            align: 'left',
            reserveSpace: false,
        },
    },
    plotOptions: {
        line: {
            color: "red",
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

var pieConfig = {
    chart: {
        renderTo: 'switchChart',//'pieGrid',
        type: 'pie',
        backgroundColor: 'transparent',
        animation: false,
    },
    plotOptions: {
        pie: {
            innerSize: '50%',
            size: '75%',
            dataLabels: {
                enabled: false
            }
        },
        series: {
            animation: false
        }
    },
    title: {
        align: 'center',
        verticalAlign: 'middle',
        text: '',
        style: {
            fontSize: '13px'
        }
    },
    series: [{
        name: 'Energy',
        colorByPoint: true,
        data: []
    }]
}
var colorsMap = {
    'black_coal': '#000000', 
    'distillate': '#FF4836', 
    'gas_ccgt': '#FFC420',
    'hydro': '#0084AD',
    'wind': '#21A100',
    'exports': '#EEC9FF',
    'pumps': '#9FE8FF'
};
// global data-structure to hold the energy breakup
var globalEnergyData = {
  name: [],
  data: []
};
var pumpEx = {
    name: [],
    data: []
};

function getpump(data) {
    data = data.filter(function(elm) {
        return (elm.name == 'pumps' || elm.name == 'exports')
    })
    pumpEx.data = [];
    for (var idx = 0; idx < data[0]['data'].length; idx ++) {
        var breaker = data.map(elm => {return elm['data'][idx]});
        pumpEx['data'].push(breaker);
    }
    pumpEx['name'] = data.map(elm => elm['name']);
}
// function to do deep-copy on the global data structure
function updateEnergyData(data) {
    data = data.filter(function(elm) {
        return (elm.name !== 'pumps' & elm.name !== 'exports')
    })
    globalEnergyData.data = [];
    for (var idx = 0; idx < data[0]['data'].length; idx ++) {
        var energyBreakup = data.map(elm => {return elm['data'][idx]});
        globalEnergyData['data'].push(energyBreakup);
    }
    globalEnergyData['name'] = data.map(elm => elm['name']);
}

function renderPieChart(nodeId) {
    var pieData = globalEnergyData['name'].map(function(elm, idx) {
        if (globalEnergyData['name'] !== 'pumps' & globalEnergyData['name'] !== 'exports') {
            return {
                name: elm.split('.')[elm.split('.').length - 1],
                y: globalEnergyData['data'][nodeId][idx],
                color: colorsMap[elm.split('.')[elm.split('.').length - 1]]
            }
        }
    });
    pieConfig.series[0].data = pieData;
    total = 0;
    for (var i = 0; i < pieConfig.series[0].data.length; i++) {
        total = total + pieConfig.series[0].data[i].y
    }
    pieConfig.title.text = Math.round(total) + ' MW';
    pie_bar_chart = Highcharts.chart(pieConfig)
  }

var renew = document.getElementById("renewables");
var sour = document.getElementById("totalSrc");
var loads = document.getElementById("totalLoad");


function updateLegendData(idx) {
    document.getElementById("windp").innerHTML = (globalEnergyData.data[idx][0]).toFixed(2);
    document.getElementById("hydrop").innerHTML = (globalEnergyData.data[idx][1]).toFixed(2);
    document.getElementById("gasp").innerHTML = (globalEnergyData.data[idx][2]).toFixed(2);
    document.getElementById("distp").innerHTML = (globalEnergyData.data[idx][3]).toFixed(2);
    document.getElementById("coalp").innerHTML = (globalEnergyData.data[idx][4]).toFixed(2);
    document.getElementById("exportsp").innerHTML = (pumpEx.data[idx][0]).toFixed(2);
    document.getElementById("pumpsp").innerHTML = (pumpEx.data[idx][1]).toFixed(2);

    
    document.getElementById("windd").innerHTML = (globalEnergyData.data[idx][0]/total*100).toFixed(2) + "%";
    document.getElementById("hydrod").innerHTML = (globalEnergyData.data[idx][1]/total*100).toFixed(2) + "%";
    document.getElementById("gasd").innerHTML = (globalEnergyData.data[idx][2]/total*100).toFixed(2) + "%";
    document.getElementById("distd").innerHTML = (globalEnergyData.data[idx][3]/total*100).toFixed(2) + "%";
    document.getElementById("coald").innerHTML = (globalEnergyData.data[idx][4]/total*100).toFixed(2) + "%";
    document.getElementById("exportsd").innerHTML = (pumpEx.data[idx][0]/total*100).toFixed(2) + "%";
    document.getElementById("pumpsd").innerHTML = (pumpEx.data[idx][1]/total*100).toFixed(2) + "%";
    
    var bigLoad = pumpEx.data[idx][0] + pumpEx.data[idx][1];
    var bigTot = bigLoad + total;

    document.getElementById("net").innerHTML = total.toFixed(2);
    document.getElementById("price").innerHTML = "$" + priceData[0].data[idx].toFixed(2);
    renew.innerHTML = ((globalEnergyData.data[idx][0] / total + globalEnergyData.data[idx][1] / total) * 100).toFixed(2) + "%";
    loads.innerHTML = bigLoad.toFixed(2);
    sour.innerHTML = bigTot.toFixed(2);

}
// this function is responsible for plotting the energy on
// successfully loading the JSON data
// It also plots the pie chart for nodeId=0
function onSuccessCb(jsonData) {
    var energyData = jsonData.filter(function(elm) {
        if (elm.fuel_tech !== 'rooftop_solar'){
            return elm['type'] === 'power';
        };
    }).map(function(elm) {
        var energyVals = new Array();
        if (elm.fuel_tech === 'pumps' || elm.fuel_tech === 'exports') {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]*(-1));
            };
        } else {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]);
            };
        }
        return {
            data: energyVals,
            name: elm.fuel_tech,
            pointStart: (elm.history.start + 5*60) * 1000,
            pointInterval: 1000 * 60 * 30,
            color: colorsMap[elm.fuel_tech],
            fillOpacity: 1,
            tooltip: {
                valueSuffix: ' ' + elm.units
            }
        };
    });
    updateEnergyData(energyData.reverse());
    getpump(energyData);

    priceData = jsonData.filter(function(elm) {
        return elm['type'] === 'price';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id']
        };
    });
    var tempData = jsonData.filter(function(elm) {
        return elm['type'] === 'temperature';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id']
        };
    });

    energyConfig.series = energyData;
    priceConfig.series = priceData;
    tempConfig.series = tempData;

    var chartDiv1 = document.createElement('div');
    chartDiv1.className = 'lgChart';
    document.getElementById('sharedGrid').appendChild(chartDiv1);
    Highcharts.chart(chartDiv1, energyConfig);

    var chartDiv2 = document.createElement('div');
    chartDiv2.className = 'medChart';
    document.getElementById('sharedGrid').appendChild(chartDiv2);
    Highcharts.chart(chartDiv2, priceConfig);

    var chartDiv3 = document.createElement('div');
    chartDiv3.className = 'smChart';
    document.getElementById('sharedGrid').appendChild(chartDiv3);
    Highcharts.chart(chartDiv3, tempConfig);

    renderPieChart(0)
    
}
['mouseleave'].forEach(function (eventType) {
    document.getElementById('sharedGrid').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event;
            
                for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                    chart = Highcharts.charts[i];
                    event = chart.pointer.normalize(e);
                    point = chart.series[0].searchPoint(event, true);
                    
                    if (point) {
                        point.onMouseOut(); 
                        chart.tooltip.hide(point);
                        chart.xAxis[0].hideCrosshair(); 
                    }
                }
            }
    )
});

['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
    document.getElementById('sharedGrid').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event,
                idx;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                // Find coordinates within the chart
                event = chart.pointer.normalize(e);
                // Get the hovered point
                point = chart.series[0].searchPoint(event, true);
                idx = chart.series[0].data.indexOf( point );

                if (point) {
                    point.highlight(e);
                    renderPieChart(idx);
                    updateLegendData(idx);
                }
            }
        }
    );
});

/**
    * Highlight a point by showing tooltip, setting hover state and draw crosshair
    */
   Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh(this); // Show the tooltip
    this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
    this.series.chart.yAxis[0].drawCrosshair(event, this);
};


/**
* Synchronize zooming through the setExtremes event handler.
*/
function syncExtremes(e) {
var thisChart = this.chart;

if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
    Highcharts.each(Highcharts.charts, function (chart) {
        if (chart !== thisChart) {
            if (chart.xAxis[0].setExtremes) { // It is null while updating
                chart.xAxis[0].setExtremes(
                    e.min,
                    e.max,
                    undefined,
                    false,
                    { trigger: 'syncExtremes' }
                );
            }
        }
    });
    }
}


/* Add this to the xAxis attribute of each chart. */
events: {
        setExtremes: syncExtremes
    }
// Utility function to fetch any file from the server
function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200 || httpRequest.status === 0) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
}

// The entrypoint of the script execution
function doMain() {
    fetchJSONFile('assets/springfield_converted_json.js', onSuccessCb);
}

document.onload = doMain();


document.getElementById('makeBar').addEventListener('click', function() {
    pie_bar_chart.update({
        chart: {
            type: 'bar'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        xAxis: {
            visible: false
        },
        yAxis: {
            visible: false
        },
        legend: {
            enabled:false
        }
    });
    renderPieChart(0);
})

document.getElementById('makePie').addEventListener('click', function() {
    pie_bar_chart.update({
        chart: {
            type: 'pie'
        }
    });
    renderPieChart(0);
})