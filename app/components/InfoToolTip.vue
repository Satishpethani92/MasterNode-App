<template>
    <img
        v-b-tooltip.hover
        :title="content"
        src="/app/assets/img/info.svg"
        alt="info-icon"
        class="ml-2">
</template>

<script>
export default {
    props: {
        content: {
            type: String,
            required: true
        }
    }
}
</script>
