import { ArrowSwapHorizontal, Send2 } from 'iconsax-reactjs'
import ChordChart from '../../components/ChordChart'
import riceWhiteLogo from '../../assets/img/rice-university-white-logo.png'
import riceMainLogo from '../../assets/img/rice-university-main-logo.png'
import mainBackground from '../../assets/img/main-background.png'
import { useEffect, useMemo, useState } from 'react'
import { Select, SelectOption } from '../../components/Select'
import HomeKpi from '../../components/HomeKpi'
import { buildGenericChordData, formatCurrency } from '../../utils'
import PostDocDrillDrawerContent from '../../components/PostDocDrillDrawerContent'
import PostDocSankeyChart from '../../components/PostDocSankeyChart'
import AskToAiFrame from '../../components/AskToAiFrame'
import riceOwl from '../../assets/img/rice-owl.png'

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
  const [year, setYear] = useState<string>('2024')
  const [school, setSchool] = useState<string>('School of Natural Sciences')
  const [degree, setDegree] = useState<string>('')
  const [major, setMajor] = useState<string>('')
  const [sex, setSex] = useState<string>('')
  const [employerIndustry, setEmployerIndustry] = useState<string>('')

  const [drillDownDimensionField, _] = useState<string>()
  const [drillDownContentOpened, setSetDrillDownContentOpened] = useState<boolean>(false)
  const [askToAiFrameOpened, setAskToAiFrameOpened] = useState<boolean>(false)
  const [viewType, setViewType] = useState<ViewType>(ViewType.CHORD_CHART)

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
      const filtered = response.filter((item: any) => !!item['Detailed Industry'])
      setSource(filtered)
    }
    load()
  }, [])

  const bodyTopKpis = useMemo(() => {
    const total = filteredSource.length
    const totalSalary = filteredSource.reduce((acc, cur) => acc + (cur['Base Salary'] ?? 0), 0)
    const avgSalary = totalSalary / total
    const salaries = filteredSource.map((item: any) => item['Base Salary']).filter(Boolean)
    const min = formatCurrency(Math.min(...salaries))
    const max = formatCurrency(Math.max(...salaries))

    return (
      <>
        <div className="kpi-container w-52">
          <HomeKpi title="Total Students" detail="2022 - Now">
            { Number(filteredSource.length).toLocaleString('en-US') }
          </HomeKpi>
        </div>

        <div className="kpi-container w-52">
          <HomeKpi title="Salary Range" theme="light">
            ${ Number(avgSalary.toFixed(2)).toLocaleString('en-US') }

            <p className="text-white text-[10px] font-light mt-1">
              Avg for selected period
            </p>
            <div className="min-max-salary-container flex mt-2 justify-between items-center">
              <div className="left-content">
                <p className="text-base">
                  ${ min }
                </p>
                <p className="text-[10px] font-light">
                  Min Salary
                </p>
              </div>
              <div className="icon-container">
                <ArrowSwapHorizontal size="18" color="white"/>
              </div>
              <div className="right-content">
                <p className="text-base">
                  ${ max }
                </p>
                <p className="text-[10px] font-light">
                  Max Salary
                </p>
              </div>
            </div>
          </HomeKpi>
        </div>
      </>
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

  return (
    <>
      <div className="rice-university-container w-full h-full relative">
        <header className="header-container w-full bg-[#062FA8] h-14 flex items-center justify-between px-16 fixed top-0 z-20">
          <div className="left-content">
            <img src={riceMainLogo} alt="Rice University Logo" className="w-40"/>
          </div>

          <div className="right-content flex justify-end space-x-12">
            <div className="user-container flex items-center space-x-4">
              <p className="text-white text-sm">
                Jese Leos
              </p>
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={riceOwl} alt="Avatar"/>
                </div>
              </div>
            </div>
          </div>
        </header>

        <AskToAiFrame opened={askToAiFrameOpened}
                      filteredSource={filteredSource}
                      onCloseClick={() => setAskToAiFrameOpened(false)} />

        <div className="body-container px-16 py-6 mt-14 relative">
          <div className="background-mask-container absolute inset-0 z-[-1]">
            <img src={mainBackground} alt="Main Background" className="h-full"/>
            <div className="mask-container absolute inset-0 bg-black opacity-80 mix-blend-difference"></div>
          </div>

          <div className="page-banner-container relative">
            <div className="text-container flex flex-col space-y-4">
              <p className="text-5xl text-white font-extralight">
                WHAT WILL YOU DO WITH A&nbsp;
                <span className="text-blue-500 font-semibold">RICE</span>&nbsp;
                <span className="font-semibold">DEGREE?</span>
              </p>
            </div>

            <div className="filters-container h-28 flex items-center justify-between">
              <div className="custom-ask-input-container relative min-w-96 w-2/5">
                <input type="text"
                       placeholder="RiceAI & FAQ"
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

          <div className="view-type-selector-container flex flex-col space-y-2 absolute z-10">
            <div className="title-container">
              <p className="text-xs text-white">
                Main Chart View
              </p>
            </div>
            <div className="tips-container flex items-center space-x-2">
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
          </div>

          {
            viewType === ViewType.CHORD_CHART && (
              <div className="page-content w-full h-[840px] flex items-center relative">
                <div className="body-top-kpis-container absolute right-0 top-0 flex flex-col space-y-4">
                  { bodyTopKpis}
                </div>

                <ChordChart data={data}
                            keys={keys}
                            despisedKeys={despisedKeys} />
              </div>
            )
          }
          {
            viewType === ViewType.SANKEY_CHART && (
              <div className="page-content w-full flex flex-col items-end space-y-4">
                <div className="flex items-center space-x-4">
                  { bodyTopKpis }
                </div>

                <div className="chart-container h-[740px] w-full">
                  <PostDocSankeyChart data={filteredSource} />
                </div>
              </div>
            )
          }
        </div>

        <div className="footer-container h-32 w-full bg-[#1f2a37] flex justify-between items-center px-16">
          <div className="left-content">
            <img src={riceWhiteLogo} alt="Rice University Logo" className="w-48"/>
          </div>
          <div className="right-content flex flex-col space-y-2">
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
              <p className="text-white font-extralight text-[10px] text-right">
                6100 Main St., Houston, TX 77005-1827| Mailing Address: P.O. Box 1892, Houston, TX 77251-1892 |
                713-348-0000
              </p>
            </div>
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