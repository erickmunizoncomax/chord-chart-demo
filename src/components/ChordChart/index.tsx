import { type FC, useState } from 'react'
import { ResponsiveChordCanvas } from '@nivo/chord'
import tw from 'tailwind-styled-components'

interface ChordChartProps {
  data: number[][]
  keys: string[]
  despisedKeys: string[]
  onArcMouseEnter?: (arc: any) => void
  onArcMouseLeave?: (arc: any) => void
  inactiveRibbonOpacity?: number
}

const legendItems = [
  { label: 'RICE Majors', color: '#0090FF' },
  { label: 'Industry Area', color: '#E74D94' },
]

const InnerCircleContainer = tw.div`
  inner-circle-container
  absolute
  rounded-full
  h-72
  w-72
  p-12
  left-1/2
  top-1/2
  backdrop-blur-[8px]
  -translate-y-1/2
  -translate-x-1/2
  flex
  items-center
  justify-center
  bg-[#50555aaa]
  text-[#9BA0AB]
  font-light
`

const CustomTooltipContainer = tw.div`
  custom-tooltip-container
  flex
  items-center
  space-x-2
  bg-white
  border
  border-black/20
  p-1
  rounded-md
`

const ChordChart: FC<ChordChartProps> = (props) => {
  const {
    data,
    keys,
    despisedKeys,
    inactiveRibbonOpacity = 0.1,
    onArcMouseLeave,
    onArcMouseEnter
  } = props
  const [showInnerCircle, setShowInnerCircle] = useState<boolean>(true)

  const handleArcMouseEnter = (arc: any) => {
    if (onArcMouseEnter) onArcMouseEnter(arc)
    setShowInnerCircle(false)
  }

  const handleArcMouseLeave = (arc: any) => {
    if (onArcMouseLeave) onArcMouseLeave(arc)
    setShowInnerCircle(true)
  }

  return (
    <>
      <div className="chord-chart-container w-full h-full relative">
        <div className="legend-container flex flex-col absolute top-20 space-y-1.5">
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
        <ResponsiveChordCanvas data={data}
                               keys={keys}
                               labelRotation={-90}
                               labelTextColor="white"
                               labelOffset={8}
                               theme={{ labels: { text: { fontSize: 12 }}}}
                               inactiveRibbonOpacity={inactiveRibbonOpacity}
                               colors={(arc) => {
                                 if (despisedKeys.includes(arc.id)) return '#E74D94'
                                 return '#0066FF'
                               }}
                               innerRadiusRatio={0.92}
                               ribbonOpacity={0}
                               arcTooltip={({ arc }) => {
                                 const index = keys.indexOf(arc.id)
                                 const count = data[index].reduce((prev, cur) => prev + cur, 0)

                                 return (
                                   <CustomTooltipContainer>
                                     <div className="square-container h-4 w-4" style={{ background: arc.color }}/>
                                     <p className="whitespace-nowrap">{ arc.id }: <strong>{ count }</strong></p>
                                   </CustomTooltipContainer>
                                 )
                               }}
                               onArcMouseEnter={(args) => setTimeout(() => handleArcMouseEnter(args), 0)}
                               onArcMouseLeave={(args) => setTimeout(() => handleArcMouseLeave(args), 0)}
                               margin={{ top: 140, bottom: 140 }}
                               padAngle={0.04} />

        <InnerCircleContainer className={`${showInnerCircle ? 'opacity-100' : 'opacity-20'}`}>
          {
            showInnerCircle && (
              <p className="text-center leading-none text-sm">
                Move your <br/>
                mouse to check <br/>
                details
              </p>
            )
          }
        </InnerCircleContainer>
      </div>
    </>
  )
}

export default ChordChart