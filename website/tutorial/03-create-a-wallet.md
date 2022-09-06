---
title: 3. Create a wallet 
sidebar_position: 2
---

# Create a wallet 
this section will learn 'how to create wallet with @ckb-lumos'

对于一个钱包来说，最重要以及最常用的功能是查看自己的账户(address)以及余额，Nervos中并不限定密码学原语，甚至可以用eth的钱包来创建nervos address，但是为了简单，本文档创建一个椭圆曲线加密算法创建一个账户

这里有一份工具可以帮助你生成一个address: https://ckb.tools/generator 或者如果你想详细了解，具体步骤会在下方列出

#### step1: Generate private key
`elliptic` 是一个帮助我们使用椭圆曲线加密算法的库，你可以运行`npm install elliptic` 来下载

``` ts
import { ec } from "elliptic";

const privateKey = new ec("secp256k1").genKeyPair().getPrivate();

console.log(`0x${privateKey.toString("hex")}`);
```

恭喜你，我们现在拥有了一个private key, 如果你运行这段代码可以看到这是一段类似于`0xbdaf10df03d9c4c356fc8378b9e01978d5bd3ac8acf68195d462d7697a5b518a`这样的字符串, 为了更好的标明这段字符串是一个十六进制的，我们手动加上了0x的前缀，

#### Step2: generate address by private key

当你拥有一个private key后，你可以使用@ckb-lumos来生成一个ckb地址

ckb拥有一个测试链arggon和一个正式环境链Lina以及你也可以自己去运行一个本机的 dev net, lumos可以帮助用户在不同的链上进行开发，在本示例中将会使用测试环境，使用`config.predefined.AGGRON4`就可以获取一些测试环境上需要的数据

``` ts
import { hd, config, helpers } from '@ckb-lumos/lumos';

const privateKey = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // your private key

const pubKey = hd.key.privateToPublic(privateKey);
const args = hd.key.publicKeyToBlake160(pubKey);
const template = config.predefined.AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
const lockScript = {
  code_hash: template.CODE_HASH,
  hash_type: template.HASH_TYPE,
  args: args,
};
const address = helpers.encodeToAddress(lockScript, { config: config.predefined.LINA });
console.log(address)
```
或许你会疑问这些东西都是啥，但是先别着急，后文中会慢慢解释，首先运行一下这段代码，你应该能看到一个以ckt为开头的输出,恭喜你, 你已经成功的创建出了一个ckb的地址，后文中我们会使用这个地址做许多事
