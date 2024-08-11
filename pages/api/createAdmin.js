import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com', // Thay đổi với email của bạn
        password: 'hashedpassword', // Hash mật khẩu của bạn trước khi lưu
        role: 'ADMIN', // Gán vai trò ADMIN
      },
    });
    res.status(200).json({ message: 'Admin created', admin });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error });
  } finally {
    await prisma.$disconnect();
  }
}
