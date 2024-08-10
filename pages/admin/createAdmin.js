import prisma from '@utils/prismadb';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    const email = 'admin@gmail.com';
    const password = 'adminpassword';

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng với vai trò admin
    const newAdmin = await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
            role: 'admin', // Gán vai trò admin
        },
    });

    console.log('Admin user created:', newAdmin);
}

createAdmin()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
