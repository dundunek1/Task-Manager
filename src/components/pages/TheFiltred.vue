<template>
  <div class="home-container">
    <div v-if="selectedGroup && selectedStatus">
      <h3>Tasks for group: {{ selectedGroup.name }} - {{ selectedStatus }}</h3>

      <div class="sorting-controls">
        <div class="dropdown" v-if="selectedStatus === 'Your Tasks'">
          <button class="filter-button dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fa-solid fa-filter me-1"></i>
            Filter by Status
          </button>
          <ul class="dropdown-menu">
            <li v-for="status in statusOptions" :key="status" class="dropdown-item" @click="filterByStatus(status)">
              {{ status }}
            </li>
          </ul>
        </div>
        <div v-else></div>

        <button @click="toggleSorting" class="sort-button">
          <i class="fa-solid fa-sort"></i>
          Sort by priority {{ sortDirection === "asc" ? "(Low to High)" : sortDirection === "desc" ? "(High to Low)" : "" }}
        </button>
      </div>

      <div class="task-column">
        <div class="column-header">
          <h4>{{ selectedStatus }}</h4>
          <span v-if="activeStatusFilter" class="status-filter-badge">
            Filtered by: {{ activeStatusFilter }}
            <button class="clear-filter-btn" @click="clearStatusFilter">
              <i class="fa-solid fa-times"></i>
            </button>
          </span>
        </div>

        <ul class="task-list">
          <li
            v-for="task in filteredAndSortedTasks"
            :key="task.id"
            class="task-card"
            :class="{
              'favorite-task': task.isFavorite,
              'priority-high': task.priority === 'high',
              'priority-medium': task.priority === 'medium',
              'priority-low': task.priority === 'low',
            }">
            <div class="task-content">
              <div class="task-header">
                <div class="task-title-wrapper">
                  <div class="priority-indicator" v-if="task.priority">
                    <i class="fa-solid fa-flag" :class="`text-${getPriorityColor(task.priority)}`" :title="`Priority: ${task.priority}`"></i>
                  </div>

                  <strong v-if="editingTaskId !== task.id">{{ task.name }}</strong>
                  <input v-else v-model="editingTaskName" @keyup.enter="saveTaskName(task.id)" @blur="cancelEdit" ref="editInput" class="form-control" />
                </div>
                <div class="action-icons">
                  <i class="fa-solid fa-pen-to-square" @click="editTask(task)"></i>
                  <i :class="[task.isFavorite ? 'fa-solid' : 'fa-regular', 'fa-star']" @click="toggleFavorite(task)"></i>
                  <i v-if="isGroupOwner" class="fa-solid fa-trash text-danger" @click="deleteTask(task)"></i>
                </div>
              </div>
              <p>
                Status <strong>{{ task.status }}</strong>
              </p>
              <p class="task-date">{{ task.date }}</p>
            </div>
          </li>
        </ul>

        <div v-if="filteredAndSortedTasks.length === 0" class="no-tasks">
          <p class="text-muted">No tasks match the current filters</p>
        </div>
      </div>
    </div>

    <div v-else-if="!selectedStatus" class="no-status-selected">
      <div class="card text-center p-4">
        <i class="fa-solid fa-list-check fa-3x text-primary mb-3"></i>
        <h4>No Status Selected</h4>
        <p class="text-muted">Please select a status to view tasks.</p>
      </div>
    </div>

    <div v-else class="no-group-selected">
      <div class="card text-center p-4">
        <i class="fa-solid fa-users fa-3x text-primary mb-3"></i>
        <h4>No Group Selected</h4>
        <p class="text-muted">Pick a group to view and manage tasks.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useGroupStore } from "@/stores/groupStore";
import { useTaskStore } from "@/stores/taskStore";
import { Toaster, toast } from "vue-sonner";
import { getAuth } from "firebase/auth";
const auth = getAuth();
const userUid = auth.currentUser ? auth.currentUser.uid : null;
console.log(userUid);
const groupStore = useGroupStore();
const taskStore = useTaskStore();
const selectedGroup = computed(() => groupStore.selectedGroup);
const selectedStatus = computed(() => groupStore.selectedStatus);

const statusOptions = ["To Do", "In Progress", "Completed", "Blocked", "On Hold"];
const activeStatusFilter = ref<string | null>(null);

const editingTaskId = ref<string | null>(null);
const editingTaskName = ref("");
const editInput = ref<HTMLInputElement | null>(null);

const sortDirection = ref<"none" | "asc" | "desc">("none");

const priorityValues = ["high", "medium", "low"];

const priorityMap: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};
const isGroupOwner = computed(() => {
  if (!selectedGroup.value || !auth.currentUser) return false;
  return selectedGroup.value.owner === auth.currentUser.uid;
});
const filterByStatus = (status: string) => {
  activeStatusFilter.value = status;
};

const clearStatusFilter = () => {
  activeStatusFilter.value = null;
};

const getPriorityColor = (priority: string) => {
  if (!priority) return "secondary";

  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "secondary";
  }
};

interface Task {
  id: string;
  name: string;
  status: string;
  priority?: string;
  date: string;
  isFavorite: boolean;
  assignedTo?: string;
}

const tasksForSelectedStatus = computed<Task[]>(() => {
  console.log("Selected Status:", selectedStatus.value);
  console.log("User UID:", userUid);

  if (!selectedStatus.value) return [];

  if (selectedStatus.value === "Your Tasks" && userUid) {
    const filteredTasks = taskStore.tasks.filter((task) => task.assignedTo === userUid);
    console.log("Filtered Tasks:", filteredTasks);
    return filteredTasks;
  }

  if (priorityValues.includes(selectedStatus.value.toLowerCase())) {
    return taskStore.tasks.filter((task) => task.priority && task.priority.toLowerCase() === selectedStatus.value.toLowerCase());
  }

  return taskStore.tasks.filter((task) => task.status === selectedStatus.value);
});

const filteredAndSortedTasks = computed<Task[]>(() => {
  let tasks = tasksForSelectedStatus.value;

  if (activeStatusFilter.value && selectedStatus.value === "Your Tasks") {
    tasks = tasks.filter((task) => task.status === activeStatusFilter.value);
  }

  if (sortDirection.value === "none") {
    return tasks;
  }

  return [...tasks].sort((a, b) => {
    const priorityA = priorityMap[a.priority?.toLowerCase() || "low"] || 0;
    const priorityB = priorityMap[b.priority?.toLowerCase() || "low"] || 0;

    return sortDirection.value === "asc" ? priorityA - priorityB : priorityB - priorityA;
  });
});

const toggleSorting = () => {
  if (sortDirection.value === "none") {
    sortDirection.value = "desc";
  } else if (sortDirection.value === "desc") {
    sortDirection.value = "asc";
  } else {
    sortDirection.value = "none";
  }
};

const fetchTasks = async () => {
  if (selectedGroup.value) {
    await taskStore.fetchTasksForGroup(selectedGroup.value.code);
  }
};

const editTask = (task: Task) => {
  editingTaskId.value = task.id;
  editingTaskName.value = task.name;

  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
    }
  });
};
const deleteTask = async (task: Task) => {
  try {
    await taskStore.deleteTask(task.id);
    toast.success("The task has been deleted");
  } catch (error) {
    toast.error("Failed to delete task:", error);
    console.error("Failed to delete task:", error);
  }
};
const saveTaskName = async (taskId: string) => {
  if (editingTaskName.value.trim() === "") return;

  try {
    await taskStore.updateTaskName(taskId, editingTaskName.value);
    toast.success("The task has been edited");
    cancelEdit();
  } catch (error) {
    toast.error("Failed to update task name:", error);
    console.error("Failed to update task name:", error);
  }
};

const cancelEdit = () => {
  editingTaskId.value = null;
  editingTaskName.value = "";
};

const toggleFavorite = async (task: Task) => {
  try {
    const newValue = !task.isFavorite;
    await taskStore.updateTaskFavorite(task.id, newValue);
    toast.success("Added to favorites");
  } catch (error) {
    toast.error("Failed to toggle favorite:", error);
    console.error("Failed to toggle favorite:", error);
  }
};

watch(
  () => selectedGroup.value,
  (newValue) => {
    if (newValue) {
      fetchTasks();

      activeStatusFilter.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => selectedStatus.value,
  () => {
    if (selectedGroup.value) {
      fetchTasks();
      activeStatusFilter.value = null;
    }
  }
);

onMounted(() => {
  if (selectedGroup.value) {
    fetchTasks();
  }
});
</script>

<style scoped>
.task-list {
  list-style: none;
  padding: 0;
  min-height: 50px;
}

.task-card {
  padding: 10px;
  background-color: #e8e8e8;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority-high {
  border-left: 4px solid #dc3545 !important;
}

.priority-medium {
  border-left: 4px solid #ffc107 !important;
}

.priority-low {
  border-left: 4px solid #28a745 !important;
}

.priority-indicator {
  margin-right: 8px;
  display: inline-block;
}

.text-danger {
  color: #dc3545;
}

.text-warning {
  color: #ffc107;
}

.text-success {
  color: #28a745;
}

.text-secondary {
  color: #6c757d;
}

.task-content {
  flex-grow: 1;
  width: 100%;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  width: 100%;
}

.task-title-wrapper {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.action-icons {
  display: flex;
  gap: 10px;
}

.task-date {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  margin-bottom: 0;
}

.favorite-task {
  border-right: 3px solid red;
}

.task-column {
  min-height: 200px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-width: 500px;
  margin: 0 auto;
}

.column-header {
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  padding-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-container {
  padding: 20px;
  background: #1e5c88;
  min-height: 100vh;
}

.button-add {
  width: 100%;
  font-size: 18px;
  cursor: pointer;
  margin-top: 10px;
  background: #007bff;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}

.button-add:hover {
  background: #0056b3;
}

.no-status-selected,
.no-group-selected {
  max-width: 500px;
  margin: 0 auto;
}

.sorting-controls {
  max-width: 500px;
  margin: 0 auto 10px auto;
  display: flex;
  justify-content: space-between;
}

.sort-button,
.filter-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.sort-button:hover,
.filter-button:hover {
  background-color: #e0e0e0;
}

.dropdown-item {
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

.status-filter-badge {
  font-size: 12px;
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
}

.clear-filter-btn {
  background: none;
  border: none;
  font-size: 10px;
  margin-left: 5px;
  cursor: pointer;
  padding: 0 2px;
}

.clear-filter-btn:hover {
  color: #dc3545;
}

.no-tasks {
  text-align: center;
  padding: 20px;
  font-style: italic;
}
</style>
