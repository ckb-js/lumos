import axios from 'axios'
import { IdNotMatchException, ResponseException } from './exceptions'
import { CKBComponents } from './types/api'

class Method {
  #name: string

  get name() {
    return this.#name
  }

  #options: CKBComponents.Method = {
    name: '',
    method: '',
    paramsFormatters: [],
    resultFormatters: undefined,
  }

  #node: CKBComponents.Node

  constructor(node: CKBComponents.Node, options: CKBComponents.Method) {
    this.#node = node
    this.#options = options
    this.#name = options.name
    Object.defineProperty(this.call, 'name', { value: options.name, configurable: false, writable: false })
  }

  public call = (...params: (string | number | object)[]) => {
    const payload = this.getPayload(...params)
    return axios({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: payload,
      url: this.#node.url,
      httpAgent: this.#node.httpAgent,
      httpsAgent: this.#node.httpsAgent,
    }).then(res => {
      if (res.data.id !== payload.id) {
        throw new IdNotMatchException(payload.id, res.data.id)
      }
      if (res.data.error) {
        throw new ResponseException(JSON.stringify(res.data.error))
      }
      return this.#options.resultFormatters?.(res.data.result) ?? res.data.result
    })
  }

  public getPayload = (...params: (string | number | object)[]) => {
    const data = params.map((p, i) => (this.#options.paramsFormatters[i] && this.#options.paramsFormatters[i](p)) || p)
    const id = Math.round(Math.random() * 10000)
    const payload = {
      id,
      method: this.#options.method,
      params: data,
      jsonrpc: '2.0',
    }
    return payload
  }
}

export default Method
