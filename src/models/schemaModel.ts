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
