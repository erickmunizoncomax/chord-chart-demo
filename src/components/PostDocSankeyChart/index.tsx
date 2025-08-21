import type { FC } from 'react'
import ReactECharts from 'echarts-for-react'

interface SankeyChartProps {
  data: any[]
}

const legendItems = [
  { label: 'RICE Majors', color: '#018CFF' },
  { label: 'Outcome (Industry)', color: '#BB57A9' },
  { label: 'Detailed Outcome', color: '#10AD95' },
]

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
    ...majors.map((name: string) => ({
      name: `M$$$${name}`,
      itemStyle: {
        color: '#018CFF',
        borderRadius: 2,
      },
      label: {
        position: 'left',
        formatter: (params: any) => {
          const n = params.name.replace('M$$$', '')
          // if (n.length > 20) n = `${n.substring(0, 20)}...`
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
      return {
        name: `O$$$${name}`,
        itemStyle: {
          color: '#BB57A9',
          borderRadius: 2
        },
        label: {
          formatter: (params: any) => {
            return params.name.replace('O$$$', '')
          }
        }
      }
    }),

    ...detailedIndustries.map((name: string) => {
      return {
        name: `I$$$${name}`,
        itemStyle: {
          color: '#10AD95',
          borderRadius: 2
        },
        label: {
          formatter: (params: any) => {
            return params.name.replace('I$$$', '')
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
        right: 250,
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
          curveness: 0.5,
          opacity: 0.35,
          color: 'gradient'
        },
        label: { color: '#FFF' }
      }
    ]
  }

  return (
    <>
      <div className="sankey-chart-container h-full w-full flex flex-col space-y-8">
        <div className="legend-container flex items-center space-x-4">
          {
            legendItems.map((item, index) => (
              <div key={index}
                   className="legend-item flex items-center space-x-2">
                <div className="square-container h-4 w-4 rounded-sm" style={{ backgroundColor: item.color }} />
                <p className="text-xs text-white">
                  { item.label }
                </p>
              </div>
            ))
          }
        </div>
        <ReactECharts option={option}
                      opts={{ devicePixelRatio: 2 }}
                      style={{ height: '100%' }} />
      </div>
    </>
  )
}

export default PostDocSankeyChart