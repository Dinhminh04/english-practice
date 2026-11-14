const fetch = require("node-fetch");

// English dictionary lookups: the free dictionaryapi.dev API (vocabulary)
// and the Oxford API (grammar, needs OXFORD_APP_ID / OXFORD_APP_KEY).

const FREE_DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";
const OXFORD_URL = "https://od-api.oxforddictionaries.com/api/v2/entries/en-us";

const fetchFreeEntry = async (word) => {
  const response = await fetch(`${FREE_DICTIONARY_URL}/${word.toLowerCase()}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`Dictionary API Error for ${word}: ${response.status} ${response.statusText}`);
    throw new Error(errorBody.title || "Không tìm thấy từ trong từ điển");
  }
  const data = await response.json();
  return data[0];
};

// Word -> { word, phonetic, audio, meanings[] } (throws when the word is not found)
const lookupWord = async (word) => {
  const entry = await fetchFreeEntry(word);
  return {
    word: entry.word,
    phonetic: entry.phonetics?.find((p) => p.text)?.text || entry.phonetic,
    audio: entry.phonetics?.find((p) => p.audio)?.audio,
    meanings:
      entry.meanings?.map((meaning) => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions:
          meaning.definitions?.map((def) => ({
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms,
            antonyms: def.antonyms,
          })) || [],
      })) || [],
  };
};

// Word -> URL of a pronunciation audio file, or null (never throws)
const findPronunciationAudio = async (word) => {
  try {
    const entry = await fetchFreeEntry(word);
    return entry.phonetics?.find((p) => p.audio)?.audio || null;
  } catch (error) {
    console.error(`Could not get pronunciation audio for "${word}":`, error.message);
    return null;
  }
};

const isOxfordConfigured = () => Boolean(process.env.OXFORD_APP_ID && process.env.OXFORD_APP_KEY);

// Word -> { word, phonetic, definitions[] } from the Oxford API (throws when not found)
const lookupOxford = async (word) => {
  const response = await fetch(`${OXFORD_URL}/${word}`, {
    headers: { app_id: process.env.OXFORD_APP_ID, app_key: process.env.OXFORD_APP_KEY },
  });
  if (!response.ok) throw new Error("Không tìm thấy từ trong từ điển");

  const data = await response.json();
  const lexicalEntry = data.results[0]?.lexicalEntries[0];
  return {
    word: data.word,
    phonetic: lexicalEntry?.pronunciations?.[0]?.phoneticSpelling,
    definitions:
      lexicalEntry?.entries?.[0]?.senses?.map((sense) => ({
        definition: sense.definitions?.[0],
        examples: sense.examples?.map((ex) => ex.text) || [],
      })) || [],
  };
};

module.exports = { lookupWord, findPronunciationAudio, isOxfordConfigured, lookupOxford };
