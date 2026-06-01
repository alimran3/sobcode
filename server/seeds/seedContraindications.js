import MasterMedicine from '../models/MasterMedicine.js';
import connectDB from '../config/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rawData = readFileSync(join(__dirname, 'medicineContraindications.json'), 'utf-8');
const contraindicationData = JSON.parse(rawData);

const seedContraindications = async () => {
  try {
    await connectDB();
    
    console.log('Starting contraindication seed...\n');
    
    let updated = 0;
    let notFound = [];
    
    for (const medData of contraindicationData) {
      const medicine = await MasterMedicine.findOne({
        $or: [
          { brandName: { $regex: new RegExp(medData.brandName.split(' ')[0], 'i') } },
          { genericName: { $regex: new RegExp(medData.genericName.split(' ')[0], 'i') } }
        ]
      });
      
      if (medicine) {
        medicine.contraindications = {
          conflictingConditions: medData.contraindications.conflictingConditions || [],
          conflictingDrugs: medData.contraindications.conflictingDrugs || [],
          allergyTriggers: medData.contraindications.allergyTriggers || [],
          bloodGroupRestrictions: medData.contraindications.bloodGroupRestrictions || {},
          vitalThresholds: medData.contraindications.vitalThresholds || {},
        };
        
        await medicine.save();
        updated++;
        console.log(`✓ Updated: ${medicine.brandName}`);
      } else {
        notFound.push(medData.brandName);
        console.log(`✗ Not found: ${medData.brandName}`);
      }
    }
    
    console.log(`\n✅ Seed complete!`);
    console.log(`   Updated: ${updated} medicines`);
    console.log(`   Not found: ${notFound.length}`);
    
    if (notFound.length > 0) {
      console.log(`\n   Missing medicines:`);
      notFound.forEach(name => console.log(`   - ${name}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedContraindications();