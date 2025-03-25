'use strict'

const Web3 = require('xdc3')
const config = require('config')

const web3Prc = {
    Web3Rpc: function () {
        const provider = new Web3.providers.HttpProvider(config.get('blockchain.rpc'), {
            headers: [{ name: 'User-Agent', value: 'Node.js' }]
        })
        const web3 = new Web3(provider)
        return web3
    },
    Web3RpcInternal: function () {
        const internalProvider = new Web3.providers.HttpProvider(config.get('blockchain.internalRpc'), {
            headers: [{ name: 'User-Agent', value: 'Node.js' }]
        })
        const web3Internal = new Web3(internalProvider)
        return web3Internal
    }
}

module.exports = web3Prc
