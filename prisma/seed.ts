import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create primary user (David)
  const primaryUser = await prisma.user.upsert({
    where: { phoneNumber: process.env.PRIMARY_USER_PHONE || '+1234567890' },
    update: {},
    create: {
      phoneNumber: process.env.PRIMARY_USER_PHONE || '+1234567890',
      name: process.env.PRIMARY_USER_NAME || 'David',
      email: 'david@example.com',
      isPrimaryUser: true,
    },
  });

  console.log(`Created primary user: ${primaryUser.name}`);

  // Create family members
  const natalie = await prisma.user.upsert({
    where: { phoneNumber: '+15555551234' },
    update: {},
    create: {
      phoneNumber: '+15555551234',
      name: 'Natalie',
      email: 'natalie@example.com',
      isPrimaryUser: false,
    },
  });

  const mom = await prisma.user.upsert({
    where: { phoneNumber: '+15555555678' },
    update: {},
    create: {
      phoneNumber: '+15555555678',
      name: 'Mom',
      email: 'mom@example.com',
      isPrimaryUser: false,
    },
  });

  console.log('Created family member users');

  // Create contacts for primary user
  const contacts = [
    { name: 'Natalie', phoneNumber: '+15555551234', email: 'natalie@example.com', relationship: 'family' },
    { name: 'Mom', phoneNumber: '+15555555678', email: 'mom@example.com', relationship: 'family' },
    { name: 'John', phoneNumber: '+15555559876', email: 'john@example.com', relationship: 'friend' },
    { name: 'Sarah', phoneNumber: '+15555554321', email: 'sarah@example.com', relationship: 'friend' },
    { name: 'Work - Bob', phoneNumber: '+15555550001', email: 'bob@work.com', relationship: 'colleague' },
  ];

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: {
        ownerId_name: {
          ownerId: primaryUser.id,
          name: contact.name,
        },
      },
      update: {},
      create: {
        ownerId: primaryUser.id,
        ...contact,
      },
    });
  }

  console.log('Created contacts');

  // Create permissions for family members
  await prisma.permission.upsert({
    where: {
      userId_grantedByUserId_permissionType: {
        userId: natalie.id,
        grantedByUserId: primaryUser.id,
        permissionType: 'location',
      },
    },
    update: {},
    create: {
      userId: natalie.id,
      grantedByUserId: primaryUser.id,
      permissionType: 'location',
      isActive: true,
    },
  });

  await prisma.permission.upsert({
    where: {
      userId_grantedByUserId_permissionType: {
        userId: natalie.id,
        grantedByUserId: primaryUser.id,
        permissionType: 'lists',
      },
    },
    update: {},
    create: {
      userId: natalie.id,
      grantedByUserId: primaryUser.id,
      permissionType: 'lists',
      isActive: true,
    },
  });

  await prisma.permission.upsert({
    where: {
      userId_grantedByUserId_permissionType: {
        userId: mom.id,
        grantedByUserId: primaryUser.id,
        permissionType: 'location',
      },
    },
    update: {},
    create: {
      userId: mom.id,
      grantedByUserId: primaryUser.id,
      permissionType: 'location',
      isActive: true,
    },
  });

  console.log('Created permissions');

  // Create grocery list
  const groceryList = await prisma.list.upsert({
    where: {
      id: 'grocery-list-default',
    },
    update: {},
    create: {
      id: 'grocery-list-default',
      ownerId: primaryUser.id,
      name: 'Grocery List',
      type: 'grocery',
      isShared: true,
    },
  });

  // Share grocery list with Natalie
  await prisma.listShare.upsert({
    where: {
      listId_sharedWithUserId: {
        listId: groceryList.id,
        sharedWithUserId: natalie.id,
      },
    },
    update: {},
    create: {
      listId: groceryList.id,
      sharedWithUserId: natalie.id,
      canEdit: true,
    },
  });

  // Add some items to grocery list
  const groceryItems = [
    { content: 'Milk', quantity: '1 gallon' },
    { content: 'Eggs', quantity: '1 dozen' },
    { content: 'Bread', quantity: '1 loaf' },
    { content: 'Bananas', quantity: '1 bunch' },
  ];

  for (const item of groceryItems) {
    await prisma.listItem.create({
      data: {
        listId: groceryList.id,
        content: item.content,
        quantity: item.quantity,
        addedByUserId: primaryUser.id,
      },
    });
  }

  console.log('Created grocery list with items');

  // Create some user settings
  await prisma.userSetting.upsert({
    where: {
      userId_settingKey: {
        userId: primaryUser.id,
        settingKey: 'home_address',
      },
    },
    update: {},
    create: {
      userId: primaryUser.id,
      settingKey: 'home_address',
      settingValue: '123 Main St, San Francisco, CA 94102',
    },
  });

  await prisma.userSetting.upsert({
    where: {
      userId_settingKey: {
        userId: primaryUser.id,
        settingKey: 'work_address',
      },
    },
    update: {},
    create: {
      userId: primaryUser.id,
      settingKey: 'work_address',
      settingValue: '456 Market St, San Francisco, CA 94103',
    },
  });

  console.log('Created user settings');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
