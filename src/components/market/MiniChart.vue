<template>
  <div class="mini-chart" ref="chartRef"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([LineChart, GridComponent, SVGRenderer])

// 定义属性
const props = defineProps({
  data: {
    type: Array as () => number[],
    required: true
  },
  color: {
    type: String,
    default: '#1989fa'
  },
  height: {
    type: Number,
    default: 40
  },
  width: {
    type: Number,
    default: 80
  }
})

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null)
// 图表实例
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 创建图表实例
  chartInstance = echarts.init(chartRef.value, undefined, {
    renderer: 'svg',
    width: props.width,
    height: props.height
  })
  
  // 更新图表
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return
  
  // 设置图表选项
  chartInstance.setOption({
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    xAxis: {
      type: 'category',
      show: false,
      data: Array.from({ length: props.data.length }, (_, i) => i)
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 'dataMin',
      max: 'dataMax'
    },
    series: [
      {
        type: 'line',
        data: props.data,
        showSymbol: false,
        symbol: 'none',
        lineStyle: {
          width: 1.5,
          color: props.color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: props.color // 渐变起始颜色
              },
              {
                offset: 1,
                color: 'rgba(255, 255, 255, 0)' // 渐变结束颜色
              }
            ]
          }
        },
        smooth: true
      }
    ],
    animation: false
  })
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// 监听颜色变化
watch(() => props.color, () => {
  nextTick(() => {
    updateChart()
  })
})

// 组件挂载时初始化图表
onMounted(() => {
  initChart()
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

// 组件卸载时销毁图表实例
const onBeforeUnmount = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  
  window.removeEventListener('resize', () => {
    chartInstance?.resize()
  })
}
</script>

<style lang="scss" scoped>
.mini-chart {
  width: 100%;
  height: 100%;
}
</style>
