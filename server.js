import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_AI_CONFIG, createOpenAIRequest, getServerErrorMessage } from './server-ai-config.js';
import { DataIntegrationService } from './data-integration-service.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Data Integration Service
const dataService = new DataIntegrationService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API endpoint for OpenAI chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemMessage, options = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received chat request:', { message, systemMessage: systemMessage?.substring(0, 100) + '...' });

    // Prepare messages for OpenAI
    const messages = [];
    
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API using centralized configuration
    // Remove systemMessage from options since it's already handled in messages
    const { systemMessage: _, ...openAIOptions } = options;
    const openAIRequest = createOpenAIRequest(messages, openAIOptions);
    const completion = await openai.chat.completions.create(openAIRequest);

    const response = completion.choices[0].message.content;
    console.log('OpenAI response received:', response.substring(0, 100) + '...');

    res.json({ 
      response,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    const errorMessage = getServerErrorMessage(error);
    const statusCode = error.status || 500;
    
    res.status(statusCode).json({ error: errorMessage });
  }
});

// API endpoint to get article data
app.get('/api/articles', async (req, res) => {
  try {
    console.log('📊 Fetching articles from data sources...');
    const articles = await dataService.getAllArticles();
    console.log(`✅ Returning ${articles.length} articles`);
    res.json(articles);
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// API endpoint to get a specific article by slug
app.get('/api/articles/:slug', async (req, res) => {
  const { slug } = req.params;
  
  try {
    console.log(`📄 Fetching article with slug: ${slug}`);
    const articles = await dataService.getAllArticles();
    let article = articles.find(a => a.slug === slug);
    
    // If not found in main data, check fallback articles
    if (!article) {
      const fallbackArticles = dataService.getFallbackArticles();
      article = fallbackArticles.find(a => a.slug === slug);
    }
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    console.log(`✅ Found article: ${article.title}`);
    res.json(article);
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// API endpoint to search for law firms
app.get('/api/law-firms', async (req, res) => {
  try {
    const { specialty, location } = req.query;
    console.log(`🏛️ Fetching law firms - specialty: ${specialty}, location: ${location}`);
    
    const lawFirms = await dataService.getLawFirms(specialty, location);
    console.log(`✅ Returning ${lawFirms.length} law firms`);
    
    res.json(lawFirms);
  } catch (error) {
    console.error('❌ Error fetching law firms:', error);
    res.status(500).json({ error: 'Failed to fetch law firms' });
  }
});

// API endpoint to get settlement data
app.get('/api/settlements', async (req, res) => {
  try {
    const { condition, state } = req.query;
    console.log(`💰 Fetching settlement data - condition: ${condition}, state: ${state}`);
    
    const settlements = await dataService.getSettlementData(condition, state);
    console.log(`✅ Returning settlement data for ${condition}`);
    
    res.json(settlements);
  } catch (error) {
    console.error('❌ Error fetching settlement data:', error);
    res.status(500).json({ error: 'Failed to fetch settlement data' });
  }
});

// API endpoint to search for comprehensive condition information
app.get('/api/search/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    console.log(`🔍 Searching for comprehensive information about: ${condition}`);
    
    const result = await dataService.searchCondition(condition);
    console.log(`✅ Found information for ${condition}`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error searching condition:', error);
    res.status(500).json({ error: 'Failed to search condition' });
  }
});

// API endpoint to clear cache
app.post('/api/cache/clear', async (req, res) => {
  try {
    dataService.clearCache();
    console.log('🗑️ Cache cleared');
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Test endpoint to verify API key
app.get('/api/test', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 50
    });

    res.json({ 
      success: true, 
      message: 'OpenAI API connection successful',
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check your API key in .env.local'
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve individual article pages
app.get('/article/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`🤖 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`📝 Visit http://localhost:${port} to use the injury info site`);
});

export default app; 