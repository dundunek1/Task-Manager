<template>
  <div>
    <h2>User Information</h2>
    <p><strong>Email:</strong> {{ userInfo?.email || "Not available" }}</p>
    <p><strong>Name:</strong> {{ userInfo?.firstName || "Not available" }} {{ userInfo?.lastName || "" }}</p>

    <button @click="getCurrentLocation">📍 Use My Location</button>

    <div id="map" style="height: 400px; margin-top: 10px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Toaster, toast } from "vue-sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

const userInfo = ref<{ email: string; firstName?: string; lastName?: string } | null>(null);
const userLocation = ref<{ lat: number; lon: number } | null>(null);
let map: L.Map | null = null;

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

      if (data.location) {
        userLocation.value = {
          lat: data.location.lat,
          lon: data.location.lon,
        };
      }
      console.log("User data fetched:", userInfo.value);
    } else {
      console.warn("User document does not exist");
    }
  } catch (error) {
    toast.error("Error fetching user data");
    console.error("Error fetching user data:", error);
  }
};

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    toast.warning("Your browser does not support geolocation");

    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      userLocation.value = { lat, lon };

      console.log("Current location:", userLocation.value);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(userRef, { location: userLocation.value }, { merge: true });
          console.log("Location saved to Firebase.");
        } catch (error) {
          console.error("Error saving location to Firebase:", error);
        }
      }

      if (map) {
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup("Your current location").openPopup();
      }
    },
    (error) => {
      toast.error("Unable to retrieve location.");
      console.error("Error getting location:", error);
    }
  );
};

onMounted(async () => {
  await fetchUserData();

  const defaultCoords = [51.505, -0.09]; // (London)

  map = L.map("map").setView(userLocation.value ? [userLocation.value.lat, userLocation.value.lon] : defaultCoords, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  if (userLocation.value) {
    L.marker([userLocation.value.lat, userLocation.value.lon]).addTo(map).bindPopup("Your saved location").openPopup();
  }
});
</script>

<style scoped>
#map {
  height: 400px;
}
button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
}
button:hover {
  background-color: #0056b3;
}
</style>
