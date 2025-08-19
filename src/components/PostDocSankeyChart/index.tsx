import type { FC } from 'react'
import { colors, despisedColors } from '../../constants'
import ReactECharts from 'echarts-for-react'

interface SankeyChartProps {
  data: any[]
}

let majorsValues = 0
let outcomesValues = 0
let detailedIndustriesValues = 0

const buildSankeyData = (items: any[]) => {
  const safe = (v: any) => String(v ?? '').trim()

  const majors = Array.from(
    new Set(items.map(i => safe(i['Major'])).filter(Boolean))
  )
  const outcomes = Array.from(
    new Set(items.map(i => safe(i['Outcome'])).filter(Boolean))
  )
  const detailedIndustries = Array.from(
    new Set(items.map(i => safe(i['Detailed Industry'])).filter(Boolean))
  )

  const data = [
    ...majors.map((name: string, i: number) => ({
      name: `M$$$${name}`,
      itemStyle: {
        color: colors[i % colors.length],
        borderRadius: 2,
      },
      label: {
        position: 'left',
        formatter: (params: any) => {
          let n = params.name.replace('M$$$', '')
          if (n.length > 20) n = `${n.substring(0, 20)}...`
          majorsValues += params.value
          return [`{title|${n}}`, `{subtitle|${params.value}}`].join('\n')
        },
        rich: {
          title: { fontSize: 10, color: 'white' },
          subtitle: { fontSize: 13, weight: 'bold', color: 'white', align: 'right' }
        },
        color: '#ffd666',
        fontSize: 12,
        fontWeight: 'bold'
      }
    })),

    ...outcomes.map((name: string) => {
      const idx = Math.floor(Math.random() * Math.max(despisedColors.length, 1))
      const color = despisedColors[idx]
      return {
        name: `O$$$${name}`,
        itemStyle: { color, borderRadius: 2 },
        label: {
          formatter: (params: any) => {
            let n = params.name.replace('O$$$', '')
            if (n.length > 20) n = `${n.substring(0, 20)}...`
            outcomesValues += params.value
            return n
          }
        }
      }
    }),

    ...detailedIndustries.map((name: string) => {
      const idx = Math.floor(Math.random() * Math.max(despisedColors.length, 1))
      const color = despisedColors[idx]
      return {
        name: `I$$$${name}`,
        itemStyle: { color, borderRadius: 2 },
        label: {
          formatter: (params: any) => {
            let n = params.name.replace('I$$$', '')
            if (n.length > 20) n = `${n.substring(0, 20)}...`
            detailedIndustriesValues += params.value
            return n
          }
        }
      }
    })
  ]

  const mapMO: Record<string, number> = {}
  const mapOI: Record<string, number> = {}

  for (const item of items) {
    const major = safe(`M$$$${item['Major']}`)
    const outcome = safe(`O$$$${item['Outcome']}`)
    const industry = safe(`I$$$${item['Detailed Industry']}`)

    if (major && outcome) {
      const k = `${major}___${outcome}`
      mapMO[k] = (mapMO[k] || 0) + 1
    }

    if (outcome && industry) {
      const k = `${outcome}___${industry}`
      mapOI[k] = (mapOI[k] || 0) + 1
    }
  }

  const links = [
    ...Object.entries(mapMO).map(([key, value]) => {
      const [source, target] = key.split('___')
      return { source, target, value }
    }),
    ...Object.entries(mapOI).map(([key, value]) => {
      const [source, target] = key.split('___')
      return { source, target, value }
    })
  ]

  return { data, links }
}

const PostDocSankeyChart: FC<SankeyChartProps> = (props) => {
  const { data, links } = buildSankeyData(props.data)

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        const replaced = params.name.replace(/\w\$\$\$/g, '')
        return `${replaced}: <b>${params.value}</b>`
      }
    },
    series: [
      {
        type: 'sankey',
        left: 150,
        right: 150,
        top: 10,
        bottom: 10,
        nodeWidth: 16,
        nodeGap: 0,
        draggable: false,
        layout: 'none',
        data,
        links,
        emphasis: { focus: 'adjacency' },
        lineStyle: {
          color: 'source',
          curveness: 0.5,
          opacity: 0.35
        },
        label: { color: '#FFF' }
      }
    ]
  }

  console.log(option)

  return (
    <>
      <div className="sankey-chart-container h-full w-full">
        <ReactECharts option={option}
                      opts={{ devicePixelRatio: 2 }}
                      style={{ height: '100%' }} />
      </div>
    </>
  )
}

export default PostDocSankeyChart