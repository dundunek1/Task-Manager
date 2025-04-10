<template>
  <div class="container vh-100 d-flex justify-content-center align-items-center">
    <div class="row justify-content-center">
      <div class="col-md">
        <h2 class="text-center">Login</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" class="form-control" v-model="email" id="email" placeholder="Enter email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control" v-model="password" id="password" placeholder="Enter password" required />
          </div>
          <div class="mt-3 d-flex justify-content-between">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? "Logging in..." : "Login" }}
            </button>
            <router-link to="/register" class="btn btn-link"> Don't have an account? </router-link>
          </div>
        </form>
        <div v-if="error" class="alert alert-danger mt-2">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";
import { Toaster, toast } from "vue-sonner";
const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const isLoading = ref(false);
const error = ref("");

const handleLogin = async () => {
  error.value = "";
  isLoading.value = true;

  try {
    await authStore.login(email.value, password.value);
    toast.success("sucess!");
    router.push("/");
  } catch (err: any) {
    error.value = err.message || "Login failed";
  } finally {
    isLoading.value = false;
  }
};
</script>
