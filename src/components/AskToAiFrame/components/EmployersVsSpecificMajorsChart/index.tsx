import { type FC, useMemo } from "react"
import ReactECharts from "echarts-for-react"

interface EmployersVsSpecificMajorsChartProps {
  data: any[]
  originField: string
  outcomeField: string
}

const getSeriesNames = (data: any[], field: string) => {
  const mapping: any = {}
  data.forEach(item => mapping[item[field]] = true)
  return Object.keys(mapping).sort()
}

const getEchartsDatasetRows = (
  data: any[],
  categories: string[],
  origin: string,
  outcome: string,
): (string | number)[][] => {
  const mapped = data.map(i => ({ ...i, dimension: i[outcome] }))
  const dimensions = Array.from(new Set(mapped.map(d => d.dimension))).sort()

  const counts: Record<string, Record<string, number>> = {}
  for (const item of mapped) {
    const dimension = item.dimension as string
    const category = String(item[origin] ?? '')
    if (!counts[dimension]) counts[dimension] = {}
    counts[dimension][category] = (counts[dimension][category] || 0) + 1
  }

  return dimensions.map(dimension => [
    dimension,
    ...categories.map(cat => counts[dimension]?.[cat] || 0)
  ])
}

const topNPlusOtherRows = (
  rows: (string | number)[][],
  seriesNames: string[],
  topN = 9,
  otherLabel = 'Other'
) => {
  if (rows.length <= topN) return rows

  const withTotals = rows.map(r => ({
    row: r,
    total: r.slice(1).reduce((a, b) => +a + Number(b || 0), 0) as number
  }))

  const top = withTotals
    .sort((a, b) => b.total - a.total)
    .slice(0, topN)
    .map(x => x.row)

  const rest = withTotals.slice(topN).map(x => x.row)
  if (rest.length === 0) return top

  const agg = Array(seriesNames.length).fill(0)
  for (const r of rest) {
    r.slice(1).forEach((v, i) => { agg[i] += Number(v || 0) })
  }

  return [...top, [otherLabel, ...agg]]
}

const EmployersVsSpecificMajorsChart: FC<EmployersVsSpecificMajorsChartProps> = (props) => {
  const { data, originField, outcomeField } = props

  const chartOptions = useMemo(() => {
    const filtered = data.filter(item => item[originField] && item[outcomeField])
    const seriesNames = getSeriesNames(filtered, originField)
    const rows = getEchartsDatasetRows(filtered, seriesNames, originField, outcomeField)
    const top9Rows = topNPlusOtherRows(rows, seriesNames, 9, 'Other')

    const option = {
      grid: {
        containLabel: true,
        top: 10,
        left: 50,
        right: 10,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const legendItems: { count: number, html: string }[] = params
            .map((item: any, index: number) => {
              const count = item.data.slice(1)[index]

              return {
                count,
                html: `
                  <div class="legend-item-container flex items-center space-x-1">
                    <div class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></div>
                    <p class="text-black">${item.seriesName}: <strong>${count}</strong></p>
                  </div>
                `
              }
            })

          return `
            <div class="tooltip-content flex flex-col space-y-0.5">
              ${legendItems.reverse().filter(item => item.count > 0).map(item => item.html).join('')}
            </div>
          `
        }
      },
      legend: {
        bottom: 0,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 4,
        textStyle: {
          color: 'white'
        },
        data: seriesNames
      },
      dataset: {
        source: [
          [
            'dimension',
            ...seriesNames
          ],
          // ...rows
          ...top9Rows
        ]
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLabel: { interval: 0, rotate: 45, color: 'white' },
      },
      yAxis: {
        type: 'value',
        name: '# of Students Per Major',
        nameRotate: 90,
        nameGap: 30,
        nameTextStyle: {
          color: 'white',
          fontSize: 12,
          fontWeight: '300'
        },
        axisLabel: { color: 'white' },
        axisLine: {
          show: true,
          lineStyle: {
            opacity: .2
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            opacity: .2
          }
        }
      },
      barCategoryGap: 4,
      series: seriesNames.map(name => ({
        name,
        type: 'bar',
        stack: 'total',
        itemStyle: {
          borderRadius: 4,
          borderColor: '#111928',
          borderWidth: 2
        }
      }))
    }

    return { ...option }
  }, [data, originField, outcomeField])

  return (
    <>
      <div className="employers-vs-specific-majors-chart-container h-full relative">
        <div className="header-container h-8">
          <p className="text-white font-medium">
            Which employers are associated with specific majors or industries?
          </p>
        </div>
        <div className="chart-container h-[calc(100%-2rem)]">
          <ReactECharts option={chartOptions}
                        style={{ height: '100%' }}
                        opts={{ devicePixelRatio: 2 }} />
        </div>
      </div>
    </>
  )
}

export default EmployersVsSpecificMajorsChart