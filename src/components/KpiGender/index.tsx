import type { FC } from 'react'

interface KpiGenderProps {
  Icon: any
  label: string
  value: string
}

const KpiGender: FC<KpiGenderProps> = (props) => {
  const { Icon, label, value } = props

  return (
    <>
      <div className="kpi-gender-container flex items-center p-4 space-x-2">
        <div className="icon-container">
          <Icon />
        </div>
        <div className="text-container">
          <p className="text-white text-[10px]">
            { label }
          </p>
          <p className="text-white font-medium text-lg">
            { value }
          </p>
        </div>
      </div>
    </>
  )
}

export default KpiGender