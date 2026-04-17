import 'dotenv/config';
import fetch from 'node-fetch';

async function listModels() {
    const apiKey = process.env.OPENAI_API_KEY;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

listModels();
