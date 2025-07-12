<div align="center">
  <br />
  <p>
    <a href="https://xora-ai.netlify.app/"><img src="https://raw.githubusercontent.com/Angrajkarn/xora-ai/main/public/icons/icon-512x512.png" width="120" alt="Xora Logo" /></a>
  </p>
  <br />
  <p>
    <a href="https://app.netlify.com/sites/xora-ai/deploys"><img src="https://api.netlify.com/api/v1/badges/e8e6e589-9b41-4c12-823e-0e9641e416a5/deploy-status" alt="Netlify Status" /></a>
    <a href="https://github.com/Angrajkarn/xora-ai/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
    <a href="https://github.com/Angrajkarn/xora-ai"><img src="https://img.shields.io/github/stars/Angrajkarn/xora-ai?style=social" alt="GitHub stars"/></a>
  </p>
  <h1 align="center">Xora AI</h1>
  <p align="center">
    <b>Your AI Ecosystem. Conversations with Soul.</b>
    <br />
    An advanced, multi-persona AI chat application built with Next.js, Firebase, and Genkit.
  </p>
  <p align="center">
    <a href="https://xora-ai.netlify.app/"><strong>View Live Demo »</strong></a>
  </p>
  <br/>
</div>

## ✨ Key Features

Xora is more than just a chatbot. It's a comprehensive AI ecosystem designed for dynamic, intelligent, and personalized interactions.

-   **🧠 Multi-Model Interaction**: Seamlessly switch between or compare responses from top-tier AI models like Gemini, ChatGPT, Claude, and more.
-   **❤️ Xora Persona Engine**: Experience a new level of AI interaction with a cognitive AI that features emotional intelligence, long-term memory, and contextual awareness.
-   **🤖 Specialized AI Personas**: Go beyond a simple assistant. Interact with specialized personas like a Therapist, Career Coach, Legal Copilot, and even a simulated Girlfriend.
-   **⚔️ AI Battle Mode**: Pit two AI models against each other with the same prompt and vote for the superior response.
-   **🚀 Smart AI Router**: Not sure which model to use? The Smart Router analyzes your prompt and intelligently queries the best models for the job, providing a synthesized summary.
-   **🗣️ Group & Collaborative Chats**: Invite multiple AI personas into a single group chat for dynamic debates and brainstorming sessions, moderated by an AI director.
-   **🔧 AI-Powered Tools**:
    -   **Reel Generator**: Turn any topic into a short-form video script with generated visuals and voiceover.
    -   **Influencer Mode**: Generate a complete 7-day social media content plan with captions, hashtags, and images.
    -   **Data Visualization**: Upload a CSV and ask the AI to generate insightful charts and graphs.
-   **🎮 Gamification & Progress**: Earn XP, level up, and unlock badges for your activity, making your AI journey rewarding.
-   **🔒 Secure & Private**: With end-to-end encryption and self-destructing chats, your conversations remain your own.
-   **📱 PWA Ready**: Install Xora on your desktop or mobile device for a native app-like experience.

---

## 🛠️ Tech Stack

This project is built with a modern, robust, and scalable technology stack.

| Tech                               | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| **[Next.js](https://nextjs.org/)**              | React framework for server-side rendering & static generation. |
| **[React](https://react.dev/)**                 | A JavaScript library for building user interfaces. |
| **[Firebase](https://firebase.google.com/)**            | Backend services: Authentication, Firestore, App Hosting. |
| **[Genkit](https://firebase.google.com/docs/genkit)**               | The open-source AI framework for building production-ready AI apps. |
| **[Tailwind CSS](https://tailwindcss.com/)**        | A utility-first CSS framework for rapid UI development. |
| **[Shadcn/ui](https://ui.shadcn.com/)**           | Re-usable UI components built with Radix UI and Tailwind CSS. |
| **[TypeScript](https://www.typescriptlang.org/)**       | Statically typed superset of JavaScript.        |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   **Node.js**: `v18.x` or `v20.x`
-   **Firebase Account**: A Firebase project is required for authentication and database services.

### Local Development

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Angrajkarn/xora-ai.git
    cd xora-ai
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Firebase project credentials. You can find these in your Firebase project settings.

    ```env
    # Firebase Client SDK Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=AIz...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...

    # Firebase Admin SDK Configuration (for server-side operations)
    # Required for login, signup, and server actions
    FIREBASE_PROJECT_ID=your-project-id
    FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
    # Get the private key from your generated service account JSON file
    # Ensure to format it as a single line with `\n` for newlines
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...=\n-----END PRIVATE KEY-----\n"

    # Optional: For third-party model access (Grok)
    # GROK_API_KEY=gsk_...
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

The project follows a standard Next.js App Router structure with some key directories:

-   `src/app/(main)`: Contains the core, authenticated pages of the application (Dashboard, Chat, Settings).
-   `src/app/(public)`: Contains public-facing pages like the landing page.
-   `src/components`: Shared UI components used across the application.
-   `src/ai/flows`: The heart of the AI logic. All Genkit flows are defined here.
-   `src/ai/tools`: Custom tools that Genkit flows can use (e.g., fetching URLs, parsing data).
-   `src/services`: Server-side actions for interacting with Firebase services (Firestore, Auth).
-   `src/lib`: Contains constants, utility functions, type definitions, and Firebase client/admin setup.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
```
