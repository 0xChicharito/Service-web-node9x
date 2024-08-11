const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com', // Thay đổi với email của bạn
        password: 'admin', // Hash mật khẩu của bạn trước khi lưu
        role: 'ADMIN', // Gán vai trò ADMIN
      },
    });
    console.log('Admin created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
