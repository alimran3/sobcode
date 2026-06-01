import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import MasterMedicine from '../models/MasterMedicine.js';
import StoreInventory from '../models/StoreInventory.js';
import Store from '../models/Store.js';
import connectDB from '../config/db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const categoryMap = {
  analgesic: 'Painkiller',
  antibiotic: 'Antibiotic',
  antacid: 'Antacid',
  antihypertensive: 'Antihypertensive',
  antidiabetic: 'Antidiabetic',
  vitamin: 'Vitamin',
  supplement: 'Supplement',
  dermatological: 'Dermatological',
  ophthalmic: 'Ophthalmic',
  psychiatric: 'Psychiatric',
  cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratory',
  gastrointestinal: 'Gastrointestinal',
  hormonal: 'Hormonal',
  antifungal: 'Antifungal',
  antiviral: 'Antiviral',
  antihistamine: 'Antihistamine',
  nsaid: 'Painkiller',
  antipyretic: 'Painkiller',
  ppi: 'Antacid',
  allopathic: 'Other',
  herbal: 'Herbal',
  homoeopathic: 'Homeopathic',
};

const dosageFormMap = {
  tablet: 'Tablet',
  capsule: 'Capsule',
  syrup: 'Syrup',
  suspension: 'Suspension',
  injection: 'Injection',
  cream: 'Cream',
  ointment: 'Ointment',
  gel: 'Gel',
  drop: 'Drop',
  inhaler: 'Inhaler',
  suppository: 'Suppository',
  powder: 'Powder',
  sachet: 'Sachet',
  solution: 'Solution',
  'chewable tablet': 'Chewable Tablet',
  'oral powder': 'Oral Powder',
  'oral suspension': 'Oral Suspension',
  'iv injection': 'Injection',
  'scalp solution': 'Solution',
};

const mapCategory = (rawCategory) => {
  if (!rawCategory) return 'Other';
  const lower = rawCategory.toLowerCase().trim();
  for (const [key, val] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return val;
  }
  return 'Other';
};

const mapDosageForm = (rawForm) => {
  if (!rawForm) return 'Tablet';
  const lower = rawForm.toLowerCase().trim();
  for (const [key, val] of Object.entries(dosageFormMap)) {
    if (lower.includes(key)) return val;
  }
  return 'Other';
};

const seedMedicines = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    const csvPath = path.join(__dirname, '..', 'data', 'medicines.csv');

    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found. Creating sample medicines...');
      await createSampleMedicines();
      return;
    }

    const medicines = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const brandName = row['brand name'] || row['brand_name'] || '';
          if (!brandName) return;
          
          const priceMatch = (row['Package Size'] || row['package container'] || '').match(/৳\s*([\d.]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          
          medicines.push({
            brandName: brandName,
            genericName: row.generic || row['generic'] || '',
            manufacturer: row.manufacturer || '',
            category: mapCategory(row.type || row.category || ''),
            dosageForm: mapDosageForm(row['dosage form'] || row['dosage_form'] || ''),
            strength: row.strength || '',
            standardMrp: price,
            description: '',
            prescriptionRequired: row.type?.toLowerCase() === 'antibiotic',
            imageUrl: '',
            status: 'Active',
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (medicines.length > 0) {
      await MasterMedicine.deleteMany({});
      await MasterMedicine.insertMany(medicines, { ordered: false });
      console.log(`Successfully seeded ${medicines.length} medicines to master DB.`);
    }

    console.log('\nSeeding complete!');
    console.log('Run: npm run dev to start the server');
    console.log('Pharmacy owners can manually add medicines to their inventory from master DB.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

const createSampleMedicines = async () => {
  const samples = [
    { brandName: 'Napa', genericName: 'Paracetamol', manufacturer: 'Beximco Pharmaceuticals', category: 'Painkiller', dosageForm: 'Tablet', strength: '500mg', standardMrp: 1.5, description: 'Used for fever and mild to moderate pain relief.', sideEffects: ['Nausea', 'Allergic reactions'], contraindications: { conflictingConditions: ['Liver Disease'], conflictingDrugs: ['Warfarin'], allergyTriggers: [] }, usageInstructions: 'Take after meals with water.', prescriptionRequired: false },
    { brandName: 'Napa Extra', genericName: 'Paracetamol + Caffeine', manufacturer: 'Beximco Pharmaceuticals', category: 'Painkiller', dosageForm: 'Tablet', strength: '500mg + 65mg', standardMrp: 3, description: 'Enhanced pain reliever with caffeine for faster action.', prescriptionRequired: false },
    { brandName: 'Seclo', genericName: 'Omeprazole', manufacturer: 'Square Pharmaceuticals', category: 'Antacid', dosageForm: 'Capsule', strength: '20mg', standardMrp: 6, description: 'Proton pump inhibitor for acid reflux and ulcers.', sideEffects: ['Headache', 'Diarrhea', 'Nausea'], prescriptionRequired: false },
    { brandName: 'Seclo', genericName: 'Omeprazole', manufacturer: 'Square Pharmaceuticals', category: 'Antacid', dosageForm: 'Capsule', strength: '40mg', standardMrp: 10, prescriptionRequired: true },
    { brandName: 'Sergel', genericName: 'Esomeprazole', manufacturer: 'Healthcare Pharmaceuticals', category: 'Antacid', dosageForm: 'Capsule', strength: '20mg', standardMrp: 7, prescriptionRequired: false },
    { brandName: 'Monas', genericName: 'Montelukast', manufacturer: 'Square Pharmaceuticals', category: 'Respiratory', dosageForm: 'Tablet', strength: '10mg', standardMrp: 12, description: 'Used for asthma and seasonal allergies.', prescriptionRequired: true },
    { brandName: 'Losectil', genericName: 'Omeprazole', manufacturer: 'Incepta Pharmaceuticals', category: 'Antacid', dosageForm: 'Capsule', strength: '20mg', standardMrp: 5, prescriptionRequired: false },
    { brandName: 'Azimax', genericName: 'Azithromycin', manufacturer: 'Incepta Pharmaceuticals', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg', standardMrp: 30, description: 'Broad-spectrum antibiotic for bacterial infections.', sideEffects: ['Diarrhea', 'Nausea', 'Stomach pain'], contraindications: { conflictingConditions: ['Liver Disease'], conflictingDrugs: ['Warfarin'], allergyTriggers: ['Macrolide'] }, prescriptionRequired: true },
    { brandName: 'Zimax', genericName: 'Azithromycin', manufacturer: 'Square Pharmaceuticals', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg', standardMrp: 35, prescriptionRequired: true },
    { brandName: 'Ciprocin', genericName: 'Ciprofloxacin', manufacturer: 'Square Pharmaceuticals', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg', standardMrp: 8, sideEffects: ['Nausea', 'Diarrhea'], contraindications: { conflictingConditions: ['Pregnancy'], conflictingDrugs: [], allergyTriggers: ['Fluoroquinolone'] }, ageRestriction: { minAge: 18, note: 'Not recommended for children under 18.' }, prescriptionRequired: true },
    { brandName: 'Amoxil', genericName: 'Amoxicillin', manufacturer: 'Beximco Pharmaceuticals', category: 'Antibiotic', dosageForm: 'Capsule', strength: '500mg', standardMrp: 5, description: 'Penicillin-type antibiotic for various infections.', contraindications: { conflictingConditions: [], conflictingDrugs: [], allergyTriggers: ['Penicillin'] }, prescriptionRequired: true },
    { brandName: 'Novamet', genericName: 'Metformin', manufacturer: 'Square Pharmaceuticals', category: 'Antidiabetic', dosageForm: 'Tablet', strength: '500mg', standardMrp: 3, description: 'First-line treatment for type 2 diabetes.', prescriptionRequired: true },
    { brandName: 'Losartan', genericName: 'Losartan Potassium', manufacturer: 'Incepta Pharmaceuticals', category: 'Antihypertensive', dosageForm: 'Tablet', strength: '50mg', standardMrp: 8, description: 'Used to treat high blood pressure.', prescriptionRequired: true },
    { brandName: 'Fexo', genericName: 'Fexofenadine', manufacturer: 'Square Pharmaceuticals', category: 'Antihistamine', dosageForm: 'Tablet', strength: '120mg', standardMrp: 10, description: 'Non-drowsy antihistamine for allergy relief.', prescriptionRequired: false },
    { brandName: 'D-Rise', genericName: 'Cholecalciferol (Vitamin D3)', manufacturer: 'Square Pharmaceuticals', category: 'Vitamin', dosageForm: 'Capsule', strength: '40000 IU', standardMrp: 15, description: 'Vitamin D supplement for deficiency.', prescriptionRequired: false },
    { brandName: 'Calbo-D', genericName: 'Calcium + Vitamin D', manufacturer: 'ACI Pharmaceuticals', category: 'Supplement', dosageForm: 'Tablet', strength: '600mg + 200IU', standardMrp: 7, prescriptionRequired: false },
    { brandName: 'Savlon', genericName: 'Chlorhexidine + Cetrimide', manufacturer: 'ACI', category: 'Antiseptic', dosageForm: 'Solution', strength: '', standardMrp: 45, prescriptionRequired: false },
    { brandName: 'Pepcid', genericName: 'Famotidine', manufacturer: 'Drug International', category: 'Gastrointestinal', dosageForm: 'Tablet', strength: '20mg', standardMrp: 5, prescriptionRequired: false },
    { brandName: 'Fluconazole', genericName: 'Fluconazole', manufacturer: 'Beximco', category: 'Antifungal', dosageForm: 'Capsule', strength: '150mg', standardMrp: 20, prescriptionRequired: true },
    { brandName: 'Acivir', genericName: 'Acyclovir', manufacturer: 'Square', category: 'Antiviral', dosageForm: 'Tablet', strength: '400mg', standardMrp: 8, prescriptionRequired: true },
  ];

  await MasterMedicine.deleteMany({});
  await MasterMedicine.insertMany(samples);
  console.log(`Created ${samples.length} sample medicines in master DB.`);

  console.log('\nSeeding complete!');
  console.log('Pharmacy owners can manually add medicines to their inventory from master DB.');
  process.exit(0);
};

const addToPharmacyInventory = async (medicines) => {
  const stores = await Store.find({ status: 'active' });
  
  if (stores.length === 0) {
    console.log('No active pharmacies found. Medicines added to master DB only.');
    return;
  }

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  for (const store of stores) {
    const inventoryItems = medicines.map((medicine) => ({
      store: store._id,
      medicine: medicine._id,
      batchNumber: '',
      buyingDate: new Date(),
      expiryDate: expiryDate,
      buyingPrice: medicine.standardMrp * 0.7,
      sellingPrice: medicine.standardMrp,
      discountPercentage: 0,
      stockQuantity: 100,
      imageUrl: medicine.imageUrl || '',
      notes: 'Auto-seeded from master database',
      status: 'active',
    }));

    await StoreInventory.insertMany(inventoryItems);
    console.log(`Added ${inventoryItems.length} medicines to ${store.pharmacyName} inventory.`);
  }
};

seedMedicines();