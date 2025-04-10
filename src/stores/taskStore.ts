import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "@/firebaseConfig";
import { Toaster, toast } from "vue-sonner";
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, serverTimestamp, deleteDoc } from "firebase/firestore";

interface Task {
  id: string;
  name: string;
  status: string;
  date: string;
  groupCode: string;
  assignedTo?: string | null;
  isFavorite?: boolean;
  priority?: string | null;
}

export const useTaskStore = defineStore("task", () => {
  const tasks = ref<Task[]>([]);

  const fetchTasksForGroup = (groupCode: string) => {
    console.log("Fetching tasks for group code:", groupCode);

    try {
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("groupCode", "==", groupCode));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log(`Got ${querySnapshot.docs.length} tasks from Firestore`);

          tasks.value = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unnamed Task",
              status: data.status || "To Do",
              date: data.date || new Date().toLocaleDateString(),
              groupCode: data.groupCode,
              assignedTo: data.assignedTo,
              isFavorite: data.isFavorite || false,
              priority: data.priority || null,
            };
          });

          console.log("Updated tasks:", tasks.value);
        },
        (error) => {
          console.error("Error fetching tasks:", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up tasks listener:", error);
      return () => {};
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const task = tasks.value[taskIndex];
    const previousStatus = task.status;

    tasks.value[taskIndex] = { ...task, status: newStatus };

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: newStatus });
      console.log(`Task ${taskId} moved to ${newStatus} and updated in Firestore.`);
    } catch (error) {
      console.error("Error updating task:", error);

      tasks.value[taskIndex] = { ...task, status: previousStatus };
    }
  };

  const updateTaskPriority = async (taskId: string, priority: string | null) => {
    if (!taskId) return;

    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const task = tasks.value[taskIndex];
    const previousPriority = task.priority;

    tasks.value[taskIndex] = { ...task, priority };

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        priority: priority,
        updatedAt: serverTimestamp(),
      });
      console.log(`Task ${taskId} priority updated to ${priority}.`);
    } catch (error) {
      console.error("Error updating task priority:", error);

      tasks.value[taskIndex] = { ...task, priority: previousPriority };
      throw error;
    }
  };

  const updateTaskName = async (taskId: string, newName: string) => {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const task = tasks.value[taskIndex];
    const previousName = task.name;

    tasks.value[taskIndex] = { ...task, name: newName };

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { name: newName });
      console.log(`Task ${taskId} renamed to ${newName}.`);
    } catch (error) {
      console.error("Error updating task name:", error);

      tasks.value[taskIndex] = { ...task, name: previousName };
    }
  };

  const updateTaskFavorite = async (taskId: string, isFavorite: boolean) => {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const task = tasks.value[taskIndex];
    const previousValue = task.isFavorite;

    tasks.value[taskIndex] = { ...task, isFavorite };

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { isFavorite });
      console.log(`Task ${taskId} favorite status updated to ${isFavorite}.`);
    } catch (error) {
      console.error("Error updating task favorite status:", error);

      tasks.value[taskIndex] = { ...task, isFavorite: previousValue };
    }
  };
  const deleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);

      tasks.value = tasks.value.filter((task) => task.id !== taskId);
      console.log(`Task ${taskId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };
  const assignUserToTask = async (taskId: string, userId: string) => {
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error("Task not found:", taskId);
      return;
    }

    const task = tasks.value[taskIndex];

    const previousAssignee = task.assignedTo;

    tasks.value[taskIndex] = { ...task, assignedTo: userId };
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { assignedUserId: userId });
      console.log(`Task ${taskId} assigned to user ${userId}.`);
    } catch (error) {
      console.error("Error assigning user to task:", error);

      tasks.value[taskIndex] = { ...task, assignedTo: previousAssignee };
    }
  };

  const updateTaskAssignment = async (taskId: string, userId: string | null) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        assignedTo: userId,
        updatedAt: new Date().toLocaleDateString(),
      });

      const taskIndex = tasks.value.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex].assignedTo = userId;
      }
    } catch (error) {
      console.error("Error updating task assignment:", error);
      throw error;
    }
  };

  return {
    tasks,
    fetchTasksForGroup,
    updateTaskStatus,
    assignUserToTask,
    updateTaskFavorite,
    updateTaskName,
    updateTaskAssignment,
    updateTaskPriority,
    deleteTask,
  };
});
