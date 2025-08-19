import { HamburgerMenu, Messages3, Notification, Send2 } from 'iconsax-reactjs'
import ChordChart from '../../components/ChordChart'
import riceWhiteLogo from '../../assets/img/rice-university-white-logo.png'
import riceBlueLogo from '../../assets/img/rice-university-blue-logo.png'
import mainBackground from '../../assets/img/main-background.png'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Select, SelectOption } from '../../components/Select'
import HomeKpi from '../../components/HomeKpi'
import spainFlag from '../../assets/img/spains-flag.png'
import { buildGenericChordData } from '../../utils'
import PostDocDrillDrawerContent from '../../components/PostDocDrillDrawerContent'
import PostDocSankeyChart from '../../components/PostDocSankeyChart'
import AskToAiFrame from '../../components/AskToAiFrame'
import GenericBarStackChart, { type BarStackChartRef } from "../../components/GenericBarStackChart"

const ViewType = {
  CHORD_CHART: 'Chord',
  SANKEY_CHART: 'Sankey',
} as const

type ViewType = typeof ViewType[keyof typeof ViewType]

const PostDocPage = () => {
  const [source, setSource] = useState<any[]>([])
  const [filteredSource, setFilteredSource] = useState<any[]>([])
  const [data, setData] = useState<number[][]>([])
  const [keys, setKeys] = useState<string[]>([])
  const [despisedKeys, setDespisedKeys] = useState<string[]>([])

  // Filters
  const [year, setYear] = useState<string>('2023')
  const [school, setSchool] = useState<string>('School of Music')
  const [degree, setDegree] = useState<string>('')
  const [major, setMajor] = useState<string>('')
  const [sex, setSex] = useState<string>('')
  const [employerIndustry, setEmployerIndustry] = useState<string>('')

  const [drillDownDimensionField, setDrillDownDimensionField] = useState<string>()
  const [drillDownContentOpened, setSetDrillDownContentOpened] = useState<boolean>(false)
  const [askToAiFrameOpened, setAskToAiFrameOpened] = useState<boolean>(false)
  const [viewType, setViewType] = useState<ViewType>(ViewType.CHORD_CHART)

  const stackBarChartRef = useRef<BarStackChartRef>(null)

  const loadData = (datasource: any[], filters: any) => {
    const filteredData = datasource.filter((item) => {
      return (
        item['Graduation Year'] === filters.year &&
        item['School'] === filters.school &&
        (!filters.degree || item['Degree'] === filters.degree) &&
        (!filters.major || item['Major'] === filters.major) &&
        (!filters.sex || item['Sex Desc'] === filters.sex) &&
        (!filters.employerIndustry || item['Employer Industry'] === filters.employerIndustry)
      )
    })

    const { data, keys, despisedKeys: dk } = buildGenericChordData(filteredData, 'Major', 'Detailed Industry')

    setFilteredSource(filteredData)
    setData(data)
    setKeys(keys)
    setDespisedKeys(dk)
  }

  const yearOptions = useMemo(() => {
    return [...new Set(source.map((item: any) => item['Graduation Year']))].sort() as string[]
  }, [source])

  const schoolOptions = useMemo(() => {
    return [...new Set(
      source
        .filter((item: any) => item["School"] && item['Graduation Year'] === year)
        .map((item: any) => item['School'])
    )].sort() as string[]
  }, [source, year])

  const degreeOptions = useMemo(() => {
    const values = [...new Set(
      source
        .filter((item: any) => (
          item["School"] &&
          item['Graduation Year'] === year &&
          item['Degree'] &&
          item['School'] === school
        ))
        .map((item: any) => item['Degree'])
    )].sort() as string[]

    values.unshift('')

    return values
  }, [source, year, school])

  const majorOptions = useMemo(() => {
    const values = [...new Set(
      source
        .filter((item: any) => (
          item["School"] &&
          item['Graduation Year'] === year &&
          item['Degree'] &&
          item['School'] === school &&
          item['Major'] &&
          (!degree || item['Degree'] === degree)
        ))
        .map((item: any) => item['Major'])
    )].sort() as string[]

    values.unshift('')

    return values
  }, [source, year, school, degree])

  const employerIndustryOptions = useMemo(() => {
    const values = [...new Set(
      source
        .filter((item: any) => (
          item["School"] &&
          item['Graduation Year'] === year &&
          item['Degree'] &&
          item['School'] === school &&
          item['Major'] &&
          item['Employer Industry'] &&
          (!degree || item['Degree'] === degree) &&
          (!major || item['Major'] && item['Major'] === major) &&
          (!sex || item['Sex Desc'] && item['Sex Desc'] === sex)
        ))
        .map((item: any) => item['Employer Industry'])
    )].sort() as string[]

    values.unshift('')

    return values
  }, [source, year, school, degree, major, sex])

  useMemo(() => {
    const load = async () => {
      const response = await fetch('/output-new.json').then(r => r.json())
      response.forEach((item: any) => !item['Detailed Industry'] ? item['Detailed Industry'] = 'Undetermined' : null)
      setSource(response)
    }
    load()
  }, [])

  const stackedBarChartNode = useMemo(() => {
    return (
      <GenericBarStackChart ref={stackBarChartRef}
                            data={filteredSource}
                            originField="Major"
                            destinationField="Detailed Industry"
                            onDrillDownClick={(l) => {
                             setDrillDownDimensionField(l)
                             setSetDrillDownContentOpened(true)
                           }}
      />
    )
  }, [filteredSource])

  const bodyTopKpis = useMemo(() => {
    // const total = source.length
    // const tracked = source.filter(item => item['Detailed Industry'].trim() !== 'Undetermined').length
    // const percentage = (!isNaN(tracked / total) ? (tracked / total) : 0) * 100

    return (
      <div className="top-content flex space-x-4 h-24 items-center">
        <div className="kpi-container w-46">
          <HomeKpi title="Total Students" detail="2022 - Now">
            { Number(filteredSource.length).toLocaleString('en-US') }
          </HomeKpi>
        </div>

        {/*<div className="kpi-container w-46">*/}
        {/*  <HomeKpi title="% of tracked students" detail="2022 - Now" theme="light">*/}
        {/*    { percentage.toFixed(1) }%*/}
        {/*  </HomeKpi>*/}
        {/*</div>*/}
      </div>
    )
  }, [filteredSource])

  useEffect(() => {
    loadData(source, { year, school, degree, major, sex, employerIndustry })
  }, [
    source,
    year,
    school,
    degree,
    major,
    sex,
    employerIndustry
  ])

  const handleChordChartArcMouseEnter = (arc: any) => {
    stackBarChartRef?.current?.highlightStack(arc.id)
  }

  const handleChordChartArcMouseLeave = (arc: any) => {
    stackBarChartRef?.current?.downPlayStack(arc.id)
  }

  return (
    <>
      <div className="rice-university-container w-full h-full relative">
        <header className="header-container w-full bg-[#062FA8] h-14 items-center grid grid-cols-3 px-16 fixed top-0 z-20">
          <div className="left-content flex items-center space-x-6">
            <p className="text-white text-sm">
              RICE HOME
            </p>
            <p className="text-white text-sm">
              Contact Us
            </p>
            <p className="text-white text-sm">
              RICE TV
            </p>
          </div>
          <div className="middle-content flex justify-center items-center">
            <img src={riceWhiteLogo} alt="Rice University Logo" className="w-42"/>
          </div>
          <div className="right-content flex justify-end space-x-12">
            <div className="translation-container flex items-center space-x-2">
              <p className="text-white text-sm">
                Translate
              </p>
              <img src={spainFlag} alt="Spain Flag" className="h-4"/>
            </div>

            <div className="icons-container flex space-x-4 items-center">
              <Messages3 size="24" color="white" variant="Bulk"/>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd"
                      d="M10.2 19.8C15.6124 19.8 20 15.4124 20 10C20 4.58762 15.6124 0.200012 10.2 0.200012C4.78761 0.200012 0.400024 4.58762 0.400024 10C0.400024 15.4124 4.78761 19.8 10.2 19.8ZM10.2 18.9833C15.1613 18.9833 19.1834 14.9614 19.1834 10C19.1834 5.03865 15.1613 1.01668 10.2 1.01668C5.23871 1.01668 1.21669 5.03865 1.21669 10C1.21669 14.9614 5.23871 18.9833 10.2 18.9833Z"
                      fill="white"/>
                <path
                  d="M10.2004 1.8338V18.1658L10.1995 18.1668C5.68925 18.1668 2.03265 14.511 2.03247 10.0008C2.03247 5.49047 5.68914 1.8338 10.1995 1.8338H10.2004Z"
                  fill="white"/>
              </svg>
              <Notification size="24" color="white" variant="Bulk"/>
            </div>

            <div className="user-container flex items-center space-x-4">
              <p className="text-white text-sm">
                Jese Leos
              </p>
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp" alt="Avatar"/>
                </div>
              </div>
            </div>
          </div>
        </header>

        <AskToAiFrame opened={askToAiFrameOpened} onCloseClick={() => setAskToAiFrameOpened(false)} />

        <div className="top-page-container h-20 bg-white flex items-center justify-between px-16 mt-14">
          <div className="left-content">
            <img src={riceBlueLogo} alt="Rice University Logo" className="w-56"/>
          </div>
          <div className="right-content flex items-center">
            <HamburgerMenu size="24" color="#4B586E" className="cursor-pointer"/>
            <div className="divider divider-horizontal "/>
            <p className="text-sm text-[#4B586E] cursor-pointer">Apps</p>
            <div className="divider divider-horizontal "/>
            <p className="text-sm text-[#4B586E] cursor-pointer">Your Favorites</p>
            <div className="divider divider-horizontal "/>
            <p className="text-sm text-[#4B586E] cursor-pointer">About</p>
          </div>
        </div>

        <div className="body-container px-16 py-12 relative">
          <div className="background-mask-container absolute inset-0 z-[-1]">
            <img src={mainBackground} alt="Main Background" className="h-full"/>
            <div className="mask-container absolute inset-0 bg-black opacity-80 mix-blend-difference"></div>
          </div>

          <div className="page-banner-container relative">
            {/*<div className="page-selector-container flex items-center space-x-2 absolute top-0 right-0">*/}
            {/*  <p className="text-white px-4 py-2 rounded-md text-sm cursor-pointer bg-[#1570EF]"*/}
            {/*     onClick={() => {}}>*/}
            {/*    Post-doc*/}
            {/*  </p>*/}
            {/*  <p className="text-white px-4 py-2 rounded-md text-sm cursor-pointer bg-[#1F2A37]"*/}
            {/*     onClick={() => navigate('/alumni')}>*/}
            {/*    Alumni*/}
            {/*  </p>*/}
            {/*</div>*/}

            <div className="text-container flex flex-col space-y-4">
              <p className="text-6xl tracking-widest text-white">
                WHAT WILL YOU DO WITH A <br/>
                <span className="text-blue-500 font-semibold">RICE DEGREE?</span>
              </p>
              <p className="text-white tracking-tight leading-5">
                The data visualized here represents alumni reported career fields matched with their corresponding RICE
                degrees. Data was collected by our College Connections team through over 8,000 interviews of RICE alumni
                with grad years spanning back to 1942. The visualization below represents a segment limited to graduates
                from 1942–2021.
              </p>
            </div>
            <div className="filters-container h-36 flex items-center justify-between">
              <div className="custom-ask-input-container relative min-w-96 w-2/5">
                <input type="text"
                       placeholder="Feel free to ask me anything directly!"
                       onClick={() => setAskToAiFrameOpened(true)}
                       className="px-4 bg-white h-[60px] w-full rounded-full !outline-0 bg-gradient-to-r from-[#446deb] to-[#6f2899] placeholder:text-white"/>
                <div className="icon-container absolute right-5 top-1/2 -translate-y-1/2">
                  <Send2 size="20" color="white"/>
                </div>
              </div>

              <div className="filters-select-container flex items-center space-x-4">
                <div className="select-container w-34">
                  <Select label="Graduation Year" name="year" value={year}
                          onChange={({target}) => setYear(target.value)}>
                    {
                      yearOptions.map((option, index) => (
                        <SelectOption key={index} value={option}>{option}</SelectOption>
                      ))
                    }
                  </Select>
                </div>

                <div className="select-container w-34">
                  <Select label="School" name="school" value={school}
                          onChange={({target}) => setSchool(target.value)}>
                    {
                      schoolOptions.map((option, index) => (
                        <SelectOption key={index} value={option}>{option}</SelectOption>
                      ))
                    }
                  </Select>
                </div>

                <div className="select-container w-34">
                  <Select label="Degree" name="degree" value={degree}
                          onChange={({target}) => setDegree(target.value)}>
                    {
                      degreeOptions.map((option, index) => (
                        <SelectOption key={index} value={option}>{option ? option : 'All'}</SelectOption>
                      ))
                    }
                  </Select>
                </div>

                <div className="select-container w-34">
                  <Select label="Major" name="major" value={major}
                          onChange={({target}) => setMajor(target.value)}>
                    {
                      majorOptions.map((option, index) => (
                        <SelectOption key={index} value={option}>{option ? option : 'All'}</SelectOption>
                      ))
                    }
                  </Select>
                </div>

                <div className="select-container w-34">
                  <Select label="Sex" name="sex" value={sex}
                          onChange={({target}) => setSex(target.value)}>
                    {
                      ['', 'Male', 'Female'].map((option, index) => (
                        <SelectOption key={index} value={option}>{option ? option : 'All'}</SelectOption>
                      ))
                    }
                  </Select>
                </div>

                <div className="select-container w-34">
                  <Select label="Employer Industry" name="employerIndustry" value={employerIndustry}
                          onChange={({target}) => setEmployerIndustry(target.value)}>
                    {
                      employerIndustryOptions.map((option, index) => (
                        <SelectOption key={index} value={option}>{option ? option : 'All'}</SelectOption>
                      ))
                    }
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="view-type-selector-container flex items-center space-x-2">
            {
              [ViewType.CHORD_CHART, ViewType.SANKEY_CHART].map((type) => (
                <p key={type}
                   className={`text-white px-4 py-1.5 rounded-full text-xs cursor-pointer ${viewType === type ? 'bg-[#1570EF]' : 'bg-[#1F2A37]'} `}
                   onClick={() => setViewType(type)}>
                { type }
                </p>
              ))
            }
          </div>

          {
            viewType === ViewType.CHORD_CHART && (
              <div className="page-content w-full h-[640px] grid grid-cols-2 mt-4">
                <div className="left-content">
                  <ChordChart data={data}
                              keys={keys}
                              despisedKeys={despisedKeys}
                              onArcMouseEnter={handleChordChartArcMouseEnter}
                              onArcMouseLeave={handleChordChartArcMouseLeave}/>
                </div>
                <div className="right-content relative">
                  { bodyTopKpis }

                  <div className="chart-container h-full max-h-[calc(100%-6rem)]">
                    { stackedBarChartNode }
                  </div>
                </div>
              </div>
            )
          }
          {
            viewType === ViewType.SANKEY_CHART && (
              <div className="page-content w-full mt-4 flex flex-col items-end space-y-4">
                { bodyTopKpis }

                <div className="chart-container h-[540px] w-full">
                  <PostDocSankeyChart data={filteredSource} />
                </div>
              </div>
            )
          }
        </div>

        <div className="footer-container h-32 w-full bg-[#1f2a37] flex justify-between items-center px-16">
          <div className="left-content flex flex-col space-y-2">
            <div className="top-text-container flex items-center space-x-4">
              <p className="text-white text-xs cursor-pointer">
                STUDENTS AND ALUMNI
              </p>
              <p className="text-white text-xs cursor-pointer">
                FACULTY AND STAFF
              </p>
              <p className="text-white text-xs cursor-pointer">
                PARENTS AND VISITORS
              </p>
              <p className="text-white text-xs cursor-pointer">
                RESOURCES AND HELP
              </p>
            </div>
            <div className="bottom-text-container">
              <p className="text-white font-extralight text-[10px]">
                6100 Main St., Houston, TX 77005-1827| Mailing Address: P.O. Box 1892, Houston, TX 77251-1892 |
                713-348-0000
              </p>
            </div>
          </div>
          <div className="right-content">
            <img src={riceWhiteLogo} alt="Rice University Logo" className="w-48"/>
          </div>
        </div>

        <PostDocDrillDrawerContent opened={drillDownContentOpened}
                                   onOpenedChange={(o) => setSetDrillDownContentOpened(o)}
                                   data={source}
                                   filters={{ school, degree, major }}
                                   dimensionField="Major"
                                   yearFieldName="Graduation Year"
                                   drillDownFieldName="Detailed Industry"
                                   drillDownFieldValue={drillDownDimensionField} />
      </div>
    </>
  )
}

export default PostDocPage