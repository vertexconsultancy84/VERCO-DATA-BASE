const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testPassword() {
  try {
    const admin = await prisma.admin.findUnique({ where: { email: 'vertexconsultancy84@gmail.com' } });
    if (!admin) {
      console.log('Admin not found');
      return;
    }
    
    const testPassword = 'Test@12345';
    console.log('Testing password:', testPassword);
    console.log('Stored hash:', admin.password.substring(0, 50) + '...');
    
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('Password valid:', isValid);
    
    // Test with some common variations
    const variations = [
      'Test@12345',
      'test@12345',
      'Test12345',
      'admin123',
      'password'
    ];
    
    console.log('\nTesting password variations:');
    for (const password of variations) {
      const valid = await bcrypt.compare(password, admin.password);
      console.log(`- ${password}: ${valid ? 'VALID' : 'INVALID'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
