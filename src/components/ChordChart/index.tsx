import { type FC, useState } from 'react'
import { ResponsiveChordCanvas } from '@nivo/chord'
import tw from 'tailwind-styled-components'
import { colors, despisedColors } from '../../constants'

interface ChordChartProps {
  data: number[][]
  keys: string[]
  despisedKeys: string[]
  onArcMouseEnter?: (arc: any) => void
  onArcMouseLeave?: (arc: any) => void
  inactiveRibbonOpacity?: number
}

const InnerCircleContainer = tw.div`
  inner-circle-container
  absolute
  rounded-full
  bg-red-500
  h-52
  w-52
  p-12
  left-1/2
  top-1/2
  -translate-y-1/2
  -translate-x-1/2
  flex
  items-center
  justify-center
  bg-[#50555a]
  text-[#9CA1AB]
  font-light
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
      <div className="chord-chart-container w-full h-[640px] relative">
        <ResponsiveChordCanvas data={data}
                               keys={keys}
                               labelRotation={-90}
                               labelTextColor="white"
                               labelOffset={4}
                               theme={{ labels: { text: { fontSize: 9 }}}}
                               inactiveRibbonOpacity={inactiveRibbonOpacity}
                               colors={(arc) => {
                                 if (despisedKeys.includes(arc.id)) {
                                   const { length } = despisedColors
                                   const idx = Math.floor(Math.random() * (length - 1))
                                   return despisedColors[idx]
                                 }
                                 return colors[arc.index]
                               }}
                               innerRadiusRatio={0.92}
                               ribbonOpacity={0}
                               label={(l) => {
                                 if (l.id.length > 20) return `${l.id.substring(0, 19)}...`
                                 return l.id
                               }}
                               arcTooltip={({ arc }) => {
                                 const index = keys.indexOf(arc.id)
                                 const count = data[index].reduce((prev, cur) => prev + cur, 0)

                                 return (
                                   <div
                                     className="custom-tooltip-container flex items-center space-x-2 bg-white border border-black/20 p-1 rounded-md">
                                     <div className="square-container h-4 w-4" style={{ background: arc.color }}/>
                                     <p className="whitespace-nowrap">{ arc.id }: <strong>{ count }</strong></p>
                                   </div>
                                 )
                               }}
                               onArcMouseEnter={(args) => setTimeout(() => handleArcMouseEnter(args), 0)}
                               onArcMouseLeave={(args) => setTimeout(() => handleArcMouseLeave(args), 0)}
                               margin={{ top: 130, bottom: 130 }}
                               padAngle={0.04}/>

        <InnerCircleContainer className={`${showInnerCircle ? 'opacity-100' : 'opacity-20'}`}>
          {
            showInnerCircle && (
              <p className="text-center leading-none text-sm">
                Move your mouse to check details
              </p>
            )
          }
        </InnerCircleContainer>
      </div>
    </>
  )
}

export default ChordChart