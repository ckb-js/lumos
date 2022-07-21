// eslint-disable-next-line import/no-named-as-default
import ErrorCode from "./ErrorCode"

export class PageSizeTooLargeException extends RangeError {
  code = ErrorCode.ParameterInvalid

  constructor(pageSize: bigint | string, maxSize: number) {
    super(`Expect page size to be at most ${maxSize}, but ${pageSize} received`)
  }
}

export class PageSizeTooSmallException extends RangeError {
  code = ErrorCode.ParameterInvalid

  constructor(pageSize: bigint | string, minSize: number) {
    super(`Expect page size to be at least ${minSize}, but ${pageSize} received`)
  }
}

export class OutputsValidatorTypeException extends TypeError {
  code = ErrorCode.ParameterInvalid

  constructor() {
    super(`Expect outputs validator to be 'default' or 'passthrough'`)
  }
}

export class BigintOrHexStringTypeException extends TypeError {
  code = ErrorCode.ParameterInvalid

  constructor(value: any) {
    super(`Expect number to be bigint or hex string, but ${value} received`)
  }
}

export class StringHashTypeException extends TypeError {
  code = ErrorCode.ParameterInvalid

  constructor(hash: any) {
    super(`Expect hash to be string, but ${hash} received`)
  }
}

export default {
  PageSizeTooLargeException,
  PageSizeTooSmallException,
  OutputsValidatorTypeException,
  BigintOrHexStringTypeException,
  StringHashTypeException,
}
