import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useNutrition } from '@/context/NutritionContext';
import { FoodItem, FoodPortion, applyOilModifier } from '@/data/placeholderFoods';

const theme = Colors.dark;

type Language = 'all' | 'english' | 'tamil' | 'hindi' | 'telugu';

export default function SearchScreen() {
  const { foods, addLog, userCalibrations } = useNutrition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Selected food for portion modal
  const [activeFood, setActiveFood] = useState<FoodItem | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null);
  const [customGrams, setCustomGrams] = useState<string>('150');
  const [isCookedMode, setIsCookedMode] = useState<boolean>(true);
  const [oilLevel, setOilLevel] = useState<'normal' | 'medium' | 'high'>('normal');
  const [targetMeal, setTargetMeal] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['All', 'Dal & Curries', 'Breads & Grains', 'High Protein', 'Dairy & Snacks'];

  // Transliteration-aware search: matches names, regional scripts, and colloquial Roman synonyms
  const filteredFoods = useMemo(() => {
    return foods.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = item.name.toLowerCase().includes(q);
      const tamilMatch = item.regionalNames.tamil?.toLowerCase().includes(q) ?? false;
      const hindiMatch = item.regionalNames.hindi?.toLowerCase().includes(q) ?? false;
      const teluguMatch = item.regionalNames.telugu?.toLowerCase().includes(q) ?? false;
      const synonymMatch = item.synonyms?.some((syn) => syn.toLowerCase().includes(q)) ?? false;

      if (selectedLanguage === 'tamil') return tamilMatch || nameMatch || synonymMatch;
      if (selectedLanguage === 'hindi') return hindiMatch || nameMatch || synonymMatch;
      if (selectedLanguage === 'telugu') return teluguMatch || nameMatch || synonymMatch;
      if (selectedLanguage === 'english') return nameMatch || synonymMatch;

      return nameMatch || tamilMatch || hindiMatch || teluguMatch || synonymMatch;
    });
  }, [foods, searchQuery, selectedLanguage, selectedCategory]);

  const handleOpenPortionModal = (food: FoodItem) => {
    setActiveFood(food);
    const defaultPortion = food.portions[food.defaultPortionIndex] || food.portions[0];
    setSelectedPortion(defaultPortion);
    setCustomGrams(defaultPortion.grams.toString());
    setIsCookedMode(food.source === 'own_measurement' || food.name.toLowerCase().includes('cooked'));
    setOilLevel('normal');
  };

  const getEffectiveGrams = (): number => {
    const val = parseFloat(customGrams);
    return isNaN(val) || val <= 0 ? 100 : val;
  };

  const calculateActiveNutrition = (food: FoodItem, grams: number) => {
    const factor = grams / 100;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const base = {
      kcal: Math.round(food.per100g.kcal * factor),
      protein: round1(food.per100g.protein * factor),
      carbs: round1(food.per100g.carbs * factor),
      fat: round1(food.per100g.fat * factor),
      fiber: round1(food.per100g.fiber * factor),
    };
    return applyOilModifier(base, oilLevel);
  };

  const handleConfirmLog = () => {
    if (!activeFood || !selectedPortion) return;
    const grams = getEffectiveGrams();
    const nutrition = calculateActiveNutrition(activeFood, grams);

    const oilSuffix = oilLevel === 'medium' ? ' (+5g tadka oil)' : oilLevel === 'high' ? ' (+10g restaurant oil)' : '';

    addLog({
      foodId: activeFood.id,
      name: `${activeFood.name}${isCookedMode ? ' (Cooked)' : ' (Raw)'}${oilSuffix}`,
      mealType: targetMeal,
      portionLabel: `${selectedPortion.label} (${grams}g)`,
      grams,
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      source: activeFood.source,
      oilLevel,
      confidence: activeFood.confidence ?? 0.9,
    });

    const loggedName = activeFood.name;
    setActiveFood(null);
    setToastMessage(`Added ${loggedName} to ${targetMeal.toUpperCase()}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const adjustGrams = (delta: number) => {
    const current = getEffectiveGrams();
    const next = Math.max(10, current + delta);
    setCustomGrams(next.toString());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Foods</Text>
          <Text style={styles.subtitle}>
            Verified Indian database with katori portions & cooked yields
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food or dish (e.g. dal, roti)..."
            placeholderTextColor={theme.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Regional Language Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'english', label: 'English' },
            { id: 'tamil', label: 'தமிழ்' },
            { id: 'hindi', label: 'हिंदी' },
            { id: 'telugu', label: 'తెలుగు' },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.filterChip, selectedLanguage === lang.id && styles.filterChipActive]}
              onPress={() => setSelectedLanguage(lang.id as Language)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedLanguage === lang.id && styles.filterChipTextActive,
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Toast Alert */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Food Items List */}
        <ScrollView
          style={styles.foodList}
          contentContainerStyle={styles.foodListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredFoods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Foods Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try typing colloquial names like "paruppu", "arhar", or "tuvar".
              </Text>
            </View>
          ) : (
            filteredFoods.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                onPress={() => handleOpenPortionModal(item)}
                activeOpacity={0.8}
              >
                <View style={styles.foodCardHeader}>
                  <View style={styles.foodNameCol}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    {item.regionalNames.tamil && (
                      <Text style={styles.regionalSubText}>{item.regionalNames.tamil}</Text>
                    )}
                    {item.regionalNames.hindi && !item.regionalNames.tamil && (
                      <Text style={styles.regionalSubText}>{item.regionalNames.hindi}</Text>
                    )}
                    {item.regionalNames.telugu && !item.regionalNames.tamil && !item.regionalNames.hindi && (
                      <Text style={styles.regionalSubText}>{item.regionalNames.telugu}</Text>
                    )}
                  </View>

                  {/* Confidence & Source Badges */}
                  <View style={styles.badgeCol}>
                    <View
                      style={[
                        styles.sourceBadge,
                        item.source === 'own_measurement' && styles.sourceBadgeYield,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sourceBadgeText,
                          item.source === 'own_measurement' && styles.sourceBadgeYieldText,
                        ]}
                      >
                        {item.source === 'own_measurement' ? 'Cooked Yield' : item.source.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.confidencePill}>
                      <Text style={styles.confidencePillText}>
                        {Math.round((item.confidence ?? 0.9) * 100)}% Verified
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Macro Strip */}
                <View style={styles.foodCardFooter}>
                  <Text style={styles.macroStripText}>
                    <Text style={styles.macroKcal}>{item.per100g.kcal} kcal</Text>
                    {'   '}
                    <Text style={{ color: theme.protein }}>P {item.per100g.protein}g</Text>
                    {'   '}
                    <Text style={{ color: theme.carbs }}>C {item.per100g.carbs}g</Text>
                    {'   '}
                    <Text style={{ color: theme.fats }}>F {item.per100g.fat}g</Text>
                  </Text>
                  <Text style={styles.tapToLogHint}>+ Log</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Portion & Meal Selection Modal (Add Food) */}
      <Modal visible={activeFood !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {activeFood && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetFoodName}>{activeFood.name}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {activeFood.category} · {Math.round((activeFood.confidence ?? 0.9) * 100)}% Verified Confidence
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveFood(null)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.closeSheetText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Raw vs Cooked Toggle */}
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, !isCookedMode && styles.toggleBtnActive]}
                    onPress={() => setIsCookedMode(false)}
                  >
                    <Text style={[styles.toggleBtnText, !isCookedMode && styles.toggleBtnTextActive]}>
                      Raw
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, isCookedMode && styles.toggleBtnActive]}
                    onPress={() => setIsCookedMode(true)}
                  >
                    <Text style={[styles.toggleBtnText, isCookedMode && styles.toggleBtnTextActive]}>
                      Cooked
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Oil Slider for Dishes with Tempering/Gravy */}
                {activeFood.supportsOilSlider && (
                  <View style={styles.oilSliderContainer}>
                    <Text style={styles.sectionLabel}>Tadka & Cooking Oil Level</Text>
                    <View style={styles.oilPillsRow}>
                      {[
                        { id: 'normal', label: 'Low / Normal (+0g)' },
                        { id: 'medium', label: 'Medium (+5g oil)' },
                        { id: 'high', label: 'Restaurant (+10g oil)' },
                      ].map((lvl) => (
                        <TouchableOpacity
                          key={lvl.id}
                          style={[styles.oilPill, oilLevel === lvl.id && styles.oilPillActive]}
                          onPress={() => setOilLevel(lvl.id as 'normal' | 'medium' | 'high')}
                        >
                          <Text style={[styles.oilPillText, oilLevel === lvl.id && styles.oilPillTextActive]}>
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Target Meal Selector */}
                <Text style={styles.sectionLabel}>Meal Slot</Text>
                <View style={styles.mealPillsRow}>
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealPill, targetMeal === m && styles.mealPillActive]}
                      onPress={() => setTargetMeal(m)}
                    >
                      <Text style={[styles.mealPillText, targetMeal === m && styles.mealPillTextActive]}>
                        {m === 'snack' ? 'Snacks' : m.charAt(0).toUpperCase() + m.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Portion Selector with Indian Units & Household Calibrations */}
                <Text style={styles.sectionLabel}>Indian Household Portion</Text>
                <View style={styles.portionsGrid}>
                  {/* Household Calibration Quick Buttons */}
                  {activeFood.supportsKatori && (
                    <TouchableOpacity
                      style={[
                        styles.portionBtn,
                        styles.calibratedPortionBtn,
                        customGrams === userCalibrations.katoriGrams.toString() && styles.portionBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedPortion({
                          name: 'my_katori',
                          label: `My Katori (${userCalibrations.katoriGrams}g)`,
                          grams: userCalibrations.katoriGrams,
                        });
                        setCustomGrams(userCalibrations.katoriGrams.toString());
                      }}
                    >
                      <Text
                        style={[
                          styles.portionBtnText,
                          styles.calibratedPortionBtnText,
                          customGrams === userCalibrations.katoriGrams.toString() && styles.portionBtnTextActive,
                        ]}
                      >
                        ⭐ My Katori ({userCalibrations.katoriGrams}g)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {activeFood.supportsPhulka && (
                    <TouchableOpacity
                      style={[
                        styles.portionBtn,
                        styles.calibratedPortionBtn,
                        customGrams === userCalibrations.rotiGrams.toString() && styles.portionBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedPortion({
                          name: 'my_phulka',
                          label: `My Phulka (${userCalibrations.rotiGrams}g)`,
                          grams: userCalibrations.rotiGrams,
                        });
                        setCustomGrams(userCalibrations.rotiGrams.toString());
                      }}
                    >
                      <Text
                        style={[
                          styles.portionBtnText,
                          styles.calibratedPortionBtnText,
                          customGrams === userCalibrations.rotiGrams.toString() && styles.portionBtnTextActive,
                        ]}
                      >
                        ⭐ My Phulka ({userCalibrations.rotiGrams}g)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {activeFood.portions.map((portion, idx) => {
                    const isSelected = selectedPortion?.label === portion.label;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.portionBtn, isSelected && styles.portionBtnActive]}
                        onPress={() => {
                          setSelectedPortion(portion);
                          setCustomGrams(portion.grams.toString());
                        }}
                      >
                        <Text style={[styles.portionBtnText, isSelected && styles.portionBtnTextActive]}>
                          {portion.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Portion Stepper with Weighed Grams */}
                <Text style={styles.sectionLabel}>Weighed Weight (grams)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustGrams(-10)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>- 10g</Text>
                  </TouchableOpacity>
                  <View style={styles.stepperInputWrapper}>
                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="numeric"
                      value={customGrams}
                      onChangeText={setCustomGrams}
                    />
                    <Text style={styles.stepperUnit}>g</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustGrams(10)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>+ 10g</Text>
                  </TouchableOpacity>
                </View>

                {/* Live Macro Grid (Strict Order: Protein, Carbs, Fats, Fibre) */}
                {(() => {
                  const g = getEffectiveGrams();
                  const calc = calculateActiveNutrition(activeFood, g);
                  return (
                    <View style={styles.liveMacroCard}>
                      <View style={styles.liveMacroHeader}>
                        <Text style={styles.liveMacroKcal}>{calc.kcal} kcal</Text>
                        <Text style={styles.liveMacroWeight}>
                          {g}g portion {oilLevel !== 'normal' ? '· Tadka Adjusted' : ''}
                        </Text>
                      </View>
                      <View style={styles.liveMacroRow}>
                        <View style={styles.liveMacroCol}>
                          <Text style={[styles.liveMacroValue, { color: theme.protein }]}>
                            {calc.protein}g
                          </Text>
                          <Text style={styles.liveMacroLabel}>Protein</Text>
                        </View>
                        <View style={styles.liveMacroCol}>
                          <Text style={[styles.liveMacroValue, { color: theme.carbs }]}>
                            {calc.carbs}g
                          </Text>
                          <Text style={styles.liveMacroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.liveMacroCol}>
                          <Text style={[styles.liveMacroValue, { color: theme.fats }]}>
                            {calc.fat}g
                          </Text>
                          <Text style={styles.liveMacroLabel}>Fats</Text>
                        </View>
                        <View style={styles.liveMacroCol}>
                          <Text style={[styles.liveMacroValue, { color: theme.fibre }]}>
                            {calc.fiber}g
                          </Text>
                          <Text style={styles.liveMacroLabel}>Fibre</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Single Full-Width Primary Action at Bottom */}
                <TouchableOpacity
                  style={styles.addDiaryBtn}
                  onPress={handleConfirmLog}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addDiaryBtnText}>
                    Add to Diary · {targetMeal.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
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
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: theme.border,
    marginVertical: Spacing.xs,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: theme.textFaint,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchText: {
    color: theme.textFaint,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  filterScroll: {
    maxHeight: 38,
    marginBottom: 6,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: Radius.pill,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.primaryMuted,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    lineHeight: 18,
  },
  filterChipTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  toastContainer: {
    backgroundColor: theme.surfaceRaised,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginVertical: 4,
    alignItems: 'center',
  },
  toastText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  foodList: {
    flex: 1,
    marginTop: 4,
  },
  foodListContent: {
    paddingBottom: Spacing.xl + 40,
    gap: Spacing.sm,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  foodCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 10,
  },
  foodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodNameCol: {
    flex: 1,
    paddingRight: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  regionalSubText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sourceBadge: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  sourceBadgeYield: {
    backgroundColor: theme.primaryMuted,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textMuted,
  },
  sourceBadgeYieldText: {
    color: theme.primary,
  },
  confidencePill: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  confidencePillText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textFaint,
  },
  foodCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  macroStripText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  macroKcal: {
    color: theme.calories,
    fontWeight: '700',
  },
  tapToLogHint: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sheetFoodName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  closeSheetText: {
    fontSize: 16,
    color: theme.textFaint,
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: theme.surfacePressed,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textMuted,
  },
  toggleBtnTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  oilSliderContainer: {
    marginBottom: Spacing.sm,
  },
  oilPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  oilPill: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  oilPillActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryMuted,
  },
  oilPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textMuted,
  },
  oilPillTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textFaint,
    marginTop: Spacing.xs,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  mealPill: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mealPillActive: {
    backgroundColor: theme.primaryMuted,
  },
  mealPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
  },
  mealPillTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  portionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  portionBtn: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  calibratedPortionBtn: {
    backgroundColor: theme.surfacePressed,
    borderWidth: 1,
    borderColor: theme.border,
  },
  calibratedPortionBtnText: {
    color: theme.text,
  },
  portionBtnActive: {
    backgroundColor: theme.primaryMuted,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  portionBtnText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  portionBtnTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepperBtn: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  stepperInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 44,
  },
  stepperInput: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  stepperUnit: {
    color: theme.textFaint,
    fontSize: 14,
    fontWeight: '500',
  },
  liveMacroCard: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  liveMacroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveMacroKcal: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  liveMacroWeight: {
    fontSize: 12,
    color: theme.textMuted,
  },
  liveMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  liveMacroCol: {
    alignItems: 'center',
  },
  liveMacroValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  liveMacroLabel: {
    fontSize: 10,
    color: theme.textFaint,
    marginTop: 1,
  },
  addDiaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: Radius.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  addDiaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.onPrimary,
  },
});
