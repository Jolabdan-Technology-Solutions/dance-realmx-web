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
          updated_at: new Date()
        },
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        role: [UserRole.ADMIN],
        created_at: new Date(),
        updated_at: new Date()
      },
    });

    // Create role mapping
    await prisma.userRoleMapping.create({
      data: {
        user_id: admin.id,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Admin user created successfully with ADMIN role');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 