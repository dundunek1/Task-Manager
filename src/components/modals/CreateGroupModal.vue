<template>
  <div class="modal fade" id="createGroupModal" tabindex="-1" aria-labelledby="createGroupModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="createGroupModalLabel">{{ isJoining ? "Join Group" : "Create Group" }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="group-name" class="form-label">Group Name</label>
              <input type="text" v-if="!isJoining" id="group-name" v-model="groupName" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="group-code" class="form-label">{{ isJoining ? "Group Code" : "Group Code (Auto Generated)" }}</label>
              <input type="text" id="group-code" v-model="groupCode" class="form-control" :disabled="!isJoining" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">{{ isJoining ? "Join Group" : "Create Group" }}</button>
            <button type="button" class="btn btn-link w-100" @click="toggleMode">{{ isJoining ? "Create New Group" : "Join Existing Group" }}</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db, doc, setDoc, getDoc } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useRouter } from "vue-router";
import { useGroupStore } from "@/stores/groupStore";
import { Toaster, toast } from "vue-sonner";
const groupStore = useGroupStore();
const groupCode = ref("");
const groupName = ref("");
const isJoining = ref(false);
const router = useRouter();
const auth = getAuth();

const generateGroupCode = () => {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  groupCode.value = code;
};
const userInfo = ref<{ email: string; firstName?: string; lastName?: string } | null>(null);

const fetchUserData = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No logged-in user");
    return;
  }

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      userInfo.value = {
        email: currentUser.email || "Not available",
        firstName: data.firstName || "Not available",
        lastName: data.lastName || "",
      };

      console.log("User data fetched:", userInfo.value);
    } else {
      console.warn("User document does not exist");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};
const createGroup = async () => {
  if (!groupName.value) return;

  try {
    generateGroupCode();

    const newGroupRef = doc(db, "groups", groupCode.value);
    await setDoc(newGroupRef, {
      name: groupName.value,
      code: groupCode.value,
      createdAt: new Date(),
      members: [auth.currentUser?.uid],
      pendingMembers: [],
      owner: auth.currentUser?.uid,
      statusesOrder: ["To Do", "In Progress", "Completed", "Blocked", "On Hold"],
    });

    groupName.value = "";
    groupCode.value = "";

    groupStore.fetchGroups();
    toast.success("Group created successfully!");
    console.log("Group created successfully!");
  } catch (error) {
    console.error("Error creating group:", error);
    toast.error("Error creating group:", error);
  }
};

const joinGroup = async () => {
  if (!groupCode.value) return;

  if (!userInfo.value) {
    console.log("Fetching user data before joining...");
    await fetchUserData();
  }

  try {
    const groupRef = doc(db, "groups", groupCode.value);
    const groupSnapshot = await getDoc(groupRef);

    if (!groupSnapshot.exists()) {
      toast.error("Group does not exist");
      console.error("Group does not exist");
      return;
    }

    const groupData = groupSnapshot.data();
    const members = groupData?.members || [];
    const pendingMembers = groupData?.pendingMembers || [];

    if (members.includes(auth.currentUser?.uid)) {
      console.log("You are already a member of this group");
      return;
    }

    if (pendingMembers.some((member: any) => member.uid === auth.currentUser?.uid)) {
      console.log("You are already waiting for approval");
      return;
    }

    pendingMembers.push({
      uid: auth.currentUser?.uid,
      firstName: userInfo.value?.firstName || "Unknown",
      lastName: userInfo.value?.lastName || "Unknown",
    });

    await setDoc(groupRef, { pendingMembers }, { merge: true });
    groupCode.value = "";
    console.log("Successfully joined the group, waiting for approval");
  } catch (error) {
    console.error("Error joining group:", error);
  }
};

const handleSubmit = () => {
  if (isJoining.value) {
    joinGroup();
  } else {
    createGroup();
  }
};

const toggleMode = () => {
  isJoining.value = !isJoining.value;
  groupCode.value = "";
  groupName.value = "";
};

onMounted(() => {
  if (!isJoining.value) {
    generateGroupCode();
  }
  fetchUserData();
});
</script>
