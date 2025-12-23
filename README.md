# 🏥 Smart Health Assistant
### AI-Powered Multilingual Mobile Health Application

Smart Health Assistant is an **AI-powered, multilingual mobile health application** built with **React Native and Expo**.  
The app helps users manage medications, interact with an AI health assistant, and perform **preliminary skin condition analysis** using on-device machine learning.

The application supports **Arabic (RTL)**, **English**, and **Turkish**, and focuses on combining modern mobile development with practical AI integration.

---

## 🎯 Project Motivation

Managing daily health tasks such as medication schedules, early symptom awareness, and accessing basic health guidance can be challenging.

This project aims to:
- Simplify **personal health management**
- Demonstrate **real-world AI integration** in mobile apps
- Provide a clean, scalable, and multilingual mobile architecture

> ⚠️ This application is **not a medical product** and is intended for **educational and demonstration purposes only**.

---

## ✨ Key Features

### 🤖 AI Health Chat
- AI-powered chat using **Google Gemini AI**
- Health-related questions and explanations
- Responses adapted to the selected language
- Clean and user-friendly chat interface

### 💊 Medication Management
- Add, edit, and delete medications
- Schedule reminders (daily / custom)
- Automatic notifications using Expo Notifications
- Dosage instructions (empty stomach / full stomach)
- Duplicate medication prevention

### 📸 Skin Disease Detection (AI)
- Capture images via camera or gallery
- Image analysis using an on-device **TensorFlow.js model**
- Preliminary classification of possible skin conditions
- AI-generated guidance and recommendations

### 🔐 Authentication & User Management
- Secure authentication with **Firebase Authentication**
- Login, registration, password reset
- User profile management
- Clear and descriptive error handling

### 🌍 Multilingual & Accessibility
- Arabic (Full RTL support)
- English
- Turkish
- Full localization using `i18next`

### ⚙️ App Settings
- Dark / Light mode
- Notification control
- Language switching
- Profile editing

---

## 🧠 Model Training – Skin Disease Classifier

The **Skin Disease Detection** feature is powered by a custom-trained image classification model.

### Dataset
- Source: Publicly available skin-condition image datasets
- Multiple skin condition categories
- Dataset split into training, validation, and testing sets

### Preprocessing
- Image resizing to a fixed input size
- Pixel normalization
- Data augmentation:
  - Rotation
  - Horizontal flipping
  - Zoom and brightness variations  
These steps help improve generalization and reduce overfitting.

### Model Architecture
- CNN-based image classification model
- Optimized for **mobile deployment**
- Trained using TensorFlow/Keras
- Loss function: categorical cross-entropy
- Optimizer: Adam

### Evaluation
- Model evaluated using validation accuracy and loss
- Focus on balancing performance and lightweight execution
- Designed for **educational and demonstrational accuracy**, not clinical use

### Mobile Deployment
- Trained model converted to **TensorFlow.js format**
- Loaded directly inside the React Native app
- Runs **on-device**, without sending images to external servers
- Model files stored under `assets/model/`

### Limitations
- Results may vary depending on lighting, camera quality, and skin tone
- Provides **initial guidance only**, not medical diagnosis

---

## 🛠️ Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Navigation
- React Hook Form
- i18next

### Backend & Services
- Firebase Authentication
- Firebase Firestore
- Google Gemini AI
- TensorFlow.js

### Additional Libraries
- Expo Camera
- Expo Notifications
- AsyncStorage
- Yup (Form validation)

---

## 🧩 High-Level Architecture

1. User authenticates via Firebase
2. User data and medications stored securely in Firestore
3. AI chat requests handled via Gemini API
4. Image classification runs locally using TensorFlow.js
5. Notifications scheduled and managed via Expo

---

## 📸 Screenshots



```md
![Home](./screenshots/home.png)
![AI Chat](./screenshots/chat.png)
![Medication Management](./screenshots/medication.png) (./screenshots/medicationm.png)
![Skin Detection](./screenshots/skin-detection.png) (./screenshots/skin-detectionm.png)
![Settings](./screenshots/settings.png)
![Login](./screenshots/Login.png)
![Sign in](./screenshots/Sign-in.png)
![Password](./screenshots/Password.png)
