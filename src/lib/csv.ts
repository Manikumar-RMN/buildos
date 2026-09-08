export type CsvRow = Record<string, string>

export type CsvParseResult = {
  headers: string[]
  rows: CsvRow[]
  error?: string
}

function parseCsvRecord(text: string): string[][] {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      record.push(field.trim())
      field = ''
    } else if (char === '\n') {
      record.push(field.trim())
      records.push(record)
      record = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (quoted) throw new Error('The CSV contains an unclosed quoted field.')

  if (field.length > 0 || record.length > 0) {
    record.push(field.trim())
    records.push(record)
  }

  return records.filter(row => row.some(value => value.length > 0))
}

export function parseCsv(text: string): CsvParseResult {
  try {
    const records = parseCsvRecord(text.replace(/^\uFEFF/, ''))
    if (records.length < 2) return { headers: [], rows: [], error: 'The file needs a header row and at least one data row.' }

    const headers = records[0].map(header => header.trim().toLowerCase())
    if (headers.some(header => !header)) return { headers: [], rows: [], error: 'The header row contains an empty column name.' }

    const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index)
    if (duplicates.length) return { headers: [], rows: [], error: `Duplicate column name: ${duplicates[0]}` }

    const rows = records.slice(1).map(values =>
      Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()]))
    )

    return { headers, rows }
  } catch (error) {
    return { headers: [], rows: [], error: error instanceof Error ? error.message : 'Could not parse the CSV file.' }
  }
}
