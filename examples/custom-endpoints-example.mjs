import { NodeLLM } from '../packages/core/dist/index.js';
import 'dotenv/config';

async function chatExample() {
  console.log('=== Chat Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  const chat = NodeLLM.chat('gpt-4').withRequestOptions({
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  const response = await chat.ask('What is Azure OpenAI?');
  console.log('Response:', response.toString().substring(0, 200) + '...');
  console.log('Tokens:', response.usage);
}

async function streamingExample() {
  console.log('\n=== Streaming Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  const chat = NodeLLM.chat('gpt-4').withRequestOptions({
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  process.stdout.write('Streaming: ');
  for await (const chunk of chat.stream('Count from 1 to 5')) {
    process.stdout.write(chunk.content);
  }
  console.log('\n');
}

async function embeddingExample() {
  console.log('\n=== Embedding Example ===\n');
  
  if (!process.env.EMBEDDING_API_ENDPOINT || !process.env.EMBEDDING_API_KEY) {
    console.log('Skipped - EMBEDDING_API_ENDPOINT and EMBEDDING_API_KEY not set');
    return;
  }
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.EMBEDDING_API_KEY,
    openaiApiBase: process.env.EMBEDDING_API_ENDPOINT
  });

  const model = process.env.EMBEDDING_MODEL;

  const embedding = await NodeLLM.embed('Azure OpenAI is powerful', {
    model,
    headers: { 'api-key': process.env.EMBEDDING_API_KEY }
  });
  
  console.log('Embedding dimensions:', embedding.dimensions);
  console.log('Model:', embedding.model);
  console.log('Vector preview:', embedding.vector.slice(0, 5), '...');
}

async function imageExample() {
  console.log('\n=== Image Generation Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  const image = await NodeLLM.paint('A sunset over mountains', {
    model: 'dall-e-3',
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  console.log('Image URL:', image.url);
  console.log('Revised prompt:', image.revised_prompt);
}

async function moderationExample() {
  console.log('\n=== Moderation Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  const result = await NodeLLM.moderate('This is a friendly message', {
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  console.log('Flagged:', result.flagged);
  console.log('Categories:', result.categories);
}

async function transcriptionExample() {
  console.log('\n=== Transcription Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  // Note: You need an actual audio file for this to work
  // const result = await NodeLLM.transcribe('path/to/audio.mp3', {
  //   headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  // });
  // console.log('Transcription:', result.text);
  
  console.log('Skipped - requires audio file');
}

async function modelsExample() {
  console.log('\n=== List Models Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  const models = await NodeLLM.models({
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  console.log('Available models:', models.length);
  console.log('First 3 models:', models.slice(0, 3).map(m => m.id));
}

async function assumeModelExistsExample() {
  console.log('\n=== Assume Model Exists Example ===\n');
  
  NodeLLM.configure({ 
    provider: 'openai',
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
  });

  // We use the flag to demonstrate bypassing validation.
  // Useful for custom deployments like 'my-company-gpt-4'
  const chat = NodeLLM.chat('gpt-4', {
    assumeModelExists: true,
    headers: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  
  const response = await chat.ask('This request skips model validation!');
  console.log('Response:', response.toString().substring(0, 100) + '...');
}

async function main() {
  try {
    await chatExample();
    await streamingExample();
    await embeddingExample();
    await assumeModelExistsExample();
    // await imageExample();        // Uncomment if DALL-E is deployed
    // await moderationExample();   // Uncomment if moderation is available
    // await transcriptionExample(); // Uncomment if you have audio files
    // await modelsExample();        // Uncomment to list models
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
