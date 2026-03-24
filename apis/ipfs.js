'use strict'
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const { addBufferToIpfs } = require('../helpers/ipfs')

if (!fs.existsSync(path.join(__dirname, '../tmp/'))) {
    fs.mkdirSync(path.join(__dirname, '../tmp/'))
}

router.post('/addKYC', async function (req, res, next) {
    // console.log(req.files)
    console.log('File Name : ', req.files)
    let imageFile = req.files.filename

    try {
        const hash = await addBufferToIpfs(imageFile.data)
        console.log(`Uploaded file; hash: ${hash}`)
        res.status(200).json({ 'hash': hash })
    } catch (err) {
        console.error('Some error occured while adding KYC at /addKYC: ', err)
        res.status(500).send(err)
    }

    // imageFile.mv(path.join(__dirname, '../tmp/', name), function (err) {
    //     if (err) {
    //         return res.status(500).send(err)
    //     }
    //     const filePath = path.join(__dirname, '/../tmp/', name)
    //     exec(
    //         `IPFS_PATH=~/.ipfs1 ipfs add ${filePath}`,
    //         async (error, stdout, stderr) => {
    //             if (error != null) {
    //                 res.status(500).send(error)
    //             }
    //             var words = stdout.split(' ')
    //             console.log('WORDS', words)
    //             for (var i = 0; i < words.length; i++) {
    //                 if (words[i][0] === 'Q') hash = words[i]
    //             }
    //             console.log('HASH : ', hash)
    //             console.log('deleting : ', filePath)
    //             fs.unlink(filePath, err => {
    //                 if (err) throw err
    //                 console.log('File successfully deleted')
    //                 res.status(200).json({ 'hash':hash })
    //             })
    //         }
    //     )
    // })
})

module.exports = router
