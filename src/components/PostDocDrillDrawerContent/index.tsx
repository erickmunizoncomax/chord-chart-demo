import { type FC, useEffect, useMemo, useState } from 'react'
import { CloseCircle, More } from 'iconsax-reactjs'
import tw from 'tailwind-styled-components'
import Man from '../../assets/svg/man.svg?react'
import Woman from '../../assets/svg/woman.svg?react'
import ReactECharts from 'echarts-for-react'
import KpiGender from '../KpiGender'

interface PostDocDrillDrawerContentProps {
  opened: boolean
  onOpenedChange: (opened: boolean) => void
  data: any[]
  drillDownFieldValue?: string
  drillDownFieldName?: string
  dimensionField: string
  yearFieldName: string
  filters: {
    school?: string
    degree?: string
    major?: string
  }
}

export const CloseButtonContainer = tw.div`
  close-button-container
  w-fit
  px-4
  h-8
  relative
  bg-gradient-to-b
  from-gray-900
  to-neutral-700
  rounded-tr-lg
  flex
  items-center
  space-x-2
  cursor-pointer
`

const salaryRangeBreaks = [
  { title: 'Below $25,000', min: 0, max: 25000 },
  { title: '$25,000 to $35,000', min: 25000, max: 35000 },
  { title: '$35,000 to $45,000', min: 35000, max: 45000 },
  { title: '$45,000 to $55,000', min: 45000, max: 55000 },
  { title: '$55,000 to $65,000', min: 55000, max: 65000 },
  { title: 'Above $65,000', min: 65000, max: Number.MAX_SAFE_INTEGER },
]

const getSalaryMetrics = (data: any[]) => {
  const total = data.length
  return salaryRangeBreaks.map(r => {
    const count = data.filter(d => d["Base Salary"] && (d["Base Salary"] >= r.min && d["Base Salary"] < r.max)).length
    const percentage = total > 0 ? (count / total) * 100 : 0
    return { percentage, count }
  })
}

const getEchartsDatasetRows = (
  data: any[],
  categories: string[],
  fieldName: string,
  yearFieldName: string,
): (string | number)[][] => {
  const mapped = data.map(i => ({ ...i, year: i[yearFieldName] }))
  const years = Array.from(new Set(mapped.map(d => d.year))).sort()

  const counts: Record<string, Record<string, number>> = {}
  for (const item of mapped) {
    const year = item.year as string
    const category = String(item[fieldName] ?? '')
    if (!counts[year]) counts[year] = {}
    counts[year][category] = (counts[year][category] || 0) + 1
  }

  return years.map(year => [
    year,
    ...categories.map(cat => counts[year]?.[cat] || 0)
  ])
}

const getSeriesNames = (data: any[], field: string) => {
  const mapping: any = {}
  data.forEach(item => mapping[item[field]] = true)
  return Object.keys(mapping).sort()
}

const PostDocDrillDrawerContent: FC<PostDocDrillDrawerContentProps> = (props) => {
  const {
    drillDownFieldValue,
    dimensionField,
    yearFieldName,
    drillDownFieldName,
    onOpenedChange,
    filters
  } = props

  const [opened, setOpened] = useState<boolean>(props.opened)
  const [data, setData] = useState<any[]>(props.data)
  const [filteredSource, setFilteredSource] = useState<any[]>([])
  const [totalStudents, setTotalStudents] = useState<number>()

  const handleOpenedChange = ({ target }: any) => {
    setOpened(target.checked)
    if (onOpenedChange) onOpenedChange(target.checked)
  }

  const handleCloseButtonClick = () => {
    setOpened(false)
    if (onOpenedChange) onOpenedChange(false)
  }

  useEffect(() => {
    setOpened(props.opened)
  }, [props.opened])

  useEffect(() => {
    setData(props.data)
  }, [props.data])

  const salaryRangeChartOptions = useMemo(() => {
    if (!data.length || !opened || !drillDownFieldValue || !drillDownFieldName) return {}

    const filtered = data.filter(item => {
      const { school, degree, major } = filters
      return (
        item[drillDownFieldName] === drillDownFieldValue &&
        item['School'] === school &&
        (!degree || item['Degree'] === degree) &&
        (!major || item['Major'] === major)
      )
    })

    const percentages = getSalaryMetrics(filtered).map(i => i.percentage)
    const counts = getSalaryMetrics(filtered).map(i => i.count)

    const option = {
      grid: {
        containLabel: true,
        top: 10,
        left: 10,
        right: 10,
        bottom: 0
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLabel: { interval: 0 },
        data: salaryRangeBreaks.map(i => i.title)
      },
      tooltip: {
        formatter: (params: any) => {
          const count = counts[params.dataIndex]
          return `Total: <b>${count}</b><br>Percentage: <b>${params.value.toFixed(2)}%</b>`
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: true,
          lineStyle: {
            opacity: .2
          }
        },
        axisLabel: {
          formatter: (v: string) => `${v}%`,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            opacity: .2
          }
        }
      },
      barCategoryGap: '10px',
      series: [
        {
          name: 'Base Salary',
          type: 'bar',
          data: percentages,
          itemStyle: {
            borderRadius: 4,
            color: '#7FCCCC'
          }
        }
      ]
    }

    return { ...option }
  }, [
    data,
    opened,
    filters,
    drillDownFieldName,
    drillDownFieldValue
  ])

  const timeTrendChartOptions = useMemo(() => {
    if (!data.length || !dimensionField || !opened || !drillDownFieldValue || !drillDownFieldName) return {}

    const filtered = data.filter(item => {
      const { school, degree, major } = filters
      return (
        item[drillDownFieldName] === drillDownFieldValue &&
        item['School'] === school &&
        (!degree || item['Degree'] === degree) &&
        (!major || item['Major'] === major)
      )
    })

    const seriesNames = getSeriesNames(filtered, dimensionField)
    const rows = getEchartsDatasetRows(filtered, seriesNames, dimensionField, yearFieldName)

    setTotalStudents(filtered.length)
    setFilteredSource(filtered)

    const option = {
      grid: {
        containLabel: true,
        top: 10,
        left: 10,
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
            'year',
            ...seriesNames
          ],
          ...rows
        ]
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
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
      barCategoryGap: '10px',
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
  }, [
    data,
    dimensionField,
    yearFieldName,
    opened,
    drillDownFieldValue,
    drillDownFieldName,
    filters
  ])

  const {
    malePercentage,
    femalePercentage
  } = useMemo(() => {
    const total = filteredSource.length
    const male = filteredSource.filter(item => item['Sex Desc'] === 'Male').length
    const female = filteredSource.filter(item => item['Sex Desc'] === 'Female').length
    const malePercentage = (!isNaN(male / total) ? (male / total) : 0) * 100
    const femalePercentage = (!isNaN(female / total) ? (female / total) : 0) * 100

    return { malePercentage, femalePercentage }
  }, [filteredSource])

  return (
    <>
      <div className="drawer drawer-end z-40">
        <input id="drill-drawer-content"
               type="checkbox"
               className="drawer-toggle"
               checked={opened}
               onChange={handleOpenedChange} />
        <div className="drawer-side">
          <label htmlFor="drill-drawer-content"
                 aria-label="close sidebar"
                 className="drawer-overlay" />
          <div className="drawer-content-container bg-transparent h-screen w-[900px] relative">
            <div className="close-button-container">
              <CloseButtonContainer onClick={handleCloseButtonClick}>
                <CloseCircle size="16" color="white"/>
                <p className="text-white text-sm">
                  Close
                </p>
              </CloseButtonContainer>
            </div>

            <div className="header-container flex items-center bg-[#3C3D3D] p-4 justify-between space-x-12 h-20">
              <div className="right-text flex flex-col">
                <p className="text-white text-[10px] leading-tight">
                  RICE Graduation areas
                </p>
                <p className="text-white whitespace-nowrap cursor-pointer"
                   title={drillDownFieldValue}>
                  { (drillDownFieldValue?.length ?? 0) > 20 ? `${drillDownFieldValue?.substring(0, 20)}...` : drillDownFieldValue }
                </p>
              </div>
              <div className="right-text">
                <p className="text-white text-xs leading-tight text-[10px]">
                  Rice will build on its leading position as a premier undergraduate program by enhancing its
                  personalized approach to education through strengthening and integrating academic and co-curricular
                  activities. We will attract an academically excellent, diverse, and deeply engaged student body and
                  develop an educated citizenry that will advance the public good through insights, service, innovation,
                  and discourse to solve the challenges of the future and lead society for the betterment of the world.
                </p>
              </div>
            </div>

            <div className="kpi-info-container flex items-center justify-between bg-[#111928] px-12 h-40">
              <div className="left-content">
                <p className="text-white">
                  Total Students
                </p>
                <p className="text-white text-3xl">
                  { totalStudents }
                </p>
                <p className="text-white text-[10px]">
                  2022 - Now
                </p>
              </div>
              <div className="right-content">
                <div className="kpi-gender-container flex items-center justify-between">
                  <KpiGender Icon={Woman}
                             label="Female"
                             value={`${femalePercentage.toFixed(1)}%`} />
                  <KpiGender Icon={Man}
                             label="Male"
                             value={`${malePercentage.toFixed(1)}%`} />
                </div>
              </div>
            </div>

            <div className="chart-container bg-[#111928] w-full h-full relative max-h-[calc(100%-17rem)] px-12 pb-12 overflow-y-auto flex flex-col space-y-4">
              <div className="component-container p-4 border border-[#FFFFFF20] rounded-2xl flex flex-col space-y-4">
                <div className="top-header-chart-container w-full relative h-6 flex flex-col justify-between">
                  <div className="top-content flex justify-between">
                    <p className="text-white">
                      Salary Range
                    </p>
                    <More size="16" color="white"/>
                  </div>
                </div>

                {
                  opened && (
                    <>
                      <ReactECharts option={salaryRangeChartOptions}
                                    style={{ height: 300 }}
                                    opts={{ devicePixelRatio: 2 }} />
                    </>
                  )
                }
              </div>

              <div className="component-container p-4 border border-[#FFFFFF20] rounded-2xl flex flex-col space-y-4">
                <div className="top-header-chart-container w-full relative h-6 flex flex-col justify-between">
                  <div className="top-content flex justify-between">
                    <p className="text-white">
                      Time Trend Analysis
                    </p>
                    <More size="16" color="white"/>
                  </div>
                </div>

                {
                  opened && (
                    <>
                      <ReactECharts option={timeTrendChartOptions}
                                    style={{ height: 400 }}
                                    opts={{ devicePixelRatio: 2 }} />
                    </>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PostDocDrillDrawerContent

