/**
 * Test script for the new data integration API endpoints
 */

async function testAPI() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 Testing Data Integration API Endpoints...\n');
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${baseUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test articles endpoint
        console.log('\n2. Testing articles endpoint...');
        const articlesResponse = await fetch(`${baseUrl}/api/articles`);
        const articlesData = await articlesResponse.json();
        console.log(`✅ Articles endpoint: ${articlesData.length} articles found`);
        
        if (articlesData.length > 0) {
            console.log('   Sample article:', articlesData[0].title);
        }
        
        // Test law firms endpoint
        console.log('\n3. Testing law firms endpoint...');
        const lawFirmsResponse = await fetch(`${baseUrl}/api/law-firms?specialty=mesothelioma`);
        const lawFirmsData = await lawFirmsResponse.json();
        console.log(`✅ Law firms endpoint: ${lawFirmsData.length} firms found`);
        
        // Test settlements endpoint
        console.log('\n4. Testing settlements endpoint...');
        const settlementsResponse = await fetch(`${baseUrl}/api/settlements?condition=mesothelioma`);
        const settlementsData = await settlementsResponse.json();
        console.log(`✅ Settlements endpoint: ${settlementsData.length} settlement records found`);
        
        // Test search endpoint
        console.log('\n5. Testing search endpoint...');
        const searchResponse = await fetch(`${baseUrl}/api/search/mesothelioma`);
        const searchData = await searchResponse.json();
        console.log('✅ Search endpoint:', searchData.condition);
        console.log(`   Found ${searchData.articles.length} articles, ${searchData.lawFirms.length} law firms`);
        
        // Test cache clear endpoint
        console.log('\n6. Testing cache clear endpoint...');
        const cacheResponse = await fetch(`${baseUrl}/api/cache/clear`, { method: 'POST' });
        const cacheData = await cacheResponse.json();
        console.log('✅ Cache clear endpoint:', cacheData.message);
        
        console.log('\n🎉 All API endpoints are working correctly!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the server is running with: npm start');
        }
    }
}

// Run the test
testAPI(); 