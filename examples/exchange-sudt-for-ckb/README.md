# Exchange SUDT for CKB
CKB cells capacity is not only represent the size of cell, but also a currency on Nervos.

Simple User Defined Tokens(Simple UDT or SUDT) provides a way for dapp developers to issue custom tokens on Nervos CKB.
In this example, there are two roles, the SUDT issuer and the CKB holder. The SUDT issuer issues some SUDT. and the CKB holder can provide CKB to issuer and get SUDT from issuer.
## Example Usage
First, you need two CKB test network private keys. you can get them [here](https://ckb.tools/generator).


And you should get some CKB into these two addresses.
Go to https://faucet.nervos.org/.
enter your address(in generator page, "Nervos CKB Address" input in "Default Lock (Secp256k1-Blake160) - Testnet" section) and click "Claim". Do the same operation on the other address.

Then, run this example.
```bash
yarn start
```
Visit http://localhost:1234.

Then put two addresses to "Issuer private key" and "holder private key"

Click "Issue SUDT" button, then you can see the SUDT issue transaction link in page.

After issue SUDT transaction confirmed in blockchain, click "Exchange SUDT for CKB" button.
you can see the exchange transaction link in page. Following it you can get the transaction info in CKB Testnet Explorer.

You can get more info in [0025-simple-udt RFC](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/0025-simple-udt.md)