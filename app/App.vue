<template>
    <div
        id="app">
        <div class="page-layout">
            <b-modal
                id="login-modal"
                v-model="showLoginModal"
                hide-footer
                hide-header
                centered
                @hidden="resetForm">
                <LoginForm
                    ref="settingRef"
                    @close-modal="handleCloseModal" />
            </b-modal>
            <b-navbar
                toggleable="lg"
                type="dark">
                <div class="container">
                    <b-navbar-brand to="/">
                        <img
                            v-if="!darkMode"
                            :style="{ width: '106px', height: '34px' }"
                            src="/app/assets/img/dark-mode-logo.svg" >
                        <img
                            v-else
                            :style="{ width: '106px', height: '34px' }"
                            src="/app/assets/img/light-mode-logo.svg" >
                    </b-navbar-brand>

                    <div class="d-lg-none d-flex ml-auto">
                        <b-navbar-toggle
                            target="nav-collapse"
                            class="btn-menu-sp p-0 mr-2"/>
                        <b-button
                            v-if="!isXDCnet"
                            id="btn-become-candidate"
                            class="mr-2"
                            variant="primary"
                            @click="showLoginModal = true">Login</b-button>
                        <b-dropdown
                            v-if="isXDCnet"
                            class="dd-setting mr-2"
                            style="height: 30px; width:30px"
                            right
                            offset="25"
                            no-caret
                            variant="primary">
                            <template slot="button-content">
                                <i class="tm-cog icon-2x"/>
                            </template>
                            <b-dropdown-item class="dd-address">
                                {{ truncate(account, 20) }}
                            </b-dropdown-item>
                            <b-dropdown-item to="/setting">Settings/Withdraws</b-dropdown-item>
                            <b-dropdown-divider />
                            <b-dropdown-item
                                v-if="!mobileCheck && isXDCnet"
                                href="/"
                                @click="signOut">Sign out</b-dropdown-item>
                        </b-dropdown>

                        <b-button
                            id="btn-darkmode"
                            variant="transparent"
                            class="p-0 bg-transparent border-0 btn"
                            style="height: 30px; width:30px"
                            @click="toggleDarkMode">
                            <svg
                                v-if="!darkMode"
                                stroke="currentColor"
                                fill="currentColor"
                                stroke-width="0"
                                viewBox="0 0 24 24"
                                focusable="false"
                                class="moon-icon"
                                height="1.5em"
                                width="1.5em"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fill="none"
                                    d="M0 0h24v24H0z"/>
                                <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"/>
                            </svg>
                            <svg
                                v-else
                                stroke="currentColor"
                                fill="currentColor"
                                stroke-width="0"
                                viewBox="0 0 24 24"
                                focusable="false"
                                class="sun-icon"
                                height="1.5em"
                                width="1.5em"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fill="none"
                                    d="M0 0h24v24H0z"/>
                                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
                            </svg>
                        </b-button>
                    </div>

                    <!-- my comment start -->
                    <!-- <b-navbar-toggle
                        target="nav-collapse"
                        class="btn-menu-sp"/> -->
                    <!-- my comment end -->
                    <b-collapse
                        id="nav-collapse"
                        is-nav>
                        <!-- Right aligned nav items -->
                        <b-navbar-nav class="ml-auto ">
                            <b-nav-form class="search-form">
                                <auto-complete
                                    v-model="search"
                                    :items="items"/>
                                <b-button
                                    variant="outline-success"
                                    type="submit"
                                    @click="searchCandidate">Search</b-button>
                            </b-nav-form>
                        </b-navbar-nav>
                        <b-navbar-nav class="ml-lg-3">
                            <li class="nav-item">
                                <router-link
                                    to="/"
                                    class="nav-link">Dashboard</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link
                                    to="/apply"
                                    class="nav-link"
                                >Setup Masternode</router-link
                                >
                            </li>
                            <li class="nav-item">
                                <router-link
                                    to="/delegators"
                                    class="nav-link"
                                >Delegators</router-link
                                >
                            </li>
                            <li class="nav-item">
                                <a
                                    href="https://xdc.dev"
                                    target="_blank"
                                    class="nav-link">Help</a>
                            </li>
                        </b-navbar-nav>
                        <b-navbar-nav class="ml-lg-3 navbar-buttons d-none d-lg-flex">
                            <b-button
                                v-if="!isXDCnet"
                                id="btn-become-candidate"
                                variant="primary"
                                @click="showLoginModal = true">Login</b-button>

                            <b-dropdown
                                v-if="isXDCnet"
                                class="dd-setting"
                                right
                                offset="25"
                                no-caret
                                variant="primary">
                                <template slot="button-content">
                                    <i class="tm-cog icon-2x"/>
                                </template>
                                <b-dropdown-item class="dd-address">
                                    {{ truncate(account, 20) }}
                                </b-dropdown-item>
                                <b-dropdown-item to="/setting">Settings/Withdraws</b-dropdown-item>
                                <b-dropdown-divider />
                                <b-dropdown-item
                                    v-if="!mobileCheck && isXDCnet"
                                    href="/"
                                    @click="signOut">Sign out</b-dropdown-item>
                            </b-dropdown>

                            <b-button
                                id="btn-darkmode"
                                variant="transparent"
                                class="p-0 bg-transparent border-0 ml-lg-3 light-dark btn"
                                @click="toggleDarkMode">
                                <svg
                                    v-if="!darkMode"
                                    stroke="currentColor"
                                    fill="currentColor"
                                    stroke-width="0"
                                    viewBox="0 0 24 24"
                                    focusable="false"
                                    class="moon-icon"
                                    height="1.5em"
                                    width="1.5em"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fill="none"
                                        d="M0 0h24v24H0z"/>
                                    <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"/>
                                </svg>
                                <svg
                                    v-else
                                    stroke="currentColor"
                                    fill="currentColor"
                                    stroke-width="0"
                                    viewBox="0 0 24 24"
                                    focusable="false"
                                    class="sun-icon"
                                    height="1.5em"
                                    width="1.5em"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fill="none"
                                        d="M0 0h24v24H0z"/>
                                    <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
                                </svg>
                            </b-button>
                        </b-navbar-nav>
                    </b-collapse>
                </div>
            </b-navbar>
            <div class="flex-grow">
                <router-view/>
            </div>
            <footer
                class="XDC-footer">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-4 mb-3 mb-lg-0">
                            <b-navbar-brand
                                to="/"
                                class="mb-2">
                                <img
                                    v-if="!darkMode"
                                    :style="{ width: '106px', height: '34px' }"
                                    src="/app/assets/img/dark-mode-logo.svg" >
                                <img
                                    v-else
                                    :style="{ width: '106px', height: '34px' }"
                                    src="/app/assets/img/light-mode-logo.svg" >
                            </b-navbar-brand>
                            <p class="mb-5">Success Depends on Your Network</p>

                            <ul class="list-inline mb-2">
                                <li class="list-inline-item">
                                    <a
                                        href="https://x.com/XDC_Network_"
                                        target="_blank">
                                        <i class="fa-brands fa-square-x-twitter"/>
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://t.me/XDC_Network_Updates"
                                        target="_blank">
                                        <i class="fa-brands fa-telegram"/>
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.facebook.com/XDCNetworkBlockchain"
                                        target="_blank">
                                        <i class="fa-brands fa-facebook"/>
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://github.com/XinFinorg"
                                        target="_blank">
                                        <i class="fa-brands fa-github"/>
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.reddit.com/r/xinfin/?rdt=33804"
                                        target="_blank">
                                        <i class="fa-brands fa-reddit"/>
                                    </a>
                                </li>
                            </ul>
                            <div class="XDC-footer__copyright">
                                &copy; {{ (new Date()).getFullYear() }} XDC.Network All rights reserved.
                            </div>
                        </div>
                        <div class="col-lg-2">
                            <h6 class="h6">Community</h6>
                            <ul class="footer-links">
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/developers-ecosystem-partners">Developers Ecosystem Partners</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/join-community">Join Community</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/xdc-accelerator-program">Join Accelerator</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/community-bounty">Community Bounty</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://forum.xinfin.org/">XDC Forum</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/events">Events</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-2">
                            <h6 class="h6">Use XDC</h6>
                            <ul class="footer-links">
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/ecosystem-dapps">Ecosystem dApps</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/setup-masternode">Setup Masternode</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/get-xdc">Get XDC</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/wallets">XDC Wallets</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/xdc-subnet">XDC Subnet</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/about">About XDC Network</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/xdpos">XDC 2.0</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-2">
                            <h6 class="h6">XDC Tools</h6>
                            <ul class="footer-links">
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xdcscan.com/">XDC Explorer</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://stats1.xinfin.network/">XDC Network Status</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://faucet.apothem.network/">XDC Faucet</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://remix.xinfin.network/#optimize=false&runs=200&evmVersion=null&version=soljson-v0.8.7+commit.e28d00a7.js">XDC Network Remix</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/quick-tools-guide">Quick Tools Guide</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-2">
                            <h6 class="h6">Developers</h6>
                            <ul class="footer-links">
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://docs.xdc.network/">Documentation</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="#">XDC Developers Forum</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://www.xdc.dev/">XDC AI Developer Tools</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/docs/whitepaper-tech.pdf">Technical White Paper</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://xinfin.org/docs/whitepaper-business.pdf">Business White Paper</a></li>
                                <li class="mb-1"><a
                                    target="_blank"
                                    href="https://github.com/XinFinorg">Github</a></li>
                            </ul>
                        </div>
                        <!-- <div class="col-md-8">
                            <div class="XDC-footer__links">
                                <ul class="list-inline">
                                    <li class="list-inline-item">
                                        <a
                                            :href="needHelpLink"
                                            target="_blank">Need help?</a>
                                    </li>|
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="https://docs.xinfin.network/legal/privacy">Privacy Policy</a>
                                    </li>|
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="https://docs.xinfin.network/legal/terms-of-use">Terms of Use</a>
                                    </li>|
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/api-docs">API Documentation</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="XDC-footer__copyright">
                                &copy; {{ (new Date()).getFullYear() }} XDC.Network All rights reserved.
                            </div>
                        </div>
                        <div class="col-md-4 XDC-footer__social">
                            <ul class="list-inline">
                                <li class="list-inline-item">
                                    <a
                                        href="https://t.me/xinfintalk"
                                        target="_blank">
                                        <i class="tm-telegram" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.facebook.com/XinFinHybridBlockchain/"
                                        target="_blank">
                                        <i class="tm-facebook" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://twitter.com/XinFin_Official"
                                        target="_blank">
                                        <i class="tm-twitter" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://github.com/XinFinOrg"
                                        target="_blank">
                                        <i class="tm-github" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.reddit.com/r/xinfin"
                                        target="_blank">
                                        <i class="tm-reddit" />
                                    </a>
                                </li>
                            </ul>
                        </div> -->
                    </div>
                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import store from 'store'
import moment from 'moment'
import pkg from '../package.json'
import AutoComplete from './components/AutoComplete.vue'
import LoginForm from './components/LoginForm.vue'
export default {
    name: 'App',
    metaInfo: {
        title: 'XDC Network Governance DApp ',
        meta: [
            { name: 'description', content: 'Providing a professional UI which allows coin-holders to stake for masternodes, decentralized governance and explore masternode performance statistics' } // eslint-disable-line
        ]
    },
    components: {
        AutoComplete,
        LoginForm
    },
    data () {
        return {
            darkMode: false,
            showLoginModal: false,
            isReady: !!this.web3,
            showProgressBar: false,
            selectedCandidate: null,
            search: null,
            isXDCnet: false,
            version: pkg.version,
            account: '',
            items: [],
            statusClass: '',
            interval: '',
            notifications: [],
            readNoti: 0,
            needHelpLink: 'https://docs.xinfin.network/faq/products/xdcchain-applications/masternodeapp'
        }
    },
    computed: {
        mobileCheck: () => {
            const isAndroid = navigator.userAgent.match(/Android/i)
            const isIOS = navigator.userAgent.match(/iPhone|iPad|iPod/i)
            return (isAndroid || isIOS)
        }
    },
    async updated () {
        await this.checkNetworkAndLogin()
    },
    destroyed () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        let self = this

        try {
            if (!self.isReady && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            self.$bus.$on('logged', async () => {
                await self.checkNetworkAndLogin()
                setTimeout(async () => {
                    await self.getNotification()
                }, 500)
            })
            // const candidates = await axios.get('/api/candidates')
            // const map = candidates.data.items.map((c) => {
            //     return {
            //         name: c.name ? c.name : 'XDC.Network',
            //         address: c.candidate
            //     }
            // })
            // const mapping = await Promise.all(map)
            // self.items = mapping
            setTimeout(async () => {
                await self.getNotification()
            }, 500)
            if (this.isXDCnet) {
                this.interval = setInterval(async () => {
                    await this.getNotification()
                }, 40000)
            }
        } catch (e) {
            console.log(e)
        }
    },
    methods: {
        searchCandidate (e) {
            e.preventDefault()
            const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/

            let to = null
            let search = (this.search || '').trim()
            if (regexpAddr.test(search)) {
                axios.get(`/api/search/${search}`)
                    .then((response) => {
                        const data = response.data
                        console.log('data', data)

                        if (Object.keys(data.candidate).length > 0) {
                            to = { path: `/candidate/${data.candidate.candidate}` }
                        } else if (Object.keys(data.voter).length > 0) {
                            to = { path: `/voter/${search}` }
                        } else {
                            this.$toasted.show('Not found')
                        }
                        if (!to) {
                            return false
                        }
                        this.search = ''
                        return this.$router.push(to)
                    }).catch(e => console.log(e))
            }
        },
        handleCloseModal () {
            this.showLoginModal = false // Close the modal
        },
        toggleDarkMode () {
            this.darkMode = !this.darkMode
            if (this.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark')
            } else {
                document.documentElement.removeAttribute('data-theme')
            }
            // Optionally, save the state to localStorage
            // localStorage.setItem('darkMode', this.darkMode);
        },
        resetForm () {
            this.$refs.settingRef.resetForm()
        },
        goPage: function (s) {
            this.$router.push({ path: `/candidate/${s}` })
        },
        async checkNetworkAndLogin () {
            let self = this
            setTimeout(async () => {
                try {
                    let contract// = await self.getXDCValidatorInstance()
                    contract = self.XDCValidator
                    self.account = store.get('address') ||
                        self.$store.state.address || await self.getAccount()
                    if (self.account.substring(0, 2) === '0x') {
                        self.account = 'xdc' + self.account.substring(2)
                    }
                    if (self.account && contract) {
                        self.isXDCnet = true
                    }
                } catch (error) {}
            }, 0)
        },
        signOut () {
            store.clearAll()
            Object.assign(this.$store.state, this.getDefaultState())
            // this.$store.state.address = null

            this.$router.go({
                path: '/'
            })
        },
        async readClick () {
            this.statusClass = 'display: none;'
        },
        async getNotification () {
            try {
                const self = this
                if (self.account && self.isXDCnet) {
                    const { data } = await axios.get('/api/voters/' + self.account.toLowerCase() + '/getNotification')
                    if (data.length > 0) {
                        let items = []
                        let readNoti = 0
                        data.map(d => {
                            if (!d.isRead) {
                                readNoti++
                            }
                            items.push({
                                event: d.event,
                                createdAt: moment(d.createdAt).fromNow(),
                                name: d.candidateName,
                                candidate: d.candidate,
                                isRead: d.isRead
                            })
                        })
                        self.readNoti = readNoti
                        self.notifications = items
                    }
                }
            } catch (error) {
                console.log(error)
            }
        },
        async markReadAll () {
            // mark read all
            this.readNoti = 0
            await axios.get('/api/voters/' + this.account.toLowerCase() + '/markReadAll')
            this.notifications = this.notifications.map(n => {
                n.isRead = true
                return n
            })
        }
    }
}
</script>
