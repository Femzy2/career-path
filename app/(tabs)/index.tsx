import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const RECOMMENDED_CAREER = {
  title: 'Full Stack AI Developer',
  salary: '$120k - $180k',
  match: 98,
  description: 'You have a perfect blend of technical interest and creative problem solving. Based on your skill level in programming and your goal for high impact, this path offers the best growth.',
  tags: ['High Growth', 'Remote Friendly', 'AI-Driven'],
};

const RECOMMENDED_COURSES = [
  {
    title: 'Modern React & Next.js',
    provider: 'Udemy',
    duration: '40 hours',
    price: '$12.99',
    icon: '⚛️',
    color: '#61DAFB'
  },
  {
    title: 'AI Fundamentals for Devs',
    provider: 'Coursera',
    duration: '12 weeks',
    price: 'Free',
    icon: '🧠',
    color: '#0056D2'
  },
  {
    title: 'Full Stack SaaS Boilerplate',
    provider: 'BuildWithAI',
    duration: '15 hours',
    price: '$49.00',
    icon: '🚀',
    color: '#8B5CF6'
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsDashboard() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.gray }]}>Your Path is Ready</Text>
            <Text style={[styles.title, { color: colors.text }]}>Recommended Career</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace('/onboarding')}
            style={[styles.retakeBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <Text style={[styles.retakeText, { color: colors.primary }]}>Retake ↺</Text>
          </TouchableOpacity>
        </View>

        {/* Main Career Card */}
        <View style={[styles.careerCard, {
          backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(124,58,237,0.05)',
          borderColor: colors.primary
        }]}>
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{RECOMMENDED_CAREER.match}% Fit</Text>
          </View>

          <Text style={[styles.careerTitle, { color: colors.text }]}>{RECOMMENDED_CAREER.title}</Text>

          <View style={styles.salaryRow}>
            <Text style={[styles.salaryLabel, { color: colors.gray }]}>Potential:</Text>
            <Text style={[styles.salaryValue, { color: colors.primary }]}>{RECOMMENDED_CAREER.salary}</Text>
          </View>

          <Text style={[styles.careerDesc, { color: colors.text }]}>
            {RECOMMENDED_CAREER.description}
          </Text>

          <View style={styles.tagRow}>
            {RECOMMENDED_CAREER.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.tagText, { color: colors.gray }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Courses Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aligned Courses</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {RECOMMENDED_COURSES.map((course, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            style={[styles.courseCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <View style={[styles.courseIcon, { backgroundColor: course.color + '20' }]}>
              <Text style={{ fontSize: 24 }}>{course.icon}</Text>
            </View>
            <View style={styles.courseInfo}>
              <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
              <Text style={[styles.courseProvider, { color: colors.gray }]}>{course.provider} • {course.duration}</Text>
            </View>
            <View style={styles.coursePrice}>
              <Text style={[styles.priceText, { color: course.price === 'Free' ? '#10B981' : colors.text }]}>
                {course.price}
              </Text>
              <Text style={[styles.priceAction, { color: colors.primary }]}>Enroll →</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Skill Gap Analysis Placeholder */}
        <TouchableOpacity style={[styles.skillGapCard, { backgroundColor: colors.text, shadowColor: colors.primary }]}>
          <Text style={[styles.skillGapTitle, { color: colors.background }]}>Skill Gap analysis</Text>
          <Text style={[styles.skillGapText, { color: colors.background + 'CC' }]}>
            You are missing 2 key skills for this path. Let AI build your learning roadmap.
          </Text>
          <View style={styles.skillGapBtn}>
            <Text style={[styles.skillGapBtnText, { color: colors.text }]}>Generate Roadmap</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24
  },
  greeting: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  retakeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  retakeText: { fontSize: 12, fontWeight: '700' },

  careerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden'
  },
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  careerTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, paddingRight: 60 },
  salaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  salaryLabel: { fontSize: 14, fontWeight: '600' },
  salaryValue: { fontSize: 16, fontWeight: '800' },
  careerDesc: { fontSize: 15, lineHeight: 22, marginBottom: 20, opacity: 0.9 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '600' },

  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  courseProvider: { fontSize: 12, fontWeight: '500' },
  coursePrice: { alignItems: 'flex-end', gap: 4 },
  priceText: { fontSize: 14, fontWeight: '800' },
  priceAction: { fontSize: 11, fontWeight: '700' },

  skillGapCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    gap: 12,
    elevation: 8,
    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.4)'
  },
  skillGapTitle: { fontSize: 20, fontWeight: '800' },
  skillGapText: { fontSize: 14, lineHeight: 20 },
  skillGapBtn: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4
  },
  skillGapBtnText: { fontSize: 14, fontWeight: '700' }
});
