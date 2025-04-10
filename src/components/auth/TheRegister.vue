<template>
  <div class="container vh-100 d-flex justify-content-center align-items-center">
    <div class="row justify-content-center">
      <div class="col">
        <h2 class="text-center">Register</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="first-name">First Name</label>
            <input type="text" class="form-control" v-model="firstName" id="firstName" placeholder="First Name" required />
          </div>
          <div class="form-group">
            <label for="last-name">Last Name</label>
            <input type="text" class="form-control" v-model="lastName" id="lastName" placeholder="Last Name" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" class="form-control" v-model="email" id="email" placeholder="Enter email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control" v-model="password" id="password" placeholder="Enter password" required minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input type="password" class="form-control" v-model="confirmPassword" id="confirm-password" placeholder="Confirm password" required />
          </div>
          <div class="form-group">
            <label for="job-title">Job Title</label>
            <input type="text" class="form-control" v-model="jobTitle" id="job-title" placeholder="Enter job title" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
            {{ isLoading ? "Registering..." : "Register" }}
          </button>
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
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Toaster, toast } from "vue-sonner";
const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const firstName = ref("");
const lastName = ref("");
const jobTitle = ref("");
const isLoading = ref(false);
const error = ref("");

const handleRegister = async () => {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords don't match!";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }

  isLoading.value = true;

  try {
    const user = await authStore.register(email.value, password.value);

    const userData = {
      jobTitle: jobTitle.value,
      email: email.value,
      firstName: firstName.value,
      lastName: lastName.value,
      location: { lat: 0, lon: 0 },
    };

    await setDoc(doc(db, "users", user.uid), userData);
    toast.success("The account has been created");
    router.push("/login");
  } catch (err: any) {
    switch (err.code) {
      case "auth/email-already-in-use":
        error.value = "Email is already in use!";
        break;
      case "auth/invalid-email":
        error.value = "Invalid email!";
        break;
      case "auth/weak-password":
        error.value = "Password is too weak!";
        break;
      default:
        error.value = err.message || "An unexpected error occurred.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
