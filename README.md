# Impostor Game 🕵️‍♂️

![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

A modern, mobile-first social deduction party game. Built to modernize the classic "Impostor" experience with AI-generated content and custom user inputs.

##  Live Demo

[Insert Link Here]

##  Why this project?

This project was born during a gathering with friends. We wanted to play the Impostor game, but existing apps lacked flexibility—specifically, we missed having **custom options** (inside jokes, specific themes) and a better UI.

I built this web application to fill that gap, adding a touch of modern engineering with **Google's Gemini AI** to generate infinite "Famous People" topics, while keeping the ability to play with custom words.

##  Key Features

-   ** AI-Powered:** Uses Google Gemini API to generate infinite, culturally relevant famous figures (never run out of topics).
-   ** Flexible Gameplay:** Choose between **Single Impostor** or **Multiple Impostors** for larger groups.
-   ** Custom Mode:** Players can input their own words/names for a personalized experience.
-   ** Bilingual:** Full support for **English** and **Spanish** (UI & AI content generation).
-   ** Mobile-First:** Designed for "Pass & Play" on a single device with smooth animations and touch interactions.
-   ** Offline Capable:** Includes a robust fallback database if the AI service is unreachable.

##  Tech Stack

-   **Frontend:** React 19, TypeScript, Vite.
-   **Styling:** Tailwind CSS (Modern, dark-themed UI).
-   **AI Integration:** Google GenAI SDK (`@google/genai`).
-   **Icons:** Lucide React.

##  Getting Started

### Prerequisites

You need a **Google Gemini API Key**. You can get one for free at [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/impostor-game.git
    cd impostor-game
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up your API Key:
    *   Create a `.env` file in the root directory.
    *   Add your key:
        ```env
        API_KEY=your_google_api_key_here
        ```
    *   *Note: In a production Vite app, you might need to configure how this key is exposed depending on your deployment strategy.*

4.  Run the development server:
    ```bash
    npm run dev
    ```

##  Feedback & Contributions

This is a personal project, but suggestions are welcome!

If you have any feedback, found a bug, or just want to suggest a new feature (like an online multiplayer mode), feel free to reach out:

 **Email:** [lucaspignataro@live.com](mailto:lucaspignataro@live.com)

##  Author

**Lucas Pignataro**

*   Frontend Engineer & Creative Developer.
*   Connect with me on [LinkedIn](https://www.linkedin.com/in/lucas-pignataro-aa7747207/)

---
*Created by Lucas Pignataro*
