import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useNutrition } from '@/context/NutritionContext';
import {
  calculateRecipe,
  atwaterDifference,
  roundNutrients,
  Ingredient,
  Nutrients,
} from '@/utils/yieldEngine';

const theme = Colors.dark;

interface PresetItem {
  name: string;
  per100g: Nutrients;
}

const COMMON_RAW_PRESETS: PresetItem[] = [
  { name: 'Toor Dal (raw)', per100g: { kcal: 335, protein: 22, carbs: 58, fat: 1.5, fibre: 15 } },
  { name: 'Moong Dal (raw)', per100g: { kcal: 347, protein: 24, carbs: 60, fat: 1.2, fibre: 16 } },
  { name: 'Chicken Breast (raw)', per100g: { kcal: 120, protein: 26, carbs: 0, fat: 1.5, fibre: 0 } },
  { name: 'Paneer (raw)', per100g: { kcal: 265, protein: 18, carbs: 3.5, fat: 20, fibre: 0 } },
  { name: 'Basmati Rice (raw)', per100g: { kcal: 360, protein: 7.5, carbs: 78, fat: 0.6, fibre: 1.3 } },
  { name: 'Onion (raw)', per100g: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fibre: 1.7 } },
  { name: 'Tomato (raw)', per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fibre: 1.2 } },
];

export default function RecipeYieldScreen() {
  const { saveRecipe } = useNutrition();

  const [recipeName, setRecipeName] = useState('Home-style Toor Dal Tadka');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      name: 'Toor Dal (raw)',
      rawGrams: 100,
      per100g: { kcal: 335, protein: 22, carbs: 58, fat: 1.5, fibre: 15 },
    },
    {
      name: 'Onion (raw)',
      rawGrams: 50,
      per100g: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fibre: 1.7 },
    },
    {
      name: 'Tomato (raw)',
      rawGrams: 80,
      per100g: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fibre: 1.2 },
    },
  ]);

  const [oilAdded, setOilAdded] = useState('10');
  const [oilLeftInPan, setOilLeftInPan] = useState('0');
  const [cookedWeight, setCookedWeight] = useState('380');
  const [servings, setServings] = useState('2');
  const [customPortionGrams, setCustomPortionGrams] = useState('150');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const cookedGramsNumber = parseFloat(cookedWeight) || 380;
  const oilAddedNumber = parseFloat(oilAdded) || 0;
  const oilLeftNumber = parseFloat(oilLeftInPan) || 0;
  const oilRetainedGrams = Math.max(0, oilAddedNumber - oilLeftNumber);
  const totalRawGrams = ingredients.reduce((sum, item) => sum + item.rawGrams, 0);

  // Compute live yield engine results
  const yieldResult = useMemo(() => {
    const srv = parseInt(servings, 10) || 1;

    try {
      return calculateRecipe({
        ingredients,
        oilAddedGrams: oilAddedNumber,
        oilLeftInPanGrams: oilLeftNumber,
        cookedWeightGrams: cookedGramsNumber,
        servings: srv,
      });
    } catch {
      return null;
    }
  }, [ingredients, oilAddedNumber, oilLeftNumber, cookedGramsNumber, servings]);

  const atwaterDiffPercent = useMemo(() => {
    if (!yieldResult) return 0;
    const diff = atwaterDifference(yieldResult.totals);
    return Math.round(diff * 1000) / 10;
  }, [yieldResult]);

  const handleAddPreset = (preset: PresetItem) => {
    setIngredients((prev) => [
      ...prev,
      {
        name: preset.name,
        rawGrams: 100,
        per100g: preset.per100g,
      },
    ]);
  };

  const handleUpdateIngredientGrams = (index: number, gramsText: string) => {
    const g = parseFloat(gramsText) || 0;
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, rawGrams: g } : item))
    );
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) {
      Alert.alert('Required', 'A recipe must contain at least 1 ingredient.');
      return;
    }
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = () => {
    if (!yieldResult) return;
    saveRecipe(recipeName.trim() || 'Untitled Recipe', cookedGramsNumber, yieldResult);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const roundedTotals = yieldResult ? roundNutrients(yieldResult.totals, 1) : null;
  const roundedPer100g = yieldResult ? roundNutrients(yieldResult.per100gCooked, 1) : null;
  const roundedPerGram = yieldResult ? yieldResult.perGramCooked : null;

  const yieldRatio = totalRawGrams > 0 ? (cookedGramsNumber / totalRawGrams).toFixed(2) : '1.0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Yield Engine</Text>
          <Text style={styles.subtitle}>
            Converts raw weighed ingredients + oil absorption + cooked pot weight into exact macros per gram.
          </Text>
        </View>

        {/* Recipe Name Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            value={recipeName}
            onChangeText={setRecipeName}
            placeholder="e.g. Toor Dal Tadka, Chicken Biryani"
            placeholderTextColor={theme.textFaint}
          />
        </View>

        {/* 1. Raw Ingredients Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>1. Raw Weighed Ingredients</Text>
            <Text style={styles.countText}>{ingredients.length} items</Text>
          </View>

          {ingredients.map((item, index) => {
            const rawKcal = Math.round((item.per100g.kcal * item.rawGrams) / 100);
            const rawProtein = Math.round(((item.per100g.protein * item.rawGrams) / 100) * 10) / 10;
            return (
              <View key={index} style={styles.ingredientRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientMacros}>
                    {rawKcal} kcal · P {rawProtein}g
                  </Text>
                </View>

                <View style={styles.stepperGramsBox}>
                  <TextInput
                    style={styles.stepperInput}
                    keyboardType="numeric"
                    value={item.rawGrams.toString()}
                    onChangeText={(txt) => handleUpdateIngredientGrams(index, txt)}
                  />
                  <Text style={styles.stepperUnit}>g raw</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveIngredient(index)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Quick Staple Presets */}
          <Text style={styles.subHeading}>+ Add Raw Staples</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsScroll}
            contentContainerStyle={styles.presetsContent}
          >
            {COMMON_RAW_PRESETS.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={styles.presetChip}
                onPress={() => handleAddPreset(p)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>+ {p.name.replace(' (raw)', '')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. Oil Absorption Precision Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Cooking Oil Precision</Text>
          <Text style={styles.hintText}>
            Oil added minus oil left in pan = true oil retained (pure fat @ 9 kcal/g).
          </Text>

          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Oil Added (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={oilAdded}
                onChangeText={setOilAdded}
                placeholder="10"
                placeholderTextColor={theme.textFaint}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
              <Text style={styles.inputLabel}>Oil Left in Pan (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={oilLeftInPan}
                onChangeText={setOilLeftInPan}
                placeholder="0"
                placeholderTextColor={theme.textFaint}
              />
            </View>
            <View style={styles.oilRetainedBox}>
              <Text style={styles.inputLabel}>Oil Retained</Text>
              <Text style={styles.oilRetainedValue}>{oilRetainedGrams} g</Text>
              <Text style={styles.oilKcalValue}>+{Math.round(oilRetainedGrams * 9)} kcal</Text>
            </View>
          </View>
        </View>

        {/* 3. Cooked Dish Weight Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Cooked Pot Weight</Text>
          <Text style={styles.hintText}>
            Weigh the entire cooked pot or dish on a kitchen scale after cooking.
          </Text>

          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Cooked Pot Weight (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cookedWeight}
                onChangeText={setCookedWeight}
                placeholder="380"
                placeholderTextColor={theme.textFaint}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.inputLabel}>Estimated Servings</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={servings}
                onChangeText={setServings}
                placeholder="2"
                placeholderTextColor={theme.textFaint}
              />
            </View>
          </View>

          {/* Raw to Cooked Ratio Preview */}
          <View style={styles.ratioBar}>
            <Text style={styles.ratioLabel}>
              Raw: <Text style={styles.ratioVal}>{totalRawGrams}g</Text>
            </Text>
            <Text style={styles.ratioArrow}>→</Text>
            <Text style={styles.ratioLabel}>
              Cooked: <Text style={styles.ratioVal}>{cookedGramsNumber}g</Text>
            </Text>
            <View style={styles.yieldPill}>
              <Text style={styles.yieldPillText}>{yieldRatio}x yield</Text>
            </View>
          </View>
        </View>

        {/* 4. Results Panel (Surface Card, Saffron for Key Result, Greys for Everything Else) */}
        {yieldResult && roundedTotals && roundedPer100g && roundedPerGram && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Yield Engine Output</Text>
              <View style={styles.energyDensityPill}>
                <Text style={styles.energyDensityText}>
                  {(Math.round(roundedPerGram.kcal * 100) / 100)} kcal / g
                </Text>
              </View>
            </View>

            {/* Total Cooked Dish Summary */}
            <View style={styles.totalDishRow}>
              <View>
                <Text style={styles.totalDishHeading}>Total Dish ({cookedGramsNumber}g)</Text>
                {/* Strictly ordered: Protein, Carbs, Fats, Fibre */}
                <Text style={styles.totalDishMacros}>
                  <Text style={{ color: theme.protein }}>P {roundedTotals.protein}g</Text>
                  {'   '}
                  <Text style={{ color: theme.carbs }}>C {roundedTotals.carbs}g</Text>
                  {'   '}
                  <Text style={{ color: theme.fats }}>F {roundedTotals.fat}g</Text>
                  {'   '}
                  <Text style={{ color: theme.fibre }}>Fi {roundedTotals.fibre}g</Text>
                </Text>
              </View>
              <Text style={styles.totalDishKcal}>{Math.round(roundedTotals.kcal)} kcal</Text>
            </View>

            {/* Per 100g vs 1 Katori (150g) Comparison */}
            <View style={styles.comparisonGrid}>
              <View style={styles.compCard}>
                <Text style={styles.compLabel}>Per 100g Cooked</Text>
                <Text style={styles.compKcal}>{Math.round(roundedPer100g.kcal)} kcal</Text>
                <Text style={styles.compMacros}>
                  <Text style={{ color: theme.protein }}>P {roundedPer100g.protein}g</Text>
                  {'  '}
                  <Text style={{ color: theme.carbs }}>C {roundedPer100g.carbs}g</Text>
                  {'  '}
                  <Text style={{ color: theme.fats }}>F {roundedPer100g.fat}g</Text>
                </Text>
              </View>

              <View style={styles.compCard}>
                <Text style={styles.compLabel}>1 Standard Katori (150g)</Text>
                <Text style={styles.compKcal}>{Math.round(roundedPerGram.kcal * 150)} kcal</Text>
                <Text style={styles.compMacros}>
                  <Text style={{ color: theme.protein }}>
                    P {Math.round(roundedPerGram.protein * 150 * 10) / 10}g
                  </Text>
                  {'  '}
                  <Text style={{ color: theme.carbs }}>
                    C {Math.round(roundedPerGram.carbs * 150 * 10) / 10}g
                  </Text>
                </Text>
              </View>
            </View>

            {/* Custom Portion Tester */}
            <View style={styles.customPortionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Custom Bowl Portion (g):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={customPortionGrams}
                  onChangeText={setCustomPortionGrams}
                />
              </View>
              <View style={styles.customPortionResults}>
                <Text style={styles.customPortionKcal}>
                  {Math.round(roundedPerGram.kcal * (parseFloat(customPortionGrams) || 0))} kcal
                </Text>
                <Text style={styles.customPortionProtein}>
                  P: {Math.round(roundedPerGram.protein * (parseFloat(customPortionGrams) || 0) * 10) / 10}g
                </Text>
              </View>
            </View>

            {/* Atwater Consistency Check (5% tolerance) */}
            <View style={styles.atwaterBox}>
              <Text style={[styles.atwaterText, Math.abs(atwaterDiffPercent) > 5 && { color: theme.danger }]}>
                {Math.abs(atwaterDiffPercent) <= 5
                  ? `Atwater check: ${atwaterDiffPercent}% difference (within 5% scientific tolerance)`
                  : `Discrepancy: ${atwaterDiffPercent}% difference. Check raw inputs.`}
              </Text>
            </View>

            {/* Single Full-Width Primary CTA: Save to Food Database */}
            {saveSuccess ? (
              <View style={styles.saveSuccessBanner}>
                <Text style={styles.saveSuccessText}>Saved. Recipe is now in Foods database.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.saveRecipeBtn}
                onPress={handleSaveRecipe}
                activeOpacity={0.85}
              >
                <Text style={styles.saveRecipeBtnText}>Save to Food Database</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 40,
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: Spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    color: theme.textFaint,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    minHeight: 44,
    color: theme.text,
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: theme.textFaint,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  ingredientMacros: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  stepperGramsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 8,
    height: 38,
    marginRight: 8,
  },
  stepperInput: {
    width: 44,
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepperUnit: {
    fontSize: 11,
    color: theme.textFaint,
    marginLeft: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    color: theme.textFaint,
    fontSize: 14,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  presetsScroll: {
    maxHeight: 38,
  },
  presetsContent: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: Radius.pill,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  oilRetainedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  oilRetainedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.fats,
    fontVariant: ['tabular-nums'],
  },
  oilKcalValue: {
    fontSize: 11,
    color: theme.textFaint,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  ratioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: Spacing.sm,
    gap: 8,
  },
  ratioLabel: {
    fontSize: 13,
    color: theme.textMuted,
  },
  ratioVal: {
    fontWeight: '600',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  ratioArrow: {
    fontSize: 14,
    color: theme.textFaint,
  },
  yieldPill: {
    marginLeft: 'auto',
    backgroundColor: theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  yieldPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    fontVariant: ['tabular-nums'],
  },
  resultsCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  energyDensityPill: {
    backgroundColor: theme.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  energyDensityText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    fontVariant: ['tabular-nums'],
  },
  totalDishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalDishHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  totalDishMacros: {
    fontSize: 12,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  totalDishKcal: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  compCard: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  compLabel: {
    fontSize: 11,
    color: theme.textFaint,
    fontWeight: '500',
  },
  compKcal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.calories,
    marginVertical: 2,
    fontVariant: ['tabular-nums'],
  },
  compMacros: {
    fontSize: 11,
    color: theme.textMuted,
    fontVariant: ['tabular-nums'],
  },
  customPortionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  customPortionResults: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  customPortionKcal: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  customPortionProtein: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.protein,
    fontVariant: ['tabular-nums'],
  },
  atwaterBox: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 10,
  },
  atwaterText: {
    fontSize: 12,
    color: theme.textFaint,
    lineHeight: 16,
  },
  saveRecipeBtn: {
    backgroundColor: theme.primary,
    borderRadius: Radius.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 4,
  },
  saveRecipeBtnText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveSuccessBanner: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSuccessText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
