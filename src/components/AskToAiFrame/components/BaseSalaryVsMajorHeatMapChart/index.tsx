import { type FC, useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { formatCurrency } from "../../../../utils";

interface BaseSalaryVsMajorHeatMapChartProps {
  data: any[]
}

type Row = {
  Major: string
  Employer: string | null
  ['Base Salary']?: number | null
  [k: string]: any
}

function buildHeatmapAvgSalary(
  records: Row[],
  topN = 9,
  otherLabel = 'Other'
) {
  const safe = (v: any) => String(v ?? '').trim()

  const majorsSet = new Set<string>()
  for (const r of records) {
    const m = safe(r.Major)
    if (m) majorsSet.add(m)
  }
  const yCategories = Array.from(majorsSet).sort((a, b) => a.localeCompare(b))

  const empCount = new Map<string, number>()
  for (const r of records) {
    const e = safe(r.Employer) || 'Unknown'
    empCount.set(e, (empCount.get(e) ?? 0) + 1)
  }
  const topEmployers = Array.from(empCount.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map(([name]) => name)

  const xCategories = [...topEmployers, otherLabel]

  const yIndex = new Map(yCategories.map((m, i) => [m, i]))
  const xIndex = new Map(xCategories.map((e, i) => [e, i]))

  // ⬇️ soma, contagem, min e max por (Major, EmployerBucket)
  const agg = new Map<string, { sum: number; cnt: number; min: number; max: number }>()

  for (const r of records) {
    const major = safe(r.Major)
    if (!yIndex.has(major)) continue

    const employerRaw = safe(r.Employer) || 'Unknown'
    const employerBucket = topEmployers.includes(employerRaw) ? employerRaw : otherLabel
    const salaryRaw = r['Base Salary']
    const salary = Number(salaryRaw)

    if (!Number.isFinite(salary)) continue

    const yi = yIndex.get(major)!
    const xi = xIndex.get(employerBucket)!
    const key = `${yi}|${xi}`

    const prev = agg.get(key) ?? { sum: 0, cnt: 0, min: Infinity, max: -Infinity }
    prev.sum += salary
    prev.cnt += 1
    if (salary < prev.min) prev.min = salary
    if (salary > prev.max) prev.max = salary
    agg.set(key, prev)
  }

  const seriesData: (number | string | null)[][] = []
  let maxValue = 0

  for (let yi = 0; yi < yCategories.length; yi++) {
    for (let xi = 0; xi < xCategories.length; xi++) {
      const key = `${yi}|${xi}`
      const cell = agg.get(key)
      if (cell && cell.cnt > 0) {
        const avg = cell.sum / cell.cnt
        if (avg > maxValue) maxValue = avg
        // [xIndex, yIndex, média, min, max]
        seriesData.push([xi, yi, avg, cell.min, cell.max])
      } else {
        // sem dados: mantém 0 como valor e min/max nulos
        seriesData.push([xi, yi, 0, null, null])
      }
    }
  }

  return { xCategories, yCategories, seriesData, maxValue }
}

const BaseSalaryVsMajorHeatMapChart: FC<BaseSalaryVsMajorHeatMapChartProps> = (props) => {
  const { data } = props

  const chartOptions = useMemo(() => {
    const { xCategories, yCategories, seriesData, maxValue } = buildHeatmapAvgSalary(data, 9, 'Other')

    const option = {
      tooltip: {
        position: 'top',
        formatter: (p: any) => {
          const format = (v: number) => `$${formatCurrency(v)}`
          const [employer, major, avgSalary, minSalary, maxSalary] = p.value
          const x = xCategories[employer]
          const y = yCategories[major]
          const avg = format(avgSalary)
          const min = format(minSalary)
          const max = format(maxSalary)
          return `
             <b>${y}</b><br/>
             ${x}: <b>${avg}</b><br/>
             Min Salary: <b>${min}</b><br/>
             Max Salary: <b>${max}</b>
          `
        }
      },
      grid: { top: 40, right: 16, bottom: 60, left: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: xCategories,
        axisTick: { show: false },
        axisLabel: { interval: 0, rotate: 30, color: 'white' },
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: yCategories,
        axisTick: { show: false },
        splitArea: { show: true },
        axisLabel: { color: 'white' }
      },
      visualMap: {
        type: 'continuous',
        min: 1,
        max: Math.max(1, maxValue),
        calculable: false,
        range: [1.1, Math.max(1, maxValue)],   // 👈 inicia em 1 (mín = máx)
        orient: 'horizontal',
        left: 'left',
        textStyle: { color: 'white' },
        text: ['Higher', 'Lower'],
        bottom: 0,
        inRange: {
          color: [
            '#DCE59980',
            '#77B28480',
            '#448F9F80',
            '#4842A380',
          ]
        },
        outOfRange: {
          color: ['#2B2B34']
        }
      },
      series: [
        {
          name: 'Majors x Employers',
          type: 'heatmap',
          data: seriesData,
          itemStyle: {
            borderColor: '#111928',   // cor da borda
            borderWidth: 1,        // espessura da borda
            borderType: 'solid',   // também aceita 'dashed' ou 'dotted',
          },
          label: {
            show: true,
            color: 'white',
            formatter: (params: any) => {
              const [_, __, value] = params.data
              if (value !== 0) {
                return `$${Number(value).toLocaleString('en-US', {
                  maximumFractionDigits: 2
                })}`
              } else {
                return '---'
              }
            }
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.35)' }
          },
          cellSize: ['auto', 60]
        }
      ]
    }

    return { ...option }
  }, [data])

  return (
    <>
      <div className="employers-vs-specific-majors-chart-container h-full relative">
        <div className="header-container h-8">
          <p className="text-white font-medium">
            What is the expected salary for this degree or major?
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

export default BaseSalaryVsMajorHeatMapChart