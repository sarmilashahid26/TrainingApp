export interface FoodPortion {
  name: string;
  label: string; // e.g. "1 Katori", "1 Medium Roti", "1 Ladle"
  grams: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Dal & Curries' | 'Breads & Grains' | 'High Protein' | 'Vegetables' | 'Dairy & Snacks';
  regionalNames: {
    tamil?: string;
    hindi?: string;
    telugu?: string;
  };
  synonyms?: string[]; // Transliterated Roman synonyms (e.g. ["tuvar", "arhar", "paruppu", "kandi pappu"])
  source: 'USDA' | 'own_measurement' | 'label';
  method?: 'weighed' | 'label' | 'estimated';
  confidence?: number; // 0 to 1 confidence score
  supportsOilSlider?: boolean; // Displaced or added tadka fat
  supportsKatori?: boolean; // Supports "My Katori" calibration
  supportsPhulka?: boolean; // Supports "My Phulka" calibration
  isCookedRecipe?: boolean;
  densityKcalPerGram?: number;
  per100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  defaultPortionIndex: number;
  portions: FoodPortion[];
  verifiedNote?: string;
}

export interface LoggedFoodItem {
  id: string;
  foodId: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  portionLabel: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: 'USDA' | 'own_measurement' | 'label';
  oilLevel?: 'normal' | 'medium' | 'high';
  confidence?: number;
}

export function applyOilModifier(
  nutrients: { kcal: number; protein: number; carbs: number; fat: number; fiber: number },
  oilLevel: 'normal' | 'medium' | 'high'
) {
  const extraOilGrams = oilLevel === 'medium' ? 5 : oilLevel === 'high' ? 10 : 0;
  if (extraOilGrams === 0) return { ...nutrients };
  return {
    kcal: nutrients.kcal + extraOilGrams * 9,
    protein: nutrients.protein,
    carbs: nutrients.carbs,
    fat: Math.round((nutrients.fat + extraOilGrams) * 10) / 10,
    fiber: nutrients.fiber,
  };
}

export const PLACEHOLDER_FOODS: FoodItem[] = [
  {
    id: 'f-toor-dal',
    name: 'Toor Dal Tadka (Cooked)',
    category: 'Dal & Curries',
    regionalNames: {
      tamil: 'துவரம் பருப்பு (Tooram Paruppu)',
      hindi: 'अरहर दाल तड़का (Arhar Dal Tadka)',
      telugu: 'కందిపప్పు తాలింపు (Kandi Pappu)',
    },
    synonyms: ['toor dal', 'tuvar', 'arhar', 'paruppu', 'kandi pappu', 'peeli dal', 'yellow dal', 'dal tadka'],
    source: 'own_measurement',
    method: 'weighed',
    confidence: 1.0,
    supportsOilSlider: true,
    supportsKatori: true,
    isCookedRecipe: true,
    densityKcalPerGram: 1.21,
    per100g: {
      kcal: 121,
      protein: 6.3,
      carbs: 16.6,
      fat: 3.3,
      fiber: 4.3,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'katori', label: '1 Katori (150g)', grams: 150 },
      { name: 'big_katori', label: '1 Big Bowl (220g)', grams: 220 },
      { name: 'ladle', label: '1 Deep Ladle (75g)', grams: 75 },
      { name: 'custom', label: 'Exact Grams', grams: 100 },
    ],
    verifiedNote: 'Yield-tested: 100g raw dal + 10g oil + water -> 350g cooked',
  },
  {
    id: 'f-phulka',
    name: 'Phulka / Whole Wheat Roti (No Ghee)',
    category: 'Breads & Grains',
    regionalNames: {
      tamil: 'சப்பாத்தி (Chappathi)',
      hindi: 'फुल्का / सादी रोटी (Phulka Roti)',
      telugu: 'పుల్కా / రొట్టె (Phulka Rotte)',
    },
    synonyms: ['phulka', 'roti', 'chapati', 'chappathi', 'rotte', 'wheat roti', 'atta roti'],
    source: 'USDA',
    method: 'weighed',
    confidence: 0.95,
    supportsPhulka: true,
    per100g: {
      kcal: 295,
      protein: 10.5,
      carbs: 58.0,
      fat: 2.2,
      fiber: 8.5,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'phulka_1', label: '1 Medium Phulka (30g)', grams: 30 },
      { name: 'phulka_2', label: '2 Phulkas (60g)', grams: 60 },
      { name: 'phulka_3', label: '3 Phulkas (90g)', grams: 90 },
      { name: 'large_roti', label: '1 Large Roti (45g)', grams: 45 },
    ],
    verifiedNote: 'Standard atta dough without oil, dry puff on tawa',
  },
  {
    id: 'f-sambar',
    name: 'Home-style Vegetable Sambar',
    category: 'Dal & Curries',
    regionalNames: {
      tamil: 'சாம்பார் (Sambar)',
      hindi: 'सांभर (Sambar)',
      telugu: 'సాంబారు (Sambaru)',
    },
    synonyms: ['sambar', 'sambhar', 'kuzhambu', 'murungakkai sambar', 'veg sambar'],
    source: 'own_measurement',
    method: 'weighed',
    confidence: 1.0,
    supportsOilSlider: true,
    supportsKatori: true,
    isCookedRecipe: true,
    densityKcalPerGram: 0.78,
    per100g: {
      kcal: 78,
      protein: 3.4,
      carbs: 11.2,
      fat: 2.1,
      fiber: 2.8,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'katori', label: '1 Katori (180g)', grams: 180 },
      { name: 'big_bowl', label: '1 Big Bowl (250g)', grams: 250 },
      { name: 'ladle', label: '1 Ladle (80g)', grams: 80 },
    ],
    verifiedNote: 'Drumstick, shallots, tomato, dal with 1 tsp tempering oil',
  },
  {
    id: 'f-paneer-bhurji',
    name: 'Paneer Bhurji (Home-cooked)',
    category: 'High Protein',
    regionalNames: {
      tamil: 'பன்னீர் புர்ஜி (Paneer Bhurji)',
      hindi: 'पनीर भुर्जी (Paneer Bhurji)',
      telugu: 'పనీర్ భుర్జీ (Paneer Bhurji)',
    },
    synonyms: ['paneer bhurji', 'scrambled paneer', 'cottage cheese bhurji', 'paneer'],
    source: 'own_measurement',
    method: 'weighed',
    confidence: 1.0,
    supportsOilSlider: true,
    supportsKatori: true,
    isCookedRecipe: true,
    per100g: {
      kcal: 205,
      protein: 13.5,
      carbs: 4.8,
      fat: 14.5,
      fiber: 1.2,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'medium_serving', label: '1 Medium Serving (150g)', grams: 150 },
      { name: 'katori', label: '1 Small Katori (100g)', grams: 100 },
      { name: 'large', label: 'Post-Workout Portion (200g)', grams: 200 },
    ],
    verifiedNote: 'Fresh paneer crumbled with onions, tomatoes & measured 5g oil',
  },
  {
    id: 'f-basmati-rice',
    name: 'Basmati Rice (Steamed Cooked)',
    category: 'Breads & Grains',
    regionalNames: {
      tamil: 'சாதம் / பாசுமதி (Saadham)',
      hindi: 'चावल (Basmati Chawal)',
      telugu: 'అన్నం (Annam)',
    },
    synonyms: ['basmati rice', 'chawal', 'saadham', 'annam', 'steamed rice', 'cooked rice', 'bhat'],
    source: 'USDA',
    method: 'weighed',
    confidence: 0.95,
    supportsKatori: true,
    per100g: {
      kcal: 130,
      protein: 2.7,
      carbs: 28.2,
      fat: 0.3,
      fiber: 0.4,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'katori', label: '1 Standard Katori (150g)', grams: 150 },
      { name: 'cup', label: '1 Cooked Cup (180g)', grams: 180 },
      { name: 'half_katori', label: 'Small Portion (100g)', grams: 100 },
    ],
  },
  {
    id: 'f-chicken-curry',
    name: 'Chicken Breast Curry (Home Yield)',
    category: 'High Protein',
    regionalNames: {
      tamil: 'கோழி குழம்பு (Kozhi Kulambu)',
      hindi: 'चिकन करी (Chicken Curry)',
      telugu: 'కోడికూర (Kodi Kura)',
    },
    synonyms: ['chicken curry', 'kozhi kulambu', 'kodi kura', 'murgh curry', 'chicken breast curry'],
    source: 'own_measurement',
    method: 'weighed',
    confidence: 1.0,
    supportsOilSlider: true,
    supportsKatori: true,
    isCookedRecipe: true,
    per100g: {
      kcal: 148,
      protein: 19.8,
      carbs: 3.2,
      fat: 6.2,
      fiber: 0.9,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'regular_serving', label: '1 Big Bowl (200g)', grams: 200 },
      { name: 'katori', label: '1 Katori (140g)', grams: 140 },
      { name: 'lifter_portion', label: 'Lifter Double Portion (300g)', grams: 300 },
    ],
    verifiedNote: 'Skinless chicken breast, onion-tomato gravy, 8g oil per 500g batch',
  },
  {
    id: 'f-whey-isolate',
    name: 'Whey Protein Isolate 90%',
    category: 'High Protein',
    regionalNames: {
      hindi: 'व्हे प्रोटीन (Whey)',
    },
    synonyms: ['whey', 'whey protein', 'isolate', 'protein shake', 'protein powder', 'wpi'],
    source: 'label',
    method: 'label',
    confidence: 0.98,
    per100g: {
      kcal: 375,
      protein: 85.0,
      carbs: 2.5,
      fat: 1.8,
      fiber: 0.0,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: '1_scoop', label: '1 Scoop in Water (30g)', grams: 30 },
      { name: '1.5_scoop', label: '1.5 Scoops (45g)', grams: 45 },
    ],
    verifiedNote: 'Verified nutritional label from 3rd-party lab certified batch',
  },
  {
    id: 'f-roasted-chana',
    name: 'Roasted Chana (With Husk)',
    category: 'Dairy & Snacks',
    regionalNames: {
      tamil: 'பொட்டுக்கடலை (Pottukadalai)',
      hindi: 'भुना चना (Bhuna Chana)',
      telugu: 'పుట్నాలు (Putnalu)',
    },
    synonyms: ['bhuna chana', 'roasted chana', 'pottukadalai', 'putnalu', 'chana snack'],
    source: 'USDA',
    method: 'weighed',
    confidence: 0.92,
    per100g: {
      kcal: 368,
      protein: 19.3,
      carbs: 58.1,
      fat: 5.5,
      fiber: 15.2,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'fistful', label: '1 Fistful Snack (35g)', grams: 35 },
      { name: 'bowl', label: '1 Katori Snack (70g)', grams: 70 },
    ],
    verifiedNote: 'Unsalted dry roasted chickpeas with natural fiber coat',
  },
  {
    id: 'f-curd-dahi',
    name: 'Curd / Dahi (Homemade from Cow Milk)',
    category: 'Dairy & Snacks',
    regionalNames: {
      tamil: 'தயிர் (Thayir)',
      hindi: 'दही (Dahi)',
      telugu: 'పెరుగు (Perugu)',
    },
    synonyms: ['curd', 'dahi', 'thayir', 'perugu', 'yogurt', 'homemade curd'],
    source: 'USDA',
    method: 'weighed',
    confidence: 0.90,
    supportsKatori: true,
    per100g: {
      kcal: 61,
      protein: 3.5,
      carbs: 4.7,
      fat: 3.3,
      fiber: 0.0,
    },
    defaultPortionIndex: 0,
    portions: [
      { name: 'katori', label: '1 Katori (150g)', grams: 150 },
      { name: 'glass', label: '1 Tall Glass Chaas (200g)', grams: 200 },
    ],
  },
];

export const INITIAL_TODAY_LOGS: LoggedFoodItem[] = [
  {
    id: 'log-1',
    foodId: 'f-phulka',
    name: 'Phulka / Whole Wheat Roti',
    mealType: 'breakfast',
    portionLabel: '2 Phulkas (60g)',
    grams: 60,
    kcal: 177,
    protein: 6.3,
    carbs: 34.8,
    fat: 1.3,
    fiber: 5.1,
    source: 'USDA',
    confidence: 0.95,
  },
  {
    id: 'log-2',
    foodId: 'f-toor-dal',
    name: 'Toor Dal Tadka (Cooked)',
    mealType: 'breakfast',
    portionLabel: '1 Katori (150g)',
    grams: 150,
    kcal: 182,
    protein: 9.5,
    carbs: 24.9,
    fat: 5.0,
    fiber: 6.5,
    source: 'own_measurement',
    confidence: 1.0,
  },
  {
    id: 'log-3',
    foodId: 'f-basmati-rice',
    name: 'Basmati Rice (Steamed)',
    mealType: 'lunch',
    portionLabel: '1 Katori (150g)',
    grams: 150,
    kcal: 195,
    protein: 4.1,
    carbs: 42.3,
    fat: 0.5,
    fiber: 0.6,
    source: 'USDA',
    confidence: 0.95,
  },
  {
    id: 'log-4',
    foodId: 'f-chicken-curry',
    name: 'Chicken Breast Curry (Home Yield)',
    mealType: 'lunch',
    portionLabel: '1 Big Bowl (200g)',
    grams: 200,
    kcal: 296,
    protein: 39.6,
    carbs: 6.4,
    fat: 12.4,
    fiber: 1.8,
    source: 'own_measurement',
    confidence: 1.0,
  },
  {
    id: 'log-5',
    foodId: 'f-whey-isolate',
    name: 'Whey Protein Isolate 90%',
    mealType: 'snack',
    portionLabel: '1 Scoop in Water (30g)',
    grams: 30,
    kcal: 113,
    protein: 25.5,
    carbs: 0.8,
    fat: 0.5,
    fiber: 0.0,
    source: 'label',
    confidence: 0.98,
  },
  {
    id: 'log-6',
    foodId: 'f-roasted-chana',
    name: 'Roasted Chana (With Husk)',
    mealType: 'snack',
    portionLabel: '1 Fistful Snack (35g)',
    grams: 35,
    kcal: 129,
    protein: 6.7,
    carbs: 20.3,
    fat: 1.9,
    fiber: 5.3,
    source: 'USDA',
    confidence: 0.92,
  },
  {
    id: 'log-7',
    foodId: 'f-paneer-bhurji',
    name: 'Paneer Bhurji (Home-cooked)',
    mealType: 'dinner',
    portionLabel: '1 Serving (160g)',
    grams: 160,
    kcal: 328,
    protein: 21.6,
    carbs: 7.7,
    fat: 23.2,
    fiber: 1.9,
    source: 'own_measurement',
    confidence: 1.0,
  },
];
