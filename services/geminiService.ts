import { SupportedLanguage, Category } from "../types";

// Helper for crypto-random selection from arrays
const getSecureRandomItem = <T>(array: T[]): T | null => {
  if (array.length === 0) return null;
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % array.length;
  return array[randomIndex];
};

// Bilingual Fallback database
const BACKUPS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    FAMOUS: ["Taylor Swift", "Elon Musk", "Batman", "Marilyn Monroe", "Albert Einstein", "Michael Jackson", "Harry Potter", "Barack Obama", "Leonardo DiCaprio", "Queen Elizabeth", "Messi", "Ronaldo", "Beyonce", "Trump", "Steve Jobs", "Tom Cruise", "Oprah", "Will Smith"],
    ANIMALS: ["Giraffe", "Penguin", "Lion", "Elephant", "Platypus", "Kangaroo", "Dolphin", "Panda", "Koala", "Octopus", "Shark", "Eagle", "Tiger", "Gorilla", "Wolf", "Zebra", "Owl", "Bear"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "The Matrix", "Frozen", "Avatar", "The Lion King", "Jurassic Park", "Inception", "The Avengers", "Shrek", "Spider-Man", "Joker", "Toy Story", "Gladiator", "Finding Nemo"],
    PLACES: ["Paris", "Tokyo", "New York", "Egypt", "Mars", "London", "Hawaii", "The Great Wall of China", "Rome", "Sydney", "Dubai", "Las Vegas", "Antarctica", "Amazon Rainforest", "Mount Everest"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Ice Cream", "Hamburger", "Spaghetti", "Pancakes", "Chocolate", "Steak", "Donuts", "Burrito", "Fried Chicken", "Popcorn", "Hot Dog", "Salad", "Croissant"],
    OBJECTS: ["iPhone", "Umbrella", "Piano", "Toothbrush", "Chair", "Laptop", "Bicycle", "Headphones", "Camera", "Watch", "Shoe", "Book", "Lamp", "Backpack", "Sunglasses", "Key"],
    SONGS: ["Bohemian Rhapsody", "Thriller", "Imagine", "Shape of You", "Blinding Lights", "Smells Like Teen Spirit", "Billie Jean", "Hey Jude", "Stayin' Alive", "Wonderwall", "Rolling in the Deep", "Bad Guy", "Havana", "Despacito", "Uptown Funk"]
  },
  es: {
    FAMOUS: ["Lionel Messi", "Shakira", "Batman", "Frida Kahlo", "Einstein", "Bad Bunny", "El Chavo del 8", "Picasso", "Maradona", "Jennifer Lopez", "Cristiano Ronaldo", "Papa Francisco", "Will Smith", "Harry Potter", "Goku", "Iron Man", "Luis Miguel", "Mirtha Legrand"],
    ANIMALS: ["Jirafa", "Pingüino", "León", "Elefante", "Ornitorrinco", "Canguro", "Delfín", "Oso Panda", "Lama", "Tiburón", "Águila", "Tigre", "Gorila", "Lobo", "Cebra", "Búho", "Oso Polar", "Hipopótamo"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "Matrix", "Frozen", "El Rey León", "Jurassic Park", "Toy Story", "Avengers", "Coco", "Shrek", "Spiderman", "El Padrino", "Volver al Futuro", "Buscando a Nemo", "Mi Pobre Angelito"],
    PLACES: ["París", "Tokio", "Nueva York", "Egipto", "Marte", "Roma", "Machu Picchu", "La Muralla China", "Buenos Aires", "Madrid", "Brasil", "Cancún", "Disney", "Las Vegas", "Torre Eiffel", "Cataratas del Iguazú"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Helado", "Hamburguesa", "Paella", "Empanadas", "Asado", "Milanesa", "Churros", "Mate", "Fernet", "Chocolate", "Papas Fritas", "Ensalada", "Torta"],
    OBJECTS: ["Celular", "Paraguas", "Piano", "Cepillo de dientes", "Silla", "Computadora", "Bicicleta", "Auriculares", "Reloj", "Lentes", "Zapato", "Libro", "Lámpara", "Mochila", "Llave", "Guitarra"],
    SONGS: ["Despacito", "Gasolina", "La Bamba", "Bailando", "Tusa", "Entre dos tierras", "La Flaca", "Rayando el sol", "Música Ligera", "Matador", "El muelle de San Blas", "Provenza", "Ojitos Lindos", "La Bachata"]
  }
};

const getRandomBackup = (category: Category, language: SupportedLanguage, forbiddenWords: string[]) => {
  const langBackups = BACKUPS[language] || BACKUPS['en'];
  const key = category as string;
  const list = langBackups[key] || langBackups['FAMOUS'];
  
  const filtered = list.filter(w => !forbiddenWords.some(fw => fw.toLowerCase() === w.toLowerCase()));
  const finalSource = filtered.length > 0 ? filtered : list;
  
  return getSecureRandomItem(finalSource) || "Error";
};

export const generateWord = async (
  category: Category, 
  language: SupportedLanguage = 'en',
  forbiddenWords: string[] = []
): Promise<string> => {
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(getRandomBackup(category, language, forbiddenWords));
    }, 3500);
  });

  const aiRequestPromise = (async (): Promise<string> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return getRandomBackup(category, language, forbiddenWords);

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const constraints = language === 'es' 
        ? "No repitas estas palabras por favor: " + forbiddenWords.slice(-15).join(", ") 
        : "Please do not repeat these words: " + forbiddenWords.slice(-15).join(", ");

      const contextPrompt = language === 'es' 
        ? `Categoría: ${category}. Dame SOLO un ejemplo muy famoso en español. No agregues nada más. ${constraints}`
        : `Category: ${category}. Give me ONLY one very famous example in English. Do not add anything else. ${constraints}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt,
        config: { maxOutputTokens: 20, temperature: 1.1 }
      });

      const text = response.text?.trim().replace(/['".]+/g, '') || "";
      if (forbiddenWords.some(fw => fw.toLowerCase() === text.toLowerCase())) return getRandomBackup(category, language, forbiddenWords);
      return text || getRandomBackup(category, language, forbiddenWords);
    } catch (error) {
      return getRandomBackup(category, language, forbiddenWords);
    }
  })();

  return Promise.race([aiRequestPromise, timeoutPromise]);
};

export const generateDuelWords = async (
  language: SupportedLanguage = 'en',
  forbiddenWords: string[] = []
): Promise<{ wordA: string, wordB: string }> => {
  const timeoutPromise = new Promise<{ wordA: string, wordB: string }>((resolve) => {
    setTimeout(() => {
      const a = getRandomBackup('SONGS', language, forbiddenWords);
      const b = getRandomBackup('SONGS', language, [...forbiddenWords, a]);
      resolve({ wordA: a, wordB: b });
    }, 4000);
  });

  const aiRequestPromise = (async (): Promise<{ wordA: string, wordB: string }> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const constraints = forbiddenWords.slice(-15).join(", ");
      const prompt = language === 'es' 
        ? `Dame 2 canciones muy famosas del mismo género pero distintas. Responde en JSON con llaves 'wordA' y 'wordB'. No repitas: ${constraints}`
        : `Give me 2 very famous songs from the same genre but different. Respond in JSON with keys 'wordA' and 'wordB'. Do not repeat: ${constraints}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wordA: { type: Type.STRING },
              wordB: { type: Type.STRING }
            },
            required: ["wordA", "wordB"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.wordA && data.wordB) return data;
      throw new Error("Invalid response format");
    } catch (error) {
      const a = getRandomBackup('SONGS', language, forbiddenWords);
      const b = getRandomBackup('SONGS', language, [...forbiddenWords, a]);
      return { wordA: a, wordB: b };
    }
  })();

  return Promise.race([aiRequestPromise, timeoutPromise]);
};