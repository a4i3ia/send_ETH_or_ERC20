const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const testnet = true;
const pathTestnet = 'https://ropsten.infura.io';
const pathMainNet = 'https://mainnet.infura.io';
const httpProvider = testnet ? new Web3.providers.HttpProvider(pathTestnet) : new Web3.providers.HttpProvider(pathMainNet);
const web3 = new Web3(httpProvider);
const contractABI = require('human-standard-token-abi');

async function transferTokens(args) {
  var serializedTx;
  const publicSenderKey = web3.eth.accounts.privateKeyToAccount("0x" + args.senderPrivateKey).address;
  if (args.currencyType === 'ETH') {
    serializedTx =  await sendETH(args.senderPrivateKey, args.reciverKey, args.amount, args.gas);
  }else{
    serializedTx = await sendERC20(args.senderPrivateKey, args.receiverKey, args.erc20ContractAddress, args.amount, args.gas);
  }
  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
  .on('receipt', console.log);
}
async function sendETH(senderPrivateKey, receiverKey, amount, gas) {
  const publicSenderKey = web3.eth.accounts.privateKeyToAccount("0x" + senderPrivateKey).address;
  const privateKey = Buffer.from(senderPrivateKey, 'hex');
  const nonce = await web3.eth.getTransactionCount(publicSenderKey);
  const gasPrice = await web3.eth.getGasPrice();
  const rawTransaction = {
    "from": publicSenderKey,
    "to": receiverKey,
    "value": web3.utils.toHex(web3.utils.toWei(amount, "ether")),
    "gasLimit": web3.utils.toHex(gas),
    "gasPrice": web3.utils.toHex(gasPrice),
    "chainId": testnet ? 3 : 1,
    "nonce": web3.utils.toHex(nonce)
  };
  const tx = new Tx(rawTransaction);
  tx.sign(privateKey);
  const serializedTx = await tx.serialize();
  return serializedTx;
}
async function sendERC20(senderPrivateKey, receiverKey, erc20ContractAddress, amount, gas) {
  const contract = new web3.eth.Contract(contractABI, erc20ContractAddress);
  const decimals = await contract.methods.decimals().call();
  const publicSenderKey = web3.eth.accounts.privateKeyToAccount("0x" + senderPrivateKey).address;
  const privateKey = Buffer.from(senderPrivateKey, 'hex');
  const value = (amount * 10 ** decimals);
  const nonce = await web3.eth.getTransactionCount(publicSenderKey)
  const gasPrice = await web3.eth.getGasPrice();
  const data = contract.methods.transfer(receiverKey, value).encodeABI();
  const rawTransaction = {
    "to": erc20ContractAddress,
    "value": web3.utils.toHex(0),
    "gasPrice": web3.utils.toHex(gasPrice),
    "gasLimit": web3.utils.toHex(gas),
    "data": data,
    "chainId": testnet ? 3 : 1,
    "nonce": nonce
  };
  const tx = new Tx(rawTransaction);
  tx.sign(privateKey);
  const serializedTx = await tx.serialize();
  return serializedTx;
}
module.exports = {
  transferTokens: transferTokens,
  sendERC20: sendERC20
}