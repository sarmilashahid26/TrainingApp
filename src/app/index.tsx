import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useNutrition } from '@/context/NutritionContext';
import { ProgressRing } from '@/components/ProgressRing';
import { FoodItem, FoodPortion, applyOilModifier } from '@/data/placeholderFoods';

const theme = Colors.dark;

export default function TodayScreen() {
  const router = useRouter();
  const {
    foods,
    logs,
    activeDayType,
    setActiveDayType,
    activeTarget,
    totals,
    streakDays,
    removeLog,
    copyYesterday,
    addLog,
    currentTrendWeight,
    userCalibrations,
  } = useNutrition();

  const [selectedFoodForPortion, setSelectedFoodForPortion] = useState<FoodItem | null>(null);
  const [portionSelection, setPortionSelection] = useState<FoodPortion | null>(null);
  const [portionGrams, setPortionGrams] = useState<string>('150');
  const [portionMeal, setPortionMeal] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');
  const [isCookedMode, setIsCookedMode] = useState<boolean>(true);
  const [portionOilLevel, setPortionOilLevel] = useState<'normal' | 'medium' | 'high'>('normal');

  // Quick Add modal
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickMeal, setQuickMeal] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('snack');
  const [quickName, setQuickName] = useState('');
  const [quickKcal, setQuickKcal] = useState('');
  const [quickProtein, setQuickProtein] = useState('');

  const mealTypes: Array<{ key: 'breakfast' | 'lunch' | 'snack' | 'dinner'; title: string }> = [
    { key: 'breakfast', title: 'Breakfast' },
    { key: 'lunch', title: 'Lunch' },
    { key: 'snack', title: 'Snacks' },
    { key: 'dinner', title: 'Dinner' },
  ];

  const handleOpenPortionModal = (food: FoodItem, targetMealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
    setSelectedFoodForPortion(food);
    const defPortion = food.portions[food.defaultPortionIndex] || food.portions[0];
    setPortionSelection(defPortion);
    setPortionGrams(defPortion.grams.toString());
    if (targetMealType) setPortionMeal(targetMealType);
    setIsCookedMode(food.source === 'own_measurement' || food.name.toLowerCase().includes('cooked'));
    setPortionOilLevel('normal');
  };

  const handleConfirmPortionLog = () => {
    if (!selectedFoodForPortion || !portionSelection) return;
    const grams = parseFloat(portionGrams) || 100;
    const factor = grams / 100;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const base = {
      kcal: Math.round(selectedFoodForPortion.per100g.kcal * factor),
      protein: round1(selectedFoodForPortion.per100g.protein * factor),
      carbs: round1(selectedFoodForPortion.per100g.carbs * factor),
      fat: round1(selectedFoodForPortion.per100g.fat * factor),
      fiber: round1(selectedFoodForPortion.per100g.fiber * factor),
    };
    const finalNutrition = applyOilModifier(base, portionOilLevel);
    const oilSuffix = portionOilLevel === 'medium' ? ' (+5g tadka)' : portionOilLevel === 'high' ? ' (+10g oil)' : '';

    addLog({
      foodId: selectedFoodForPortion.id,
      name: `${selectedFoodForPortion.name}${isCookedMode ? ' (Cooked)' : ' (Raw)'}${oilSuffix}`,
      mealType: portionMeal,
      portionLabel: `${portionSelection.label} (${grams}g)`,
      grams,
      kcal: finalNutrition.kcal,
      protein: finalNutrition.protein,
      carbs: finalNutrition.carbs,
      fat: finalNutrition.fat,
      fiber: finalNutrition.fiber,
      source: selectedFoodForPortion.source,
      oilLevel: portionOilLevel,
      confidence: selectedFoodForPortion.confidence ?? 0.9,
    });

    setSelectedFoodForPortion(null);
  };

  const handleQuickAdd = () => {
    const kcalNum = parseFloat(quickKcal);
    const proteinNum = parseFloat(quickProtein) || 0;
    if (!quickName.trim() || isNaN(kcalNum) || kcalNum <= 0) {
      Alert.alert('Invalid Entry', 'Please enter a food name and valid calories.');
      return;
    }
    addLog({
      foodId: 'quick-add',
      name: quickName.trim(),
      mealType: quickMeal,
      portionLabel: 'Quick Entry',
      grams: 100,
      kcal: Math.round(kcalNum),
      protein: Math.round(proteinNum * 10) / 10,
      carbs: 0,
      fat: 0,
      fiber: 0,
      source: 'label',
    });
    setQuickName('');
    setQuickKcal('');
    setQuickProtein('');
    setQuickAddVisible(false);
  };

  const calorieProgress = activeTarget.kcal > 0 ? totals.kcal / activeTarget.kcal : 0;
  const proteinProgress = activeTarget.protein > 0 ? totals.protein / activeTarget.protein : 0;
  const carbsProgress = activeTarget.carbs > 0 ? totals.carbs / activeTarget.carbs : 0;
  const fatProgress = activeTarget.fat > 0 ? totals.fat / activeTarget.fat : 0;
  const fiberProgress = activeTarget.fiber > 0 ? totals.fiber / activeTarget.fiber : 0;

  const proteinToGo = Math.max(0, Math.round((activeTarget.protein - totals.protein) * 10) / 10);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.largeTitle}>Today</Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>{streakDays}-day streak</Text>
            </View>
          </View>
        </View>

        {/* 2. Calorie Hero Card: Big Saffron Ring with calories in centre */}
        <View style={styles.calorieCard}>
          <View style={styles.ringWrapper}>
            <ProgressRing
              size={180}
              strokeWidth={14}
              progress={calorieProgress}
              color={theme.calories}
              trackColor={theme.ringTrack}
              backgroundColor={theme.surface}
            >
              {totals.kcal > activeTarget.kcal ? (
                <View style={styles.ringContent}>
                  <Text style={[styles.numberHero, { color: theme.text }]}>
                    +{totals.kcal - activeTarget.kcal}
                  </Text>
                  <Text style={styles.ringUnit}>kcal over · adaptive logged</Text>
                </View>
              ) : (
                <View style={styles.ringContent}>
                  <Text style={styles.numberHero}>{totals.remainingKcal}</Text>
                  <Text style={styles.ringUnit}>kcal left</Text>
                </View>
              )}
            </ProgressRing>
          </View>

          {/* Three-Column Budget Numbers */}
          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Target</Text>
              <Text style={styles.budgetValue}>{activeTarget.kcal}</Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Eaten</Text>
              <Text style={styles.budgetValue}>{totals.kcal}</Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={[styles.budgetValue, { color: theme.calories }]}>
                {totals.remainingKcal}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Macro Grid (2 x 2): Strictly Protein, Carbs, Fats, Fibre (Clean, Uncluttered) */}
        <View style={styles.macroGrid}>
          {/* Tile 1: Protein (Brightest White #FFFFFF, Lifter Priority #1) */}
          <View style={styles.macroTile}>
            <View style={styles.macroTileTop}>
              <Text style={[styles.macroLabel, { color: theme.protein }]}>Protein</Text>
              <ProgressRing
                size={40}
                strokeWidth={5}
                progress={proteinProgress}
                color={theme.protein}
                trackColor={theme.ringTrack}
                backgroundColor={theme.surface}
              >
                <Text style={[styles.miniRingLabel, { color: theme.protein }]}>P</Text>
              </ProgressRing>
            </View>
            <Text style={styles.macroGramsRow}>
              <Text style={styles.macroEatenText}>{totals.protein}</Text>
              <Text style={styles.macroTargetText}> / {activeTarget.protein} g</Text>
            </Text>
          </View>

          {/* Tile 2: Carbs (Shade #BDBDBD) */}
          <View style={styles.macroTile}>
            <View style={styles.macroTileTop}>
              <Text style={[styles.macroLabel, { color: theme.carbs }]}>Carbs</Text>
              <ProgressRing
                size={40}
                strokeWidth={5}
                progress={carbsProgress}
                color={theme.carbs}
                trackColor={theme.ringTrack}
                backgroundColor={theme.surface}
              >
                <Text style={[styles.miniRingLabel, { color: theme.carbs }]}>C</Text>
              </ProgressRing>
            </View>
            <Text style={styles.macroGramsRow}>
              <Text style={styles.macroEatenText}>{totals.carbs}</Text>
              <Text style={styles.macroTargetText}> / {activeTarget.carbs} g</Text>
            </Text>
          </View>

          {/* Tile 3: Fats (Shade #959595) */}
          <View style={styles.macroTile}>
            <View style={styles.macroTileTop}>
              <Text style={[styles.macroLabel, { color: theme.fats }]}>Fats</Text>
              <ProgressRing
                size={40}
                strokeWidth={5}
                progress={fatProgress}
                color={theme.fats}
                trackColor={theme.ringTrack}
                backgroundColor={theme.surface}
              >
                <Text style={[styles.miniRingLabel, { color: theme.fats }]}>F</Text>
              </ProgressRing>
            </View>
            <Text style={styles.macroGramsRow}>
              <Text style={styles.macroEatenText}>{totals.fat}</Text>
              <Text style={styles.macroTargetText}> / {activeTarget.fat} g</Text>
            </Text>
          </View>

          {/* Tile 4: Fibre (Shade #707070) */}
          <View style={styles.macroTile}>
            <View style={styles.macroTileTop}>
              <Text style={[styles.macroLabel, { color: theme.fibre }]}>Fibre</Text>
              <ProgressRing
                size={40}
                strokeWidth={5}
                progress={fiberProgress}
                color={theme.fibre}
                trackColor={theme.ringTrack}
                backgroundColor={theme.surface}
              >
                <Text style={[styles.miniRingLabel, { color: theme.fibre }]}>Fi</Text>
              </ProgressRing>
            </View>
            <Text style={styles.macroGramsRow}>
              <Text style={styles.macroEatenText}>{totals.fiber}</Text>
              <Text style={styles.macroTargetText}> / {activeTarget.fiber} g</Text>
            </Text>
          </View>
        </View>

        {/* 4. Quick Actions: Clean, Minimal, No Emojis */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setQuickAddVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionBtnText}>Quick Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={copyYesterday}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionBtnText}>Copy Yesterday</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Meals List: Breakfast, Lunch, Snacks, Dinner */}
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsHeading}>Meals</Text>
        </View>

        {mealTypes.map((meal) => {
          const mealLogs = logs.filter((l) => l.mealType === meal.key);
          const mealKcal = mealLogs.reduce((acc, curr) => acc + curr.kcal, 0);
          const mealProtein = Math.round(mealLogs.reduce((acc, curr) => acc + curr.protein, 0) * 10) / 10;

          return (
            <View key={meal.key} style={styles.mealSectionCard}>
              <View style={styles.mealSectionHeader}>
                <Text style={styles.mealTitleText}>{meal.title}</Text>
                <View style={styles.mealStatsRow}>
                  <Text style={styles.mealKcalText}>{mealKcal} kcal</Text>
                  {mealProtein > 0 && (
                    <Text style={styles.mealProteinText}>· {mealProtein}g P</Text>
                  )}
                  <TouchableOpacity
                    style={styles.addFoodPlusBtn}
                    onPress={() => router.push('/search')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addFoodPlusText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {mealLogs.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyMealRow}
                  onPress={() => router.push('/search')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyMealPrompt}>+ Log food</Text>
                </TouchableOpacity>
              ) : (
                mealLogs.map((item) => (
                  <View key={item.id} style={styles.foodRow}>
                    <View style={styles.foodRowLeft}>
                      <View style={styles.foodNameAndBadge}>
                        <Text style={styles.foodRowName}>{item.name}</Text>
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
                        {item.confidence ? (
                          <View style={styles.confidencePill}>
                            <Text style={styles.confidencePillText}>
                              {Math.round(item.confidence * 100)}%
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.portionText}>{item.portionLabel}</Text>
                      {/* P / C / F in text-muted per DESIGN.md */}
                      <Text style={styles.macroBreakdownText}>
                        P {item.protein}g · C {item.carbs}g · F {item.fat}g
                      </Text>
                    </View>
                    <View style={styles.foodRowRight}>
                      <Text style={styles.foodRowKcal}>{item.kcal} kcal</Text>
                      <TouchableOpacity
                        style={styles.removeLogBtn}
                        onPress={() => removeLog(item.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Text style={styles.removeLogIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {/* 6. Health & Calorie Floor Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            Accuracy depends on weighing ingredients. Not medical advice.
          </Text>
          <Text style={styles.calorieFloorNote}>
            Calorie floors: minimum 1,600 kcal (males) / 1,200 kcal (females) for metabolic safety.
          </Text>
        </View>
      </ScrollView>

      {/* Direct Portion Modal (Triggered from Top Search or Food Row) */}
      <Modal visible={selectedFoodForPortion !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedFoodForPortion && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetFoodName}>{selectedFoodForPortion.name}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedFoodForPortion.category} · Source: {selectedFoodForPortion.source}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFoodForPortion(null)}
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
                {selectedFoodForPortion.supportsOilSlider && (
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
                          style={[styles.oilPill, portionOilLevel === lvl.id && styles.oilPillActive]}
                          onPress={() => setPortionOilLevel(lvl.id as 'normal' | 'medium' | 'high')}
                        >
                          <Text style={[styles.oilPillText, portionOilLevel === lvl.id && styles.oilPillTextActive]}>
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Target Meal Selector */}
                <Text style={styles.sectionLabel}>Meal</Text>
                <View style={styles.mealPillsRow}>
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealPill, portionMeal === m && styles.mealPillActive]}
                      onPress={() => setPortionMeal(m)}
                    >
                      <Text style={[styles.mealPillText, portionMeal === m && styles.mealPillTextActive]}>
                        {m === 'snack' ? 'Snacks' : m.charAt(0).toUpperCase() + m.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Indian Household Portions & Calibrations */}
                <Text style={styles.sectionLabel}>Portion</Text>
                <View style={styles.portionsGrid}>
                  {selectedFoodForPortion.supportsKatori && (
                    <TouchableOpacity
                      style={[
                        styles.portionBtn,
                        styles.calibratedPortionBtn,
                        portionGrams === userCalibrations.katoriGrams.toString() && styles.portionBtnActive,
                      ]}
                      onPress={() => {
                        setPortionSelection({
                          name: 'my_katori',
                          label: `My Katori (${userCalibrations.katoriGrams}g)`,
                          grams: userCalibrations.katoriGrams,
                        });
                        setPortionGrams(userCalibrations.katoriGrams.toString());
                      }}
                    >
                      <Text
                        style={[
                          styles.portionBtnText,
                          styles.calibratedPortionBtnText,
                          portionGrams === userCalibrations.katoriGrams.toString() && styles.portionBtnTextActive,
                        ]}
                      >
                        ⭐ My Katori ({userCalibrations.katoriGrams}g)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedFoodForPortion.supportsPhulka && (
                    <TouchableOpacity
                      style={[
                        styles.portionBtn,
                        styles.calibratedPortionBtn,
                        portionGrams === userCalibrations.rotiGrams.toString() && styles.portionBtnActive,
                      ]}
                      onPress={() => {
                        setPortionSelection({
                          name: 'my_phulka',
                          label: `My Phulka (${userCalibrations.rotiGrams}g)`,
                          grams: userCalibrations.rotiGrams,
                        });
                        setPortionGrams(userCalibrations.rotiGrams.toString());
                      }}
                    >
                      <Text
                        style={[
                          styles.portionBtnText,
                          styles.calibratedPortionBtnText,
                          portionGrams === userCalibrations.rotiGrams.toString() && styles.portionBtnTextActive,
                        ]}
                      >
                        ⭐ My Phulka ({userCalibrations.rotiGrams}g)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedFoodForPortion.portions.map((portion, idx) => {
                    const isSelected = portionSelection?.label === portion.label;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.portionBtn, isSelected && styles.portionBtnActive]}
                        onPress={() => {
                          setPortionSelection(portion);
                          setPortionGrams(portion.grams.toString());
                        }}
                      >
                        <Text style={[styles.portionBtnText, isSelected && styles.portionBtnTextActive]}>
                          {portion.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Weight Input */}
                <Text style={styles.sectionLabel}>Weight (grams)</Text>
                <View style={styles.weightInputRow}>
                  <TextInput
                    style={styles.weightInput}
                    keyboardType="numeric"
                    value={portionGrams}
                    onChangeText={setPortionGrams}
                  />
                  <Text style={styles.weightUnit}>g</Text>
                </View>

                {/* Single Primary Action: Add to Diary (Saffron) */}
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleConfirmPortionLog}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionButtonText}>
                    Add to Diary · {portionMeal.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Quick Add Modal */}
      <Modal visible={quickAddVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quick Entry</Text>
            <Text style={styles.modalSubtitle}>Fast logging when macros are already known</Text>

            <Text style={styles.inputLabel}>Meal</Text>
            <View style={styles.modalMealPicker}>
              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modalMealPill, quickMeal === m && styles.modalMealPillActive]}
                  onPress={() => setQuickMeal(m)}
                >
                  <Text style={[styles.modalMealPillText, quickMeal === m && styles.modalMealPillTextActive]}>
                    {m === 'snack' ? 'Snacks' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Protein shake"
              placeholderTextColor={theme.textFaint}
              value={quickName}
              onChangeText={setQuickName}
            />

            <View style={styles.modalInputRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={styles.inputLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 130"
                  placeholderTextColor={theme.textFaint}
                  keyboardType="numeric"
                  value={quickKcal}
                  onChangeText={setQuickKcal}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 25"
                  placeholderTextColor={theme.textFaint}
                  keyboardType="numeric"
                  value={quickProtein}
                  onChangeText={setQuickProtein}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setQuickAddVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleQuickAdd}
              >
                <Text style={styles.modalSubmitText}>Add to Diary</Text>
              </TouchableOpacity>
            </View>
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
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 40,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakPill: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  streakText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.4,
    lineHeight: 40,
  },
  // Top Search Bar on Home Screen
  topSearchWrapper: {
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIconText: {
    fontSize: 14,
    color: theme.textFaint,
    marginRight: 6,
    fontWeight: '600',
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
  searchResultsBox: {
    backgroundColor: theme.surface,
    borderRadius: Radius.md,
    marginTop: 6,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noSearchMatchRow: {
    padding: Spacing.sm,
    alignItems: 'center',
  },
  noSearchMatchText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  goToFoodsLink: {
    marginTop: 6,
    padding: 4,
  },
  goToFoodsLinkText: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '600',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  searchResultMeta: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  searchResultLogPill: {
    backgroundColor: theme.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  searchResultLogText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  // Day Switcher
  daySwitchContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  daySwitchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  daySwitchBtnActive: {
    backgroundColor: theme.surface,
  },
  daySwitchText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textMuted,
  },
  daySwitchTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  // Calorie Hero Card (no border, no shadow, surface background)
  calorieCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  ringWrapper: {
    marginVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberHero: {
    fontSize: 44,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  ringUnit: {
    fontSize: 13,
    color: theme.textFaint,
    fontWeight: '500',
    marginTop: -2,
  },
  proteinPriorityLine: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: theme.surfaceRaised,
  },
  proteinPriorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
  },
  proteinPriorityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.protein, // Pure white reserved for protein
    fontVariant: ['tabular-nums'],
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  budgetItem: {
    alignItems: 'center',
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: theme.textFaint,
    marginBottom: 2,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  budgetDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },
  // Macro Grid 2 x 2
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  macroTile: {
    width: '47.5%',
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  macroTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  macroLabelBlock: {
    flex: 1,
    marginRight: 6,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  macroRemainingSub: {
    fontSize: 11,
    color: theme.textFaint,
    marginTop: 2,
    fontWeight: '500',
  },
  miniRingLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroGramsRow: {
    marginTop: 4,
  },
  macroEatenText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  macroTargetText: {
    fontSize: 13,
    color: theme.textFaint,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  // Quick Actions Row
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBtnText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '500',
  },
  // Meals
  mealsHeader: {
    marginBottom: Spacing.sm,
  },
  mealsHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  mealSectionCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  mealTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  mealStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealKcalText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  mealProteinText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textMuted,
    fontVariant: ['tabular-nums'],
  },
  addFoodPlusBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFoodPlusText: {
    color: theme.primary,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
  },
  emptyMealRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyMealPrompt: {
    fontSize: 13,
    color: theme.textFaint,
    fontWeight: '500',
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  foodRowLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  foodNameAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodRowName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  sourceBadge: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  portionText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  macroBreakdownText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  foodRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  foodRowKcal: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  removeLogBtn: {
    padding: 8,
    marginTop: 4,
  },
  removeLogIcon: {
    color: theme.textFaint,
    fontSize: 14,
  },
  disclaimerCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: theme.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },
  calorieFloorNote: {
    fontSize: 11,
    color: theme.textFaint,
    marginTop: 4,
    textAlign: 'center',
  },
  // Portion Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sheetFoodName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  closeSheetText: {
    fontSize: 18,
    color: theme.textFaint,
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.surface,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
  },
  toggleBtnTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
  },
  mealPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  mealPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPillActive: {
    backgroundColor: theme.primaryMuted,
  },
  mealPillText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  mealPillTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  portionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  portionBtn: {
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: Radius.md,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionBtnActive: {
    backgroundColor: theme.primaryMuted,
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
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: Spacing.md,
  },
  weightInput: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  weightUnit: {
    fontSize: 13,
    color: theme.textFaint,
    fontWeight: '500',
  },
  primaryActionButton: {
    backgroundColor: theme.primary,
    borderRadius: Radius.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 4,
  },
  primaryActionButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Quick Add Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
  },
  modalMealPicker: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  modalMealPill: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMealPillActive: {
    backgroundColor: theme.primaryMuted,
  },
  modalMealPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
  },
  modalMealPillTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    minHeight: 44,
    color: theme.text,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  modalInputRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceRaised,
  },
  modalCancelText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  modalSubmitBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
  modalSubmitText: {
    color: theme.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  calibratedPortionBtn: {
    backgroundColor: theme.surfacePressed,
    borderWidth: 1,
    borderColor: theme.border,
  },
  calibratedPortionBtnText: {
    color: theme.text,
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
  confidencePill: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginLeft: 4,
  },
  confidencePillText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textFaint,
  },
});
