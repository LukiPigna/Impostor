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
    INTERNET: ["Rickroll", "Doge", "TikTok", "MrBeast", "Skibidi Toilet", "Discord", "Fortnite", "Minecraft", "Trollface"],
    VILLAINS: ["Joker", "Thanos", "Darth Vader", "Voldemort", "Scar", "Hannibal Lecter", "Cruella", "The Riddler", "Green Goblin"],
    NOSTALGIA: ["Game Boy", "Tamagotchi", "Walkman", "Blockbuster", "MSN Messenger", "Pac-Man", "iPod Nano", "Cassette"],
    LEGENDS: ["Michael Jordan", "Mike Tyson", "Muhammad Ali", "Messi", "Cristiano Ronaldo", "Serena Williams", "Tiger Woods"],
    ANIME: ["Pikachu", "Goku", "Naruto", "Sailor Moon", "Luffy", "Spirited Away", "Death Note", "Totoro"],
    GADGETS: ["iPhone 1", "Tesla", "VR Glasses", "Drone", "Apple Watch", "Hoverboard", "Nintendo Switch"]
  },
  es: {
    INTERNET: ["Rickroll", "Doge", "TikTok", "Ibai Llanos", "Auronplay", "WhatsApp", "Minecraft", "Instagram", "Stickers"],
    VILLAINS: ["El Guasón", "Thanos", "Darth Vader", "Voldemort", "Scar", "Cruella de Vil", "Lex Luthor", "Freezer"],
    NOSTALGIA: ["Game Boy", "Tamagotchi", "Walkman", "Blockbuster", "Fotolog", "MSN Messenger", "Flippers", "Cassette"],
    LEGENDS: ["Messi", "Maradona", "Manu Ginóbili", "Rafa Nadal", "Pau Gasol", "Sena", "Fangio", "Michael Jordan"],
    ANIME: ["Pikachu", "Goku", "Naruto", "Caballeros del Zodiaco", "Luffy", "Oliver Atom", "Death Note", "Totoro"],
    GADGETS: ["iPhone", "Tesla", "Lentes VR", "Dron", "Apple Watch", "Hoverboard", "PlayStation 5", "Alexa"]
  }
};

const UNDERCOVER_BACKUPS: Record<SupportedLanguage, [string, string][]> = {
  en: [["Coca-Cola", "Pepsi"], ["iPhone", "Samsung"], ["Burger King", "McDonald's"], ["Star Wars", "Star Trek"], ["Batman", "Iron Man"], ["Adidas", "Nike"]],
  es: [["Coca-Cola", "Pepsi"], ["iPhone", "Samsung"], ["Burger King", "McDonald's"], ["Disney+", "Netflix"], ["Mate", "Café"], ["Perro", "Gato"], ["Fútbol", "Básquet"]]
};

const SONGS_BACKUPS: Record<SupportedLanguage, [string, string][]> = {
  en: [["Thriller - Michael Jackson", "Smooth Criminal - Michael Jackson"], ["Bohemian Rhapsody - Queen", "Stairway to Heaven - Led Zeppelin"], ["Blinding Lights - The Weeknd", "Starboy - The Weeknd"], ["Shape of You - Ed Sheeran", "Despacito - Luis Fonsi"]],
  es: [["La Morocha - Luck Ra", "Hola Perdida - Luck Ra"], ["Gasolina - Daddy Yankee", "Danza Kuduro - Don Omar"], ["De Música Ligera - Soda Stereo", "Persiana Americana - Soda Stereo"], ["Provenza - Karol G", "Tusa - Karol G"], ["Matador - Los Fabulosos Cadillacs", "Vasos Vacíos - Los Fabulosos Cadillacs"]]
};

export const generateWord = async (category: Category, language: SupportedLanguage, forbidden: string[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return getSecureRandomItem(BACKUPS[language][category]) || "Error";
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const seed = Math.random();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Category: ${category}. Language: ${language}. Seed: ${seed}. Give me ONE very specific and famous entity. Avoid generic terms. Just the name.`,
      config: { temperature: 1.2, maxOutputTokens: 20 }
    });
    return response.text.trim().replace(/[".]/g, '') || getSecureRandomItem(BACKUPS[language][category]) || "Error";
  } catch { return getSecureRandomItem(BACKUPS[language][category]) || "Error"; }
};

export const generateDuel = async (type: 'UNDERCOVER' | 'SONGS', language: SupportedLanguage): Promise<{ wordA: string, wordB: string }> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const pair = getSecureRandomItem(type === 'SONGS' ? SONGS_BACKUPS[language] : UNDERCOVER_BACKUPS[language])!;
      return { wordA: pair[0], wordB: pair[1] };
    }
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    const seed = Math.random();
    const systemPrompt = type === 'SONGS'
      ? `You are a music expert. Provide two very famous and similar SONGS with specific names like "Song Title - Artist Name". They must be similar enough to dance to. Language: ${language}. Seed: ${seed}.`
      : `You are a branding expert. Provide two very similar famous brands, characters, or objects (NOT SONGS). Language: ${language}. Seed: ${seed}.`;

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