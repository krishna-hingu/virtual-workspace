const axios = require('axios');

const testRegister = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test User',
      email: 'test123456789@gmail.com',
      password: 'password123',
      role: 'employee'
    });
    
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
    if (error.response) {
      console.error('STATUS:', error.response.status);
      console.error('HEADERS:', error.response.headers);
    }
  }
};

testRegister();
