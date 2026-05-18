import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { RoleEnum } from '../../enums/role.enum';
import { hashString } from '../../utils/auth';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@gmail.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping admin user seeding...');
    return;
  }

  // Find admin role
  const adminRole = await roleRepository.findOne({
    where: { name: RoleEnum.ADMIN },
  });

  if (!adminRole) {
    throw new Error('Admin role not found. Please run role seeding first.');
  }

  // Hash the default admin password
  const hashedPassword = await hashString('Admin@123456');

  // Create admin user
  const adminUser = userRepository.create({
    email: 'admin@gmail.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    roleId: adminRole.id,
    provider: 'local',
  });

  // Save admin user to database
  await userRepository.save(adminUser);

  console.log('Admin user seeded successfully!');
  console.log(`- Email: admin@gmail.com`);
  console.log(`- Password: Admin@123456`);
  console.log(`- User ID: ${adminUser.id}`);
  console.log(`- Role: ${adminRole.name}`);
}
