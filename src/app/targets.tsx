import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useNutrition } from '@/context/NutritionContext';

const theme = Colors.dark;

export default function TargetsScreen() {
  const {
    targets,
    activeDayType,
    setActiveDayType,
    weightLogs,
    calculatedTrends,
    currentScaleWeight,
    currentTrendWeight,
    adaptiveTdee,
    addWeightLog,
    applyWeeklyCheckIn,
    userCalibrations,
    updateCalibrations,
  } = useNutrition();

  const [selectedRate, setSelectedRate] = useState<number>(targets.weeklyRateKg ?? -0.4);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);

  // Daily weight entry input state
  const [newScaleWeight, setNewScaleWeight] = useState<string>(currentScaleWeight.toString());
  const [weightLoggedToast, setWeightLoggedToast] = useState(false);

  // Household calibrations input state
  const [katoriInput, setKatoriInput] = useState<string>(userCalibrations.katoriGrams.toString());
  const [rotiInput, setRotiInput] = useState<string>(userCalibrations.rotiGrams.toString());
  const [calibrationsSaved, setCalibrationsSaved] = useState(false);

  const handleLogScaleWeight = () => {
    const val = parseFloat(newScaleWeight);
    if (!Number.isFinite(val) || val < 30 || val > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid scale weight between 30 and 300 kg.');
      return;
    }
    addWeightLog(val, 'Today');
    setWeightLoggedToast(true);
    setTimeout(() => setWeightLoggedToast(false), 2500);
  };

  const handleSaveCalibrations = () => {
    const k = parseInt(katoriInput, 10);
    const r = parseInt(rotiInput, 10);
    if (k > 0 && r > 0) {
      updateCalibrations({ katoriGrams: k, rotiGrams: r });
      setCalibrationsSaved(true);
      setTimeout(() => setCalibrationsSaved(false), 2500);
    }
  };

  const handleApplyStrategy = () => {
    applyWeeklyCheckIn(selectedRate);
    Alert.alert(
      'Targets Updated',
      `Weekly targets have been updated based on your adaptive TDEE of ${adaptiveTdee.tdee} kcal/day and chosen rate of ${selectedRate >= 0 ? '+' : ''}${selectedRate} kg/week.`
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Nutrition & Weight Data',
      'Under India’s DPDP Act, you can download all your logged food weights, Kalman trend weights, calibrated household measures, and recipes as an encrypted JSON archive.',
      [{ text: 'Download Archive', onPress: () => {} }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data (DPDP Act)',
      'This will permanently erase all local SQLite databases and cloud records. Your data will not be recoverable.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  // Recent 6 days of weight log history for the table
  const recentHistory = weightLogs.slice(-6).map((entry, idx) => {
    const globalIdx = weightLogs.length - 6 + idx;
    const trendVal = calculatedTrends[globalIdx];
    return {
      date: entry.date,
      scale: entry.weightKg,
      trend: Number.isNaN(trendVal) ? null : trendVal,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Targets & Coaching</Text>
          <Text style={styles.subtitle}>
            Adaptive energy engine & calibrated Indian home cooking
          </Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.profileName}>Lifter Profile</Text>
              <Text style={styles.profileDetail}>
                Trend: {currentTrendWeight} kg · Target: {targets.targetWeightKg} kg · {targets.proteinPerKg}g/kg Protein
              </Text>
            </View>
            <View style={styles.trialPill}>
              <Text style={styles.trialText}>ADAPTIVE ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* 1. Weight Trend & Kalman Filter Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Weight Trend (Kalman Filter)</Text>
            <View style={styles.neutralBadge}>
              <Text style={styles.neutralBadgeText}>Noise Filtered</Text>
            </View>
          </View>
          <Text style={styles.cardHelperText}>
            Separates true tissue changes from daily water, glycogen, and sodium fluctuations. Missed weigh-ins are automatically bridged.
          </Text>

          {/* Metric Comparison Hero */}
          <View style={styles.trendHeroGrid}>
            <View style={styles.trendMetricCard}>
              <Text style={styles.trendMetricLabel}>TREND WEIGHT</Text>
              <Text style={styles.trendMetricValue}>{currentTrendWeight} <Text style={styles.unitText}>kg</Text></Text>
              <Text style={styles.trendSubtext}>True metabolic trend</Text>
            </View>
            <View style={styles.trendMetricCard}>
              <Text style={styles.trendMetricLabel}>SCALE READING</Text>
              <Text style={[styles.trendMetricValue, { color: theme.textMuted }]}>
                {currentScaleWeight} <Text style={styles.unitText}>kg</Text>
              </Text>
              <Text style={styles.trendSubtext}>Raw bathroom scale</Text>
            </View>
          </View>

          {/* Log Today's Scale Weight Input */}
          <View style={styles.weighInRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputMiniLabel}>Log Today's Weight</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={newScaleWeight}
                onChangeText={setNewScaleWeight}
                placeholder="Scale weight (kg)"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <TouchableOpacity style={styles.logWeightBtn} onPress={handleLogScaleWeight}>
              <Text style={styles.logWeightBtnText}>
                {weightLoggedToast ? 'Updated ✓' : 'Record'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Weight Table */}
          <View style={styles.historyTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Day</Text>
              <Text style={[styles.tableColHeader, { flex: 1 }]}>Scale</Text>
              <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Trend</Text>
            </View>
            {recentHistory.map((row, idx) => (
              <View key={idx} style={styles.tableDataRow}>
                <Text style={[styles.tableCellText, { flex: 1.2, color: theme.textMuted }]}>{row.date}</Text>
                <Text style={[styles.tableCellText, { flex: 1 }]}>
                  {row.scale != null ? `${row.scale} kg` : '—'}
                </Text>
                <Text style={[styles.tableCellText, { flex: 1, textAlign: 'right', color: theme.text, fontWeight: '600' }]}>
                  {row.trend != null ? `${row.trend} kg` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Adaptive Calorie Burn (TDEE Engine) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Adaptive Calorie Burn (TDEE)</Text>
            <View style={styles.confidencePill}>
              <Text style={styles.confidencePillText}>
                {Math.round(adaptiveTdee.confidence * 100)}% Confidence
              </Text>
            </View>
          </View>

          <Text style={styles.cardHelperText}>
            Deterministic calculation from energy balance: Intake minus trend weight rate of change. Fitness tracker burn is excluded.
          </Text>

          <View style={styles.tdeeHeroBox}>
            <Text style={styles.tdeeHeroLabel}>EXPENDITURE ESTIMATE</Text>
            <Text style={styles.tdeeHeroNumber}>
              {adaptiveTdee.tdee} <Text style={styles.tdeeHeroUnit}>kcal / day</Text>
            </Text>
            <View style={styles.confidenceBarContainer}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${Math.max(10, Math.round(adaptiveTdee.confidence * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceStatusText}>
              Learning progress: {adaptiveTdee.daysLogged} of {adaptiveTdee.totalWindowDays} days logged ({Math.round(adaptiveTdee.completeness * 100)}% complete)
            </Text>
          </View>

          <View style={styles.neutralExplainerBox}>
            <Text style={styles.neutralExplainerText}>
              Adherence-neutral coaching: We calculate from what you actually eat, never what you were supposed to eat. No guilt, no scolding.
            </Text>
          </View>
        </View>

        {/* 3. Weekly Strategy & Auto-Adjusted Targets */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Weekly Strategy & Auto-Adjust</Text>
          </View>

          <Text style={styles.cardHelperText}>
            Target rate of weight change per week. Auto-adjustments are clamped to a safe step size of ±150 kcal.
          </Text>

          {/* Rate Selector Pills */}
          <View style={styles.ratePillsRow}>
            {[
              { rate: -0.6, label: 'Fast Cut (-0.6kg)' },
              { rate: -0.4, label: 'Steady Cut (-0.4kg)' },
              { rate: 0.0, label: 'Maintain (0.0kg)' },
              { rate: 0.25, label: 'Lean Bulk (+0.25kg)' },
            ].map((item) => (
              <TouchableOpacity
                key={item.rate}
                style={[styles.ratePill, selectedRate === item.rate && styles.ratePillActive]}
                onPress={() => setSelectedRate(item.rate)}
              >
                <Text style={[styles.ratePillText, selectedRate === item.rate && styles.ratePillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Macro Targets Preview */}
          <View style={styles.targetsTable}>
            <View style={[styles.targetRow, styles.targetRowActive]}>
              <View style={styles.dayCol}>
                <Text style={styles.dayColTitle}>Daily Targets</Text>
                <Text style={styles.dayColSub}>Adjusted by adaptive energy engine</Text>
              </View>
              <View style={styles.dayStatsCol}>
                <Text style={styles.targetKcal}>{targets.trainingDay.kcal} kcal</Text>
                <Text style={styles.targetMacros}>
                  <Text style={{ color: theme.protein }}>P {targets.trainingDay.protein}g</Text>
                  {'   '}
                  <Text style={{ color: theme.carbs }}>C {targets.trainingDay.carbs}g</Text>
                  {'   '}
                  <Text style={{ color: theme.fats }}>F {targets.trainingDay.fat}g</Text>
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyStrategy}>
            <Text style={styles.applyBtnText}>Apply Weekly Check-in Targets</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Household Measures Calibration (Indian Kitchen Moat) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>My Household Calibrations</Text>
            <View style={styles.neutralBadge}>
              <Text style={styles.neutralBadgeText}>Indian Kitchen</Text>
            </View>
          </View>
          <Text style={styles.cardHelperText}>
            Weigh your home katori and phulka once. Future quick logs instantly use your personal household weights.
          </Text>

          <View style={styles.calibrationGrid}>
            <View style={styles.calibrationCol}>
              <Text style={styles.inputMiniLabel}>My Katori (g)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={katoriInput}
                onChangeText={setKatoriInput}
                placeholder="150"
                placeholderTextColor={theme.textMuted}
              />
              <Text style={styles.calibDesc}>Standard dal / curry bowl</Text>
            </View>

            <View style={styles.calibrationCol}>
              <Text style={styles.inputMiniLabel}>My Phulka (g)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={rotiInput}
                onChangeText={setRotiInput}
                placeholder="30"
                placeholderTextColor={theme.textMuted}
              />
              <Text style={styles.calibDesc}>Single roti without ghee</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveCalibBtn} onPress={handleSaveCalibrations}>
            <Text style={styles.saveCalibBtnText}>
              {calibrationsSaved ? 'Calibrations Saved ✓' : 'Save Household Measures'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Subscription Plan Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Full Access Plan</Text>
            <View style={styles.trialPill}>
              <Text style={styles.trialText}>REVENUECAT</Text>
            </View>
          </View>
          <Text style={styles.cardHelperText}>
            7-day full access trial. All saved recipes, kitchen calibrations, and weight trend logs are permanently preserved.
          </Text>

          <View style={styles.planOptionsRow}>
            <View style={[styles.planBox, styles.planBoxHighlighted]}>
              <Text style={styles.planTag}>BEST VALUE</Text>
              <Text style={styles.planDuration}>Annual Plan</Text>
              <Text style={styles.planPrice}>₹1,499</Text>
              <Text style={styles.planPerMonth}>₹125 / month</Text>
            </View>
            <View style={styles.planBox}>
              <Text style={styles.planDuration}>Monthly Plan</Text>
              <Text style={styles.planPrice}>₹199</Text>
              <Text style={styles.planPerMonth}>Billed monthly</Text>
            </View>
          </View>
        </View>

        {/* 6. Offline SQLite & DPDP Act Data Privacy */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Privacy & Offline Storage</Text>
          <Text style={styles.cardHelperText}>
            Compliant with India's Digital Personal Data Protection (DPDP) Act. All food data is stored on-device via SQLite.
          </Text>

          <View style={styles.settingToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>On-Device SQLite Storage</Text>
              <Text style={styles.settingDesc}>Instant lookups without internet connection</Text>
            </View>
            <Switch
              value={offlineSyncEnabled}
              onValueChange={setOfflineSyncEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          <View style={styles.dpdpActionsRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportData}>
              <Text style={styles.exportBtnText}>Export My Data (JSON)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteData}>
              <Text style={styles.deleteBtnText}>Delete All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Floor Notice */}
        <View style={styles.safetyFloorBox}>
          <Text style={styles.safetyFloorText}>
            Calorie floor: minimum 1,600 kcal (males) / 1,200 kcal (females) for metabolic safety.
          </Text>
        </View>

        {/* Health Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Accuracy depends on weighing ingredients. Not medical advice.
          </Text>
        </View>
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
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  cardHelperText: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  profileDetail: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  trialPill: {
    backgroundColor: theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  trialText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  neutralBadge: {
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  neutralBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textMuted,
  },
  trendHeroGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 12,
  },
  trendMetricCard: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  trendMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textFaint,
    letterSpacing: 0.5,
  },
  trendMetricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.textFaint,
  },
  trendSubtext: {
    fontSize: 11,
    color: theme.textMuted,
  },
  weighInRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: 12,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textFaint,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: theme.surfaceRaised,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    color: theme.text,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  logWeightBtn: {
    backgroundColor: theme.primary,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  logWeightBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  historyTable: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textFaint,
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  tableCellText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: theme.text,
  },
  tdeeHeroBox: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 10,
  },
  tdeeHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textFaint,
    letterSpacing: 0.5,
  },
  tdeeHeroNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  tdeeHeroUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textFaint,
  },
  confidenceBarContainer: {
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  confidenceStatusText: {
    fontSize: 11,
    color: theme.textMuted,
    fontVariant: ['tabular-nums'],
  },
  confidencePill: {
    backgroundColor: theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  confidencePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primary,
  },
  neutralExplainerBox: {
    backgroundColor: theme.surfaceRaised,
    padding: 10,
    borderRadius: Radius.sm,
  },
  neutralExplainerText: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
  switchDayTypeLink: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  ratePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  ratePill: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratePillActive: {
    backgroundColor: theme.primaryMuted,
    borderColor: theme.primary,
    borderWidth: 1,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
  },
  ratePillTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  targetsTable: {
    gap: 8,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surfaceRaised,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  targetRowActive: {
    borderColor: theme.primary,
  },
  dayCol: {
    flex: 1,
  },
  dayColTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  dayColSub: {
    fontSize: 11,
    color: theme.textMuted,
  },
  dayStatsCol: {
    alignItems: 'flex-end',
  },
  targetKcal: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.calories,
    fontVariant: ['tabular-nums'],
  },
  targetMacros: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: theme.primary,
    borderRadius: Radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  calibrationGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 12,
  },
  calibrationCol: {
    flex: 1,
  },
  calibDesc: {
    fontSize: 11,
    color: theme.textFaint,
    marginTop: 4,
  },
  saveCalibBtn: {
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  saveCalibBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  planOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  planBox: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  planBoxHighlighted: {
    borderColor: theme.primary,
  },
  planTag: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  planPerMonth: {
    fontSize: 11,
    color: theme.textMuted,
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  dpdpActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    borderRadius: Radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.danger,
  },
  safetyFloorBox: {
    backgroundColor: theme.surfaceRaised,
    padding: 12,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  safetyFloorText: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
  disclaimerBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.textFaint,
    textAlign: 'center',
  },
});
