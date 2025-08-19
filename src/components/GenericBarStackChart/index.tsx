import ReactECharts from 'echarts-for-react'
import chroma from 'chroma-js'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { ArrowSquareLeft, ArrowSquareRight } from 'iconsax-reactjs'
import { colors } from '../../constants'
import Big from 'big.js'

interface BarStackChartProps {
  data?: any[]
  originField: string
  destinationField: string
  onDrillDownClick?: (value: string) => void
}

export interface BarStackChartRef {
  highlightStack: (stackName: string) => void
  downPlayStack: (stackName: string) => void
}

const getSeriesNames = (data: any[], field: string) => {
  const mapping: any = {}
  data.forEach(item => mapping[item[field]] = true)
  return Object.keys(mapping).sort()
}

interface DataItem {
  [key: string]: any
}

interface SeriesMatrixResult {
  industries: string[]
  matrix: number[][]
  industryMatrix: string[][]
}

const buildSeriesMatrix = (
  data: DataItem[],
  columnsNames: string[],
  colKey: string,
  rowKey: string
): SeriesMatrixResult => {
  const industries = Array.from(
    new Set(data.map(item => item[rowKey] ?? '—'))
  ).sort()

  const matrix: number[][] = industries.map(() =>
    columnsNames.map(() => 0)
  )

  data.forEach(item => {
    const columnName = item[colKey] ?? ''
    const rowName = item[rowKey] ?? '—'
    const col = columnsNames.indexOf(columnName)
    const row = industries.indexOf(rowName)
    if (col >= 0 && row >= 0) {
      matrix[row][col]++
    }
  })

  const industryMatrix: string[][] = industries.map((ind) =>
    columnsNames.map(() =>
      ind
    )
  )

  return { industries, matrix, industryMatrix }
}

function normalizeWithBig(rawData: any[][], decimals = 8) {
  const nSeries = rawData.length
  const nCats   = rawData[0].length
  const scale   = Big(10).pow(decimals)

  const totalData = Array.from({ length: nCats }, (_, j) =>
    rawData.reduce(
      (sum: any, serie: any) => sum.plus( Big(serie[j] || 0) ),
      Big(0)
    )
  )

  const fracData = rawData.map(serie =>
    serie.map((v, j) => {
      const tot = totalData[j]
      if (tot.eq(0)) return 0
      return Big(v)
        .div(tot)
        .times(scale)
        .round(0, 0)
        .div(scale)
        .toNumber()
    })
  )

  for (let j = 0; j < nCats; j++) {
    const soma = fracData.reduce((s, serie) => s + serie[j], 0)
    const diff = Big(1).minus(soma).toNumber()
    if (diff !== 0) {
      const last = nSeries - 1
      fracData[last][j] = Big(fracData[last][j])
        .plus(diff)
        .toNumber()
    }
  }

  return fracData
}

const scope: any = {}

const GenericBarStackChart = forwardRef<
  BarStackChartRef,
  BarStackChartProps
>((props, ref) => {
  const {
    originField,
    destinationField,
    onDrillDownClick
  } = props

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    highlightStack: scope.highlightStack,
    downPlayStack: scope.downPlayStack
  }))

  if (!props.data?.length) return null

  const seriesNames = getSeriesNames(props.data, destinationField)
  const { matrix: rawData, industries, industryMatrix } = buildSeriesMatrix(props.data, seriesNames, destinationField, originField)

  scope.seriesNames = seriesNames

  // Data should be a squared matrix to work correctly...
  /* const rawData = [
     [100, 302, 301, 334, 390, 330, 320],
     [320, 132, 101, 134, 90, 230, 210],
     [220, 182, 191, 234, 290, 330, 310],
     [150, 212, 201, 154, 190, 330, 410],
     [820, 832, 901, 934, 1290, 1330, 1320],
     [100, 302, 301, 334, 390, 330, 320],
     [320, 132, 101, 134, 90, 230, 210],
   ]*/

  // Series name should have same length of rawData to work correctly
  // const seriesNames = ['Direct', 'Mail Ad', 'Affiliate Ad', 'Video Ad', 'Search Engine', 'Saturday', 'Sunday']
  const grid = { left: 0, right: 0, top: 34, bottom: 0 }

  const barWidthStr = '90%'
  const barWidthInPixels = 105
  const categories = rawData[0].length
  const chartTotalWidthInPixels = categories * barWidthInPixels

  // 2) PictorialBar para desenhar só 2px de "borda" no topo
  //    precisa calcular barWidth em px pra usar em symbolSize
  const chartWidth = chartTotalWidthInPixels
  const chartHeight = 360
  const gridWidth = chartWidth - grid.left - grid.right
  const gridHeight = chartHeight - grid.top - grid.bottom
  const categoryWidth = gridWidth / rawData[0].length
  const barWidthPx = categoryWidth * 0.9

  const series: any[] = []

  const fracData = normalizeWithBig(rawData, /*decimals=*/8)

  // seriesNames.forEach((name, sid, arr) => {
  industries.forEach((name, sid, arr) => {
    // current serie normalized data
    const barData = fracData[sid]

    // normal stack bar
    series.push({
      name,
      type: 'bar',
      stack: 'total',
      barWidth: barWidthStr,
      label: { show: false },
      data: barData?.map((value, index) => ({
        value,
        label: industryMatrix[sid][index],
        rawValue: rawData[sid][index]
      })),
      itemStyle: { color: colors[sid] },
      emphasis: { itemStyle: { opacity: 1 }},
      blur: { itemStyle: { opacity: 0 }}
    })

    if (sid < arr.length - 1) {
      // calc cumulativeData = sum of fracData[0..sid] for each category
      const cumulativeData = fracData
        .slice(0, sid + 1)
        .reduce(
          (acc, cur) => acc.map((sum, i) => sum + cur[i]),
          new Array(fracData[0].length).fill(0)
        )

      // pictorialBar uses the correct cumulativeData
      series.push({
        name: `${name} Topline`,
        type: 'pictorialBar',
        symbol: 'rect',
        symbolPosition: 'end',
        symbolOffset: [0, '-50%'],
        symbolSize: [barWidthPx, 2], // same width bar, 2px height
        data: cumulativeData,
        z: 10,
        tooltip: { show: false },
        itemStyle: {
          color: '#00000090',
        },
      })
    }
  })

  // 3) Costomized Graphic (polygon) between categories
  const elements = []
  const barPadding = (categoryWidth - barWidthPx) / 2

  for (let j = 1; j < categories; ++j) {
    const leftX = grid.left + categoryWidth * j - barPadding
    const rightX = leftX + barPadding * 2
    let leftY = grid.top + gridHeight
    let rightY = leftY

    for (let i = 0; i < industries.length; ++i) {
      const points = []
      const leftBarHeight = fracData[i][j - 1] * gridHeight
      points.push([leftX, leftY])
      points.push([leftX, leftY - leftBarHeight])

      const rightBarHeight = fracData[i][j] * gridHeight
      points.push([rightX, rightY - rightBarHeight])
      points.push([rightX, rightY])
      points.push([leftX, leftY])

      leftY -= leftBarHeight
      rightY -= rightBarHeight

      elements.push({
        type: 'polygon',
        shape: { points },
        style: {
          fill: chroma(colors[i]).darken(1.3).hex(),
          opacity: 1,
        },
      })

      if (i !== 0) {
        elements.push({
          type: 'polyline',
          shape: {
            points: [
              points[0],  // bottom-left
              points[3]   // bottom-right
            ]
          },
          style: {
            stroke: '#00000090',
            lineWidth: 2,
            opacity: 1
          }
        })
      }
    }
  }

  // new, for each j category, it will draw rect+text
  const rectH = 30

  for(let j= 0; j < categories; ++j){
    const rectX = grid.left + categoryWidth * j + barPadding
    const rectY = grid.top - rectH - 4

    // label rectangle
    elements.push({
      type: 'rect',
      id: `rect-name-container-${j}__${seriesNames[j]}`,
      info: { columnName: seriesNames[j] },
      shape: {
        x: rectX,
        y: rectY,
        width: barWidthPx,
        height: rectH,
        r: 4
      },
      style: {
        fill: '#B0AFAC',
      }
    })

    // certered text
    elements.push({
      type: 'text',
      id: `rect-name-text-${j}__${seriesNames[j]}`,
      info: { columnName: seriesNames[j] },
      style: {
        x: rectX + barWidthPx / 2,
        y: rectY + rectH / 2,
        text: (() => {
          if (seriesNames[j].length > 12) return `${seriesNames[j].substring(0, 12)}...`
          return seriesNames[j]
        })(),
        textAlign: 'center',
        textVerticalAlign: 'middle',
        fill: 'white',
        font: '12px sans-serif',
      }
    })
  }

  const option = {
    legend: { show: false },
    grid,
    xAxis: {
      type: 'category',
      show: false,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      min: 0,
      max: 1,
      type: 'value',
      show: false,
      splitLine: { show: false },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      renderMode: 'html',
      appendToBody: true,
      formatter: (params: any) => {
        const filtered = params.reverse().filter((item: any) => item.data.value > 0)
        const legendItems = filtered.map((item: any) => (
          `
            <div class="legend-item-container flex items-center space-x-1">
              <div class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></div>
              <p class="text-black">${item.data.label}: <strong>${item.data.rawValue}</strong></p>
            </div>
          `
        ))

        return `
          <div class="tooltip-content flex flex-col space-y-0.5">
            ${legendItems.join('')}
          </div>  
        `
      }
    },
    series,
    graphic: { elements },
  }

  const onEvents = {
    click: (params: any) => {
      if (params.componentType === 'graphic') {
        let id = null

        if (typeof params.event.target.id === 'string') {
          id = params.event.target.id.startsWith('rect-name') ? params.event.target.id.split('__')[1] : null
        } else if (typeof params.event.target.parent.id === 'string') {
          id = params.event.target.parent.id.startsWith('rect-name') ? params.event.target.parent.id.split('__')[1] : null
        }

        if (id && onDrillDownClick) onDrillDownClick(id)
      }
    }
  }

  const highlightColumnByName = (chart: any, columnName: string) => {
    const mutedOpacity = 0.2
    const option = chart.getOption()

    if (!scope.seriesNames?.includes(columnName)) return

    const idx = scope.seriesNames.indexOf(columnName)

    const newSeries = (option.series || []).map((s: any) => ({
      ...s,
      data: s.data.map((raw: any, index: number) => {
        const value = (typeof raw === 'object') ? raw.value : raw
        if (index !== idx) {
          const prevStyle = (typeof raw === 'object' && raw.itemStyle)
            ? raw.itemStyle
            : {}
          return {
            value,
            label: raw.label,
            rawValue: raw.rawValue,
            itemStyle: {
              ...prevStyle,
              opacity: mutedOpacity
            }
          }
        }
        return raw
      })
    }))

    const newGraphic = option.graphic.map((group: any) => {
      if (!group.elements) return group

      return {
        ...group,
        elements: group.elements.map((el: any) => {
          if (['text', 'rect'].includes(el.type)) {
            return {
              ...el,
              style: {
                ...el.style,
                opacity: el.info.columnName === columnName ? 1 : mutedOpacity
              }
            }
          }
          return el
        })
      }
    })

    chart.setOption({ series: newSeries, graphic: newGraphic }, false, { lazyUpdate: true })
  }

  const resetAllSeriesOpacity = (chart: any) => {
    const option = chart.getOption()

    const newSeries = (option.series || []).map((s: any) => {
      const newData = (s.data || []).map((raw: any) => {
        const value = (typeof raw === 'object') ? raw.value : raw
        const prevStyle = (typeof raw === 'object' && raw.itemStyle) ? raw.itemStyle : {}
        return {
          value,
          label: raw.label,
          rawValue: raw.rawValue,
          itemStyle: {
            ...prevStyle,
            opacity: 1
          }
        }
      })
      return { ...s, data: newData }
    })

    const newGraphic = option.graphic.map((group: any) => {
      if (!group.elements) return group

      return {
        ...group,
        elements: group.elements.map((el: any) => {
          return {
            ...el,
            style: {
              ...el.style,
              opacity: 1
            }
          }
        })
      }
    })

    chart.setOption({ series: newSeries, graphic: newGraphic }, false, { lazyUpdate: true })
  }

  const highlightStack = (stackName: string) => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance()
      highlightColumnByName(chart, stackName)
    }
  }

  const downPlayStack = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance()
      resetAllSeriesOpacity(chart)
    }
  }

  scope.highlightStack = highlightStack
  scope.downPlayStack = downPlayStack

  const handleScrollRightClick = () => {
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollTo({
        left: chartContainerRef.current.scrollLeft + 110,
        behavior: 'smooth',
      })
    }
  }

  const handleScrollLeftClick = () => {
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollTo({
        left: chartContainerRef.current.scrollLeft - 110,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <div className="bar-stack-chart-component-container w-full h-full relative flex items-center">
        <div className="chart-container relative flex w-full">
          <div className="left-arrow-container flex flex-col items-center mt-auto h-full relative w-4">
            <svg width="6" height="60" viewBox="0 0 6 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 5.5L0.113249 0.5H5.88675L3.5 5.5H2.5ZM3 44H2.5V5H3H3.5V44H3Z" fill="white"/>
            </svg>

            <div className="y-axis-label -rotate-90 h-[120px] flex items-center z-20">
              <p className="text-white text-[9px] whitespace-nowrap">
                RCE Graduation areas
              </p>
            </div>

            <svg width="6" height="145" viewBox="0 0 6 204" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 199L0.113249 204H5.88675L3.5 199H2.5ZM3 0.5H2.5V199.5H3H3.5V0.5H3Z"
                    fill="url(#paint0_linear_21388_33202)"/>
              <defs>
                <linearGradient id="paint0_linear_21388_33202" x1="3.5" y1="0.5" x2="3.5" y2="204"
                                gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0.15"/>
                  <stop offset="1" stopColor="white"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="top-arrow-and-chart-container w-full relative">
            <div className="top-arrow-container flex items-center h-6 relative w-full ml-1">
              <svg width="60" height="7" viewBox="0 0 60 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0.25 3.25L5.25 0.363249V6.13675L0.25 3.25ZM43.75 3.25V3.75L4.75 3.75V3.25V2.75L43.75 2.75V3.25Z"
                  fill="white"/>
              </svg>

              <div className="x-axis-label flex items-center z-20">
                <p className="text-white text-[9px] whitespace-nowrap">
                  Professional engagement
                </p>
              </div>

              <svg width="100%" height="6" viewBox="0 0 533 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M532.5 3L527.5 0.113249V5.88675L532.5 3ZM0 3L0 3.5L528 3.5V3V2.5L0 2.5L0 3Z"
                      fill="url(#paint0_linear_21388_33206)"/>
                <defs>
                  <linearGradient id="paint0_linear_21388_33206" x1="0.00151976" y1="-2.48195e+13" x2="203.502"
                                  y2="-2.48195e+13" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.15"/>
                    <stop offset="1" stopColor="white"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="scroll-icons-container absolute w-full z-40 flex justify-between top-7.5">
              <ArrowSquareLeft size="20"
                               color="white"
                               className="absolute cursor-pointer -left-5"
                               onClick={handleScrollLeftClick} />
              <ArrowSquareRight size="20"
                                color="white"
                                className="absolute cursor-pointer right-0"
                                onClick={handleScrollRightClick} />
            </div>

            <div ref={chartContainerRef}
                 className="chart-container overflow-hidden">
              <ReactECharts ref={chartRef}
                            option={option}
                            opts={{ devicePixelRatio: 2 }}
                            style={{ height: '360px', width: chartTotalWidthInPixels, marginRight: 20 }}
                            onEvents={onEvents} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export default GenericBarStackChart
