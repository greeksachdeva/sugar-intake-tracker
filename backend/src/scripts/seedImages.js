require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const Image = require('../models/Image');

const sampleImages = [
  {
    url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800',
    alt: 'Colorful fresh fruits and vegetables on a wooden table',
  },
  {
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    alt: 'Healthy green salad bowl with avocado and vegetables',
  },
  {
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    alt: 'Assorted fresh fruits arranged on a flat surface',
  },
  {
    url: 'https://images.unsplash.com/photo-1505576399279-0d06b2000de6?w=800',
    alt: 'Glass of fresh orange juice with sliced oranges',
  },
  {
    url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800',
    alt: 'Healthy breakfast with granola, yogurt, and berries',
  },
];

async function seedImages() {
  try {
    await connectDatabase();
    console.log('Connected to database.');

    const existingCount = await Image.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} images. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }

    const inserted = await Image.insertMany(sampleImages);
    console.log(`Seeded ${inserted.length} sample images.`);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error seeding images:', error);
    process.exit(1);
  }
}

seedImages();
