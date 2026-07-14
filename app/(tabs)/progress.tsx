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
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // Horizontal margin padding

interface Skill {
  name: string;
  importance: 'high' | 'medium' | 'low';
  description: string;
}

interface Career {
  title: string;
  salary: string;
  match: number;
  description: string;
  tags: string[];
  requiredSkills: Skill[];
}

const RIASEC_CATEGORIES = [
  { key: 'technical', code: 'R', name: 'Realistic (R)', desc: 'Practical, hands-on, building physical things or systems.', icon: 'construct-outline' },
  { key: 'investigative', code: 'I', name: 'Investigative (I)', desc: 'Analytical, intellectual, research and problem-solving oriented.', icon: 'flask-outline' },
  { key: 'creative', code: 'A', name: 'Artistic (A)', desc: 'Creative, expressive, aesthetic appreciation and visual/written design.', icon: 'color-palette-outline' },
  { key: 'social', code: 'S', name: 'Social (S)', desc: 'Helping, teaching, collaborating, and communicating with others.', icon: 'people-outline' },
  { key: 'structured', code: 'C', name: 'Conventional (C)', desc: 'Organized, systematic, detail-oriented data and clerical systems.', icon: 'folder-open-outline' }
];

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [career, setCareer] = useState<Career | null>(null);
  const [userSkills, setUserSkills] = useState<Record<string, string>>({});
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [personality, setPersonality] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadProgressData = async () => {
    try {
      const storedRec = await AsyncStorage.getItem('@career_recommendation');
      const storedSkills = await AsyncStorage.getItem('@user_skills');
      const storedProgress = await AsyncStorage.getItem('@user_progress');
      const storedPersonality = await AsyncStorage.getItem('@user_personality');

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

      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (parsed.completedCourses) {
          setCompletedCourses(parsed.completedCourses);
        }
      }

      if (storedPersonality) {
        setPersonality(JSON.parse(storedPersonality));
      } else {
        setPersonality({
          technical: 4,
          creative: 3,
          social: 5,
          structured: 2,
          investigative: 4
        });
      }
    } catch (err) {
      console.error('Failed to load progress state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressData();
  }, []);

  // Reload progress when screen is focused or refreshed
  useEffect(() => {
    const timer = setInterval(() => {
      loadProgressData();
    }, 2000); // Poll storage every 2 seconds for smooth syncing between tabs
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading stats...</Text>
      </SafeAreaView>
    );
  }

  if (!career) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/images/empty_profile.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assessment Profile</Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            You haven't completed the onboarding assessment yet. Start onboarding to generate your profile, custom chart, and studies metrics.
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

  // Calculate dynamic stats
  const required = career.requiredSkills || [];
  const missingSkills = required.filter(reqSkill => {
    const userRating = userSkills[reqSkill.name] || 'Beginner';
    return userRating === 'Beginner';
  });
  const missingCount = missingSkills.length;
  const totalRequiredCount = required.length || 1;
  const matchingCount = totalRequiredCount - missingCount;
  const readinessScore = Math.min(100, Math.round((matchingCount / totalRequiredCount) * 100) + completedCourses.length * 5);

  const completedCount = completedCourses.length;
  const studyHours = completedCount * 5; // 5 hours per course completed

  // Rating color map for chart
  const getRatingColor = (rating: string) => {
    if (rating === 'Advanced') return colors.success;
    if (rating === 'Intermediate') return colors.primary;
    return colors.error;
  };

  const getRatingPercent = (rating: string) => {
    if (rating === 'Advanced') return 1.0;
    if (rating === 'Intermediate') return 0.65;
    return 0.3; // Beginner
  };

  const getDominantCategory = () => {
    let highestKey = 'technical';
    let highestScore = 0;
    for (const cat of RIASEC_CATEGORIES) {
      const score = personality[cat.key] || 0;
      if (score > highestScore) {
        highestScore = score;
        highestKey = cat.key;
      }
    }
    return RIASEC_CATEGORIES.find(c => c.key === highestKey) || RIASEC_CATEGORIES[0];
  };

  const dominant = getDominantCategory();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.gray }]}>YOUR STATS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Progress Analytics</Text>
        </View>

        {/* Weekly Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Feather name="book-open" size={22} color={colors.primary} style={styles.statsIcon} />
            <Text style={[styles.statsValue, { color: colors.text }]}>{completedCount}</Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>Courses Done</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Feather name="clock" size={22} color={colors.primary} style={styles.statsIcon} />
            <Text style={[styles.statsValue, { color: colors.text }]}>{studyHours}h</Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>Study Time</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Feather name="award" size={22} color={colors.primary} style={styles.statsIcon} />
            <Text style={[styles.statsValue, { color: colors.text }]}>{readinessScore}%</Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>Readiness</Text>
          </View>
        </View>

        {/* Skill Growth Graph Section */}
        <View style={[styles.chartSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skill Growth Graph</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
            Current rating distributions relative to advanced milestones
          </Text>

          {/* SVG Skill Bar Chart */}
          <View style={styles.chartContainer}>
            {required.map((skill, index) => {
              const rating = userSkills[skill.name] || 'Beginner';
              const fillPercent = getRatingPercent(rating);
              const barColor = getRatingColor(rating);

              return (
                <View key={index} style={styles.chartRow}>
                  <View style={styles.chartLabelRow}>
                    <Text style={[styles.chartSkillName, { color: colors.text }]} numberOfLines={1}>
                      {skill.name}
                    </Text>
                    <Text style={[styles.chartSkillRating, { color: barColor }]}>
                      {rating}
                    </Text>
                  </View>
                  <View style={styles.barSvgContainer}>
                    <Svg width={CHART_WIDTH} height={12}>
                      <Rect
                        x="0"
                        y="0"
                        width={CHART_WIDTH}
                        height="12"
                        rx="6"
                        ry="6"
                        fill={isDark ? '#2D2D4E' : '#DDDDF5'}
                      />
                      <Rect
                        x="0"
                        y="0"
                        width={CHART_WIDTH * fillPercent}
                        height="12"
                        rx="6"
                        ry="6"
                        fill={barColor}
                      />
                    </Svg>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* RIASEC Personality Profile Widget */}
        <View style={[styles.personalitySection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>RIASEC Personality Profile</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
            Your psychological orientation based on the RIASEC Holland Codes
          </Text>

          <View style={styles.dominantBanner}>
            <Ionicons name={dominant.icon as any} size={26} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.dominantTitle, { color: colors.text }]}>Dominant Trait: {dominant.name}</Text>
              <Text style={[styles.dominantDesc, { color: colors.gray }]}>{dominant.desc}</Text>
            </View>
          </View>

          <View style={styles.riasecBarsList}>
            {RIASEC_CATEGORIES.map((cat, idx) => {
              const score = personality[cat.key] || 1;
              const percent = score / 5;
              return (
                <View key={idx} style={styles.riasecRow}>
                  <View style={styles.riasecLabelRow}>
                    <Text style={[styles.riasecName, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.riasecScore, { color: colors.primary }]}>{score}/5</Text>
                  </View>
                  <View style={[styles.riasecBarTrack, { backgroundColor: isDark ? '#2D2D4E' : '#DDDDF5' }]}>
                    <View style={[styles.riasecBarFill, { width: `${percent * 100}%`, backgroundColor: colors.primary }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Career Profile Details */}
        <View style={[styles.profileSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Career Profile</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
            Current alignment details for your focus field
          </Text>

          <View style={styles.profileHeaderRow}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoMarkImage}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.profileTargetLabel, { color: colors.gray }]}>TARGET ROLE</Text>
              <Text 
                style={[styles.profileTargetTitle, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {career.title}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>Estimated Salary:</Text>
            <Text 
              style={[styles.summaryValue, { color: colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {career.salary}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>Primary Fit Status:</Text>
            <Text style={[styles.summaryValue, { color: readinessScore >= 80 ? colors.success : readinessScore >= 50 ? '#F59E0B' : colors.error }]}>
              {readinessScore >= 80 ? 'Market Ready' : readinessScore >= 50 ? 'Developing' : 'Foundational'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/onboarding')}
            style={[styles.retakeBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}
          >
            <Text style={[styles.retakeText, { color: colors.primary }]}>Reset & Retake Assessment ↺</Text>
          </TouchableOpacity>
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
    marginBottom: 24
  },
  subtitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800' },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 6
  },
  statsIcon: { fontSize: 24 },
  statsValue: { fontSize: 20, fontWeight: '800' },
  statsLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  chartSection: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 20, lineHeight: 18 },
  chartContainer: {
    paddingVertical: 4
  },
  chartRow: {
    marginBottom: 16
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chartSkillName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8
  },
  chartSkillRating: {
    fontSize: 12,
    fontWeight: '800'
  },
  barSvgContainer: {
    height: 12,
    width: '100%'
  },

  profileSection: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    gap: 16
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  logoMarkImage: {
    width: 48,
    height: 48,
    borderRadius: 12
  },
  profileTargetLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  profileTargetTitle: { fontSize: 18, fontWeight: '800' },
  divider: {
    height: 1.5,
    width: '100%'
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '800' },

  retakeBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  retakeText: { fontSize: 14, fontWeight: '700' },
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
  },

  // RIASEC Widget styles
  personalitySection: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24
  },
  dominantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16
  },
  dominantTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  dominantDesc: {
    fontSize: 12,
    lineHeight: 18
  },
  riasecBarsList: {
    gap: 14
  },
  riasecRow: {
    gap: 6
  },
  riasecLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  riasecName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8
  },
  riasecScore: {
    fontSize: 12,
    fontWeight: '800'
  },
  riasecBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  riasecBarFill: {
    height: '100%',
    borderRadius: 4
  }
});
