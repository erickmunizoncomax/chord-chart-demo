import { type FC, type PropsWithChildren, useEffect, useRef } from 'react'
import tw from 'tailwind-styled-components'
import cuteRobot from '../../assets/img/cute-robot.png'
import { Send2 } from "iconsax-reactjs";

interface AskToAiFrameProps {
  opened: boolean
  onCloseClick: () => void
}

const FAQ_QUESTIONS = [
  'What are the best rated RICE Graduations for the Market?',
  'Got questions about Rice University? Just ask away!',
  'Curious about Rice University? Feel free to shoot your questions!',
  'Curious about Rice University? Feel free to shoot your questions!',
  'Curious about Rice University? Feel free to shoot your questions!',
]

const AskToAiFrameContainer = tw.div<{ $opened: boolean }>`
  ask-to-ai-frame-container
  pointer-events-all
  bg-gradient-to-br
  from-fuchsia-950/90
  to-cyan-950/90
  fixed
  inset-0
  top-14
  max-h-[calc(100%-3.5rem)]
  z-50
  overflow-hidden
  overscroll-none
  flex
  flex-col
  items-center
  space-y-8
  backdrop-blur-[4px]
  origin-top
  transform
  transition-all
  duration-300
  ease-out
  scale-100
  opacity-100
  p-8
  ${props => !props.$opened ? `
    opacity-0
    scale-90
    pointer-events-none
  ` : ''}
`

const FaqItem: FC<PropsWithChildren> = ({children}) => {

  return (
    <>
      <div className="faq-item-container bg-black/30 rounded-lg shadow-sm w-fit py-3 px-8 cursor-pointer">
        <p className="text-sm text-white">
          {children}
        </p>
      </div>
    </>
  )
}

const AskToAiFrame: FC<AskToAiFrameProps> = (props) => {
  const {opened, onCloseClick} = props

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current!
    const block = (e: Event) => e.preventDefault()

    el.addEventListener('wheel', block, {passive: false})
    el.addEventListener('touchmove', block, {passive: false})

    return () => {
      el.removeEventListener('wheel', block)
      el.removeEventListener('touchmove', block)
    }
  }, [])

  return (
    <>
      <AskToAiFrameContainer ref={ref}
                             $opened={opened}>
        <div className="close-button-container absolute right-4 top-4">
          <p className="text-white cursor-pointer text-sm"
             onClick={onCloseClick}>
            Close
          </p>
        </div>

        <div className="img-container w-24 h-24 flex items-center justify-center">
          <img src={cuteRobot} alt="Cute Robot" className="absolute h-40"/>
        </div>

        <div className="input-container w-full relative flex justify-center">
          <div className="custom-ask-input-container relative w-2/3 max-w-[800px]">
            <input type="text"
                   placeholder="Feel free to ask me anything directly!"
                   className="px-4 h-[60px] w-full rounded-full border-white border !outline-0 bg-white/20 placeholder:text-white text-white"/>
            <div className="icon-container absolute right-5 top-1/2 -translate-y-1/2">
              <Send2 size="20" color="white"/>
            </div>
          </div>
        </div>

        <div className="frequently-asked-questions-container flex flex-col space-y-6 items-center">
          <div className="title-container">
            <p className="text-white">
              Frequently Asked Questions
            </p>
          </div>

          <div className="items-container flex flex-col space-y-2 items-center">
            {
              FAQ_QUESTIONS.map((text, index) => (
                <FaqItem key={index}>{ text }</FaqItem>
              ))
            }
          </div>
        </div>
      </AskToAiFrameContainer>
    </>
  )
}

export default AskToAiFrame