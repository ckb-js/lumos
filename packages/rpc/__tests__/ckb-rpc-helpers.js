const http = require('http')
const https = require('https')

const NODE_URL = 'http://localhost:8114'
const {CKBRPC} = require('../lib')

const rpc = new CKBRPC(NODE_URL)
describe('ckb-rpc settings and helpers', () => {
  it('set node url', () => {
    const node = {
      url: 'http://localhost:8114',
    }
    rpc.setNode(node)
    expect(rpc.node).toEqual(node)
  })

  it('set http agent', () => {
    const httpAgent = new http.Agent()
    const node = {
      httpAgent,
    }
    rpc.setNode(node)
    expect(rpc.node.httpAgent).toBeDefined()
  })

  it('set https agent', () => {
    const httpsAgent = new https.Agent()
    const node = {
      httpsAgent,
    }
    rpc.setNode(node)
    expect(rpc.node.httpsAgent).toBeDefined()
  })

  it('has 38 basic rpc', () => {
    expect(Object.values(rpc)).toHaveLength(38)
  })

  it('set node url to http://test.localhost:8114', () => {
    const url = 'http://test.localhost:8114'
    rpc.setNode({
      url,
    })
    expect(rpc.node.url).toBe(url)
  })
})
