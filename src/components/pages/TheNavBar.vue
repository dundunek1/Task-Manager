<template>
  <nav class="navbar navbar-expand-sm navbar-light bg-light sticky-top">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">Task Manager</router-link>

      <button
        class="navbar-toggler ms-auto"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Dashboard</router-link>
          </li>
          <li class="nav-item dropdown">
            <button class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">Groups</button>
            <ul class="dropdown-menu dropdown-menu">
              <li v-if="allGroups.length === 0">No groups found</li>
              <li v-for="group in allGroups" :key="group.code">
                <a class="dropdown-item" @click="groupStore.setSelectedGroup(group)">
                  <i v-if="isOwner(group)" class="fa-solid fa-user-tie ms-1"></i>
                  <i v-else class="fa-solid fa-users ms-1"></i>
                  {{ group.name }}
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <button class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">Filter</button>
            <ul class="dropdown-menu">
              <li v-for="status in statuses" :key="status">
                <router-link to="/filtered" class="dropdown-item" @click="groupStore.selectedStatus = status">
                  {{ status }}
                </router-link>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createGroupModal">Create / Join Group</button>
          </li>
        </ul>

        <div class="d-flex align-items-center ms-auto">
          <router-link to="/profile" class="d-flex align-items-center text-decoration-none text-dark">
            <i class="fas fa-user-circle m-lg-2" style="font-size: 24px"></i>
            <button v-if="authStore.user" @click="handleLogout" class="btn btn-outline-danger d-flex align-items-center"><i class="fas fa-sign-out-alt"></i></button>
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Toaster, toast } from "vue-sonner";
const groupStore = useGroupStore();
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const allGroups = computed(() => {
  const seen = new Set();
  return [...groupStore.ownedGroups, ...groupStore.joinedGroups].filter((group) => {
    if (seen.has(group.code)) {
      return false;
    }
    seen.add(group.code);
    return true;
  });
});
const isOwner = (group: { code: string }) => {
  return groupStore.ownedGroups.some((ownedGroup) => ownedGroup.code === group.code);
};
const handleLogout = async () => {
  await authStore.logout();
  toast.info("Logged out");
  router.push("/login");
};
const statuses: string[] = ["To Do", "In Progress", "Completed", "Blocked", "On Hold", "Your Tasks"];
</script>
