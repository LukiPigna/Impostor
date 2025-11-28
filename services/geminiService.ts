import { SupportedLanguage, Category } from "../types";

// Helper for crypto-random selection from arrays
const getSecureRandomItem = <T>(array: T[]): T => {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % array.length;
  return array[randomIndex];
};

// Bilingual Fallback database (Expanded for variety during timeouts)
const BACKUPS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    FAMOUS: ["Taylor Swift", "Elon Musk", "Batman", "Marilyn Monroe", "Albert Einstein", "Michael Jackson", "Harry Potter", "Barack Obama", "Leonardo DiCaprio", "Queen Elizabeth", "Messi", "Ronaldo", "Beyonce", "Trump", "Steve Jobs", "Tom Cruise", "Oprah", "Will Smith"],
    ANIMALS: ["Giraffe", "Penguin", "Lion", "Elephant", "Platypus", "Kangaroo", "Dolphin", "Panda", "Koala", "Octopus", "Shark", "Eagle", "Tiger", "Gorilla", "Wolf", "Zebra", "Owl", "Bear"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "The Matrix", "Frozen", "Avatar", "The Lion King", "Jurassic Park", "Inception", "The Avengers", "Shrek", "Spider-Man", "Joker", "Toy Story", "Gladiator", "Finding Nemo"],
    PLACES: ["Paris", "Tokyo", "New York", "Egypt", "Mars", "London", "Hawaii", "The Great Wall of China", "Rome", "Sydney", "Dubai", "Las Vegas", "Antarctica", "Amazon Rainforest", "Mount Everest"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Ice Cream", "Hamburger", "Spaghetti", "Pancakes", "Chocolate", "Steak", "Donuts", "Burrito", "Fried Chicken", "Popcorn", "Hot Dog", "Salad", "Croissant"],
    OBJECTS: ["iPhone", "Umbrella", "Piano", "Toothbrush", "Chair", "Laptop", "Bicycle", "Headphones", "Camera", "Watch", "Shoe", "Book", "Lamp", "Backpack", "Sunglasses", "Key"]
  },
  es: {
    FAMOUS: ["Lionel Messi", "Shakira", "Batman", "Frida Kahlo", "Einstein", "Bad Bunny", "El Chavo del 8", "Picasso", "Maradona", "Jennifer Lopez", "Cristiano Ronaldo", "Papa Francisco", "Will Smith", "Harry Potter", "Goku", "Iron Man", "Luis Miguel", "Mirtha Legrand"],
    ANIMALS: ["Jirafa", "Pingüino", "León", "Elefante", "Ornitorrinco", "Canguro", "Delfín", "Oso Panda", "Lama", "Tiburón", "Águila", "Tigre", "Gorila", "Lobo", "Cebra", "Búho", "Oso Polar", "Hipopótamo"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "Matrix", "Frozen", "El Rey León", "Jurassic Park", "Toy Story", "Avengers", "Coco", "Shrek", "Spiderman", "El Padrino", "Volver al Futuro", "Buscando a Nemo", "Mi Pobre Angelito"],
    PLACES: ["París", "Tokio", "Nueva York", "Egipto", "Marte", "Roma", "Machu Picchu", "La Muralla China", "Buenos Aires", "Madrid", "Brasil", "Cancún", "Disney", "Las Vegas", "Torre Eiffel", "Cataratas del Iguazú"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Helado", "Hamburguesa", "Paella", "Empanadas", "Asado", "Milanesa", "Churros", "Mate", "Fernet", "Chocolate", "Papas Fritas", "Ensalada", "Torta"],
    OBJECTS: ["Celular", "Paraguas", "Piano", "Cepillo de dientes", "Silla", "Computadora", "Bicicleta", "Auriculares", "Reloj", "Lentes", "Zapato", "Libro", "Lámpara", "Mochila", "Llave", "Guitarra"]
  }
};

const getRandomBackup = (category: Category, language: SupportedLanguage) => {
  const langBackups = BACKUPS[language] || BACKUPS['en'];
  const key = category as string;
  const list = langBackups[key] || langBackups['FAMOUS'];
  
  if (!list) return "Error";
  return getSecureRandomItem(list);
};

export const generateWord = async (category: Category, language: SupportedLanguage = 'en'): Promise<string> => {
  // 1. TIMEOUT RACE: If AI takes > 3 seconds, force use of Backup.
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      console.warn("AI Request Timed out. Using Backup.");
      resolve(getRandomBackup(category, language));
    }, 3000); // 3 Seconds Max
  });

  // 2. AI Request Logic
  const aiRequestPromise = (async (): Promise<string> => {
    try {
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.warn("Gemini API Key missing. Using offline backup.");
        return getRandomBackup(category, language);
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      // Improved Sub-Categories
      const subCategories: Record<Category, string[]> = {
          FAMOUS: language === 'es' 
              ? ["un deportista", "un cantante", "un actor", "un científico", "un personaje de ficción", "un líder histórico"]
              : ["an athlete", "a singer", "an actor", "a scientist", "a fictional character", "a historical leader"],
          ANIMALS: language === 'es'
              ? ["un mamífero", "un ave", "un animal marino", "un reptil", "un insecto"]
              : ["a mammal", "a bird", "a sea animal", "a reptile", "an insect"],
          MOVIES: language === 'es'
              ? ["una película de acción", "una película infantil", "una película de terror", "una comedia"]
              : ["an action movie", "a kids movie", "a horror movie", "a comedy"],
          PLACES: language === 'es'
              ? ["una ciudad famosa", "un país", "un monumento", "un lugar turístico"]
              : ["a famous city", "a country", "a monument", "a tourist spot"],
          FOOD: language === 'es'
              ? ["un postre", "un plato salado", "una fruta", "una bebida"]
              : ["a dessert", "a savory dish", "a fruit", "a drink"],
          OBJECTS: language === 'es'
              ? ["un electrodoméstico", "algo que llevas en el bolsillo", "un mueble", "ropa"]
              : ["an appliance", "something in your pocket", "furniture", "clothing"]
      };

      const specificTopic = getSecureRandomItem(subCategories[category] || [category]);
      const randomSeed = Math.floor(Math.random() * 1000000);

      const strictInstruction = language === 'es' 
        ? "Responde SOLO la palabra en ESPAÑOL." 
        : "Respond ONLY the word in ENGLISH.";

      const contextPrompt = language === 'es' 
        ? `Dame 1 ejemplo de: ${specificTopic}. ${strictInstruction} Seed: ${randomSeed}`
        : `Give me 1 example of: ${specificTopic}. ${strictInstruction} Seed: ${randomSeed}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
            maxOutputTokens: 20, // Limit output size for speed
            temperature: 0.9,
        }
      });

      const text = response.text;
      if (text) {
        return text.trim().replace(/['".]+/g, '');
      } else {
        throw new Error("Empty response");
      }
    } catch (error) {
      console.error("AI Error:", error);
      return getRandomBackup(category, language);
    }
  })();

  // Race the AI against the Timeout
  return Promise.race([aiRequestPromise, timeoutPromise]);
};
