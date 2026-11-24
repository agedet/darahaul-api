import 'dotenv/config';
import { PrismaClient, user_role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN = {
  first_name: 'Aniekan',
  last_name: 'Edet',
  email: 'aniekanedetdev@gmail.com',
  phone_number: '07065606131',
  password: 'SuperAgent9060',
};

async function main() {
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12);

  let user = await prisma.users.findFirst({
    where: { email: SUPER_ADMIN.email },
  });

  if (!user) {
    user = await prisma.users.create({
      data: {
        id: randomUUID(),
        encrypted_password: hashedPassword,
        instance_id: '00000000-0000-0000-0000-000000000000',
        role: user_role.Super_Admin,
        email: SUPER_ADMIN.email,
        phone: SUPER_ADMIN.phone_number,
        is_anonymous: false,
        email_confirmed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log(`Created super_admin user ${user.id}`);
  } else {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        encrypted_password: hashedPassword,
        role: user_role.Super_Admin,
        phone: SUPER_ADMIN.phone_number,
        email_confirmed_at: user.email_confirmed_at ?? new Date(),
        created_at: user.created_at ?? new Date(),
        updated_at: new Date(),
      },
    });
    console.log(`Updated existing user ${user.id} to SUPER_ADMIN`);
  }

  await prisma.user_profiles.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      first_name: SUPER_ADMIN.first_name,
      last_name: SUPER_ADMIN.last_name,
      phone_number: SUPER_ADMIN.phone_number,
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      isActive: true,
      email_confirmed_at: new Date(),
      last_sign_in_at: new Date(),
    },
    update: {
      first_name: SUPER_ADMIN.first_name,
      last_name: SUPER_ADMIN.last_name,
      phone_number: SUPER_ADMIN.phone_number,
      email: SUPER_ADMIN.email,
    },
  });

  console.log(
    `Super admin seeded: ${SUPER_ADMIN.first_name} ${SUPER_ADMIN.last_name} <${SUPER_ADMIN.email}>`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
