import type { FC } from 'react'
import { colors, despisedColors } from '../../constants'
import ReactECharts from 'echarts-for-react'

interface SankeyChartProps {
  data: any[]
  originField: string
  destinationField: string
}

const buildSankeyData = (items: any[], originField: string, destinationField: string) => {
  const fields = Array.from(new Set(items.map(i => i[originField])))
  const industries = Array.from(new Set(items.map(i => i[destinationField])))

  const data = [
    ...fields.map((name: any, i: number) => {
      return {
        name,
        itemStyle: {
          color: colors[i],
          borderRadius: 2,
        },
        label: {
          position: 'left',
          formatter: (params: any) => {
            let name = params.name
            if (name.length > 20) name = `${name.substring(0, 20)}...`
            return [
              `{title|${name}}`,
              `{subtitle|${params.value}}`
            ].join('\n')
          },
          rich: {
            title: {
              fontSize: 10,
              color: 'white',
            },
            subtitle: {
              fontSize: 13,
              weight: 'bold',
              color: 'white',
              align: 'right',
            }
          },
          color: '#ffd666',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    }),
    ...industries.map(name => {
      const { length } = despisedColors
      const idx = Math.floor(Math.random() * (length - 1))
      const color = despisedColors[idx]
      return {
        name,
        itemStyle: { color, borderRadius: 2 },
        label: {
          formatter: (params: any) => {
            let name = params.name
            if (name.length > 20) name = `${name.substring(0, 20)}...`
            return name
          }
        }
      }
    })
  ]

  const countMap: any = {}
  items.forEach((item: any) => {
    const key = `${item[originField]}___${item[destinationField]}`
    countMap[key] = (countMap[key] || 0) + 1
  })

  const links = Object.entries(countMap).map(([key, value]) => {
    const [source, target] = key.split('___')
    return { source, target, value }
  })

  return { data, links }
}

const AlumniSankeyChart: FC<SankeyChartProps> = (props) => {
  const { originField, destinationField} = props

  const { data, links } = buildSankeyData(
    props.data,
    originField,
    destinationField
  )

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        left: 150,
        right: 150,
        top: 10,
        bottom: 10,
        nodeWidth: 16,
        nodeGap: 8,
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

export default AlumniSankeyChart