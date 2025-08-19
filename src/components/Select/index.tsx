import type { FC, PropsWithChildren } from 'react'
import tw from 'tailwind-styled-components'

interface SelectProps extends PropsWithChildren {
  name: string
  label?: string
  value?: string | number
  onChange?: (event: any) => void
}

interface SelectOptionProps extends PropsWithChildren {
  value: string | number
}

const CustomSelect = tw.select`
  w-full
  text-white
  outline-0
  font-medium
  text-sm
  [&>option]:text-black
  [&>option]:bg-white
`

export const Select: FC<SelectProps> = (props) => {
  const {
    label,
    value,
    name,
    children,
    onChange
  } = props

  return (
    <>
      <div className="custom-select-container bg-[#1F2A37] rounded-md px-4 justify-center flex flex-col h-[60px]">
        <label htmlFor={name} className="text-white !font-light text-xs">
          { label }
        </label>
        <CustomSelect name={name} value={value} onChange={onChange}>
          { children }
        </CustomSelect>
      </div>
    </>
  )
}

export const SelectOption: FC<SelectOptionProps> = (props) => {
  const { value, children} = props

  return (
    <>
      <option value={value}>
        { children }
      </option>
    </>
  )
}