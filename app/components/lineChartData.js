const lineChartData = {
    type: 'line',
    data: {
        'labels': ['Oct 0', 'Oct 3', 'Oct 6', 'Oct 9', 'Oct 12', 'Oct 15', 'Oct 18', 'Oct 21', 'Oct 24', 'Oct 27', 'Oct 30'],
        'datasets': [{
            'label': 'Price',
            'data': [0.041, 0.050, 0.057, 0.053, 0.051, 0.050, 0.049, 0.048, 0.049, 0.050, 0.051],
            'borderColor': 'blue',
            'backgroundColor': 'rgba(0, 0, 255, 0.1)',
            'borderWidth': 2,
            'fill': true,
            pointStyle: false
        }]
    },
    options: {
        responsive: true,
        lineTension: 1,
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true,
                        padding: 25
                    }
                }
            ]
        },
        plugins: {
            title: {
                display: true,
                text: (ctx) => 'Point Style: ' + ctx.chart.data.datasets[0].pointStyle
            }
        }
    }
}

export default lineChartData
