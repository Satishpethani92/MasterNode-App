<template>
    <div>
        <div
            v-if="!address">
            <b-card
                v-if="!address"
                :class="'XDC-card XDC-card--lighter'

                + (loading ? ' XDC-loading' : '')"
                class="mb-0">
                <h3 class="text-uppercase text-center fw-600 color-text-3 mb-4">Login</h3>
                <b-form
                    class="XDC-form XDC-form--setting"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        class="mb-4"
                        label="Network Provider"
                        label-for="provider">
                        <b-input-group>
                            <b-form-select
                                id="provider"
                                v-model="provider"
                                class="form-control"
                                @change="onChangeSelect">
                                <option
                                    v-if="!isElectron"
                                    value="metamask">XDCPay</option>
                                <option value="connect-wallet">WalletConnect v2</option>
                                <!-- <option
                                            value="XDCwallet">XDCWallet (Recommended)</option> -->
                                <option
                                    value="custom">PrivateKey/MNEMONIC</option>
                                <option
                                    value="ledger">Ledger Wallet</option>
                                <option
                                    value="trezor">Trezor Wallet</option>
                                    <!-- <option
                                                v-if="!isElectron"
                                                value="xinpay">XinPay</option> -->
                            </b-form-select>
                            <small
                                v-if="provider !== 'metamask' && provider !== 'xinpay'"
                                class="form-text text-muted">Using node at {{ chainConfig.rpc }}.</small>
                        </b-input-group>
                    </b-form-group>
                    <!-- <b-form-group
                                v-if="provider === 'custom'"
                                class="mb-4"
                                label="Network URL"
                                label-for="networks-custom">
                                <b-form-input
                                    :class="getValidationClass('custom')"
                                    v-model="networks.custom"
                                    type="text" />
                                <span
                                    v-if="$v.networks.custom.$dirty && !$v.networks.custom.required"
                                    class="text-danger">Required field</span>
                                <span
                                    v-else-if="$v.networks.custom.$dirty && !$v.networks.custom.localhostUrl"
                                    class="text-danger">Wrong URL format</span>
                            </b-form-group> -->
                    <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Privatekey/MNEMONIC"
                        label-for="mnemonic">
                        <b-form-input
                            :class="getValidationClass('mnemonic')"
                            v-model="mnemonic"
                            autocomplete="off"
                            type="text" />
                        <span
                            v-if="$v.mnemonic.$dirty && !$v.mnemonic.required"
                            class="text-danger">Required field</span>
                    </b-form-group>
                    <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Select HD derivation path(MNEMONIC)"
                        label-for="hdPath">
                        <b-form-input
                            :class="getValidationClass('hdPath')"
                            :value="hdPath"
                            v-model="hdPath"
                            type="text" />
                        <span
                            v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                            class="text-danger">Required field</span>
                        <small
                            class="form-text text-muted">To unlock the wallet, try paths
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'/0`)">m/44'/60'/0'/0</code> or
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'`)">m/44'/60'/0'</code> or
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/551'/0'/0`)">m/44'/551'/0'/0</code></small>
                    </b-form-group>

                    <b-form-group
                        v-if="provider === 'XDCwallet'"
                        class="mb-4"
                        style="text-align: center">
                        <vue-qrcode
                            :options="{size: 250 }"
                            :value="qrCode"
                            class="img-fluid text-center text-lg-right"/>
                        <div
                            v-if="mobileCheck">
                            <b-button
                                :href="qrCodeApp"
                                variant="primary">
                                Open in App
                            </b-button>
                        </div>
                        <div>
                            <b>In case you do not have XDCWallet, download here</b>
                        </div>
                        <div
                            style="margin-top: 5px">
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/MvE1GV"
                                class="social-links__link">
                                <img src="/app/assets/img/appstore.png" >
                            </a>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/4tFQzY"
                                class="social-links__link">
                                <img src="/app/assets/img/googleplay.png" >
                            </a>
                        </div>
                    </b-form-group>
                    <b-form-group
                        v-if="provider === 'ledger'"
                        class="mb-4"
                        label="Select HD derivation path"
                        label-for="hdPath">
                        <b-form-input
                            :class="getValidationClass('hdPath')"
                            :value="hdPath"
                            v-model="hdPath"
                            type="text" />
                        <span
                            v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                            class="text-danger">Required field</span>
                        <small
                            class="form-text text-muted">To unlock the wallet, try paths
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'`)">m/44'/60'/0'</code>
                            or <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'/0`)">m/44'/60'/0'/0</code>
                            with Ethereum App,<br>
                            or try path <code
                                class="hd-path"
                                @click="changePath(`m/44'/551'/0'/0`)">m/44'/551'/0'/0</code>
                            with XDC Network App (on Ledger).</small>
                    </b-form-group>

                    <b-form-group
                        v-if="provider === 'trezor'"
                        class="mb-4"
                        label-for="hdPath">
                        <span>HD derivation path: </span>
                        <label class="ml-1"><b>m/44'/60'/0'/0</b></label>
                        <!-- <b-form-input
                                    :class="getValidationClass('hdPath')"
                                    :value="hdPath"
                                    v-model="hdPath"
                                    readonly
                                    type="text" /> -->
                        <!-- <span
                                    v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                                    class="text-danger">Required field</span> -->
                    </b-form-group>

                    <div
                        v-if="!isReady && provider === 'metamask'">
                        <p class="mb-4">Please install &amp; login
                            <a
                                href="https://chrome.google.com/webstore/detail/xdcpay/bocpokimicclpaiekenaeelehdjllofo/"
                                target="_blank">XDCPay Extension</a>
                            then connect it to XDC Network Mainnet or Apothem Testnet.</p>
                    </div>
                    <div
                        v-if="!isReady && provider === 'xinpay'">
                        <p>Please install &amp; login
                            <a
                                href="https://xinpay.io/"
                                target="_blank">XinPay Extension</a>
                            then connect it to XDC Network Mainnet or Testnet.</p>
                    </div>
                    <div class="buttons text-center">
                        <b-button
                            v-if="provider !== 'XDCwallet'"
                            type="submit"
                            class="custom-primary-btn m-0"
                            variant="primary">Save</b-button>
                    </div>
                </b-form>
            </b-card>
            <!-- My comment start -->
            <!-- <div class="col-12 col-md-2 col-lg-2"/>

            </b-row>  -->
            <!-- My comment end -->
        </div>
    </div>
</template>
<script>
import Web3 from 'xdc3'
import BigNumber from 'bignumber.js'
import { validationMixin } from 'vuelidate'
import axios from 'axios'
import {
    required, minLength
} from 'vuelidate/lib/validators'
// import localhostUrl from '../../validators/localhostUrl.js'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import store from 'store'
import Helper from '../utils'
// const HDWalletProvider = require('truffle-hdwallet-provider')
const { HDWalletProvider } = require('../../helpers')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const defaultWalletNumber = 10
export default {
    name: 'App',
    components: {
        VueQrcode
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            mnemonic: '',
            hdPath: "m/44'/551'/0'/0", // HD DerivationPath of hardware wallet
            hdWallets: {}, // list of addresses in hardware wallet
            config: {},
            provider: 'metamask',
            address: '',
            withdraws: [],
            wh: [],
            aw: false,
            balance: 0,
            chainConfig: {},
            networks: {
                // mainnet: 'https://core.xinfin.network',
                rpc: 'https://testnet.xinfin.network',
                XDCwallet: 'https://testnet.xinfin.network'
            },
            loading: false,
            qrCode: 'text',
            id: '',
            interval: '',
            qrCodeApp: '',
            gasPrice: null,
            KYCStatus: false
        }
    },
    validations: {
        networks: {
            // custom: {
            //     required,
            //     localhostUrl
            // }
        },
        mnemonic: {
            required
        },
        hdPath: {
            required,
            minLength: minLength(12)
        }
    },
    computed: {
        mobileCheck: () => {
            const isAndroid = navigator.userAgent.match(/Android/i)
            const isIOS = navigator.userAgent.match(/iPhone|iPad|iPod/i)
            return (isAndroid || isIOS)
        }
    },
    watch: {},
    updated () {},
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        if (this.NetworkProvider) {
            this.provider = this.NetworkProvider
        }
        let self = this
        self.hdWallets = self.hdWallets || {}
        self.config = store.get('configMaster') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.networks.rpc = self.chainConfig.rpc

        self.setupAccount = async () => {
            let contract
            let account
            self.address = ''
            try {
                if (!self.web3 && self.NetworkProvider === 'metamask') {
                    throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
                }
                if (!self.web3 && self.NetworkProvider === 'xinpay') {
                    throw Error('Web3 is not properly detected. Have you installed XinPay extension?')
                }
                if (self.web3) {
                    try {
                        contract = self.XDCValidator
                        self.gasPrice = await self.web3.eth.getGasPrice()
                    } catch (error) {
                        self.$toasted.show('Make sure you choose correct XDC Network network.')
                    }
                }

                if (store.get('address') && self.isReady) {
                    account = store.get('address').toLowerCase()
                } else {
                    account = this.$store.state.address
                        ? this.$store.state.address : (self.web3 ? await self.getAccount() : false)
                }

                if (!account) {
                    return false
                    // if (store.get('address') && self.provider !== 'custom') {
                    //     account = store.get('address')
                    // } else return false
                }

                self.address = account
                self.web3.eth.getBalance(self.address).then(balanceBN => {
                    self.balance = new BigNumber(balanceBN).div(10 ** 18)
                }).catch(e => {
                    self.$toasted.show('Cannot load balance', { type: 'error' })
                })

                let whPromise = axios.get(`/api/owners/${self.address}/withdraws?limit=100`)
                if (contract) {
                    // let blksPromise = contract.getWithdrawBlockNumbers.call({ from: account })
                    let blksPromise = contract.methods.getWithdrawBlockNumbers().call({ from: account })
                    // let blks = await contract.getWithdrawBlockNumbers.call({ from: account })

                    const blks = await blksPromise

                    await Promise.all(blks.map(async (it, index) => {
                        let blk = new BigNumber(it).toString()
                        if (blk !== '0') {
                            self.aw = true
                        }
                        console.log(blk, 'blk')
                        let wd = {
                            blockNumber: blk
                        }
                        wd.cap = new BigNumber(
                            // await contract.getWithdrawCap.call(blk, { from: account })
                            await contract.methods.getWithdrawCap(blk).call({ from: account })
                        ).div(10 ** 18).toFormat()
                        wd.estimatedTime = await self.getSecondsToHms(
                            (wd.blockNumber - self.chainConfig.blockNumber)
                        )
                        self.withdraws[index] = wd
                    }))
                    await this.setKYCStatus(contract)
                }

                const wh = await whPromise

                // let wh = await axios.get(`/api/owners/${self.address}/withdraws`)
                self.wh = []
                wh.data.forEach(w => {
                    let it = {
                        cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                        tx: w.tx
                    }
                    self.wh.push(it)
                })
                self.isReady = true
            } catch (e) {
                console.log(e)
                self.$toasted.show(e, {
                    type : 'error'
                })
            }
        }
        if (self.provider === 'XDCwallet' && !self.address) {
            const hasQRCOde = self.loginByQRCode()
            if (await hasQRCOde) {
                self.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
            }
        }
        await self.setupAccount()
    },
    mounted () {},
    methods: {
        getValidationClass: function (fieldName) {
            let field = this.$v[fieldName]
            if (typeof this.$v.networks[fieldName] !== 'undefined') {
                field = this.$v.networks[fieldName]
            }
            if (field) {
                return {
                    'is-invalid': field.$error
                }
            }
        },
        resetForm () {
            this.provider = 'metamask'
            this.mnemonic = ''
            this.hdPath = "m/44'/551'/0'/0"
        },
        validate: function () {
            if (this.provider === 'connect-wallet') {
                this.save()
            }
            if (this.provider === 'metamask' || this.provider === 'xinpay') {
                this.save()
            }

            this.$v.$touch()
            if (this.provider === 'custom' && !this.$v.mnemonic.$invalid) {
                this.save()
            }
            if (this.provider === 'ledger' && !this.$v.hdPath.$invalid) {
                this.selectHdPath()
            }
            if (this.provider === 'trezor' && !this.$v.hdPath.$invalid) {
                this.hdPath = "m/44'/60'/0'/0"
                this.selectHdPath()
            }
        },
        selectHdPath: async function (offset = 0, limit = defaultWalletNumber) {
            let self = this
            let wallets
            try {
                self.loading = true
                store.set('hdDerivationPath', self.hdPath)
                if (self.provider === 'trezor') {
                    await self.unlockTrezor()
                    wallets = await self.loadTrezorWallets(offset, limit)
                } else {
                    await self.unlockLedger()
                    wallets = await self.loadMultipleLedgerWallets(offset, limit)
                }
                if (Object.keys(wallets).length > 0) {
                    Object.assign(self.hdWallets, self.hdWallets, wallets)
                    document.getElementById('hdwalletModal').style.display = 'block'
                    self.loading = false
                }
            } catch (error) {
                console.log(error.message)
                self.loading = false
                self.$toasted.show(error.message || error, {
                    type : 'error'
                })
            }
        },
        save: async function () {
            store.clearAll()
            const self = this
            self.address = ''
            self.$store.state.address = null
            // clear old data
            self.withdraws = []
            self.aw = []
            self.wh = []
            var wjs = false
            self.loading = true
            try {
                let offset
                switch (self.provider) {
                case 'connect-wallet':
                    let ethereumProvider = await this.walletConnectProvider(self.chainConfig)
                    await ethereumProvider.connect()
                    self.address = ethereumProvider.accounts[0]
                    ethereumProvider.on('disconnect', (code, reason) => {
                        store.clearAll()
                        Object.assign(this.$store.state, Helper.getDefaultState())

                        this.$router.go({
                            path: '/'
                        })
                    })
                    wjs = new Web3(ethereumProvider)
                    break
                case 'metamask':
                    if (window.web3) {
                        const p = window.web3.currentProvider
                        wjs = new Web3(p)
                    }
                    break
                case 'xinpay':
                    if (window.XDCWeb3) {
                        var pp = window.XDCWeb3.currentProvider
                        wjs = new Web3(pp)
                    }
                    break
                case 'ledger':
                    // Object - HttpProvider
                    wjs = new Web3(new Web3.providers.HttpProvider(self.networks.rpc))
                    // Object - IpcProvider: The IPC provider is used node.js dapps when running a local node
                    // import net from 'net'
                    // wjs = new Web3(new Web3.providers.IpcProvider('~/.ethereum/geth.ipc', net))

                    // Object - WebsocketProvider: The Websocket provider is the standard for usage in legacy browsers.
                    // wjs = await ws.connect(self.networks.wss)
                    // wjs = new Web3(new Web3.providers.WebsocketProvider(self.chainConfig.ws))
                    // web3 version 0.2 haven't supported WebsocketProvider yet. (for web@1.0 only)
                    offset = document.querySelector('input[name="hdWallet"]:checked').value.toString()
                    store.set('hdDerivationPath', self.hdPath + '/' + offset)
                    break
                case 'trezor':
                    wjs = new Web3(new Web3.providers.HttpProvider(self.networks.rpc))
                    offset = document.querySelector('input[name="hdWallet"]:checked').value.toString()
                    store.set('hdDerivationPath', self.hdPath + '/' + offset)
                    store.set('offset', offset)
                    break
                default:
                    self.mnemonic = self.mnemonic.trim()
                    const walletProvider =
                        (self.mnemonic.indexOf(' ') >= 0)
                            ? new HDWalletProvider(
                                self.mnemonic.trim(),
                                self.chainConfig.rpc, 0, 1, self.hdPath)
                            : new PrivateKeyProvider(self.mnemonic, self.chainConfig.rpc)
                    wjs = new Web3(walletProvider)
                    break
                }
                await self.setupProvider(this.provider, wjs)
                await self.setupAccount()
                self.loading = false

                if (self.address) {
                    self.$store.state.address = self.address.toLowerCase()
                    if (self.provider === 'metamask' || self.provider === 'xinpay' || self.provider === 'connect-wallet') {
                        store.set('address', self.address.toLowerCase())
                        store.set('network', self.provider)
                    }
                    self.$bus.$emit('logged', 'user logged')
                    self.$toasted.show('Network Provider was changed successfully')

                    self.$emit('close-modal')
                    self.$router.push('/setting')
                }
            } catch (e) {
                self.loading = false
                self.$toasted.show('There are some errors when changing the network provider', {
                    type : 'error'
                })
                console.log(e)
            }
        },
        async loginByQRCode () {
            // generate qr code
            const { data } = await axios.get('/api/auth/generateLoginQR')
            this.id = data.id
            this.qrCode = encodeURI(
                'xdcchain:login?message=' + data.message +
                '&submitURL=' + data.url
            )
            this.qrCodeApp = encodeURI(
                'xdcchain://login?message=' + data.message +
                '&submitURL=' + data.url
            )
            return true
        },
        async getLoginResult () {
            // calling api every 2 seconds
            const { data } = await axios.get('/api/auth/getLoginResult?id=' + this.id)

            if (!data.error && data) {
                this.loading = true
                if (self.interval) {
                    clearInterval(self.interval)
                }
                await this.getAccountInfo(data.user)
            }
        },
        async onChangeSelect (event) {
            switch (event) {
            case 'XDCwallet':
                await this.loginByQRCode()
                this.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
                break
            case 'trezor':
                this.hdPath = "m/44'/60'/0'/0"
                break
            case 'ledger':
                this.hdPath = "m/44'/551'/0'/0"
                break
            default:
                if (this.interval) {
                    clearInterval(this.interval)
                }
                break
            }
        },
        async getAccountInfo (account) {
            const self = this
            let contract
            self.address = account
            self.$store.state.address = account
            const web3 = new Web3(new HDWalletProvider(
                '',
                self.chainConfig.rpc, 0, 1, self.hdPath))

            await self.setupProvider(this.provider, web3)
            try {
                // contract = await self.getXDCValidatorInstance()
                contract = self.XDCValidator
            } catch (error) {
                if (self.interval) {
                    clearInterval(self.interval)
                }
                self.$toasted.show('Make sure you choose correct xdcchain network.', {
                    type : 'error'
                })
            }

            self.web3.eth.getBalance(self.address, function (a, b) {
                self.balance = new BigNumber(b).div(10 ** 18).toFormat()
                if (a) {
                    console.log('got an error', a)
                }
            })
            if (contract) {
                // let blks = await contract.getWithdrawBlockNumbers.call({ from: account })
                let blks = await contract.methods.getWithdrawBlockNumbers().call({ from: account })

                await Promise.all(blks.map(async (it, index) => {
                    let blk = new BigNumber(it).toString()
                    if (blk !== '0') {
                        self.aw = true
                    }
                    let wd = {
                        blockNumber: blk
                    }
                    wd.cap = new BigNumber(
                        // await contract.getWithdrawCap.call(blk, { from: account })
                        await contract.methods.getWithdrawCap(blk).call({ from: account })
                    ).div(10 ** 18).toFormat()
                    wd.estimatedTime = await self.getSecondsToHms(
                        (wd.blockNumber - self.chainConfig.blockNumber)
                    )
                    self.withdraws[index] = wd
                }))
            }

            let wh = await axios.get(`/api/owners/${self.address}/withdraws?limit=100`)
            self.wh = []
            wh.data.forEach(w => {
                let it = {
                    cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                    tx: w.tx
                }
                self.wh.push(it)
            })
            self.isReady = true
            self.loading = false
            store.set('address', account.toLowerCase())
            store.set('network', self.provider)
            self.$bus.$emit('logged', 'user logged')
            self.$toasted.show('Network Provider was changed successfully')
            if (this.interval) {
                clearInterval(this.interval)
            }
        },
        changeView (w, k) {
            const txFee = new BigNumber(this.chainConfig.gas * this.gasPrice).div(10 ** 18)

            if (this.balance.isGreaterThanOrEqualTo(txFee)) {
                this.$router.push({ name: 'CandidateWithdraw',
                    params: {
                        address: this.address,
                        blockNumber: w.blockNumber,
                        capacity: w.cap,
                        index: k
                    }
                })
            } else {
                this.$toasted.show('Not enough XDC for transaction fee', {
                    type : 'info'
                })
            }
        },
        closeModal () {
            document.getElementById('hdwalletModal').style.display = 'none'
        },
        async setHdPath () {
            document.getElementById('hdwalletModal').style.display = 'none'
            await this.save()
        },
        async moreHdAddresses () {
            document.getElementById('moreHdAddresses').style.cursor = 'wait'
            document.body.style.cursor = 'wait'
            await this.selectHdPath(Object.keys(this.hdWallets).length, this.defaultWalletNumber)
            document.getElementById('moreHdAddresses').style.cursor = 'pointer'
            document.body.style.cursor = 'default'
        },
        async setKYCStatus (contract) {
            // const isHashFound = await contract.methods.getHashCount().call({ from:this.address })
            const isHashFound = await contract.methods.getHashCount(this.address).call()
            console.log(isHashFound, 'isHashFound')
            console.log(new BigNumber(isHashFound).toNumber(), 'KYC uploaded successfully')
            if (new BigNumber(isHashFound).toNumber()) {
                const getKYC = await contract.methods.getLatestKYC(this.address).call()
                // const KYCString = await contract.KYCString.call(this.address)
                this.KYCStatus = getKYC
            }
        },
        changePath (path) {
            this.hdPath = path
        }
    }
}
</script>
