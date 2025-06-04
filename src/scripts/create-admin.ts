import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        username: 'admin',
      },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

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
        },
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
      },
    });

    // Assign all roles to admin one by one
    const roles = Object.values(UserRole);
    for (const role of roles) {
      try {
        await prisma.userRoleMapping.create({
          data: {
            user_id: admin.id,
            role,
          },
        });
      } catch (error) {
        console.log(`Role ${role} already assigned or error:`, error);
      }
    }

    console.log('Admin user created successfully with all roles');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 