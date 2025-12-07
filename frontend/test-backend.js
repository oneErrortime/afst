const API_URL = 'https://afst-4.onrender.com/api/v1';

async function testAPI() {
  console.log('Testing backend at:', API_URL);
  
  const tests = [
    { name: 'Books', endpoint: '/books' },
    { name: 'Categories', endpoint: '/categories' },
    { name: 'Collections (auth)', endpoint: '/collections' },
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(API_URL + test.endpoint);
      const data = await response.json();
      console.log(`✅ ${test.name}: ${response.status}`, data.message || data);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

testAPI();
