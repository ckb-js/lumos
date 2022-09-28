import { RPC } from '../src'

const main = async () => {
  const rpc = new RPC('http://localhost:8080', { timeout: 100 })
  const d1 = Date.now()
  console.log('before call', );
  await rpc.getBlockHash('0x1')
  const d2 = Date.now()
  console.log('time:', d2-d1);
}

main()