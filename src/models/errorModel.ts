export interface ValidationError {
  propertyName: string
  errorMessage: string
  attemptedValue: string
}
export interface ErrorResponse {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  traceId: string
  validationErrors: ValidationError[]
}

export class ApiError extends Error {
  type: string
  status: number
  instance: string
  traceId: string
  validationErrors: ValidationError[]

  constructor(error: ErrorResponse) {
    super(error.detail || error.title)

    this.name = 'ApiError'
    this.type = error.type
    this.status = error.status
    this.instance = error.instance
    this.traceId = error.traceId
    this.validationErrors = error.validationErrors

    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
