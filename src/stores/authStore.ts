import { defineStore } from "pinia";
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import type { User } from "firebase/auth";
import { Toaster, toast } from "vue-sonner";
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isAuthLoaded: false,
    error: null as string | null,
    isLoading: false,
  }),
  actions: {
    async checkAuth() {
      return new Promise<void>((resolve) => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.user = user;
            this.token = await user.getIdToken();
            sessionStorage.setItem("token", this.token);
          } else {
            this.user = null;
            this.token = null;
            sessionStorage.removeItem("token");
          }
          this.isAuthLoaded = true;
          resolve();
        });
      });
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        this.token = await userCredential.user.getIdToken();
        sessionStorage.setItem("token", this.token);
        return userCredential.user;
      } catch (error: any) {
        this.error = this.mapAuthError(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async register(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        this.token = await userCredential.user.getIdToken();
        sessionStorage.setItem("token", this.token);
        return userCredential.user;
      } catch (error: any) {
        this.error = this.mapAuthError(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      const auth = getAuth();
      await signOut(auth);
      this.user = null;
      this.token = null;
      sessionStorage.removeItem("token");
    },

    mapAuthError(error: any): string {
      switch (error.code) {
        case "auth/user-not-found":
          return "No user found with this email.";
        case "auth/wrong-password":
          return "Incorrect password.";
        case "auth/email-already-in-use":
          return "Email is already in use.";
        case "auth/invalid-email":
          return "Invalid email address.";
        case "auth/weak-password":
          return "Password is too weak.";
        default:
          return error.message || "An unexpected error occurred.";
      }
    },
  },
  getters: {
    isAuthenticated(): boolean {
      return !!this.user;
    },
  },
});
