<template>
    <div>
        <highcharts
            :constructor-type="'stockChart'"
            :options="chartOptions"
            :highcharts="Highcharts" />
    </div>
</template>

<script>
export default {
    name: 'StockAreaChart',
    data () {
        return {
            Highcharts: this.$Highcharts,
            chartOptions: {
                chart: {
                    height: 250,
                    backgroundColor: 'transparent'
                },
                title: { text: null },
                rangeSelector: { enabled: false },
                navigator: { enabled: false },
                scrollbar: { enabled: false },
                legend: { enabled: false },
                yAxis: {
                    opposite: true,
                    gridLineColor: '#eee',
                    labels: {
                        style: { color: '#999' },
                        align: 'right',
                        x: 0
                    }
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        style: { color: '#999' }
                    },
                    lineWidth: 0,
                    overscroll: '40px'
                },
                tooltip: {
                    xDateFormat: '%b %d',
                    valueDecimals: 5,
                    shared: true
                },
                credits: { enabled: false },
                series: [{
                    type: 'areaspline',
                    name: 'Price',
                    data: this.generateDummyData(),
                    color: '#3399cc',
                    fillColor: {
                        linearGradient: [0, 0, 0, 300],
                        stops: [
                            [0, '#3399cc'],
                            [1, 'rgba(51, 153, 204, 0)']
                        ]
                    },
                    lineWidth: 2,
                    marker: {
                        enabled: false
                    },
                    threshold: null
                }]
            }
        }
    },
    methods: {
        generateDummyData () {
            const data = []
            const time = Date.UTC(2023, 9, 1)
            for (let i = 0; i <= 30; i++) {
                data.push([
                    time + i * 24 * 3600 * 1000,
                    0.045 + Math.sin(i / 2) * 0.005 + (Math.random() - 0.5) * 0.002
                ])
            }
            return data
        }
    }
}
</script>
