import { SupportedLanguage, Category } from "../types";

// Fallback database in case API fails or is missing
const BACKUPS: Record<string, string[]> = {
  FAMOUS: ["Lionel Messi", "Taylor Swift", "Batman", "Marilyn Monroe", "Einstein"],
  ANIMALS: ["Giraffe", "Penguin", "Lion", "Elephant", "Platypus"],
  MOVIES: ["Titanic", "Star Wars", "Harry Potter", "The Matrix", "Frozen"],
  PLACES: ["Paris", "Tokyo", "New York", "Egypt", "Mars"],
  FOOD: ["Pizza", "Sushi", "Tacos", "Ice Cream", "Hamburger"],
  OBJECTS: ["iPhone", "Umbrella", "Piano", "Toothbrush", "Chair"]
};

export const generateWord = async (category: Category, language: SupportedLanguage = 'en'): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;

    // Use backup if no key provided
    if (!apiKey) {
      console.warn("Gemini API Key missing. Using offline backup.");
      return getRandomBackup(category);
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Dynamic prompt based on language and category
    const langPrompt = language === 'es' ? 'Spanish' : 'English';
    const categoryPrompts: Record<Category, string> = {
      FAMOUS: language === 'es' ? "un personaje famoso muy conocido globalmente" : "a globally famous person",
      ANIMALS: language === 'es' ? "un animal conocido" : "a well-known animal",
      MOVIES: language === 'es' ? "una película muy famosa" : "a very famous movie",
      PLACES: language === 'es' ? "una ciudad o país famoso" : "a famous city or country",
      FOOD: language === 'es' ? "una comida popular" : "a popular food item",
      OBJECTS: language === 'es' ? "un objeto cotidiano común" : "a common everyday object"
    };

    const contextPrompt = language === 'es' 
      ? `Genera UNA sola palabra (o nombre corto) en Español. Debe ser: ${categoryPrompts[category]}. NO escribas frases, solo el nombre.`
      : `Generate a SINGLE word (or short name) in English. It must be: ${categoryPrompts[category]}. Do NOT write sentences, just the name.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${contextPrompt} Ensure variety.`,
    });

    const text = response.text;
    return text ? text.trim().replace(/['".]+/g, '') : getRandomBackup(category);
  } catch (error) {
    console.error("Error generating content:", error);
    return getRandomBackup(category);
  }
};

const getRandomBackup = (category: Category) => {
  // Map category to backup keys, default to FAMOUS if somehow mapping fails
  const key = Object.keys(BACKUPS).includes(category) ? category : 'FAMOUS';
  const list = BACKUPS[key];
  return list[Math.floor(Math.random() * list.length)];
};