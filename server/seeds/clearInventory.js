import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import StoreInventory from '../models/StoreInventory.js';
import Store from '../models/Store.js';

dotenv.config();

const clearInventory = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...');

    const stores = await Store.find({ status: 'active' });
    
    if (stores.length === 0) {
      console.log('No active stores found.');
      process.exit(0);
    }

    for (const store of stores) {
      const count = await StoreInventory.countDocuments({ store: store._id });
      console.log(`\nStore: ${store.pharmacyName}`);
      console.log(`Current inventory items: ${count}`);
      
      if (count > 0) {
        await StoreInventory.deleteMany({ store: store._id });
        console.log('Cleared all inventory items.');
        console.log('Pharmacy owner can now manually add medicines from master DB.');
      }
    }

    console.log('\n========================================');
    console.log('Inventory cleared successfully!');
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

clearInventory();