import { SupportedLanguage, Category } from "../types";

// Bilingual Fallback database in case API fails or is missing
const BACKUPS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    FAMOUS: ["Taylor Swift", "Elon Musk", "Batman", "Marilyn Monroe", "Albert Einstein", "Michael Jackson", "Harry Potter", "Barack Obama"],
    ANIMALS: ["Giraffe", "Penguin", "Lion", "Elephant", "Platypus", "Kangaroo", "Dolphin", "Panda"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "The Matrix", "Frozen", "Avatar", "The Lion King", "Jurassic Park"],
    PLACES: ["Paris", "Tokyo", "New York", "Egypt", "Mars", "London", "Hawaii", "The Great Wall of China"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Ice Cream", "Hamburger", "Spaghetti", "Pancakes", "Chocolate"],
    OBJECTS: ["iPhone", "Umbrella", "Piano", "Toothbrush", "Chair", "Laptop", "Bicycle", "Headphones"]
  },
  es: {
    FAMOUS: ["Lionel Messi", "Shakira", "Batman", "Frida Kahlo", "Einstein", "Bad Bunny", "El Chavo del 8", "Picasso"],
    ANIMALS: ["Jirafa", "Pingüino", "León", "Elefante", "Ornitorrinco", "Canguro", "Delfín", "Oso Panda"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "Matrix", "Frozen", "El Rey León", "Jurassic Park", "Toy Story"],
    PLACES: ["París", "Tokio", "Nueva York", "Egipto", "Marte", "Roma", "Machu Picchu", "La Muralla China"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Helado", "Hamburguesa", "Paella", "Empanadas", "Asado"],
    OBJECTS: ["Celular", "Paraguas", "Piano", "Cepillo de dientes", "Silla", "Computadora", "Bicicleta", "Auriculares"]
  }
};

export const generateWord = async (category: Category, language: SupportedLanguage = 'en'): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;

    // Use backup if no key provided
    if (!apiKey) {
      console.warn("Gemini API Key missing. Using offline backup.");
      return getRandomBackup(category, language);
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Dynamic prompt based on language and category
    const categoryPrompts: Record<Category, string> = {
      FAMOUS: language === 'es' ? "un personaje famoso muy conocido globalmente" : "a globally famous person",
      ANIMALS: language === 'es' ? "un animal conocido" : "a well-known animal",
      MOVIES: language === 'es' ? "una película muy famosa" : "a very famous movie",
      PLACES: language === 'es' ? "una ciudad o país famoso" : "a famous city or country",
      FOOD: language === 'es' ? "una comida popular" : "a popular food item",
      OBJECTS: language === 'es' ? "un objeto cotidiano común" : "a common everyday object"
    };

    // Strict Language Enforcement Prompt
    const strictInstruction = language === 'es' 
      ? "IMPORTANTE: Responde ÚNICAMENTE en ESPAÑOL." 
      : "IMPORTANT: Respond ONLY in ENGLISH.";

    const contextPrompt = language === 'es' 
      ? `Genera UNA sola palabra (o nombre corto) en Español. Debe ser: ${categoryPrompts[category]}. NO escribas frases, solo el nombre. ${strictInstruction}`
      : `Generate a SINGLE word (or short name) in English. It must be: ${categoryPrompts[category]}. Do NOT write sentences, just the name. ${strictInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${contextPrompt} Ensure variety.`,
    });

    const text = response.text;
    // Clean up response and ensure it's not empty
    if (text) {
      return text.trim().replace(/['".]+/g, '');
    } else {
      throw new Error("Empty response from AI");
    }

  } catch (error) {
    console.error("Error generating content:", error);
    return getRandomBackup(category, language);
  }
};

const getRandomBackup = (category: Category, language: SupportedLanguage) => {
  // Access the correct language tree
  const langBackups = BACKUPS[language] || BACKUPS['en'];
  
  // Map category to backup keys, default to FAMOUS if somehow mapping fails
  // CASTING: We treat the category as a string key for the backup object
  const key = category as string;
  
  const list = langBackups[key] || langBackups['FAMOUS'];
  
  if (!list) {
    return language === 'es' ? "Error" : "Error";
  }

  return list[Math.floor(Math.random() * list.length)];
};