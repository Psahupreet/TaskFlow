const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Task = require('../models/Task');

const members = [
  {
    name: 'Preet',
    email: 'preet.mpexcisejci@gmail.com',
    password: 'PreetTask@010',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Kajal',
    email: 'kajalmpexcisejci@gmail.com',
    password: 'Kajal@020',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Manish',
    email: 'manishmpexcisejci2002@gmail.com',
    password: 'Manish@2009',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Niranjan',
    email: 'niranjanexcisejci@gmail.com',
    password: 'Niranjan@200+',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Ankit',
    email: 'ankitmpexcisejci1626@gmail.com',
    password: 'Ankit@8529',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Hardik',
    email: 'hardik.mpexcisejci@gmail.com',
    password: 'Hardik@9826',
    role: 'member',
    department: 'Engineering',
  },
  {
    name: 'Kirti',
    email: 'kirtimpexciseiccc@gmail.com',
    password: 'Kirti@2004',
    role: 'member',
    department: 'Engineering',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing users and tasks');

    await User.create({
      name: 'Admin',
      email: 'AdminTask@gmail.com',
      password: 'MpExcise@010',
      role: 'admin',
      department: 'Management',
      avatar: 'A',
    });
    console.log('Admin created: AdminTask@gmail.com / MpExcise@010');

    await User.create(
      members.map((member) => ({
        ...member,
        avatar: member.name
          .split(' ')
          .map((namePart) => namePart[0])
          .join(''),
      }))
    );
    console.log(`${members.length} team members created`);

    console.log('\n--- LOGIN CREDENTIALS ---');
    console.log('Admin:  AdminTask@gmail.com / MpExcise@010');
    console.log('Member: preet.mpexcisejci@gmail.com / PreetTask@010');
    console.log('-------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
