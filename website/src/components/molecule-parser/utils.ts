import { BI } from "@ckb-lumos/bi"
import { UnpackType } from "@ckb-lumos/molecule/lib/utils"

export const deepStringifyNumber = (data: UnpackType): UnpackType => {
  if (
    Object.prototype.toString.call(data) === "[object Number]" ||
    Object.prototype.toString.call(data) === "[object String]"
  ) {
    return String(data)
  } else if (Object.prototype.toString.call(data) === "[object Object]") {
    const isBI = BI.isBI(data)

    if (isBI) {
      return data as BI
    }
    const keys = Object.keys(data as Record<string, unknown>)
    let result: Record<string, unknown> = {}
    keys.forEach((key) => {
      const value = (data as Record<string, UnpackType>)[key]
      // TODO: not sure if there is a performance issue
      result = Object.assign(result, {
        [key]: deepStringifyNumber(value),
      })
    })
    return result as UnpackType
  } else if (Object.prototype.toString.call(data) === "[object Array]") {
    // TODO: not sure if there is a performance issue
    return (data as UnpackType[]).map((item) => deepStringifyNumber(item))
  } else if (Object.prototype.toString.call(data) === "[object Undefined]") {
    return undefined
  } else {
    throw new Error(
      `UnpackType should not contain types other than string|number|object|array|undefined. recieved ${JSON.stringify(
        data
      )}, type is ${Object.prototype.toString.call(data)}`
    )
  }
}
