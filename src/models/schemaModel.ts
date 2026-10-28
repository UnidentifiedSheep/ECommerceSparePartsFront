export type SchemaValueType =
  | 'String'
  | 'Boolean'
  | 'Integer'
  | 'Number'
  | 'Enum'
  | 'Array'
  | 'Object'

export type SchemaInputControl =
  | 'UploadFile'
  | 'TextField'
  | 'DatePicker'
  | 'EntitySelector'
  | 'EnumSelector'
  | 'NamedObjectSelector'

export interface SchemaDependency {
  entityName: string
  fieldName?: string | null
}

export interface SchemaField {
  name: string
  type: SchemaValueType
  labelKey?: string | null
  descriptionKey?: string | null
  label?: string | null
  description?: string | null
  required: boolean
  control?: SchemaInputControl | null
  accepts: string[]
  dependency?: SchemaDependency | null
  nestedSchema?: ObjectSchema | null
}

export interface CsvColumnSchema {
  propertyName: string
  names: string[]
  type: SchemaValueType
  required: boolean
  labelKey?: string | null
  descriptionKey?: string | null
  label?: string | null
  description?: string | null
}

export interface CsvSchema {
  columns: CsvColumnSchema[]
}

export interface ObjectSchema {
  version: number
  fields: SchemaField[]
  csvSchema?: CsvSchema | null
}

export interface SchemaUiField extends SchemaField {
  dependsOnEntity?: string
  dependsOnField?: string
}

export function toSchemaUiFields(fields: SchemaField[]): SchemaUiField[] {
  return fields.map((field) => ({
    ...field,
    dependsOnEntity: field.dependency?.entityName,
    dependsOnField: field.dependency?.fieldName ?? undefined,
  }))
}

const valueTypes: SchemaValueType[] = ['String', 'Boolean', 'Integer', 'Number', 'Enum', 'Array', 'Object']
const inputControls: SchemaInputControl[] = ['UploadFile', 'TextField', 'DatePicker', 'EntitySelector', 'EnumSelector', 'NamedObjectSelector']

function normalizeEnumValue<T extends string>(value: unknown, values: T[]): T {
  const normalized = typeof value === 'number'
    ? values[value]
    : values.find((item) => item.toLowerCase() === String(value).replace(/_/g, '').toLowerCase())
  if (!normalized) throw new Error(`Unknown schema enum value: ${String(value)}`)
  return normalized
}

/** REST responses may contain numeric enums when emitted by the gateway. */
export function normalizeObjectSchema(schema: ObjectSchema): ObjectSchema {
  return {
    ...schema,
    fields: schema.fields.map((field) => ({
      ...field,
      type: normalizeEnumValue(field.type, valueTypes),
      control: field.control == null ? null : normalizeEnumValue(field.control, inputControls),
      nestedSchema: field.nestedSchema ? normalizeObjectSchema(field.nestedSchema) : null,
    })),
    csvSchema: schema.csvSchema ? {
      ...schema.csvSchema,
      columns: schema.csvSchema.columns.map((column) => ({
        ...column,
        type: normalizeEnumValue(column.type, valueTypes),
      })),
    } : null,
  }
}

export function isStructuredSchemaField(field: SchemaField): boolean {
  // Backend scalar wrappers (for example TimeSpan) may be described as Object
  // while explicitly using a text input and having no nested object schema.
  if (field.type === 'Object' && field.control === 'TextField' && !field.nestedSchema) return false
  return field.type === 'Array' || field.type === 'Object'
}

export function formatStructuredSchemaValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

export function parseStructuredSchemaValue(field: SchemaField, value: unknown): unknown {
  if (!isStructuredSchemaField(field)) return value
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value
  if (field.type === 'Array' && !Array.isArray(parsed)) throw new Error(`Expected array for ${field.name}`)
  if (field.type === 'Object' && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error(`Expected object for ${field.name}`)
  }
  return parsed
}
