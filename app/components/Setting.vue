<template>
    <div>
        <div
            v-if="address"
            class="XDC-header">
            <div class="container">
                <div class="XDC-header-block">
                    <div class="XDC-header-block-left">
                        <div>
                            <i class="tm-wallet XDC-header__icon" />
                        </div>
                        <div>
                            <h4 class="h4 color-text-3">Address</h4>
                            <p>
                                <router-link
                                    :to="`/voter/xdc${address.substring(2)}`"
                                    class="text-truncate">
                                    {{ 'xdc' + address.substring(2) }}
                                </router-link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="address">
            <div class="container">
                <b-row>
                    <div
                        class="col-12 col-md-6 col-lg-6">
                        <b-card
                            v-if="address"
                            :class="'XDC-card XDC-card--lighter'
                            + (loading ? ' XDC-loading' : '')">
                            <h4 class="h4 XDC-card__title color-text-3">
                                Account Information</h4>
                            <ul class="XDC-list list-unstyled">
                                <li class="XDC-list__item">
                                    <i class="tm-wallet XDC-list__icon" />
                                    <p class="XDC-list__text">
                                        <router-link
                                            :to="`/voter/xdc${address.substring(2)}`"
                                            class="text-truncate">
                                            {{ 'xdc' + address.substring(2) }}
                                        </router-link>
                                        <span>Address</span>
                                    </p>
                                </li>
                                <li class="XDC-list__item">
                                    <i class="tm-XDC2 XDC-list__icon" />
                                    <div class="XDC-list__text">
                                        <p class="color-text mb-0">{{ formatNumber(balance) }}
                                        <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                                        <span>Balance</span>
                                    </div>
                                </li>
                                <li class="XDC-list__item">
                                    <i class="tm-XDC XDC-list__icon" />
                                    <div class="XDC-list__text">
                                        <p class="color-text mb-0">
                                        <span class="text-muted">{{ Boolean(KYCStatus) }}</span></p>
                                        <span>KYC</span>
                                    </div>
                                </li>
                                <li
                                    v-if="KYCStatus"
                                    class="XDC-list__item">
                                    <i class="tm-XDC XDC-list__icon" />
                                    <div class="XDC-list__text">
                                        <p class="color-text mb-0">
                                            <span class="text-muted">
                                                <a
                                                    :href="`https://kycdocs.xinfin.network/${KYCStatus}`"
                                                    target="_blank">
                                                    Check here
                                                </a>
                                            </span>
                                        </p>
                                        <span>KYC</span>
                                    </div>
                                </li>
                            </ul>
                        </b-card>
                    </div>
                    <div
                        class="col-12 col-md-6 col-lg-6">
                        <b-card
                            v-if="isReady && (aw || (wh.length > 0))"
                            :class="'XDC-card XDC-card--lighter'
                            + (loading ? ' XDC-loading' : '')">
                            <h4 class="h4 XDC-card__title color-text-3">
                                Withdrawals</h4>
                            <ul
                                v-for="(w, k, index) in withdraws"
                                :key="index"
                                class="XDC-list list-unstyled">
                                <li
                                    v-if="w.blockNumber !== '0' && w.cap !== '0'"
                                    class="XDC-list__item">
                                    <p class="XDC-list__text">
                                        <a :href="`${config.explorerUrl}/blocks/${w.blockNumber}`">
                                            {{ w.blockNumber }}</a>
                                        <span>Withdrawal Block Number</span>
                                    </p>
                                    <div class="XDC-list__text">
                                        <p class="color-text mb-0">{{ w.cap }}
                                        <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                                        <span>Capacity</span>
                                    </div>
                                    <div class="XDC-list__text">
                                        <b-button
                                            :disabled="w.blockNumber > chainConfig.blockNumber"
                                            class="float-right"
                                            variant="primary"
                                            @click="changeView(w, k)">Withdraw</b-button>
                                    </div>
                                </li>
                            </ul>
                            <ul
                                v-for="(w, k, index) in wh"
                                :key="index"
                                class="XDC-list list-unstyled">
                                <li
                                    class="XDC-list__item">
                                    <p class="XDC-list__text">
                                        <a :href="`${config.explorerUrl}/txs/${w.tx}`">
                                            {{ (w.tx || '').substring(0,8) }}</a>
                                        <span>Transaction</span>
                                    </p>
                                    <div class="XDC-list__text">
                                        <p class="color-text mb-0">{{ w.cap }}
                                        <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                                        <span>Capacity</span>
                                    </div>
                                    <p class="XDC-list__text"/>
                                </li>
                            </ul>
                        </b-card>
                    </div>
                </b-row>
            </div>
        </div>
    </div>
</template>

<script>
import BigNumber from 'bignumber.js'
import axios from 'axios'
import store from 'store'

export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            config: {},
            address: '',
            withdraws: [],
            wh: [],
            aw: false,
            balance: 0,
            chainConfig: {},
            loading: false,
            KYCStatus: false
        }
    },
    created: async function () {
        let self = this
        self.config = store.get('configMaster') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}

        self.setupAccount = async () => {
            let contract
            let account
            self.address = ''
            try {
                if (store.get('address') && self.isReady) {
                    account = store.get('address').toLowerCase()
                } else {
                    account = this.$store.state.address
                        ? this.$store.state.address : (self.web3 ? await self.getAccount() : false)
                }

                if (!account) {
                    return false
                }

                self.address = account
                self.web3.eth.getBalance(self.address).then(balanceBN => {
                    self.balance = new BigNumber(balanceBN).div(10 ** 18)
                }).catch(e => {
                    self.$toasted.show('Cannot load balance', { type: 'error' })
                })

                let whPromise = axios.get(`/api/owners/${self.address}/withdraws?limit=100`)
                if (contract) {
                    let blksPromise = contract.methods.getWithdrawBlockNumbers().call({ from: account })
                    const blks = await blksPromise

                    await Promise.all(blks.map(async (it, index) => {
                        let blk = new BigNumber(it).toString()
                        if (blk !== '0') {
                            self.aw = true
                        }
                        let wd = {
                            blockNumber: blk
                        }
                        wd.cap = new BigNumber(
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
                    type: 'error'
                })
            }
        }
        await self.setupAccount()
    },
    methods: {
        async setKYCStatus (contract) {
            const isHashFound = await contract.methods.getHashCount(this.address).call()
            if (new BigNumber(isHashFound).toNumber()) {
                const getKYC = await contract.methods.getLatestKYC(this.address).call()
                this.KYCStatus = getKYC
            }
        },
        changeView (w, k) {
            const txFee = new BigNumber(this.chainConfig.gas * this.gasPrice).div(10 ** 18)

            if (this.balance.isGreaterThanOrEqualTo(txFee)) {
                this.$router.push({
                    name: 'CandidateWithdraw',
                    params: {
                        address: this.address,
                        blockNumber: w.blockNumber,
                        capacity: w.cap,
                        index: k
                    }
                })
            } else {
                this.$toasted.show('Not enough XDC for transaction fee', {
                    type: 'info'
                })
            }
        }
    }
}
</script>
