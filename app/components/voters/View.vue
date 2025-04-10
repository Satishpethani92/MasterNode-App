<template>
    <div>
        <div
            class="XDC-header">
            <div class="container">
                <div class="XDC-header-block">
                    <div class="XDC-header-block-left">
                        <div>
                            <img
                                src="/app/assets/img/owner-name-icon.svg"
                                alt="Owner-icon">
                        </div>
                        <div>
                            <h6 class="h6 color-text-3 mb-1">Voter</h6>
                            <p>{{ voter }}</p>
                        </div>
                    </div>
                    <div class="XDC-header-block-right">
                        <router-link
                            to="/"
                            class="d-flex align-items-center">
                            <img
                                class="mr-2"
                                src="/app/assets/img/backarrow.svg"
                                alt="Back-arrow img">
                            Back to all Validators
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-12 col-md-4 mb-4 mb-md-0">
                    <b-card class="XDC-card custom-card mb-0 h-100">
                        <h6 class="XDC-card__title d-flex align-items-center">
                            Total Rewards Earned
                            <img
                                src="/app/assets/img/info.svg"
                                alt="info-icon"
                                class="ml-2">
                        </h6>
                        <p class="XDC-card__text">
                            {{ formatCurrencySymbol(formatBigNumber(mnRewardsTotalRows, 2)) }}
                        </p>
                    </b-card>
                </div>
                <!-- future use start-->
                <!-- <div class="col-sm-6 col-lg-3 mb-4 mb-lg-0">
                    <b-card class="XDC-card XDC-card custom-card mb-0 h-100">
                        <h6 class="XDC-card__title d-flex align-items-center">
                            Voting Power
                            <img
                                src="/app/assets/img/info.svg"
                                alt="info-icon"
                                class="ml-2">
                        </h6>
                        <p class="XDC-card__text">
                            3.42%
                        </p>
                    </b-card>
                </div> -->
                <!-- future use end -->
                <div class="col-12 col-md-4 mb-4 mb-md-0">
                    <b-card class="XDC-card XDC-card custom-card mb-0 h-100">
                        <h6 class="XDC-card__title d-flex align-items-center">
                            Status
                            <img
                                src="/app/assets/img/info.svg"
                                alt="info-icon"
                                class="ml-2">
                        </h6>
                        <div class="d-flex align-items-center">
                            <p class="XDC-card__text">
                                {{ candidate.status }}
                            </p>
                        </div>
                    </b-card>
                </div>

                <div class="col-12 col-md-4">
                    <b-card class="XDC-card XDC-card custom-card mb-0 h-100">
                        <h6 class="XDC-card__title d-flex align-items-center">
                            Validator Uptime
                            <img
                                src="/app/assets/img/info.svg"
                                alt="info-icon"
                                class="ml-2">
                        </h6>
                        <p class="XDC-card__text color-green">
                            ToDo
                        <!-- {{ formatBigNumber(toXDCNumber(chainConfig.XDCStakeAmount),2) }} -->
                        </p>
                    </b-card>
                </div>
            </div>
        </div>
        <div class="main-content container">
            <b-row>
                <div
                    class="col-12 col-lg-6 mb-lg-4">
                    <b-card
                        :class="'XDC-card XDC-card--lighter XDC-card--candidate'
                        + (loading ? ' XDC-loading' : '')">
                        <div class="XDC-detail">
                            <h6 class="h6 fw-400 color-text-3 mb-4">Validator Overview</h6>
                            <div class="XDC-detail-section d-flex justify-content-between">
                                <div class="XDC-detail-label">Capacity</div>
                                <div class="XDC-detail-value-small">
                                    <span
                                        :class="'XDC-info__description'">
                                        {{ formatCurrencySymbol(formatBigNumber(candidate.cap, 3)) }}
                                    </span>
                                </div>
                            </div>
                            <hr>
                            <div class="XDC-detail-section d-flex justify-content-between">
                                <div class="XDC-detail-label">Checkpoints</div>
                                <div class="XDC-detail-value-small">
                                    <span
                                        :class="'XDC-info__description'">
                                        ToDo
                                        <!-- {{ formatCurrencySymbol(formatBigNumber(candidate.cap, 3)) }} -->
                                    </span>
                                </div>
                            </div>
                            <hr>
                            <div class="XDC-detail-section d-flex justify-content-between">
                                <div class="XDC-detail-label d-flex align-items-center">Est. Staking ROI
                                    <img
                                        src="/app/assets/img/info.svg"
                                        alt="info-icon"
                                        class="ml-2"></div>
                                <div class="XDC-detail-value-small">
                                    <span
                                        :class="'XDC-info__description'">
                                        {{ voterROI ? voterROI + '%' : '-&#45;&#45;' }}

                                    </span>
                                </div>
                            </div>
                            <hr>
                            <div class="XDC-detail-section d-flex justify-content-between">
                                <div class="XDC-detail-label align-items-center">Est. Owner ROI
                                    <img
                                        src="/app/assets/img/info.svg"
                                        alt="info-icon"
                                        class="ml-2">
                                </div>
                                <div class="XDC-detail-value-small">
                                    <span
                                        :class="'XDC-info__description'">
                                        {{ mnROI ? mnROI + '%' : '-&#45;&#45;' }}
                                    </span>
                                </div>
                            </div>
                            <hr>
                            <div class="XDC-detail-section d-flex justify-content-between mb-0">
                                <div class="XDC-detail-label">Commission</div>
                                <div class="XDC-detail-value-small">
                                    <span
                                        :class="'XDC-info__description'">
                                        ToDo
                                        <!-- {{ mnROI ? mnROI + '%' : '---' }} -->
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- My comment start -->
                        <!-- <div class="XDC-detail">
                            <div
                                class="XDC-detail-section">
                                <div class="XDC-detail-label">Voter</div>
                                <div class="XDC-detail-value-small">{{ voter }}</div>
                            </div>
                            <div
                                v-if="isReady"
                                class="XDC-detail-section">
                                <div class="XDC-detail-label">Balance</div>
                                <div class="XDC-detail-value-big">{{ formatCurrencySymbol(formatBigNumber(balance, 3)) }}</div>
                            </div>
                            <div
                                class="XDC-detail-section">
                                <div class="XDC-detail-label">Total voted</div>
                                <div class="XDC-detail-value-big">{{ formatCurrencySymbol(formatNumber(totalVoted)) }}</div>
                            </div>
                        </div> -->
                        <!-- My comment end -->

                        <!--<div class="section section&#45;&#45;candidate">
                            <div class="section-title">
                                <span>
                                    {{ (candidate.rank) ? `${candidate.rank}. ${candidate.name}` : candidate.name }}
                                </span>

                                <router-link
                                    v-if="account === candidate.owner"
                                    :to="'/candidate/' + candidate.address + '/update'"
                                    class="edit-link">
                                    <i class="tm-edit ml-2 mr-0" />
                                </router-link>
                                <span class="text-truncate section-title__description">{{ candidate.address }}</span>
                                <ul class="list-inline social-links">
                                    <li
                                        v-for="(value, key) in candidate.socials"
                                        :key="key"
                                        class="list-inline-item social-links__item">
                                        <a
                                            v-if="value !== ''"
                                            :href="value"
                                            target="_blank"
                                            class="social-links__link">
                                            <i :class="'social-links__icon tm-' + key" />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div class="row m-md-0">
                                <div
                                    class="col-12 XDC-info text-truncate">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Owner</span>
                                    </p>
                                    <p class="XDC-info__description color-cyan">
                                        <router-link
                                            :to="'/voter/' + candidate.owner"
                                            class="text-truncate">
                                            {{ candidate.owner }}
                                        </router-link>
                                    </p>
                                </div>
                                <div
                                    v-if="candidate.status !== 'STANDBY'"
                                    class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Latest Signed Block</span>
                                    </p>
                                    <p class="'XDC-info__description'">
                                        <span
                                            :class="`float-left mr-2 XDC-status-dot&#45;&#45;${getColor(
                                            candidate.latestSignedBlock || 0, currentBlock)}`">
                                            {{ formatNumber(candidate.latestSignedBlock) }}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Capacity</span>
                                    </p>
                                    <p
                                        id="XDC-info__description&#45;&#45;cap"
                                        class="'XDC-info__description'">
                                        {{ formatCurrencySymbol(formatBigNumber(candidate.cap, 3)) }}
                                        <b-tooltip
                                            v-if="checkLongNumber(candidate.cap)"
                                            ref="tooltip"
                                            target="XDC-info__description&#45;&#45;cap">
                                            {{ formatCurrencySymbol(formatBigNumber(candidate.cap, 6)) }}
                                        </b-tooltip>
                                    </p>
                                </div>
                                <div
                                    v-if="isReady"
                                    class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <i class="tm-arrow-up XDC-info__icon" />
                                        <span class="XDC-info__text">You voted</span>
                                    </p>
                                    <p
                                        id="XDC-info__description&#45;&#45;you-voted"
                                        class="'XDC-info__description'">
                                        {{ formatCurrencySymbol(formatNumber(candidate.voted)) }}
                                        <b-tooltip
                                            v-if="checkLongNumber(candidate.voted)"
                                            ref="tooltip"
                                            target="XDC-info__description&#45;&#45;you-voted">
                                            {{ formatCurrencySymbol(formatBigNumber(candidate.voted, 6)) }}
                                        </b-tooltip>
                                    </p>
                                </div>
                                <div
                                    class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <span
                                            class="XDC-info__text">
                                            Status
                                        </span>
                                    </p>
                                    <p
                                        :class="{ 'color-cyan': candidate.status === 'MASTERNODE',
                                                  'color-pink': candidate.status === 'SLASHED',
                                                  'color-pink': candidate.status === 'RESIGNED' }"
                                        class="'XDC-info__description'">
                                        {{ candidate.status }}
                                    </p>
                                </div>
                                <div class="col-12 order-md-1 order-lg-0 XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Hardware</span>
                                    </p>
                                    <p class="'XDC-info__description'">
                                        {{ candidate.hardwareInfo }}
                                    </p>
                                </div>
                                <div
                                    v-for="(value, key) in candidate.dataCenterInfo"
                                    :key="key"
                                    class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">{{ key }}</span>
                                    </p>
                                    <p class="'XDC-info__description'">
                                        {{ value }}
                                    </p>
                                </div>
                                <div class="col-12 XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Est. Staking ROI</span>
                                    </p>
                                    <p
                                        id="XDC-info__description&#45;&#45;balance"
                                        class="'XDC-info__description'">
                                        {{ voterROI ? voterROI + '%' : '-&#45;&#45;' }}
                                    </p>
                                </div>
                                <div class="col-12   XDC-info">
                                    <p class="XDC-info__title">
                                        <span class="XDC-info__text">Est. Owner ROI</span>
                                    </p>
                                    <p
                                        id="XDC-info__description&#45;&#45;balance"
                                        class="'XDC-info__description'">
                                        {{ mnROI ? mnROI + '%' : '-&#45;&#45;' }}
                                    </p>
                                </div>
                            </div>
                            <div
                                class="buttons text-right">
                                <b-button
                                    v-if="candidate.owner === account && candidate.status !== 'RESIGNED'"
                                    :to="`/resign/${candidate.address}`"
                                    variant="secondary">Resign</b-button>
                                <b-button
                                    v-if="candidate.voted > 0"
                                    :to="`/unvoting/${candidate.address}`"
                                    variant="secondary">Unvote</b-button>
                                <b-button
                                    v-if="candidate.status !== 'RESIGNED' && isXDCnet"
                                    :to="`/voting/${candidate.address}`"
                                    variant="primary">Vote</b-button>
                            </div>
                        </div>-->

                    </b-card>
                </div>
                <div
                    class="col-12 col-lg-6 mb-lg-4">
                    <b-card
                        :class="'XDC-card XDC-card--lighter'
                        + (loading ? ' XDC-loading' : '')">
                        <div class="XDC-custom-tab mb-3">
                            <ul>
                                <li>Validator Info</li>
                                <li>Health Check</li>
                            </ul>
                        </div>
                        <div class="XDC-detail-section d-flex justify-content-between">
                            <div class="XDC-detail-label">Owner Address</div>
                            <div class="XDC-detail-value-small">
                                <div
                                    :class="'XDC-info__description'"
                                    class="d-flex align-items-center">
                                    {{ candidate.owner ? candidate.owner : "N/A" }}
                                    <button
                                        v-b-tooltip.hover
                                        v-if="candidate.owner"
                                        ref="copyButton"
                                        :title="tooltipText"
                                        class="btn btn-transparent ml-2"
                                        @click="copyToClipboard(candidate.owner, $event.target)">
                                        <img
                                            src="/app/assets/img/copy-icon.svg"
                                            alt="copy-icon" >
                                    </button>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="XDC-detail-section d-flex justify-content-between">
                            <div class="XDC-detail-label">Coinbase Address</div>
                            <div class="XDC-detail-value-small">
                                <div
                                    :class="'XDC-info__description'"
                                    class="d-flex align-items-center">
                                    {{ candidate.address ? candidate.address : "N/A" }}
                                    <button
                                        v-b-tooltip.hover
                                        v-if="candidate.address"
                                        ref="copyButton"
                                        :title="tooltipText"
                                        class="btn btn-transparent ml-2"
                                        @click="copyToClipboard(candidate.address, $event.target)">
                                        <img
                                            src="/app/assets/img/copy-icon.svg"
                                            alt="copy-icon" >
                                    </button>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="XDC-detail-section d-flex justify-content-between">
                            <div class="XDC-detail-label d-flex align-items-center">Active From
                                <img
                                    src="/app/assets/img/info.svg"
                                    alt="info-icon"
                                    class="ml-2"></div>
                            <div class="XDC-detail-value-small">
                                <span
                                    :class="'XDC-info__description'">
                                    ToDo
                                    <!-- {{ formatCurrencySymbol(formatBigNumber(candidate.cap, 3)) }} -->
                                </span>
                            </div>
                        </div>
                        <hr>
                        <div class="XDC-detail-section d-flex justify-content-between">
                            <div class="XDC-detail-label align-items-center">Location
                                <img
                                    src="/app/assets/img/info.svg"
                                    alt="info-icon"
                                    class="ml-2">
                            </div>
                            <div class="XDC-detail-value-small">
                                <span
                                    :class="'XDC-info__description'">
                                    ToDo
                                    <!-- {{ mnROI ? mnROI + '%' : '---' }} -->
                                </span>
                            </div>
                        </div>
                        <hr>
                        <div class="XDC-detail-section d-flex justify-content-between mb-0">
                            <div class="XDC-detail-label">Hardware</div>
                            <div class="XDC-detail-value-small">
                                <span
                                    :class="'XDC-info__description'">
                                    {{ candidate.hardwareInfo ? candidate.hardwareInfo : "N/A" }}
                                </span>
                            </div>
                        </div>
                        <!-- My comment start--->
                        <!-- <b-tabs
                            pills
                            card
                            class="XDC-tab">
                            <b-tab
                                title="Candidates"
                                active>
                                <div
                                    :class="'section section--candiates'
                                    + (loading ? ' XDC-loading' : '')">
                                    <b-table
                                        :items="candidates"
                                        :fields="candidateFields"
                                        :per-page="perPage"
                                        :sort-by.sync="sortBy"
                                        :sort-desc.sync="sortDesc"
                                        :show-empty="true"
                                        :class="`XDC-table XDC-table--voted${loading ? ' loading' : ''}`"
                                        empty-text="There are no candidates to show"
                                        stacked="md"
                                        @sort-changed="sortingChangeCandidate" >

                                        <template
                                            slot="index"
                                            slot-scope="data">{{ data.index + 1 }}
                                        </template>

                                        <template
                                            slot="address"
                                            slot-scope="data">
                                            <router-link
                                                :to="'/candidate/' + data.item.address"
                                                class="text-truncate">
                                                {{ data.item.address }}
                                            </router-link>
                                        </template>

                                        <template
                                            slot="capacity"
                                            slot-scope="data">
                                            {{ isNaN(data.item.capacity) ? '---' : formatCurrencySymbol(data.item.capacity) }}
                                            <span
                                                v-if="data.item.owner == voter"
                                                :id="`mnowner__${data.index}`">*</span>
                                            <b-tooltip :target="`mnowner__${data.index}`">
                                                This voter owns this node
                                            </b-tooltip>
                                        </template>

                                        <template
                                            slot="totalCapacity"
                                            slot-scope="data">{{ formatCurrencySymbol(formatBigNumber(data.item.totalCapacity, 3)) }}
                                        </template>
                                    </b-table>

                                    <b-pagination
                                        v-if="totalRows > 0 && totalRows > perPage"
                                        :total-rows="totalRows"
                                        :per-page="perPage"
                                        v-model="currentPage"
                                        align="center"
                                        class="XDC-pagination"
                                        @change="candidatePageChange" />
                                </div>
                            </b-tab> -->
                        <!-- My comment end--->

                        <!-- <b-tab
                                title="Voter Rewards">
                                <div
                                    :class="'container section section--voterrewards'
                                    + (rewardLoading ? ' XDC-loading' : '')">
                                    <b-table
                                        :items="voterRewards"
                                        :fields="voterRewardsFields"
                                        :sort-by.sync="voterRewardsSortBy"
                                        :sort-desc.sync="voterRewardsSortDesc"
                                        :per-page="voterRewardsPerPage"
                                        :show-empty="true"
                                        :class="`XDC-table XDC-table--voterrewards${rewardLoading ? ' loading' : ''}`"
                                        empty-text="There are no rewards to show"
                                        stacked="md" >

                                        <template
                                            slot="id"
                                            slot-scope="data">{{ data.index + 1 }}
                                        </template>

                                        <template
                                            slot="checkpoint"
                                            slot-scope="data">{{ data.item.checkpoint }}
                                        </template>

                                        <template
                                            slot="reward"
                                            slot-scope="data">
                                            {{ formatCurrencySymbol(formatNumber(data.item.reward)) }}
                                        </template>

                                        <template
                                            slot="candidateName"
                                            slot-scope="data">
                                            <router-link
                                                :to="'/candidate/' + data.item.candidate"
                                                class="text-truncate">
                                                {{ data.item.candidateName }}
                                            </router-link>
                                        </template>

                                        <template
                                            slot="createdAt"
                                            slot-scope="data">
                                            <span :id="`timestamp__${data.index}`">{{ data.item.createdAt }}</span>
                                            <b-tooltip :target="`timestamp__${data.index}`">
                                                {{ data.item.dateTooltip }}
                                            </b-tooltip>
                                        </template>

                                    </b-table>

                                    <b-pagination
                                        v-if="voterRewardsTotalRows > 0 && voterRewardsTotalRows > voterRewardsPerPage"
                                        :total-rows="voterRewardsTotalRows"
                                        :per-page="voterRewardsPerPage"
                                        v-model="voterRewardsCurrentPage"
                                        align="center"
                                        class="XDC-pagination"
                                        @change="rewardPageChange" />
                                </div>
                            </b-tab> -->

                        <!-- My comment start--->
                        <!-- <b-tab
                                title="Transactions">
                                <div
                                    :class="'container section section--txs'
                                    + (txLoading ? ' XDC-loading' : '')">
                                    <b-table
                                        :items="transactions"
                                        :fields="txFields"
                                        :per-page="txPerPage"
                                        :show-empty="true"
                                        :class="`XDC-table XDC-table--transactions-voter${txLoading ? ' loading' : ''}`"
                                        empty-text="There are no transactions to show"
                                        stacked="md"
                                        @sort-changed="sortingChangeTxes" >

                                        <template
                                            slot="id"
                                            slot-scope="data">{{ data.item.id }}
                                        </template>

                                        <template
                                            slot="candidate"
                                            slot-scope="data">
                                            <router-link
                                                :to="'/candidate/' + data.item.candidate">
                                                {{ truncate(data.item.candidate, 20) }}
                                            </router-link>
                                        </template>

                                        <template
                                            slot="event"
                                            slot-scope="data">
                                            <span :class="'fw-600 ' + getEventClass(data.item.event)">{{ data.item.event }}</span>
                                        </template>

                                        <template
                                            slot="capacity"
                                            slot-scope="data">
                                            {{ isNaN(data.item.cap) ? '---' : formatCurrencySymbol(data.item.cap) }}
                                        </template>

                                        <template
                                            slot="candidateCap"
                                            slot-scope="data">
                                            {{ isNaN(data.item.candidateCap) ? '---' : formatCurrencySymbol(data.item.candidateCap) }}
                                        </template>

                                        <template
                                            slot="tx"
                                            slot-scope="data">
                                            <a
                                                v-b-tooltip.hover.right
                                                :href="`${config.explorerUrl}/txs/${data.item.tx}`"
                                                title="View on XDCScan"
                                                target="_blank">
                                                <i class="tm-eye" />
                                                <span>View on XDCScan</span>
                                            </a>
                                        </template>
                                    </b-table>

                                    <b-pagination
                                        v-if="txTotalRows > 0 && txTotalRows > txPerPage"
                                        :total-rows="txTotalRows"
                                        :per-page="txPerPage"
                                        v-model="txCurrentPage"
                                        align="center"
                                        class="XDC-pagination"
                                        @change="txPageChange" />
                                </div>
                            </b-tab>
                        </b-tabs> -->
                        <!-- My comment end--->
                    </b-card>
                </div>

                <div class="col-12">
                    <b-card class="XDC-card pagination xdc-p-none">
                        <div class="XDC-custom-tab mb-3">
                            <ul>
                                <li>Voters</li>
                                <li>Rewards</li>
                                <li>Transactions</li>
                                <li>Reward Metrics</li>
                            </ul>
                        </div>

                        <div
                            :class="
                            + (txLoading ? ' XDC-loading' : '')">
                            <div class="table-wrapper">
                                <div class="d-flex align-items-center justify-content-between px-4">
                                    <h6 class="h6 color-text-3 fw-400 mb-0">People who voted for this candidate</h6>
                                    <div class="XDC-custom-tab">
                                        <ul>
                                            <li>Week</li>
                                            <li>Month</li>
                                            <li>Year</li>
                                        </ul>
                                    </div>
                                </div>
                                <b-table
                                    :items="transactions"
                                    :fields="txFields"
                                    :per-page="txPerPage"
                                    :show-empty="true"
                                    :class="`XDC-table XDC-table--transactions-voter${txLoading ? ' loading' : ''}`"
                                    :style="(txTotalRows > 0 && txTotalRows < txPerPage) ? { borderRadius: '12px', marginBottom:'0' } : {}"
                                    empty-text="There are no transactions to show"
                                    stacked="md"
                                    @sort-changed="sortingChangeTxes" >

                                    <template
                                        slot="id"
                                        slot-scope="data">{{ data.item.id }}
                                    </template>

                                    <template
                                        slot="candidate"
                                        slot-scope="data">
                                        <router-link
                                            :to="'/candidate/' + data.item.candidate">
                                            {{ truncate(data.item.candidate, 20) }}
                                        </router-link>
                                    </template>

                                    <template
                                        slot="event"
                                        slot-scope="data">
                                        <span :class="'fw-600 ' + getEventClass(data.item.event)">{{ data.item.event }}</span>
                                    </template>

                                    <template
                                        slot="capacity"
                                        slot-scope="data">
                                        {{ isNaN(data.item.cap) ? '---' : formatCurrencySymbol(data.item.cap) }}
                                    </template>

                                    <template
                                        slot="candidateCap"
                                        slot-scope="data">
                                        {{ isNaN(data.item.candidateCap) ? '---' : formatCurrencySymbol(data.item.candidateCap) }}
                                    </template>

                                    <template
                                        slot="tx"
                                        slot-scope="data">
                                        <a
                                            v-b-tooltip.hover.right
                                            :href="`${config.explorerUrl}/txs/${data.item.tx}`"
                                            title="View on XDCScan"
                                            target="_blank">
                                            <i class="tm-eye" />
                                            <span>View on XDCScan</span>
                                        </a>
                                    </template>
                                </b-table>

                                <b-pagination
                                    v-if="txTotalRows > 0 && txTotalRows > txPerPage"
                                    :total-rows="txTotalRows"
                                    :per-page="txPerPage"
                                    v-model="txCurrentPage"
                                    align="center"
                                    class="XDC-pagination"
                                    @change="txPageChange" />
                            </div>
                        </div>
                        <!--<div class="section section&#45;&#45;voter">
                    <div class="row">
                        <div class="col-12">
                            <div class="section-title">
                                <i class="tm-arrow-up color-pink" />
                                <span>Voter</span>
                                <span class="text-truncate section-title__description">{{ voter }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="row row-grid">
                        <div
                            v-if="isReady"
                            class="col-12 XDC-info">
                            <p class="XDC-info__title">
                                <i class="tm-dot XDC-info__icon" />
                                <span class="XDC-info__text">Balance</span>
                            </p>
                            <p
                                id="XDC-info__description&#45;&#45;balance"
                                class="'XDC-info__description'">
                                {{ formatCurrencySymbol(formatBigNumber(balance, 3)) }}
                                <b-tooltip
                                    v-if="checkLongNumber(balance)"
                                    ref="tooltip"
                                    target="XDC-info__description&#45;&#45;balance">
                                    {{ formatCurrencySymbol(formatBigNumber(balance, 6)) }}
                                </b-tooltip>
                            </p>
                        </div>
                        <div class="col-12 XDC-info">
                            <p class="XDC-info__title">
                                <i class="tm-dot XDC-info__icon" />
                                <span class="XDC-info__text">Total voted</span>
                            </p>
                            <p
                                id="XDC-info__description&#45;&#45;voted"
                                class="'XDC-info__description'">
                                {{ formatCurrencySymbol(formatNumber(totalVoted)) }}
                                <b-tooltip
                                    v-if="checkLongNumber(totalVoted)"
                                    ref="tooltip"
                                    target="XDC-info__description&#45;&#45;voted">
                                    {{ formatCurrencySymbol(formatBigNumber(totalVoted, 6)) }}
                                </b-tooltip>
                            </p>
                        </div>
                    </div>
                </div>-->
            </b-card></div></b-row>
        </div>
    </div>
</template>
<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import store from 'store'

export default {
    name: 'App',
    metaInfo: {
        title: 'Staker Details | XDC Network Governance DApp',
        meta: [
            { name: 'description', content: 'Staking history, Reward history, Masternode list, Transaction list. You can use mobile, desktop, hardware wallet - ledger nano, trezor to stake XDC Network' } // eslint-disable-line
        ]
    },
    data () {
        return {
            candidate: {
                address: '',
                name: '',
                balance: '',
                status: '',
                cap: 0,
                latestBlock: '',
                latestSignedBlock: 0,
                rewarded: 0,
                hardwareInfo: '',
                dataCenterInfo: {},
                socials: {},
                voted: 0,
                slashedTimes: 0,
                rank: ''
            },
            candidateFields: [
                {
                    key: 'address',
                    label: 'Address',
                    sortable: false
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: false
                },
                {
                    key: 'status',
                    label: 'Status',
                    sortable: false
                },
                {
                    key: 'status',
                    label: 'Status',
                    sortable: false
                },
                {
                    key: 'capacity',
                    label: 'Voted Capacity',
                    sortable: true
                },
                {
                    key: 'totalCapacity',
                    label: 'Capacity',
                    sortable: true
                }
            ],
            sortBy: 'capacity',
            sortDesc: true,
            isReady: !!this.web3,
            tooltipText: 'Copy to clipboard',
            voter: this.$route.params.address.toLowerCase(),
            candidates: [],
            balance: 0,
            totalVoted: 0,
            currentPage: 1,
            perPage: 10,
            totalRows: 0,
            voterRewards: [],
            voterRewardsFields: [
                {
                    key: 'epoch',
                    label: 'Epoch',
                    sortable: false
                },
                {
                    key: 'candidateName',
                    label: 'Masternode',
                    sortable: false
                },
                {
                    key: 'signNumber',
                    label: 'Sign No.',
                    sortable: false
                },
                {
                    key: 'reward',
                    label: 'Reward',
                    sortable: false
                },
                {
                    key: 'createdAt',
                    label: 'Age',
                    sortable: false
                }
            ],
            voterRewardsCurrentPage: 1,
            voterRewardsSortBy: 'epoch',
            voterRewardsPerPage: 10,
            voterRewardsSortDesc: true,
            voterRewardsTotalRows: 0,
            loading: false,
            rewardLoading: false,
            txLoading: false,
            txFields: [
                {
                    key: 'candidate',
                    label: 'Address',
                    sortable: false
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: false
                },
                {
                    key: 'event',
                    label: 'Event',
                    sortable: true
                },
                {
                    key: 'capacity',
                    label: 'Amount',
                    sortable: true
                },
                {
                    key: 'candidateCap',
                    label: 'Capacity',
                    sortable: true
                },
                {
                    key: 'createdAt',
                    label: 'Age',
                    sortable: false
                }
            ],
            transactions: [],
            txCurrentPage: 1,
            txPerPage: 10,
            txTotalRows: 0,
            txSortBy: 'createdAt',
            txSortDesc: true,
            voterROI: '',
            mnROI: ''
        }
    },
    computed: { },
    watch: {
        $route (to, from) {
            this.voter = to.params.address.toLowerCase()
            this.getCandidates()
            this.getTransactions()
            this.getRewards()
        }
    },
    update () {},
    created: async function () {
        let self = this
        self.config = store.get('configMaster') || await self.appConfig()

        self.getCandidates()
        self.getRewards()
        self.getTransactions()
    },
    methods: {
        getEventClass (event) {
            let clazz = ''
            if (event === 'Unvote' || event === 'Resign') {
                clazz = 'color-pink'
            }

            return clazz
        },

        async getCandidateData (candidate) {
            let self = this

            try {
                let address = candidate.address

                self.loading = true
                const candidatePromise = axios.get(`/api/candidates/${address}`)

                // Get candidate's information
                let c = await candidatePromise

                if (c.data) {
                    let data = c.data
                    console.log('data', data)
                    self.isCandidate = data.candidate
                    self.candidate.address = data.candidate
                    self.candidate.name = data.name ? data.name : 'XDC.Network'
                    self.candidate.status = data.status
                    self.candidate.nodeId = data.nodeId
                    self.candidate.owner = data.owner
                    self.candidate.cap = new BigNumber(data.capacity).div(10 ** 18).toNumber()
                    self.candidate.rewarded = 0
                    self.candidate.latestBlock = '0'
                    self.candidate.latestSignedBlock = data.latestSignedBlock
                    self.candidate.hardwareInfo = data.hardware || 'N/A'
                    self.candidate.dataCenterInfo = {
                        name: (data.dataCenter || {}).name || 'N/A',
                        location: (data.dataCenter || {}).location || 'N/A'
                    }
                    self.candidate.socials = data.socials
                    self.candidate.slashedTimes = data.slashedTimes
                    self.candidate.rank = data.rank

                    if (data.rank) {
                        await self.getAnnualReward(data)
                    }
                }

                self.loading = false
            } catch (e) {
                self.loading = false
                console.log(e)
            }
        },

        async copyToClipboard (text, button) {
            try {
                await navigator.clipboard.writeText(text)
                this.tooltipText = 'Copied!'

                // Force tooltip to show immediately
                this.$root.$emit('bv::disable::tooltip', button)
                this.$root.$emit('bv::enable::tooltip', button)
                this.$root.$emit('bv::show::tooltip', button)

                // Reset tooltip text after 2 seconds
                setTimeout(() => {
                    this.tooltipText = 'Copy to clipboard'
                    this.$root.$emit('bv::hide::tooltip', button)
                }, 2000)
            } catch (err) {
                console.error('Failed to copy text: ', err)
            }
        },
        async getCandidates () {
            let self = this
            try {
                let voter = self.$route.params.address

                self.loading = true
                const params = {
                    page: self.currentPage,
                    limit: self.perPage,
                    sortBy: self.sortBy,
                    sortDesc: self.sortDesc
                }
                const candiatePromise = axios.get(`/api/voters/${voter}/candidates?${self.serializeQuery(params)}`)

                // Candidate table
                let candidates = await candiatePromise
                let items = []

                candidates.data.items.map(async (c) => {
                    items.push({
                        address: c.candidate,
                        name: c.candidateName,
                        status: c.status,
                        owner: c.owner,
                        capacity: new BigNumber(c.capacity).div(10 ** 18).toNumber(),
                        totalCapacity: new BigNumber(c.totalCapacity).div(10 ** 18).toNumber()
                    })
                })

                self.totalVoted = candidates.data.totalVoted
                self.candidates = items
                if (items[0]) {
                    await self.getCandidateData(items[0])
                }
                self.totalRows = candidates.data.total

                if (typeof self.web3 !== 'undefined') {
                    self.web3.eth.getBalance(voter, function (a, b) {
                        self.balance = new BigNumber(b).div(10 ** 18).toNumber()
                        if (a) {
                            throw Error(a)
                        }
                    })
                }

                self.loading = false
            } catch (e) {
                self.loading = false
                console.log(e)
            }
        },
        async getTransactions () {
            try {
                const self = this
                const voter = self.$route.params.address
                self.txLoading = true
                const params = {
                    page: self.txCurrentPage,
                    limit: self.txPerPage,
                    sortBy: self.txSortBy,
                    sortDesc: self.txSortDesc
                }

                const txPromise = axios.get(`/api/transactions/voter/${voter}?${self.serializeQuery(params)}`)

                // transaction table
                let txs = await txPromise
                console.log('txs', txs)

                let items = []

                txs.data.items.map((tx, idx) => {
                    items.push({
                        tx: tx.tx,
                        voter: tx.voter,
                        candidate: tx.candidate,
                        event: tx.event,
                        cap: new BigNumber(tx.capacity).div(10 ** 18).toNumber(),
                        createdAt: moment(tx.createdAt).fromNow(),
                        name: tx.name || '---',
                        candidateCap: (new BigNumber(tx.currentCandidateCap).div(10 ** 18).toNumber()) || '---'
                    })
                })
                self.transactions = items

                self.txTotalRows = txs.data.total
                self.txLoading = false
            } catch (error) {
                self.txLoading = false
                console.log(error)
            }
        },
        async getRewards () {
            try {
                const self = this
                const voter = self.$route.params.address
                self.rewardLoading = true

                const params = {
                    page: self.voterRewardsCurrentPage,
                    limit: self.voterRewardsPerPage
                }

                const rewardPromise = axios.get(`/api/voters/${voter}/rewards?${self.serializeQuery(params)}`)

                // voter reward table
                let voterRewards = await rewardPromise
                let items = []

                voterRewards.data.items.map((r) => {
                    items.push({
                        epoch: r.epoch,
                        candidate: r.validator,
                        candidateName: r.candidateName,
                        startBlockNumber: r.startBlockNumber,
                        endBlockNumber: r.endBlockNumber,
                        signNumber: r.signNumber,
                        reward: new BigNumber(r.reward).toFixed(6),
                        createdAt: moment(r.rewardTime).fromNow(),
                        dateTooltip: moment(r.rewardTime).format('lll')
                    })
                })
                self.voterRewards = items

                self.voterRewardsTotalRows = voterRewards.data.total
                self.rewardLoading = false
            } catch (error) {
                self.rewardLoading = false
                console.log(error)
            }
        },
        txPageChange (val) {
            if (this.txCurrentPage !== val) {
                this.txCurrentPage = val
                this.getTransactions()
            }
        },
        rewardPageChange (val) {
            if (this.voterRewardsCurrentPage !== val) {
                this.voterRewardsCurrentPage = val
                this.getRewards()
            }
        },
        candidatePageChange (val) {
            if (this.currentPage !== val) {
                this.currentPage = val
                this.getCandidates()
            }
        },
        sortingChangeCandidate (obj) {
            if (obj.sortBy === 'totalCapacity') {
                return this.candidates.slice().sort(function (a, b) {
                    return b.totalCapacity - a.totaCapacity
                })
            }
            this.sortBy = obj.sortBy
            this.sortDesc = obj.sortDesc
            this.getCandidates()
        },
        sortingChangeTxes (obj) {
            this.txSortBy = obj.sortBy
            this.txSortDesc = obj.sortDesc
            this.getTransactions()
        },
        async getAnnualReward (data) {
            axios.get('/api/voters/annualReward?candidate=' + data.candidate)
                .then((result) => {
                    if (result.data && result.data.voterROI) {
                        this.voterROI = result.data.voterROI.toFixed(2)
                    }
                    if (result.data && result.data.mnROI) {
                        this.mnROI = result.data.mnROI.toFixed(2)
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.$toasted.show(error, { type: 'error' })
                })
        }
    }
}
</script>
