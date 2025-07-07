import OpenAIChatbotConnector from './openai-chatbot-connector.js';

async function demonstrateChatbot() {
  console.log('🤖 OpenAI Chatbot Demo Starting...\n');

  // Initialize the chatbot
  const chatbot = new OpenAIChatbotConnector();

  try {
    // Test the connection first
    console.log('🔍 Testing OpenAI API connection...');
    const isConnected = await chatbot.testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to OpenAI API. Please check your API key.');
      return;
    }

    console.log('✅ Connected to OpenAI API successfully!\n');

    // Example 1: Simple conversation
    console.log('📝 Example 1: Simple Conversation');
    console.log('═══════════════════════════════════');
    
    const userMessage1 = "Hello! Can you write a haiku about artificial intelligence?";
    console.log(`User: ${userMessage1}`);
    
    const response1 = await chatbot.sendMessage(userMessage1);
    console.log(`Assistant: ${response1}\n`);

    // Example 2: Follow-up conversation (uses history)
    console.log('📝 Example 2: Follow-up Conversation');
    console.log('═══════════════════════════════════');
    
    const userMessage2 = "Can you explain that haiku in simple terms?";
    console.log(`User: ${userMessage2}`);
    
    const response2 = await chatbot.sendMessage(userMessage2);
    console.log(`Assistant: ${response2}\n`);

    // Example 3: Generate a response without conversation history
    console.log('📝 Example 3: One-time Response Generation');
    console.log('═══════════════════════════════════════════');
    
    const prompt = "Explain quantum computing in one sentence.";
    console.log(`Prompt: ${prompt}`);
    
    const response3 = await chatbot.generateResponse(prompt, {
      systemMessage: "You are a science educator. Explain complex topics simply.",
      temperature: 0.5,
      maxTokens: 100
    });
    console.log(`Response: ${response3}\n`);

    // Example 4: Custom options
    console.log('📝 Example 4: Custom Options');
    console.log('═════════════════════════════');
    
    const userMessage4 = "Tell me a creative story about a robot.";
    console.log(`User: ${userMessage4}`);
    
    const response4 = await chatbot.sendMessage(userMessage4, {
      temperature: 0.9, // More creative
      maxTokens: 200,
      model: "gpt-4o-mini"
    });
    console.log(`Assistant: ${response4}\n`);

    // Show conversation history
    console.log('📋 Conversation History:');
    console.log('═══════════════════════');
    const history = chatbot.getHistory();
    history.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });

    // Clear history demonstration
    console.log('\n🗑️ Clearing conversation history...');
    chatbot.clearHistory();
    console.log('History cleared. New conversation will start fresh.\n');

    // Example 5: Fresh conversation after clearing history
    console.log('📝 Example 5: Fresh Conversation');
    console.log('═══════════════════════════════');
    
    const userMessage5 = "What did we talk about earlier?";
    console.log(`User: ${userMessage5}`);
    
    const response5 = await chatbot.sendMessage(userMessage5);
    console.log(`Assistant: ${response5}\n`);

    console.log('🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
    console.error('Please check your OpenAI API key and internet connection.');
  }
}

// Run the demonstration
demonstrateChatbot().catch(console.error);

// Export for use in other modules
export { demonstrateChatbot }; 