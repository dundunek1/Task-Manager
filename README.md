# Task Manager Web Application

## Overview
This is a fully functional task management web application built with Vue 3, TypeScript, Pinia, Firebase Firestore, and Firebase Authentication. The application allows users to create and join groups, assign tasks, change statuses, sort tasks by priority, and use drag & drop functionality. Admins can approve members, assign tasks, and manage users within the group.

## Features
- **Group Management:** Users can create groups, join with a group code, and be approved by the admin.
- **User Roles:** Admins can manage users, assign tasks, and approve or remove members from the group.
- **Task Management:** Create, edit, and delete tasks (admins only), assign tasks to users, and update their statuses.
- **Task Status:** Five task statuses available: "To Do", "In Progress", "Blocked", "On Hold", and "Complete".
- **Task Sorting:** Sort tasks by priority, by status, or by whether the task is assigned to you. Tasks can also be moved between columns using drag & drop functionality.
- **State Management:** Pinia is used for state management to handle global store data.
- **Authentication:** Firebase Authentication handles user registration and login.
- **Database:** Firebase Firestore is used to store user data, groups, and tasks.
- **UI Framework:** Styled with Bootstrap for a modern, responsive design.

## Technologies Used
- **Frontend:** Vue 3, TypeScript, Pinia, Vue Router
- **UI Framework:** Bootstrap, Vue Sonner
- **Authentication:** Firebase Authentication
- **State Management:** Pinia
- **Database:** Firebase Firestore

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/task-manager.git
   cd task-manager
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Install Firebase and Firebase SDK: You need to install Firebase to handle authentication and database functionality. Run the following command:
   ```sh
   npm install firebase
   ```
4. Set up Firebase in your project:

   Go to Firebase Console, create a new Firebase project, or use an existing one.
   Enable Firebase Authentication and Firebase Firestore for your project.
   Copy your Firebase configuration (API key, project ID, etc.) from your Firebase Console.

5. Edit Firebase Configuration:
   Open the src/firebaseConfig.ts
   Replace the placeholder values with your Firebase project credentials (from step 4). It should look like this:
   ```sh
   const firebaseConfig = {
   apiKey: "<YOUR_API_KEY>",
   authDomain: "<YOUR_AUTH_DOMAIN>",
   projectId: "<YOUR_PROJECT_ID>",
   storageBucket: "<YOUR_STORAGE_BUCKET>",
   messagingSenderId: "<YOUR_MESSAGING_SENDER_ID>",
   appId: "<YOUR_APP_ID>",
   measurementId: "<YOUR_MEASUREMENT_ID>",
   };

   ```
6. Run the development server:
   ```sh
   npm run dev
   ```
## Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
