import { type FC, type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import tw from 'tailwind-styled-components'
import cuteRobot from '../../assets/img/cute-robot.png'
import { BackSquare, Clock } from "iconsax-reactjs";
import EmployersVsSpecificMajorsChart from "./components/EmployersVsSpecificMajorsChart";
import BaseSalaryVsMajorHeatMapChart from "./components/BaseSalaryVsMajorHeatMapChart";

interface AskToAiFrameProps {
  filteredSource: any[]
  opened: boolean
  onCloseClick: () => void
}

interface FaqItemProps {
  onClick: () => void
  selected: boolean
}

const FAQ_QUESTIONS = [
  'What is the ‘major’ preference for employers?',
  'What is the expected salary by degree or major?',
  'What are the job locations for a specific major or degree?',
  'Which industries can I get into with a particular major?',
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

const CustomRiceAiInput = tw.input`
  custom-rice-ai-input
  px-4
  h-[60px]
  w-full
  rounded-full
  border-white
  border
  !outline-0
  bg-white/20
  placeholder:text-white
  text-white
`

const FaqItem: FC<FaqItemProps & PropsWithChildren> = (props) => {
  const { onClick, selected, children } = props

  return (
    <>
      <div className={`faq-item-container rounded-lg shadow-sm py-3 px-8 cursor-pointer w-full ${selected ? 'bg-[#0066FF]' : ' bg-black'}`}
           onClick={onClick}>
        <p className="text-sm text-white text-center">
          { children }
        </p>
      </div>
    </>
  )
}

const AskToAiFrame: FC<AskToAiFrameProps> = (props) => {
  const { opened, filteredSource, onCloseClick } = props
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | never>()

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

  const faqQuestionsNode = useMemo(() => {
    return (
      <div className={`frequently-asked-questions-container flex flex-col space-y-6 ${selectedQuestionIndex === void 0 ? 'items-center' : ''}`}>
        <div className="title-container">
          <p className="text-white text-sm">
            Frequently Asked Questions
          </p>
        </div>

        <div className="items-container flex flex-col space-y-2 items-center relative">
          {
            FAQ_QUESTIONS.map((text, index) => (
              <FaqItem key={index}
                       onClick={() => setSelectedQuestionIndex(index)}
                       selected={selectedQuestionIndex === index}>
                { text }
              </FaqItem>
            ))
          }
        </div>
      </div>
    )
  }, [selectedQuestionIndex])

  const handleCloseClick = () => {
    onCloseClick()
    setTimeout(() => setSelectedQuestionIndex(void 0), 500)
  }

  return (
    <>
      <AskToAiFrameContainer ref={ref}
                             $opened={opened}>
        {
          selectedQuestionIndex === void 0 && (
            <>
              <div className="close-button-container absolute right-4 top-4">
                <p className="text-white cursor-pointer text-sm"
                   onClick={handleCloseClick}>
                  Close
                </p>
              </div>

              <div className="img-container w-24 h-24 flex items-center justify-center">
                <img src={cuteRobot} alt="Cute Robot" className="absolute h-40"/>
              </div>

              { faqQuestionsNode }

              <div className="input-container w-full relative flex justify-center">
                <div className="custom-ask-input-container relative w-2/3 max-w-[800px]">
                  <CustomRiceAiInput type="text" placeholder="RiceAI is coming Soon!" />
                  <div className="icon-container absolute right-5 top-1/2 -translate-y-1/2">
                    <Clock size="26" color="white"/>
                  </div>
                </div>
              </div>
            </>
          )
        }
        {
          selectedQuestionIndex !== void 0 && (
            <>
              <div className="showing-faq-selected-question-container grid grid-cols-6 h-full gap-4">
                <div className="faq-questions-container col-span-2 flex flex-col space-y-6">
                  <div className="back-button-container flex items-center space-x-2 cursor-pointer"
                       onClick={() => setSelectedQuestionIndex(void 0)}>
                    <BackSquare size="20" color="white"/>
                    <p className="text-sm text-white">
                      Back
                    </p>
                  </div>
                  { faqQuestionsNode }
                </div>
                <div className="faq-selected-questio-answer-container col-span-4 bg-gray-900/40 rounded-2xl p-4 h-full">
                  <div className="chart-container h-full w-full rounded-2xl bg-[#111928] p-4">
                    {
                      selectedQuestionIndex === 0 && (
                        <EmployersVsSpecificMajorsChart data={filteredSource}
                                                        originField="Major"
                                                        outcomeField="Employer" />
                      )
                    }
                    {
                      selectedQuestionIndex === 1 && (
                        <BaseSalaryVsMajorHeatMapChart data={filteredSource} />
                      )
                    }
                  </div>
                </div>
              </div>
            </>
          )
        }
      </AskToAiFrameContainer>
    </>
  )
}

export default AskToAiFrame