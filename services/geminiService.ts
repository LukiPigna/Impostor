import { SupportedLanguage, Category } from "../types";

// Helper for crypto-random selection from arrays
const getSecureRandomItem = <T>(array: T[]): T | null => {
  if (array.length === 0) return null;
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % array.length;
  return array[randomIndex];
};

// Bilingual Fallback database (Expanded for variety during timeouts)
const BACKUPS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    FAMOUS: ["Taylor Swift", "Elon Musk", "Batman", "Marilyn Monroe", "Albert Einstein", "Michael Jackson", "Harry Potter", "Barack Obama", "Leonardo DiCaprio", "Queen Elizabeth", "Messi", "Ronaldo", "Beyonce", "Trump", "Steve Jobs", "Tom Cruise", "Oprah", "Will Smith", "Dwayne Johnson", "Keanu Reeves", "Adele", "Snoop Dogg", "Billie Eilish"],
    ANIMALS: ["Giraffe", "Penguin", "Lion", "Elephant", "Platypus", "Kangaroo", "Dolphin", "Panda", "Koala", "Octopus", "Shark", "Eagle", "Tiger", "Gorilla", "Wolf", "Zebra", "Owl", "Bear", "Chameleon", "Sloth", "Meerkat", "Flamingo"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "The Matrix", "Frozen", "Avatar", "The Lion King", "Jurassic Park", "Inception", "The Avengers", "Shrek", "Spider-Man", "Joker", "Toy Story", "Gladiator", "Finding Nemo", "Back to the Future", "The Godfather", "Pulp Fiction"],
    PLACES: ["Paris", "Tokyo", "New York", "Egypt", "Mars", "London", "Hawaii", "The Great Wall of China", "Rome", "Sydney", "Dubai", "Las Vegas", "Antarctica", "Amazon Rainforest", "Mount Everest", "Grand Canyon", "Niagara Falls", "Taj Mahal"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Ice Cream", "Hamburger", "Spaghetti", "Pancakes", "Chocolate", "Steak", "Donuts", "Burrito", "Fried Chicken", "Popcorn", "Hot Dog", "Salad", "Croissant", "Ramen", "Curry", "Waffles"],
    OBJECTS: ["iPhone", "Umbrella", "Piano", "Toothbrush", "Chair", "Laptop", "Bicycle", "Headphones", "Camera", "Watch", "Shoe", "Book", "Lamp", "Backpack", "Sunglasses", "Key", "Wallet", "Microwave", "Scissors"]
  },
  es: {
    FAMOUS: ["Lionel Messi", "Shakira", "Batman", "Frida Kahlo", "Einstein", "Bad Bunny", "El Chavo del 8", "Picasso", "Maradona", "Jennifer Lopez", "Cristiano Ronaldo", "Papa Francisco", "Will Smith", "Harry Potter", "Goku", "Iron Man", "Luis Miguel", "Mirtha Legrand", "Ricardo Darín", "Daddy Yankee", "Karol G", "Susana Giménez", "Guillermo Francella"],
    ANIMALS: ["Jirafa", "Pingüino", "León", "Elefante", "Ornitorrinco", "Canguro", "Delfín", "Oso Panda", "Lama", "Tiburón", "Águila", "Tigre", "Gorila", "Lobo", "Cebra", "Búho", "Oso Polar", "Hipopótamo", "Carpincho", "Hornero", "Yaguareté", "Coatí"],
    MOVIES: ["Titanic", "Star Wars", "Harry Potter", "Matrix", "Frozen", "El Rey León", "Jurassic Park", "Toy Story", "Avengers", "Coco", "Shrek", "Spiderman", "El Padrino", "Volver al Futuro", "Buscando a Nemo", "Mi Pobre Angelito", "Relatos Salvajes", "El Secreto de sus Ojos", "Esperando la Carroza"],
    PLACES: ["París", "Tokio", "Nueva York", "Egipto", "Marte", "Roma", "Machu Picchu", "La Muralla China", "Buenos Aires", "Madrid", "Brasil", "Cancún", "Disney", "Las Vegas", "Torre Eiffel", "Cataratas del Iguazú", "Bariloche", "Ushuaia", "El Obelisco"],
    FOOD: ["Pizza", "Sushi", "Tacos", "Helado", "Hamburguesa", "Paella", "Empanadas", "Asado", "Milanesa", "Churros", "Mate", "Fernet", "Chocolate", "Papas Fritas", "Ensalada", "Torta", "Dulce de Leche", "Alfajor", "Choripán"],
    OBJECTS: ["Celular", "Paraguas", "Piano", "Cepillo de dientes", "Silla", "Computadora", "Bicicleta", "Auriculares", "Reloj", "Lentes", "Zapato", "Libro", "Lámpara", "Mochila", "Llave", "Guitarra", "Mate", "Termo", "Control Remoto"]
  }
};

const getRandomBackup = (category: Category, language: SupportedLanguage, forbiddenWords: string[]) => {
  const langBackups = BACKUPS[language] || BACKUPS['en'];
  const key = category as string;
  const list = langBackups[key] || langBackups['FAMOUS'];
  
  // Filter out words that have already been played in this session
  const availableList = list.filter(word => !forbiddenWords.some(fw => fw.toLowerCase() === word.toLowerCase()));

  // If we exhausted the list, fallback to the full list (allows repeats if played for hours)
  if (availableList.length === 0) {
      return getSecureRandomItem(list) || "Error";
  }
  
  return getSecureRandomItem(availableList) || "Error";
};

// Generate a random letter to force the AI to diverge
const getRandomLetter = () => {
    const alphabet = "ABCDEFGHIJKLMNOPRSTUVW"; // Excluded tough letters like Q, X, Z for broader appeal
    return getSecureRandomItem(alphabet.split('')) || 'A';
};

const getRandomConstraint = (category: Category, language: SupportedLanguage): string => {
    const isEs = language === 'es';
    
    // Constraints force the AI to step away from "Taylor Swift" or "Lionel Messi"
    const constraints: Record<Category, string[]> = {
        FAMOUS: isEs ? [
            "Debe ser un villano de película", "Debe ser un cantante de los 80s", "Debe ser un científico famoso", 
            "Debe ser un atleta olímpico", "Debe ser un personaje de Disney", "Debe ser un líder histórico",
            "Debe ser un Youtuber famoso", "Debe ser un pintor clásico", "Su nombre debe empezar con " + getRandomLetter(),
            "Debe ser un personaje de ficción", "Debe ser un político polémico", "Debe ser un músico de Rock"
        ] : [
            "Must be a movie villain", "Must be an 80s singer", "Must be a famous scientist",
            "Must be an olympic athlete", "Must be a Disney character", "Must be a historical leader",
            "Must be a famous Youtuber", "Must be a classic painter", "Name must start with " + getRandomLetter(),
            "Must be a fictional character", "Must be a controversial politician", "Must be a Rock musician"
        ],
        ANIMALS: isEs ? [
            "Debe vivir en la selva", "Debe ser un animal microscópico", "Debe ser un animal extinto",
            "Debe ser una raza de perro", "Debe ser un insecto venenoso", "Nombre debe empezar con " + getRandomLetter(),
            "Debe ser un animal de granja", "Debe vivir en el fondo del mar"
        ] : [
            "Must live in the jungle", "Must be microscopic", "Must be extinct",
            "Must be a dog breed", "Must be a poisonous insect", "Name must start with " + getRandomLetter(),
            "Must be a farm animal", "Must live deep in the ocean"
        ],
        MOVIES: isEs ? [
            "Película de terror clásica", "Película animada de Pixar", "Película ganadora del Oscar",
            "Película de superhéroes", "Comedia romántica de los 90s", "Película de Ciencia Ficción", "Dibujo animado antiguo"
        ] : [
            "Classic horror movie", "Pixar animated movie", "Oscar winning movie",
            "Superhero movie", "90s Rom-Com", "Sci-Fi movie", "Old cartoon"
        ],
        PLACES: isEs ? [
            "Una capital de Europa", "Una isla famosa", "Un desierto", "Un estadio de fútbol famoso",
            "Un monumento asiático", "Una ciudad de Estados Unidos", "Un país de Sudamérica", "Una maravilla del mundo"
        ] : [
            "A European capital", "A famous island", "A desert", "A famous stadium",
            "An Asian monument", "A US City", "A South American country", "A wonder of the world"
        ],
        FOOD: isEs ? [
            "Comida picante", "Un postre con chocolate", "Una fruta tropical", "Comida italiana",
            "Comida callejera", "Un vegetal verde", "Comida típica de desayuno"
        ] : [
            "Spicy food", "Chocolate dessert", "Tropical fruit", "Italian dish",
            "Street food", "Green vegetable", "Typical breakfast food"
        ],
        OBJECTS: isEs ? [
            "Algo que encontrás en un baño", "Herramienta de construcción", "Instrumento musical",
            "Algo que llevás en la playa", "Algo que hay en una oficina", "Algo que hay en la cocina"
        ] : [
            "Something found in a bathroom", "Construction tool", "Musical instrument",
            "Something brought to the beach", "Office supply", "Something in the kitchen"
        ]
    };

    const list = constraints[category] || [];
    return list.length > 0 ? getSecureRandomItem(list) || "" : "";
}

export const generateWord = async (
    category: Category, 
    language: SupportedLanguage = 'en',
    forbiddenWords: string[] = []
): Promise<string> => {
  
  // 1. TIMEOUT RACE: If AI takes > 3.5 seconds, force use of Backup.
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      console.warn("AI Request Timed out. Using Backup.");
      resolve(getRandomBackup(category, language, forbiddenWords));
    }, 3500); 
  });

  // 2. AI Request Logic
  const aiRequestPromise = (async (): Promise<string> => {
    try {
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.warn("Gemini API Key missing. Using offline backup.");
        return getRandomBackup(category, language, forbiddenWords);
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const specificConstraint = getRandomConstraint(category, language);
      const randomSeed = Math.floor(Math.random() * 1000000);

      const strictInstruction = language === 'es' 
        ? "Responde SOLO el nombre, sin explicaciones. NO uses comillas." 
        : "Respond ONLY the name, no explanations. Do NOT use quotes.";

      // Send the last 20 words to the AI to prevent repetition logic
      const recentHistory = forbiddenWords.slice(-20).join(", ");
      const exclusionInstruction = recentHistory.length > 0 
        ? (language === 'es' 
            ? `IMPORTANTE: NO repitas ninguna de estas palabras: [${recentHistory}]. Dame algo diferente.` 
            : `IMPORTANT: Do NOT repeat any of these words: [${recentHistory}]. Give me something different.`)
        : "";

      const contextPrompt = language === 'es' 
        ? `Dame 1 ejemplo ÚNICO, CREATIVO y MENOS COMÚN de: ${category}. Condición obligatoria: ${specificConstraint}. ${exclusionInstruction} ${strictInstruction} Seed: ${randomSeed}`
        : `Give me 1 UNIQUE, CREATIVE and LESS COMMON example of: ${category}. Mandatory constraint: ${specificConstraint}. ${exclusionInstruction} ${strictInstruction} Seed: ${randomSeed}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
            maxOutputTokens: 25, 
            temperature: 1.3, // High temperature for maximum variety
            topP: 0.9,
        }
      });

      const text = response.text;
      if (text) {
        const cleaned = text.trim().replace(/['".]+/g, '');
        // Basic client-side check just in case AI ignored the prompt (LLM hallucination)
        if (forbiddenWords.some(fw => fw.toLowerCase() === cleaned.toLowerCase())) {
             console.warn("AI repeated a word despite instructions. Retrying with backup.");
             return getRandomBackup(category, language, forbiddenWords);
        }
        return cleaned;
      } else {
        throw new Error("Empty response");
      }
    } catch (error) {
      console.error("AI Error:", error);
      return getRandomBackup(category, language, forbiddenWords);
    }
  })();

  // Race the AI against the Timeout
  return Promise.race([aiRequestPromise, timeoutPromise]);
};