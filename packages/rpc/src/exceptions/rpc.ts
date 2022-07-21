import ErrorCode from './ErrorCode'

export class IdNotMatchException extends Error {
  code = ErrorCode.IdNotMatch

  constructor(requestId: number, responseId: number) {
    super(`Expect json rpc id to be ${requestId}, but ${responseId} received`)
  }
}

export class ResponseException extends Error {
  code = ErrorCode.ResponseMessage
}

export default {
  IdNotMatchException,
  ResponseException,
}
