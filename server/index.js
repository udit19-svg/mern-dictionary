 const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Agent with explicit IPv4 family and keep-alive to avoid Cloudflare 522 timeouts
const agent = new https.Agent({
  family: 4,
  keepAlive: true,
  timeout: 5000
});

app.get('/api/dictionary/:word', async (req, res) => {
  const { word } = req.params;
  const cleanWord = word.trim().toLowerCase();

  try {
    let wordData = null;

    // Primary Source: Free Dictionary API (dictionaryapi.dev)
    try {
      const dictResponse = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
        { httpsAgent: agent, timeout: 5000 }
      );
      wordData = dictResponse.data[0];
    } catch (primaryErr) {
      if (primaryErr.response && primaryErr.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Word nahi mila! Kripya spelling check karein.'
        });
      }

      console.warn(`Primary API timed out (${primaryErr.message}). Switching to fallback API...`);

      // Fallback Source: Datamuse / Free Alternative API
      const fallbackRes = await axios.get(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`,
        { timeout: 4000 }
      );

      if (fallbackRes.data && fallbackRes.data.length > 0 && fallbackRes.data[0].defs) {
        const item = fallbackRes.data[0];
        const parsedMeanings = item.defs.map(d => {
          const parts = d.split('\t');
          return {
            partOfSpeech: parts[0] || 'noun',
            definitions: [{ definition: parts[1] || d, example: '' }]
          };
        });

        wordData = {
          word: item.word,
          phonetic: '',
          phonetics: [],
          meanings: parsedMeanings
        };
      } else {
        throw primaryErr; // Rethrow if fallback also didn't get data
      }
    }

    // 2. Hindi Translation (Google GTX - Fast & Stable)
    let hindiMeaning = '';
    try {
      const transResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(cleanWord)}`,
        { timeout: 3000 }
      );
      if (transResponse.data && transResponse.data[0] && transResponse.data[0][0]) {
        hindiMeaning = transResponse.data[0][0][0];
      }
    } catch (transErr) {
      console.log('Hindi translation skipped for:', cleanWord);
    }

    return res.json({
      success: true,
      data: wordData,
      hindiMeaning: hindiMeaning
    });

  } catch (error) {
    console.error('Dictionary API Final Error:', error.message);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Word not found.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error, please try again later.'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});