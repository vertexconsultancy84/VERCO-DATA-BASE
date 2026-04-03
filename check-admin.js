const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.admin.findUnique({ where: { email: 'vertexconsultancy84@gmail.com' } });
    if (admin) {
      console.log('Admin found:', { id: admin.id, name: admin.name, email: admin.email, role: admin.role });
      console.log('Password hash exists:', !!admin.password);
    } else {
      console.log('No admin found with email vertexconsultancy84@gmail.com');
    }
    const allAdmins = await prisma.admin.findMany();
    console.log('Total admins in database:', allAdmins.length);
    allAdmins.forEach(a => console.log('- ', a.email, '(', a.name, ')'));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
