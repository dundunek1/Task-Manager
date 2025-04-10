<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";
import { Toaster, toast } from "vue-sonner";
import TheNavBar from "@/components/pages/TheNavBar.vue";
import CreateGroupModal from "@/components/modals/CreateGroupModal.vue";
const route = useRoute();
</script>

<template>
  <TheNavBar v-if="!route.meta.hideNav" />
  <Toaster richColors position="top-center" />
  <CreateGroupModal />
  <router-view></router-view>
</template>

<style scoped></style>
