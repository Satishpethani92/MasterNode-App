'use strict'

/**
 * Wraps HTTP RPC so Ledger uses the same web3.eth.personal.sign / contract.send
 * code paths as MetaMask and other wallets.
 */
function toRpcAddress (address) {
    if (!address) return address
    const normalized = String(address).toLowerCase()
    if (normalized.startsWith('xdc')) {
        return '0x' + normalized.substring(3)
    }
    if (!normalized.startsWith('0x')) {
        return '0x' + normalized
    }
    return normalized
}

function toXdcAddress (address) {
    const rpc = toRpcAddress(address)
    if (!rpc || rpc.length < 3) return rpc
    return 'xdc' + rpc.substring(2)
}

/** Web3 checks tx.from against eth_accounts — return both 0x and xdc forms. */
function expandAccountFormats (accounts) {
    const expanded = new Set()
    accounts.forEach((a) => {
        if (!a) return
        const lower = String(a).toLowerCase()
        expanded.add(toRpcAddress(lower))
        expanded.add(toXdcAddress(lower))
    })
    return Array.from(expanded)
}

function normalizeHexPrefix (value) {
    const hex = String(value).trim()
    return hex.startsWith('0x') ? hex : '0x' + hex
}

function decodeSignMessage (hexMessage) {
    const hex = normalizeHexPrefix(hexMessage)
    return Buffer.from(hex.slice(2), 'hex').toString('utf8')
}

function rpcSend (provider, payload) {
    return new Promise((resolve, reject) => {
        const send = provider.sendAsync || provider.send
        send.call(provider, payload, (err, result) => {
            if (err) return reject(err)
            if (result && result.error) return reject(result.error)
            resolve(result)
        })
    })
}

function createLedgerWeb3Provider (rpcProvider, hooks) {
    const rpcResponse = (payload, result) => ({
        id: payload.id,
        jsonrpc: payload.jsonrpc || '2.0',
        result
    })

    const send = (payload, callback) => {
        if (Array.isArray(payload)) {
            return rpcProvider.send(payload, callback)
        }

        const run = async () => {
            const method = (payload.method || '').toLowerCase()
            const params = payload.params || []

            switch (method) {
            case 'eth_accounts':
            case 'eth_requestaccounts': {
                const accounts = await hooks.getAccounts()
                return rpcResponse(payload, expandAccountFormats(accounts))
            }
            case 'personal_sign': {
                const message = decodeSignMessage(params[0])
                const signature = await hooks.signPersonalMessage(message)
                return rpcResponse(payload, signature)
            }
            case 'eth_sign': {
                const hexData = params[1] || params[0]
                const message = decodeSignMessage(hexData)
                const signature = await hooks.signPersonalMessage(message)
                return rpcResponse(payload, signature)
            }
            case 'eth_sendtransaction': {
                const tx = Object.assign({}, params[0])
                const accounts = await hooks.getAccounts()
                tx.from = toRpcAddress(tx.from || accounts[0])

                const nonceRes = await rpcSend(rpcProvider, {
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'eth_getTransactionCount',
                    params: [tx.from, 'latest']
                })
                tx.nonce = nonceRes.result

                if (hooks.prepareTransaction) {
                    await hooks.prepareTransaction(tx)
                }

                const signature = await hooks.signTransaction(tx)
                const txHash = await hooks.sendSignedTransaction(tx, signature)
                return rpcResponse(payload, txHash)
            }
            case 'eth_sendrawtransaction':
                return rpcSend(rpcProvider, payload)
            default:
                return rpcSend(rpcProvider, payload)
            }
        }

        run()
            .then((response) => callback(null, response))
            .catch((error) => callback(error))
    }

    return {
        send,
        sendAsync: send,
        connected: true,
        isLedgerProvider: true
    }
}

export { createLedgerWeb3Provider, toRpcAddress }
