import { sequelize } from '../config/database';
import { initDatabase, Category } from '../models';

const INITIAL_CATEGORIES = [
  { name: "Men's Wear", description: "Clothing and apparel for men" },
  { name: "Women's Wear", description: "Clothing, dresses, and ethnic wear for women" },
  { name: "Kids Wear", description: "Apparel for children and infants" },
  { name: 'Sarees', description: 'Traditional and designer sarees, silk, cotton, etc.' },
  { name: 'Shirts', description: 'Formal and casual shirts' },
  { name: 'T-Shirts', description: 'Polo, crew neck, and graphic t-shirts' },
  { name: 'Jeans', description: 'Denim jeans, trousers, and bottom wear' },
  { name: 'Dress Materials', description: 'Unstitched and semi-stitched salwar suits and fabrics' },
  { name: 'Fabrics', description: 'Textiles sold by meter - cotton, linen, silk, wool' },
  { name: 'Accessories', description: 'Belts, ties, scarves, stoles, and related accessories' },
];

export const syncDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Connecting to MariaDB...');
    await sequelize.authenticate();
    console.log('✅ Connection to MariaDB established successfully.');

    console.log('📦 Creating/synchronizing tables in MariaDB...');
    await initDatabase(true);
    console.log('✅ All tables synchronized successfully in MariaDB.');

    // Seed default categories if none exist
    const count = await Category.count();
    if (count === 0) {
      console.log('🌱 Seeding initial categories...');
      for (const cat of INITIAL_CATEGORIES) {
        await Category.create(cat);
      }
      console.log(`✅ Seeded ${INITIAL_CATEGORIES.length} initial categories.`);
    }

    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  syncDatabase().then(() => {
    process.exit(0);
  });
}
