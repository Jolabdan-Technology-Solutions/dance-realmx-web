import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
      where: {
        username: 'superadmin',
      },
    });

    // Create default tenant if it doesn't exist
    let tenant = await prisma.tenant.findFirst({
      where: {
        name: 'Default Tenant',
      },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const adminData = {
      email: 'admin@dancerealm.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    };

    const admin = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: adminData.email,
        password: hashedPassword,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        role: adminData.role,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create role mapping
    await prisma.userRoleMapping.create({
      data: {
        user_id: admin.id,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Admin user created successfully with ADMIN role');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
