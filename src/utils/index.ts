type AlumniItemRecord = {
  MAJOR_1: string
  OUTCOME: string
  CONTINUING_EDUCATION_LEVEL: string
}

export const buildGenericChordData = (data: AlumniItemRecord[], origin: string, destination: string): {
  keys: string[]
  data: number[][]
  despisedKeys: string[]
} => {
  const fieldSet = new Set<string>()
  const industrySet = new Set<string>()

  data.forEach((item) => {
    fieldSet.add(item[origin as keyof AlumniItemRecord])
    industrySet.add(item[destination as keyof AlumniItemRecord])
  })

  const fieldKeys = Array.from(fieldSet)
  const industryKeys = Array.from(industrySet).filter(i => !fieldSet.has(i))
  const keys = [...industryKeys, ...fieldKeys]

  const despisedKeys = [...industryKeys]

  const idx: Record<string, number> = {}
  keys.forEach((k, i) => {
    idx[k] = i
  })

  const N = keys.length
  const matrix: number[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => 0)
  )

  data.forEach((item) => {
    const i = idx[item[origin as keyof AlumniItemRecord]]
    const j = idx[item[destination as keyof AlumniItemRecord]]
    matrix[i][j] += 1
    matrix[j][i] += 1
  })

  return { keys, data: matrix, despisedKeys }
}

export const formatCurrency = (value: number) => {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 2
  })
}