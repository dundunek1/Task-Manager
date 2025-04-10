<template>
  <div class="modal fade" id="createTaskModal" tabindex="-1" aria-labelledby="createTaskModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="createTaskModalLabel">Add Task</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addTask">
            <div class="mb-3">
              <label for="task-name" class="form-label">Task:</label>
              <input type="text" id="task-name" v-model="taskName" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Add to {{ taskStatus }}</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { db, collection, addDoc } from "@/firebaseConfig";
import { useGroupStore } from "@/stores/groupStore";
import { Toaster, toast } from "vue-sonner";
const taskName = ref("");
const taskStatus = ref("");
const groupStore = useGroupStore();

const setTaskStatus = (status: string) => {
  taskStatus.value = status;
};

const addTask = async () => {
  const date = new Date();
  if (!taskName.value.trim()) return;
  if (!groupStore.selectedGroup) {
    alert("Please select a group first!");
    return;
  }

  try {
    await addDoc(collection(db, "tasks"), {
      name: taskName.value,
      status: taskStatus.value,
      groupCode: groupStore.selectedGroup.code,
      date: date.toLocaleString(),
    });

    taskName.value = "";
    toast.success(`Task added to ${taskStatus.value}!`);
  } catch (error) {
    console.error("Error adding task:", error);
    toast.error("Error adding task.");
  }
};

defineExpose({ setTaskStatus });
</script>
