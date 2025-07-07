import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

class OpenAIChatbotConnector {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 messages for context
  }

  /**
   * Send a message to the OpenAI chatbot and get a response
   * @param {string} userMessage - The user's message
   * @param {object} options - Additional options for the API call
   * @returns {Promise<string>} - The chatbot's response
   */
  async sendMessage(userMessage, options = {}) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage
      });

      // Prepare messages for API call
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant. Be concise and friendly in your responses."
        },
        ...this.conversationHistory
      ];

      // Create chat completion
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4o-mini",
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        store: options.store || true,
        ...options
      });

      const assistantMessage = completion.choices[0].message.content;

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage
      });

      // Trim history if it gets too long
      if (this.conversationHistory.length > this.maxHistoryLength * 2) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
      }

      return assistantMessage;
    } catch (error) {
      console.error('Error in OpenAI chatbot:', error);
      throw new Error(`Chatbot error: ${error.message}`);
    }
  }

  /**
   * Generate a response for a specific prompt without conversation history
   * @param {string} prompt - The prompt to send
   * @param {object} options - Additional options
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(prompt, options = {}) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: options.systemMessage || "You are a helpful assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        store: options.store || true,
        ...options
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Response generation error: ${error.message}`);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history
   * @returns {Array} - Array of conversation messages
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Test the connection to OpenAI API
   * @returns {Promise<boolean>} - Whether the connection is successful
   */
  async testConnection() {
    try {
      const response = await this.generateResponse("Hello, this is a test message.");
      console.log('OpenAI API connection test successful:', response);
      return true;
    } catch (error) {
      console.error('OpenAI API connection test failed:', error);
      return false;
    }
  }
}

export default OpenAIChatbotConnector; 