import MasterMedicine from '../models/MasterMedicine.js';
import Fuse from 'fuse.js';

let fuseInstance = null;
let medicineCacheTimestamp = null;

const getFuseInstance = async () => {
  const now = Date.now();
  // Refresh cache every 10 minutes
  if (fuseInstance && medicineCacheTimestamp && (now - medicineCacheTimestamp) < 600000) {
    return fuseInstance;
  }

  const medicines = await MasterMedicine.find({ status: 'Active' }).lean();
  fuseInstance = new Fuse(medicines, {
    keys: [
      { name: 'brandName', weight: 0.5 },
      { name: 'genericName', weight: 0.3 },
      { name: 'manufacturer', weight: 0.1 },
      { name: 'category', weight: 0.1 },
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
  });
  medicineCacheTimestamp = now;
  return fuseInstance;
};

// Fuzzy search medicines
export const searchMedicines = async (req, res, next) => {
  try {
    const { q, category, dosageForm, page = 1, limit = 1000 } = req.query;

    if (!q || q.trim().length < 2) {
      // Return category-based or all
      const filter = { status: 'Active' };
      if (category) filter.category = category;
      if (dosageForm) filter.dosageForm = dosageForm;

      const total = await MasterMedicine.countDocuments(filter);
      const medicines = await MasterMedicine.find(filter)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ brandName: 1 });

      return res.json({
        success: true,
        data: {
          medicines,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    }

    const fuse = await getFuseInstance();
    let results = fuse.search(q.trim());

    // Apply additional filters
    if (category) {
      results = results.filter((r) => r.item.category === category);
    }
    if (dosageForm) {
      results = results.filter((r) => r.item.dosageForm === dosageForm);
    }

    const total = results.length;
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + parseInt(limit));

    res.json({
      success: true,
      data: {
        medicines: paginatedResults.map((r) => ({ ...r.item, searchScore: r.score })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single medicine
export const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await MasterMedicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }
    res.json({ success: true, data: { medicine } });
  } catch (error) {
    next(error);
  }
};

// Get all categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await MasterMedicine.distinct('category', { status: 'Active' });
    res.json({ success: true, data: { categories: categories.sort() } });
  } catch (error) {
    next(error);
  }
};

// Get autocomplete suggestions
export const getAutocompleteSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const fuse = await getFuseInstance();
    const results = fuse.search(q.trim()).slice(0, 10);

    const suggestions = results.map((r) => ({
      _id: r.item._id,
      brandName: r.item.brandName,
      genericName: r.item.genericName,
      strength: r.item.strength,
      dosageForm: r.item.dosageForm,
      manufacturer: r.item.manufacturer,
      imageUrl: r.item.imageUrl,
    }));

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};