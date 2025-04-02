<template>
    <div class="chart-container">
        <canvas id="line-chart"/>
    </div>
</template>

<script>
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from 'chart.js'
import lineChartData from './lineChartData'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale)

export default {
    name: 'LineChart',
    data () {
        return {
            chartInstance: null
        }
    },
    mounted () {
        const canvas = document.getElementById('line-chart')
        if (!canvas) {
            console.error('Canvas element not found')
            return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            console.error('Canvas context not available')
            return
        }

        this.chartInstance = new Chart(ctx, lineChartData)
    },
    beforeUnmount () {
        if (this.chartInstance) {
            this.chartInstance.destroy()
        }
    }
}
</script>
