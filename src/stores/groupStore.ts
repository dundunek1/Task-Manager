import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { db } from "@/firebaseConfig";
import { getDocs, collection, query, where, doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { Toaster, toast } from "vue-sonner";
import { getAuth } from "firebase/auth";

export const useGroupStore = defineStore("group", () => {
  const selectedGroup = ref<{ code: string; name: string; members: any } | null>(null);
  const userGroups = ref<Array<{ code: string; name: string; members: any }>>([]);
  const ownedGroups = ref<Array<any>>([]);
  const joinedGroups = ref<Array<any>>([]);
  const statuses = ref<string[]>([]);
  const selectedStatus = ref("");
  const auth = getAuth();

  const fetchStatusesForGroup = async (groupCode: string) => {
    try {
      const groupRef = doc(db, "groups", groupCode);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const data = groupSnap.data();
        statuses.value = data.statusesOrder || ["To Do", "In Progress", "Completed"];
      } else {
        toast.warning("Group not found!");
        console.error("Group not found!");
      }
    } catch (error) {
      toast.error("Error fetching statuses");
      console.error("Error fetching statuses:", error);
    }
  };

  const updateStatuses = async (newStatuses: string[]) => {
    if (!selectedGroup.value) return;

    try {
      const groupRef = doc(db, "groups", selectedGroup.value.code);
      await updateDoc(groupRef, { statusesOrder: newStatuses });
      statuses.value = newStatuses;
    } catch (error) {
      console.error("Error updating statuses:", error);
    }
  };

  const setSelectedGroup = (group: { code: string; name: string; members: any }) => {
    selectedGroup.value = group;
    selectedGroup.value.members = group.members || [];
    fetchStatusesForGroup(group.code);
  };

  const fetchGroups = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User is not authenticated.");
        return;
      }

      const groupsSnapshot = await getDocs(collection(db, "groups"));
      ownedGroups.value = [];
      joinedGroups.value = [];

      groupsSnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const group = {
          code: docSnapshot.id,
          ...data,
          members: Array.isArray(data.members) ? data.members : [],
          pendingMembers: Array.isArray(data.pendingMembers) ? data.pendingMembers : [],
          memberDetails: data.memberDetails || {},
        };

        if (data.owner === user.uid) {
          ownedGroups.value.push(group);
        } else if (Array.isArray(data.members)) {
          const isMember = data.members.some((member) => {
            if (typeof member === "string") {
              return member === user.uid;
            } else if (typeof member === "object" && member !== null) {
              return member.uid === user.uid;
            }
            return false;
          });

          if (isMember) {
            joinedGroups.value.push(group);
            console.log("Added to joinedGroups:", group);
          }
        }
      });

      console.log("Owned groups:", ownedGroups.value);
      console.log("Joined groups:", joinedGroups.value);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchGroupsWithQuery = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User is not authenticated.");
        return;
      }

      const ownedGroupsQuery = query(collection(db, "groups"), where("owner", "==", user.uid));
      const ownedGroupsSnapshot = await getDocs(ownedGroupsQuery);

      const joinedGroupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
      const joinedGroupsSnapshot = await getDocs(joinedGroupsQuery);

      ownedGroups.value = ownedGroupsSnapshot.docs.map((doc) => ({
        code: doc.id,
        ...doc.data(),
        members: Array.isArray(doc.data().members) ? doc.data().members : [],
        pendingMembers: Array.isArray(doc.data().pendingMembers) ? doc.data().pendingMembers : [],
        memberDetails: doc.data().memberDetails || {},
      }));

      const ownedIds = new Set(ownedGroups.value.map((g) => g.code));
      joinedGroups.value = joinedGroupsSnapshot.docs
        .filter((doc) => !ownedIds.has(doc.id))
        .map((doc) => ({
          code: doc.id,
          ...doc.data(),
          members: Array.isArray(doc.data().members) ? doc.data().members : [],
          pendingMembers: Array.isArray(doc.data().pendingMembers) ? doc.data().pendingMembers : [],
          memberDetails: doc.data().memberDetails || {},
        }));

      console.log("Owned groups:", ownedGroups.value);
      console.log("Joined groups:", joinedGroups.value);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const acceptMember = async (groupCode: string, member: string) => {
    try {
      const groupRef = doc(db, "groups", groupCode);
      await updateDoc(groupRef, {
        members: arrayUnion(member),
        pendingMembers: arrayRemove(member),
      });
      toast.success("User has been added");
      await fetchGroups();
    } catch (error) {
      toast.error("Error accepting member");
      console.error("Error accepting member:", error);
    }
  };

  const rejectMember = async (groupCode: string, member: string) => {
    try {
      const groupRef = doc(db, "groups", groupCode);
      await updateDoc(groupRef, {
        pendingMembers: arrayRemove(member),
      });
      await fetchGroups();
      toast.success("User has been rejected");
    } catch (error) {
      toast.error("Error rejecting member");
      console.error("Error rejecting member:", error);
    }
  };

  const removeMember = async (groupCode: string, member: string) => {
    try {
      const groupRef = doc(db, "groups", groupCode);
      await updateDoc(groupRef, {
        members: arrayRemove(member),
      });
      await fetchGroups();
      toast.success("User has been deleted");
    } catch (error) {
      toast.error("Error removing member");
      console.error("Error removing member:", error);
    }
  };

  const leaveGroup = async (groupCode: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const groupRef = doc(db, "groups", groupCode);
      await updateDoc(groupRef, {
        members: arrayRemove(user.uid),
      });
      await fetchGroups();
      toast.success("You have left the group.");
    } catch (error) {
      toast.error("Error leaving group");
      console.error("Error leaving group:", error);
    }
  };

  return {
    selectedGroup,
    userGroups,
    setSelectedGroup,
    fetchGroups,
    fetchGroupsWithQuery,
    removeMember,
    rejectMember,
    acceptMember,
    ownedGroups,
    joinedGroups,
    leaveGroup,
    statuses,
    fetchStatusesForGroup,
    updateStatuses,
    selectedStatus,
  };
});
