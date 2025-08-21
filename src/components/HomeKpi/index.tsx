import type { FC, PropsWithChildren } from 'react'
import tw from 'tailwind-styled-components'

interface HomeKpiProps extends PropsWithChildren {
  theme?: 'dark' | 'light'
  title: string
  detail?: string
}

const BackgroundMaskContainer = tw.div<{ $theme: 'dark' | 'light' }>`
  background-mask-container
  absolute
  inset-0
  z-[-1]
  ${props => props.$theme === 'dark' ? 'bg-[#1F2A37] opacity-40' : 'bg-white opacity-20'}
`

const HomeKpi: FC<HomeKpiProps> = (props) => {
  const {
    detail,
    title,
    theme = 'dark',
    children} = props

  return (
    <>
      <div className="home-kpi-container w-full flex flex-col relative rounded-lg overflow-hidden py-4 px-6">
        <BackgroundMaskContainer $theme={theme} />
        <p className="text-white text-xs font-light">{ title }</p>
        <p className="text-white text-3xl font-semibold leading-none">{ children }</p>
        { detail && <p className="text-white text-[10px] font-light">{ detail }</p> }
      </div>
    </>
  )
}

export default HomeKpi