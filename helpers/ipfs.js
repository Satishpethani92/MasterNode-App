'use strict'

const IpfsClient = require('ipfs-http-client')

const xinFinClient = new IpfsClient({
    host: 'ipfs.xinfin.network',
    port: 443,
    protocol: 'https'
})

function extractHash (result) {
    if (!result) return null
    if (Array.isArray(result)) {
        return result[0] && (result[0].hash || result[0].path || result[0].cid)
    }

    return result.hash || result.path || (result.cid && result.cid.toString())
}

async function addBufferToIpfs (buffer) {
    return new Promise((resolve, reject) => {
        xinFinClient.add(buffer, (err, result) => {
            if (err) {
                reject(err)
                return
            }

            const hash = extractHash(result)

            if (!hash) {
                reject(new Error('Unable to determine IPFS hash'))
                return
            }

            resolve(hash.toString())
        })
    })
}

module.exports = {
    addBufferToIpfs,
    xinFinClient
}
