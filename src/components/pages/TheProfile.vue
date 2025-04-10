<template>
  <div class="container mt-4">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="text-center">User Profile</h4>
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-center gap-3 mb-3">
          <button class="btn" :class="isToggled === 'profileInfo' ? 'btn-primary' : 'btn-outline-primary'" @click="isToggled = 'profileInfo'">Profile Info</button>

          <button class="btn" :class="isToggled === 'profileGroups' ? 'btn-primary' : 'btn-outline-primary'" @click="isToggled = 'profileGroups'">Groups Manager</button>
        </div>

        <TheProfileGroup v-if="isToggled === 'profileGroups'" />
        <TheProfileInfo v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TheProfileInfo from "@/components/profile/TheProfileInfo.vue";
import TheProfileGroup from "@/components/profile/TheProfileGroup.vue";
import { ref } from "vue";
import { Toaster, toast } from "vue-sonner";
const isToggled = ref("profileInfo");
</script>

<style scoped>
.btn {
  min-width: 150px;
}
</style>
