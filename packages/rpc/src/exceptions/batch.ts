import ErrorCode from './ErrorCode'
import { IdNotMatchException } from './rpc'

const ERROR_LABEL = 'Batch Request'

export class MethodInBatchNotFoundException extends Error {
  code = ErrorCode.MethodNotFound

  constructor(name: string) {
    super(`[${ERROR_LABEL}]: Method ${name} is not found`)
  }
}

export class PayloadInBatchException extends Error {
  code = ErrorCode.PayloadMessage

  index: number | undefined

  constructor(index: number, message: string) {
    super(`[${ERROR_LABEL} ${index}]: ${message}`)
    this.index = index
  }
}

export class IdNotMatchedInBatchException extends IdNotMatchException {
  index: number | undefined

  constructor(index: number, requestId: number, responseId: number) {
    super(requestId, responseId)
    this.message = `[${ERROR_LABEL} ${index}]: ${this.message}`
    this.index = index
  }
}

export default {
  MethodInBatchNotFoundException,
  PayloadInBatchException,
  IdNotMatchedInBatchException,
}
