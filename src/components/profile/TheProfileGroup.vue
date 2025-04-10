<template>
  <div class="container mt-4">
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'owned' }" @click="activeTab = 'owned'">My Groups</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'joined' }" @click="activeTab = 'joined'">Joined Groups</button>
      </li>
    </ul>

    <div v-if="activeTab === 'owned'" class="tab-content p-3">
      <h4>My Groups</h4>
      <div v-for="group in ownedGroups" :key="group.code" class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">{{ group.name }}, Group code: {{ group.code }}</h5>
          <p class="fw-bold">Members:</p>
          <ul class="list-group mb-2">
            <li v-for="member in group.members" :key="member" class="list-group-item d-flex justify-content-between align-items-center">
              {{ getMemberName(group, member) }}
              <button v-if="member !== auth.currentUser?.uid" @click="groupStore.removeMember(group.code, member)" class="btn btn-danger btn-sm">Remove</button>
            </li>
          </ul>
          <p class="fw-bold">Pending Members:</p>
          <ul class="list-group">
            <li v-for="member in group.pendingMembers" :key="member" class="list-group-item d-flex justify-content-between align-items-center">
              {{ getMemberName(group, member) }}
              <div>
                <button @click="groupStore.acceptMember(group.code, member)" class="btn btn-success btn-sm me-2">Accept</button>
                <button @click="groupStore.rejectMember(group.code, member)" class="btn btn-warning btn-sm">Reject</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'joined'" class="tab-content p-3">
      <h4>Joined Groups</h4>
      <div v-for="group in joinedGroups" :key="group.code" class="card mb-3">
        <div class="card-body d-flex justify-content-between align-items-center">
          <h5 class="card-title">{{ group.name }}</h5>
          <button @click="groupStore.leaveGroup(group.code)" class="btn btn-secondary btn-sm">Leave Group</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getAuth } from "firebase/auth";
import { useGroupStore } from "@/stores/groupStore";
import { Toaster, toast } from 'vue-sonner'
const groupStore = useGroupStore();
const auth = getAuth();
const activeTab = ref("owned");

const ownedGroups = computed(() => groupStore.ownedGroups);
const joinedGroups = computed(() => groupStore.joinedGroups);

onMounted(async () => {
  await groupStore.fetchGroups();
});

type Member = string | { uid: string; firstName?: string; lastName?: string };
type Group = { memberDetails?: Record<string, { firstName?: string; lastName?: string }> };

const getMemberName = (group: Group, member: Member): string => {
  if (typeof member === "string") {
    if (member === auth.currentUser?.uid) {
      return "You";
    }

    if (group.memberDetails && group.memberDetails[member]) {
      const memberInfo = group.memberDetails[member];
      return `${memberInfo.firstName || ""} ${memberInfo.lastName || ""}`.trim() || member.substring(0, 8);
    }

    return member.substring(0, 8) + "...";
  } else if (typeof member === "object" && member !== null) {
    if (member.uid === auth.currentUser?.uid) {
      return "You";
    }

    return `${member.firstName || ""} ${member.lastName || ""}`.trim() || (member.uid ? member.uid.substring(0, 8) + "..." : "Unknown");
  }

  return "Unknown Member";
};
</script>
