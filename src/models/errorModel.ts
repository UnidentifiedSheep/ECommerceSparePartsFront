export interface ValidationError {
  propertyName: string
  errorMessage: string
  attemptedValue: string
}
export interface ErrorResponse {
  type: string
  title: string
  status: number
  statusCode?: number
  detail: string
  instance: string
  traceId: string
  validationErrors: ValidationError[]
  errorRelatedData?: unknown
}

export class ApiError extends Error {
  type: string
  status: number
  instance: string
  traceId: string
  validationErrors: ValidationError[]
  errorRelatedData?: unknown

  constructor(error: ErrorResponse) {
    super(error.detail || error.title)

    this.name = 'ApiError'
    this.type = error.type
    this.status = error.status ?? error.statusCode ?? 0
    this.instance = error.instance
    this.traceId = error.traceId
    this.validationErrors = error.validationErrors ?? []
    this.errorRelatedData = error.errorRelatedData

    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
