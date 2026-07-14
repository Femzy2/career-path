import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

interface Skill {
  name: string;
  importance: 'high' | 'medium' | 'low';
  description: string;
}

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  focusSkills: string[];
}

interface Career {
  title: string;
  salary: string;
  match: number;
  description: string;
  tags: string[];
  requiredSkills: Skill[];
  roadmap: RoadmapStep[];
}

export default function RoadmapScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const [career, setCareer] = useState<Career | null>(null);
  const [userSkills, setUserSkills] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRec = await AsyncStorage.getItem('@career_recommendation');
        const storedSkills = await AsyncStorage.getItem('@user_skills');

        if (storedRec) {
          const parsed = JSON.parse(storedRec);
          if (parsed.career) {
            setCareer(parsed.career);
          }
        }

        if (storedSkills) {
          setUserSkills(JSON.parse(storedSkills));
        } else {
          setUserSkills({
            'Programming': 'Intermediate',
            'Communication': 'Advanced',
            'Mathematics': 'Beginner',
            'Creativity': 'Advanced',
            'Leadership': 'Intermediate',
            'Analytical Thinking': 'Intermediate',
            'Problem Solving': 'Intermediate'
          });
        }
      } catch (err) {
        console.error('Failed to load roadmap data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading Roadmap...</Text>
      </SafeAreaView>
    );
  }

  if (!career) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.subtitle, { color: colors.gray }]}>BRIDGE THE GAP</Text>
            <Text style={[styles.title, { color: colors.text }]}>Learning Roadmap</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <Text style={[styles.closeText, { color: colors.primary }]}>Close ✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/images/empty_profile.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recommendation Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            You haven't completed the onboarding questionnaire yet. Complete it to let our AI build your custom learning roadmap.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/onboarding')}
            style={[styles.onboardBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.onboardBtnText}>Start Onboarding →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate score
  const required = career.requiredSkills || [];
  const missingSkills = required.filter(reqSkill => {
    const userRating = userSkills[reqSkill.name] || 'Beginner';
    return userRating === 'Beginner';
  });
  const missingCount = missingSkills.length;
  const totalRequiredCount = required.length || 1;
  const matchingCount = totalRequiredCount - missingCount;
  const readinessScore = Math.round((matchingCount / totalRequiredCount) * 100);

  // Score status details
  let scoreColor = colors.success;
  let readinessText = 'You are ready to begin applying for junior roles! Click below to see targeted recommendations.';
  if (readinessScore < 50) {
    scoreColor = colors.error;
    readinessText = 'Significant upskilling is recommended. Focus on the foundational steps below to bridge your skill gap.';
  } else if (readinessScore < 80) {
    scoreColor = '#F59E0B';
    readinessText = 'Almost there! Bridging a few key skills will make you highly competitive in the market.';
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.subtitle, { color: colors.gray }]}>BRIDGE THE GAP</Text>
          <Text style={[styles.title, { color: colors.text }]}>Learning Roadmap</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          <Text style={[styles.closeText, { color: colors.primary }]}>Close ✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Career Readiness Score */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardLabel, { color: colors.gray }]}>CAREER READINESS</Text>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>{readinessScore}%</Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: scoreColor, width: `${readinessScore}%` }]} />
          </View>
          <Text style={[styles.cardComment, { color: colors.text }]}>{readinessText}</Text>
        </View>

        {/* Skill Gap Analysis Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills Breakdown</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
            Compare your self-assessed profiles with the career requirements
          </Text>
          <View style={styles.skillsContainer}>
            {required.map((skill, index) => {
              const rating = userSkills[skill.name] || 'Beginner';
              const isMatch = rating !== 'Beginner';
              return (
                <View
                  key={index}
                  style={[
                    styles.skillRowCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: isMatch ? colors.success + '20' : colors.border
                    }
                  ]}
                >
                  <View style={styles.skillRowHeader}>
                    <Text style={[styles.skillNameText, { color: colors.text }]}>{skill.name}</Text>
                    <View style={styles.skillBadgesRow}>
                      <View
                        style={[
                          styles.importanceBadge,
                          { backgroundColor: colors.backgroundSecondary }
                        ]}
                      >
                        <Text style={[styles.importanceText, { color: colors.gray }]}>
                          {skill.importance}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.matchBadge,
                          {
                            backgroundColor: isMatch ? '#10B98120' : '#EF444420',
                            borderColor: isMatch ? '#10B981' : '#EF4444',
                            borderWidth: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 2
                          }
                        ]}
                      >
                        <Feather name={isMatch ? "check-circle" : "alert-circle"} size={11} color={isMatch ? '#10B981' : '#EF4444'} />
                        <Text style={[styles.matchBadgeText, { color: isMatch ? '#10B981' : '#EF4444' }]}>
                          {isMatch ? `Match (${rating})` : 'Gap'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.skillDescText, { color: colors.gray }]}>
                    {skill.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Learning Roadmap Steps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Step-by-Step Timeline</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
            Your sequential milestones, focus skills, and recommended pacing
          </Text>

          <View style={styles.timelineContainer}>
            {career.roadmap?.map((step, index) => {
              const stepsCount = career.roadmap.length;
              const isLast = index === stepsCount - 1;
              return (
                <View key={index} style={styles.timelineRow}>
                  <View style={styles.timelineIndicators}>
                    <View style={[styles.stepNumberDot, { backgroundColor: colors.primary }]}>
                      <Text style={styles.stepNumberDotText}>{step.step}</Text>
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                  </View>

                  <View style={[styles.stepCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={styles.stepCardHeader}>
                      <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                      <View style={[styles.durationBadge, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.durationText, { color: colors.primary }]}>{step.estimatedTime}</Text>
                      </View>
                    </View>
                    <Text style={[styles.stepDescription, { color: colors.gray }]}>
                      {step.description}
                    </Text>

                    <View style={styles.skillsTagRow}>
                      <Text style={[styles.skillsTagLabel, { color: colors.gray }]}>Focus:</Text>
                      {step.focusSkills.map((focusSkill, fIdx) => (
                        <View
                          key={fIdx}
                          style={[
                            styles.skillsTagChip,
                            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: 1 }
                          ]}
                        >
                          <Text style={[styles.skillsTagChipText, { color: colors.text }]}>
                            {focusSkill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  subtitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  closeText: { fontSize: 13, fontWeight: '700' },

  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 28,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  cardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  scoreNumber: { fontSize: 28, fontWeight: '900' },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 16
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5
  },
  cardComment: { fontSize: 14, lineHeight: 20, fontWeight: '500' },

  section: {
    marginBottom: 32
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16, lineHeight: 18 },

  skillsContainer: {
    gap: 12
  },
  skillRowCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10
  },
  skillRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  skillNameText: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  skillBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  importanceText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  matchBadgeText: { fontSize: 11, fontWeight: '800' },
  skillDescText: { fontSize: 13, lineHeight: 18 },

  // Timeline
  timelineContainer: {
    marginTop: 10
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineIndicators: {
    alignItems: 'center',
    width: 28
  },
  stepNumberDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  stepNumberDotText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
  },
  timelineLine: {
    flex: 1,
    width: 3,
    marginVertical: 4,
    borderRadius: 1.5
  },
  stepCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    gap: 12
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  stepTitle: { fontSize: 16, fontWeight: '800', flex: 1, lineHeight: 22 },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: { fontSize: 11, fontWeight: '700' },
  stepDescription: { fontSize: 13, lineHeight: 18 },
  skillsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  skillsTagLabel: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  skillsTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  skillsTagChipText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12
  },
  onboardBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 8
  },
  onboardBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
