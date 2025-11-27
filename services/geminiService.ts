import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from "../types";

// Much larger fallback database ("Agranda la base de datos")
const BACKUPS = [
  // Global Icons
  "Lionel Messi", "Cristiano Ronaldo", "Michael Jackson", "Albert Einstein",
  "Taylor Swift", "Harry Potter", "Batman", "Spider-Man", "Barack Obama",
  "Donald Trump", "Shakira", "Beyoncé", "Elon Musk", "Marilyn Monroe",
  "Pablo Picasso", "Frida Kahlo", "Diego Maradona", "Pelé", "Michael Jordan",
  "Leonardo da Vinci", "Cleopatra", "Julius Caesar", "William Shakespeare",
  "Napoleon Bonaparte", "Mahatma Gandhi", "Mother Teresa", "Pope Francis", 
  "Queen Elizabeth II", "Tom Cruise", "Will Smith", "Johnny Depp", 
  "Brad Pitt", "Angelina Jolie", "Kim Kardashian", "Dwayne Johnson",
  "Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Oprah Winfrey",
  "Walt Disney", "Elvis Presley", "Madonna", "Freddie Mercury",
  "Bob Marley", "Vincent van Gogh", "Wolfgang Amadeus Mozart",
  "Beethoven", "Isaac Newton", "Charles Darwin", "Neil Armstrong",
  "SpongeBob SquarePants", "Darth Vader", "Joker", "James Bond",
  "Sherlock Holmes", "Wonder Woman", "Superman", "Iron Man",
  "Mickey Mouse", "Pikachu", "Mario Bros", "Sonic the Hedgehog"
];

export const generateFamousPerson = async (language: SupportedLanguage = 'en'): Promise<string> => {
  try {
    // Lazy initialization: Check environment only when function is called.
    // This prevents the "process is not defined" crash on app load if the env var is missing.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        console.warn("Gemini API Key is missing. Using offline backup database.");
        return getRandomBackup();
    }

    // Initialize only if key exists
    const ai = new GoogleGenAI({ apiKey });

    const langPrompt = language === 'es' ? 'Spanish' : 'English';
    const contextPrompt = language === 'es' 
      ? "Genera el nombre de una persona famosa (real o ficticia) muy conocida por hablantes de español."
      : "Generate the name of a single, widely known famous person (real or fictional).";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${contextPrompt} Return ONLY the name, nothing else. Ensure variety and do not always pick the most obvious ones.`,
    });

    const text = response.text;
    return text ? text.trim().replace(/['"]+/g, '') : getRandomBackup();
  } catch (error) {
    console.error("Error generating famous person:", error);
    // Graceful fallback so the game continues even if API fails
    return getRandomBackup();
  }
};

const getRandomBackup = () => {
  return BACKUPS[Math.floor(Math.random() * BACKUPS.length)];
};