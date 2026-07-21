import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, db, getUserAssessmentHistory, AssessmentRecord } from '@/lib/firebase';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  const fetchHistory = async () => {
    try {
      const activeId = await AsyncStorage.getItem('@active_assessment_id');
      setActiveAssessmentId(activeId);

      const currentUser = auth.currentUser;
      if (currentUser) {
        const records = await getUserAssessmentHistory(currentUser.uid);
        setHistory(records);
      } else {
        // Fallback to current local recommendation if offline/unauthenticated
        const localRec = await AsyncStorage.getItem('@career_recommendation');
        const localState = await AsyncStorage.getItem('@onboarding_state');
        if (localRec) {
          const parsedRec = JSON.parse(localRec);
          const parsedState = localState ? JSON.parse(localState) : {};
          setHistory([{
            id: parsedRec.assessmentId || 'local-1',
            userId: 'local',
            userEmail: 'Local User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            onboardingState: parsedState,
            recommendation: parsedRec,
            isActive: true,
          }]);
        }
      }
    } catch (err) {
      console.warn('Error loading assessment history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleSetActive = async (record: AssessmentRecord) => {
    try {
      if (!record.recommendation) return;

      const recToSave = {
        ...record.recommendation,
        assessmentId: record.id
      };

      await AsyncStorage.setItem('@career_recommendation', JSON.stringify(recToSave));
      if (record.onboardingState?.skills) {
        await AsyncStorage.setItem('@user_skills', JSON.stringify(record.onboardingState.skills));
      }
      if (record.onboardingState?.personality) {
        await AsyncStorage.setItem('@user_personality', JSON.stringify(record.onboardingState.personality));
      }
      if (record.onboardingState) {
        await AsyncStorage.setItem('@onboarding_state', JSON.stringify(record.onboardingState));
      }
      await AsyncStorage.setItem('@active_assessment_id', record.id);
      setActiveAssessmentId(record.id);

      // Also sync active preference to Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid), {
          recommendation: recToSave,
          activeAssessmentId: record.id,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn('Failed to update active assessment in Firestore:', err));
      }

      Alert.alert(
        'Active Path Updated',
        `"${record.recommendation.career?.title || 'Selected Career'}" is now set as your active career recommendation on the dashboard!`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(tabs)')
          },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
    } catch (err) {
      console.error('Failed to set active assessment:', err);
      Alert.alert('Error', 'Failed to set selected assessment as active.');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : colors.gray}
        />
      );
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Assessment History</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>
            Review past AI career recommendations & inputs
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/onboarding')}
          style={[styles.retakeIconButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.gray }]}>Fetching assessment history...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
        >
          {/* Top Banner */}
          <View style={[styles.topBanner, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: colors.tint + '40' }]}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="sparkles" size={24} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Continuous AI Learning</Text>
              <Text style={[styles.bannerDesc, { color: colors.gray }]}>
                Every assessment run and rating is saved to Firebase to help Gemini learn your career preferences and evolve recommendations over time.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Past Sessions ({history.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/onboarding')}>
              <Text style={[styles.retakeLink, { color: colors.tint }]}>+ Retake Assessment</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Ionicons name="time-outline" size={48} color={colors.gray} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assessment History Found</Text>
              <Text style={[styles.emptyDesc, { color: colors.gray }]}>
                You haven't completed any career assessments yet. Take your first assessment to unlock personalized recommendations!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/onboarding')}
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              >
                <Text style={styles.primaryButtonText}>Start Career Assessment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            history.map((record, index) => {
              const isActive = activeAssessmentId ? record.id === activeAssessmentId : index === 0;
              const dateFormatted = record.createdAt
                ? new Date(record.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Session ' + (index + 1);

              const careerTitle = record.recommendation?.career?.title || 'Career Recommendation';
              const matchScore = record.recommendation?.career?.match || 85;
              const eduLevel = record.onboardingState?.educationLevel || 'General';
              const goal = record.onboardingState?.careerGoal || 'Career Growth';

              return (
                <View
                  key={record.id || index.toString()}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isActive ? colors.tint : isDark ? '#334155' : '#E2E8F0',
                      borderWidth: isActive ? 2 : 1
                    }
                  ]}
                >
                  {/* Card Top Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.dateBox}>
                      <Ionicons name="calendar-outline" size={14} color={colors.gray} />
                      <Text style={[styles.dateText, { color: colors.gray }]}>{dateFormatted}</Text>
                    </View>

                    {isActive ? (
                      <View style={[styles.activeBadge, { backgroundColor: colors.tint + '20' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.tint} />
                        <Text style={[styles.activeBadgeText, { color: colors.tint }]}>Active Path</Text>
                      </View>
                    ) : (
                      <View style={[styles.matchBadge, { backgroundColor: '#10B98120' }]}>
                        <Text style={styles.matchBadgeText}>{matchScore}% Match</Text>
                      </View>
                    )}
                  </View>

                  {/* Career Title & Salary */}
                  <Text style={[styles.careerTitle, { color: colors.text }]}>{careerTitle}</Text>
                  {record.recommendation?.career?.salary ? (
                    <Text style={[styles.salaryText, { color: colors.gray }]}>
                      💰 {record.recommendation.career.salary}
                    </Text>
                  ) : null}

                  {/* Description Snippet */}
                  {record.recommendation?.career?.description ? (
                    <Text
                      style={[styles.cardDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}
                      numberOfLines={2}
                    >
                      {record.recommendation.career.description}
                    </Text>
                  ) : null}

                  {/* Context Pills */}
                  <View style={styles.pillsRow}>
                    <View style={[styles.pill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                      <Text style={[styles.pillText, { color: colors.text }]}>🎓 {eduLevel}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                      <Text style={[styles.pillText, { color: colors.text }]}>🎯 {goal}</Text>
                    </View>
                  </View>

                  {/* Feedback Summary (if provided) */}
                  {record.feedback ? (
                    <View style={[styles.feedbackBox, { backgroundColor: isDark ? '#0F172A' : '#FFFBEB', borderColor: '#F59E0B40' }]}>
                      <View style={styles.feedbackHeader}>
                        <Text style={[styles.feedbackLabel, { color: isDark ? '#FCD34D' : '#D97706' }]}>
                          User Rating:
                        </Text>
                        {renderStars(record.feedback.rating)}
                      </View>
                      {record.feedback.comment ? (
                        <Text style={[styles.feedbackComment, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                          "{record.feedback.comment}"
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedRecord(record)}
                      style={[styles.secondaryButton, { borderColor: colors.gray + '40' }]}
                    >
                      <Ionicons name="eye-outline" size={16} color={colors.text} />
                      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>View Details</Text>
                    </TouchableOpacity>

                    {!isActive ? (
                      <TouchableOpacity
                        onPress={() => handleSetActive(record)}
                        style={[styles.activeActionButton, { backgroundColor: colors.tint }]}
                      >
                        <Ionicons name="radio-button-on" size={16} color="#FFFFFF" />
                        <Text style={styles.activeActionButtonText}>Set Active</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.activeIndicatorBox}>
                        <Text style={[styles.currentActiveText, { color: colors.tint }]}>✓ Current Choice</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Detail Modal ── */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setSelectedRecord(null)}
              style={[styles.backButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Assessment Details</Text>
              <Text style={[styles.subtitle, { color: colors.gray }]}>
                {selectedRecord?.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString() : 'Session details'}
              </Text>
            </View>
          </View>

          {selectedRecord && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <Text style={[styles.modalSectionHeader, { color: colors.tint }]}>Recommended Career</Text>
                <Text style={[styles.modalCareerTitle, { color: colors.text }]}>
                  {selectedRecord.recommendation?.career?.title}
                </Text>
                <Text style={[styles.salaryText, { color: colors.gray }]}>
                  Match Score: {selectedRecord.recommendation?.career?.match}% | {selectedRecord.recommendation?.career?.salary}
                </Text>
                <Text style={[styles.cardDescription, { color: colors.text, marginTop: 8 }]}>
                  {selectedRecord.recommendation?.career?.description}
                </Text>
              </View>

              {/* Onboarding State Inputs */}
              <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <Text style={[styles.modalSectionHeader, { color: colors.tint }]}>Assessment Questionnaire Inputs</Text>

                <View style={styles.inputItemRow}>
                  <Text style={[styles.inputLabel, { color: colors.gray }]}>Education Level:</Text>
                  <Text style={[styles.inputValue, { color: colors.text }]}>
                    {selectedRecord.onboardingState?.educationLevel || 'N/A'}
                  </Text>
                </View>

                <View style={styles.inputItemRow}>
                  <Text style={[styles.inputLabel, { color: colors.gray }]}>Academic Field:</Text>
                  <Text style={[styles.inputValue, { color: colors.text }]}>
                    {selectedRecord.onboardingState?.academicBackground || 'N/A'}
                  </Text>
                </View>

                <View style={styles.inputItemRow}>
                  <Text style={[styles.inputLabel, { color: colors.gray }]}>Primary Goal:</Text>
                  <Text style={[styles.inputValue, { color: colors.text }]}>
                    {selectedRecord.onboardingState?.careerGoal || 'N/A'}
                  </Text>
                </View>

                {selectedRecord.onboardingState?.interests?.length ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.inputLabel, { color: colors.gray, marginBottom: 4 }]}>Selected Interests:</Text>
                    <View style={styles.pillsRow}>
                      {selectedRecord.onboardingState.interests.map((int: string, i: number) => (
                        <View key={i} style={[styles.pill, { backgroundColor: colors.tint + '15' }]}>
                          <Text style={[styles.pillText, { color: colors.tint }]}>{int}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {selectedRecord.onboardingState?.aboutMe ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.inputLabel, { color: colors.gray }]}>About Me Reflection:</Text>
                    <Text style={[styles.inputValue, { color: colors.text, marginTop: 2 }]}>
                      "{selectedRecord.onboardingState.aboutMe}"
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action */}
              <TouchableOpacity
                onPress={() => {
                  const recordToSet = selectedRecord;
                  setSelectedRecord(null);
                  handleSetActive(recordToSet);
                }}
                style={[styles.primaryButton, { backgroundColor: colors.tint, marginTop: 12 }]}
              >
                <Text style={styles.primaryButtonText}>Set as Active Career Recommendation</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  retakeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F615',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  retakeLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 20,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  careerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackComment: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#33415530',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  activeActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeIndicatorBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentActiveText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalCareerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  inputItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
