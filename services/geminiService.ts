import { SupportedLanguage, Category } from "../types";

const getSecureRandomItem = <T>(array: T[]): T | null => {
  if (array.length === 0) return null;
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % array.length;
  return array[randomIndex];
};

const BACKUPS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    ANIMALS: ["Lion", "Elephant", "Penguin", "Giraffe", "Kangaroo", "Panda", "Great White Shark", "Bald Eagle", "Gray Wolf"],
    FOOD: ["Pepperoni Pizza", "Cheese Burger", "Salmon Sushi", "Beef Tacos", "Spaghetti Carbonara", "Vanilla Ice Cream", "Butter Croissant", "Blueberry Pancakes"],
    MOVIES: ["Titanic", "Jurassic Park", "The Lion King", "Avatar", "Star Wars: A New Hope", "Harry Potter", "Inception", "The Matrix"],
    CITIES: ["Paris", "New York City", "Tokyo", "London", "Rome", "Barcelona", "Dubai", "Sydney", "Cairo"],
    OBJECTS: ["Umbrella", "Mountain Bicycle", "Sunglasses", "Digital Camera", "Electric Guitar", "Backpack", "Wristwatch", "Laptop"],
    JOBS: ["Astronaut", "Firefighter", "Surgeon", "Commercial Pilot", "Executive Chef", "Professional Artist", "Private Detective", "Farmer"],
    SPORTS: ["Football", "Basketball", "Tennis", "Baseball", "Swimming", "Boxing", "Golf", "Volleyball"],
    CLOTHING: ["T-shirt", "Denim Jeans", "Leather Jacket", "Summer Dress", "Wool Sweater", "Sneakers", "Winter Scarf", "Fedora Hat"],
    COUNTRIES: ["United States", "Japan", "Italy", "Brazil", "Germany", "Mexico", "France", "Canada", "Argentina"],
    BRANDS: ["Nike", "Apple", "Coca-Cola", "Google", "Adidas", "Samsung", "Disney", "Tesla"],
    CARTOONS: ["Mickey Mouse", "SpongeBob SquarePants", "The Simpsons", "Pokémon", "Tom and Jerry", "Looney Tunes"],
    INSTRUMENTS: ["Grand Piano", "Acoustic Guitar", "Drum Set", "Violin", "Flute", "Saxophone", "Trumpet", "Harp"]
  },
  es: {
    ANIMALS: ["León Africano", "Elefante", "Pingüino Emperador", "Jirafa", "Canguro", "Oso Panda", "Tiburón Blanco", "Águila Real", "Lobo Gris"],
    FOOD: ["Pizza de Pepperoni", "Hamburguesa Completa", "Sushi de Salmón", "Tacos al Pastor", "Pasta a la Boloñesa", "Helado de Vainilla", "Medialuna de Manteca", "Panqueques con Dulce de Leche"],
    MOVIES: ["Titanic", "Jurassic Park", "El Rey León", "Avatar", "Star Wars", "Harry Potter", "Inception", "Matrix"],
    CITIES: ["París", "Nueva York", "Tokio", "Londres", "Roma", "Barcelona", "Dubai", "Sídney", "El Cairo"],
    OBJECTS: ["Paraguas", "Bicicleta de Montaña", "Lentes de sol", "Cámara Digital", "Guitarra Eléctrica", "Mochila", "Reloj de pulsera", "Computadora Portátil"],
    JOBS: ["Astronauta", "Bombero", "Médico Cirujano", "Piloto de Avión", "Chef Ejecutivo", "Artista Plástico", "Detective Privado", "Granjero"],
    SPORTS: ["Fútbol", "Básquet", "Tenis", "Béisbol", "Natación", "Boxeo", "Golf", "Vóley"],
    CLOTHING: ["Remera", "Pantalón Jean", "Campera de Cuero", "Vestido de Verano", "Suéter de Lana", "Zapatillas", "Bufanda", "Gorra"],
    COUNTRIES: ["España", "Japón", "Italia", "Brasil", "Alemania", "México", "Francia", "Canadá", "Argentina"],
    BRANDS: ["Nike", "Apple", "Coca-Cola", "Google", "Adidas", "Samsung", "Disney", "Tesla"],
    CARTOONS: ["Mickey Mouse", "Bob Esponja", "Los Simpsons", "Pokémon", "Tom y Jerry", "Looney Tunes"],
    INSTRUMENTS: ["Piano de Cola", "Guitarra Acústica", "Batería", "Violín", "Flauta Travesera", "Saxofón", "Trompeta", "Arpa"]
  }
};

const UNDERCOVER_BACKUPS: Record<SupportedLanguage, [string, string][]> = {
  en: [["Coca-Cola", "Pepsi"], ["iPhone", "Samsung Galaxy"], ["Burger King", "McDonald's"], ["Star Wars", "Star Trek"], ["Batman", "Iron Man"], ["Adidas", "Nike"]],
  es: [["Coca-Cola", "Pepsi"], ["iPhone", "Samsung Galaxy"], ["Burger King", "McDonald's"], ["Disney+", "Netflix"], ["Mate", "Café"], ["Perro", "Gato"], ["Fútbol", "Básquet"]]
};

const SONGS_BACKUPS: Record<SupportedLanguage, [string, string][]> = {
  en: [["Thriller - Michael Jackson", "Smooth Criminal - Michael Jackson"], ["Bohemian Rhapsody - Queen", "Stairway to Heaven - Led Zeppelin"], ["Blinding Lights - The Weeknd", "Starboy - The Weeknd"], ["Shape of You - Ed Sheeran", "Despacito - Luis Fonsi"]],
  es: [["La Morocha - Luck Ra", "Hola Perdida - Luck Ra"], ["Gasolina - Daddy Yankee", "Danza Kuduro - Don Omar"], ["De Música Ligera - Soda Stereo", "Persiana Americana - Soda Stereo"], ["Provenza - Karol G", "Tusa - Karol G"], ["Matador - Los Fabulosos Cadillacs", "Vasos Vacíos - Los Fabulosos Cadillacs"]]
};

export const generateWord = async (category: Category, language: SupportedLanguage, forbidden: string[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const list = BACKUPS[language][category].filter(w => !forbidden.includes(w));
      return getSecureRandomItem(list.length > 0 ? list : BACKUPS[language][category]) || "Error";
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const seed = Math.random();
    
    const forbiddenPrompt = forbidden.length > 0 ? `. DO NOT use any of these words: ${forbidden.join(", ")}` : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Category: ${category}. Language: ${language}. Seed: ${seed}${forbiddenPrompt}. 
      Give me ONE very specific and famous entity or common word for this category. 
      RULES:
      1. Use the FULL NAME. NO abbreviations (e.g., use 'France' not 'Fr', 'United States' not 'USA').
      2. Choose something different and unique, avoid repeating common items.
      3. Return ONLY the name, no punctuation.`,
      config: { temperature: 1, maxOutputTokens: 30 }
    });
    
    const result = response.text.trim().replace(/[".]/g, '');
    return result || getSecureRandomItem(BACKUPS[language][category]) || "Error";
  } catch { 
    const list = BACKUPS[language][category].filter(w => !forbidden.includes(w));
    return getSecureRandomItem(list.length > 0 ? list : BACKUPS[language][category]) || "Error";
  }
};

export const generateDuel = async (type: 'UNDERCOVER' | 'SONGS', language: SupportedLanguage, forbidden: string[]): Promise<{ wordA: string, wordB: string }> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const pair = getSecureRandomItem(type === 'SONGS' ? SONGS_BACKUPS[language] : UNDERCOVER_BACKUPS[language])!;
      return { wordA: pair[0], wordB: pair[1] };
    }
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    const seed = Math.random();
    const forbiddenPrompt = forbidden.length > 0 ? `. DO NOT use any of these: ${forbidden.join(", ")}` : "";

    const systemPrompt = type === 'SONGS'
      ? `You are a music expert. Provide two very famous and similar SONGS with specific names like "Song Title - Artist Name". They must be similar enough to dance to. Language: ${language}. Seed: ${seed}${forbiddenPrompt}. Use full titles.`
      : `You are a branding expert. Provide two very similar famous brands, characters, or objects (NOT SONGS). Language: ${language}. Seed: ${seed}${forbiddenPrompt}. Use full names, no abbreviations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Return a JSON with 'wordA' and 'wordB'.",
      config: { 
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { wordA: { type: Type.STRING }, wordB: { type: Type.STRING } },
          required: ["wordA", "wordB"]
        }
      }
    });
    const data = JSON.parse(response.text);
    if (!data.wordA || !data.wordB) throw new Error("Invalid format");
    return data;
  } catch {
    const pair = getSecureRandomItem(type === 'SONGS' ? SONGS_BACKUPS[language] : UNDERCOVER_BACKUPS[language])!;
    return { wordA: pair[0], wordB: pair[1] };
  }
};