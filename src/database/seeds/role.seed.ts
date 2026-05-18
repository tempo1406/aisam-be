import { Role } from '@modules/roles/entities/role.entity';
import { RoleEnum } from 'src/enums/role.enum';
import { DataSource } from 'typeorm';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  // Check if roles already exist
  const existingRoles = await roleRepository.find();
  if (existingRoles.length > 0) {
    console.log('Roles already exist, skipping role seeding...');
    return;
  }

  // Create admin role
  const adminRole = roleRepository.create({
    name: RoleEnum.ADMIN,
    description: 'Administrator role with full system access',
  });

  // Create user role
  const userRole = roleRepository.create({
    name: RoleEnum.USER,
    description: 'Standard user role with basic permissions',
  });

  await roleRepository.save([adminRole, userRole]);

  console.log('Roles seeded successfully!');
  console.log(`Admin role created: ${adminRole.id}`);
  console.log(`User role created: ${userRole.id}`);
}
