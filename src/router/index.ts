import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import TheLogin from "@/components/auth/TheLogin.vue";
import TheRegister from "@/components/auth/TheRegister.vue";
import TheHome from "@/components/pages/TheHome.vue";
import TheProfile from "@/components/pages/TheProfile.vue";
import TheFiltred from "@/components/pages/TheFiltred.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: TheHome,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: "/filtered",
      name: "TheFiltered",
      component: TheFiltred,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      name: "profile",
      component: TheProfile,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: TheLogin,
      meta: { hideNav: true, requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: TheRegister,
      meta: { hideNav: true, requiresGuest: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthLoaded) {
    await authStore.checkAuth();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

  if (requiresAuth && !authStore.user) {
    next("/login");
  } else if (requiresGuest && authStore.user) {
    next("/");
  } else {
    next();
  }
});

export default router;
