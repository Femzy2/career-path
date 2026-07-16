import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons, Feather } from '@expo/vector-icons';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const RECOMMENDED_CAREER = {
  title: 'Full Stack AI Developer',
  salary: '₦8,000,000 - ₦15,000,000',
  match: 98,
  description: 'You have a perfect blend of technical interest and creative problem solving. Based on your skill level in programming and your goal for high impact, this path offers the best growth.',
  tags: ['High Growth', 'Remote Friendly', 'AI-Driven'],
  requiredSkills: [
    { name: 'Programming', importance: 'high', description: 'Write clean, scalable code in Python, JavaScript, or TypeScript.' },
    { name: 'Analytical Thinking', importance: 'high', description: 'Analyze complex problems and break them down into modular parts.' },
    { name: 'Problem Solving', importance: 'high', description: 'Develop novel solutions for AI integration and data pipelines.' },
    { name: 'Mathematics', importance: 'medium', description: 'Understanding of linear algebra, calculus, and statistical methods.' },
  ],
  roadmap: [
    { step: 1, title: 'Foundations of Modern Dev', description: 'Master TypeScript, Next.js, and React architecture.', estimatedTime: '1-2 months', focusSkills: ['Programming', 'Problem Solving'] },
    { step: 2, title: 'AI Integration & Prompt Eng', description: 'Learn to use Gemini APIs, model calling, and structured outputs.', estimatedTime: '1 month', focusSkills: ['Programming', 'Analytical Thinking'] },
    { step: 3, title: 'System Deployment & Scale', description: 'Deploy serverless backends and integrate database persistence.', estimatedTime: '2 months', focusSkills: ['Analytical Thinking', 'Problem Solving'] }
  ]
};

const RECOMMENDED_COURSES = [
  {
    title: 'Modern React & Next.js',
    provider: 'Udemy',
    duration: '40 hours',
    price: '₦20,000',
    icon: 'code',
    color: '#61DAFB',
    url: 'https://www.udemy.com'
  },
  {
    title: 'AI Fundamentals for Devs',
    provider: 'Coursera',
    duration: '12 weeks',
    price: 'Free',
    icon: 'book-open',
    color: '#0056D2',
    url: 'https://www.coursera.org'
  },
  {
    title: 'Full Stack SaaS Boilerplate',
    provider: 'BuildWithAI',
    duration: '15 hours',
    price: '₦75,000',
    icon: 'play-circle',
    color: '#8B5CF6',
    url: 'https://www.youtube.com'
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsDashboard() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth');
    } catch (err) {
      console.error('Failed to log out:', err);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  const [career, setCareer] = useState(RECOMMENDED_CAREER);
  const [courses, setCourses] = useState(RECOMMENDED_COURSES);
  const [userSkills, setUserSkills] = useState<Record<string, string>>({});
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const handleOpenCourse = async (url?: string) => {
    if (url) {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch (err) {
        console.error('Failed to open link:', err);
      }
    }
  };

  useEffect(() => {
    const loadRecommendation = async () => {
      try {
        const stored = await AsyncStorage.getItem('@career_recommendation');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.career && parsed.courses) {
            setCareer(parsed.career);
            setCourses(parsed.courses);
          }
        }
        const storedSkills = await AsyncStorage.getItem('@user_skills');
        if (storedSkills) {
          setUserSkills(JSON.parse(storedSkills));
        } else {
          // Default mock user skills
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
        const storedProgress = await AsyncStorage.getItem('@user_progress');
        if (storedProgress) {
          const parsed = JSON.parse(storedProgress);
          if (parsed.completedCourses) {
            setCompletedCourses(parsed.completedCourses);
          }
        }
        const storedFeedback = await AsyncStorage.getItem('@recommendation_feedback');
        if (storedFeedback) {
          setFeedbackSaved(true);
        }
      } catch (error) {
        console.error('Failed to load career recommendation:', error);
      }
    };

    loadRecommendation();
  }, []);

  const toggleCourseCompletion = async (courseTitle: string) => {
    try {
      const isCompleted = completedCourses.includes(courseTitle);
      let updatedList = [];
      if (isCompleted) {
        updatedList = completedCourses.filter(title => title !== courseTitle);
      } else {
        updatedList = [...completedCourses, courseTitle];
      }
      setCompletedCourses(updatedList);

      const progressData = {
        completedCourses: updatedList,
        studyHoursThisWeek: updatedList.length * 5,
        lastActiveDate: new Date().toISOString().split('T')[0]
      };
      await AsyncStorage.setItem('@user_progress', JSON.stringify(progressData));

      // Sync progress to Firebase Firestore (non-blocking)
      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid), {
          progress: progressData
        }, { merge: true }).catch(firestoreErr => {
          console.warn('Failed to sync course progress to Firestore:', firestoreErr);
        });
      }
    } catch (err) {
      console.error('Failed to save course completion:', err);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0) {
      Alert.alert('Evaluation Rating', 'Please select a star rating to evaluate the recommendation.');
      return;
    }
    try {
      const evaluation = {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        date: new Date().toISOString(),
        careerTitle: career.title
      };
      await AsyncStorage.setItem('@recommendation_feedback', JSON.stringify(evaluation));
      
      // Sync feedback to Firebase Firestore (non-blocking)
      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(doc(db, 'feedback', currentUser.uid), {
          ...evaluation,
          userId: currentUser.uid,
          userEmail: currentUser.email || 'Anonymous',
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(firestoreErr => {
          console.warn('Failed to sync feedback to Firestore:', firestoreErr);
        });
      }

      setFeedbackSaved(true);
      Alert.alert('Evaluation Saved', 'Thank you! Your feedback helps us evaluate and improve the system.');
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  const required = career.requiredSkills || [];
  const missingSkills = required.filter(reqSkill => {
    const userRating = userSkills[reqSkill.name] || 'Beginner';
    return userRating === 'Beginner';
  });
  const missingCount = missingSkills.length;
  const totalRequiredCount = required.length || 1;
  const matchingCount = totalRequiredCount - missingCount;
  const readinessScore = Math.min(100, Math.round((matchingCount / totalRequiredCount) * 100) + completedCourses.length * 5);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.gray }]}>Your Path is Ready</Text>
            <Text style={[styles.title, { color: colors.text }]}>Recommended Career</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.replace('/onboarding')}
              style={[styles.retakeBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            >
              <Text style={[styles.retakeText, { color: colors.primary }]}>Retake ↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.logoutBtn, { backgroundColor: colors.cardBackground, borderColor: '#EF4444' }]}
            >
              <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout ⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Career Card */}
        <View style={[styles.careerCard, {
          backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(124,58,237,0.05)',
          borderColor: colors.primary
        }]}>
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{career.match}% Fit</Text>
          </View>

          <Text 
            style={[styles.careerTitle, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {career.title}
          </Text>

          <View style={styles.salaryRow}>
            <Text style={[styles.salaryLabel, { color: colors.gray }]}>Potential:</Text>
            <Text 
              style={[styles.salaryValue, { color: colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {career.salary}
            </Text>
          </View>

          <Text style={[styles.careerDesc, { color: colors.text }]}>
            {career.description}
          </Text>

          <View style={styles.tagRow}>
            {career.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.tagText, { color: colors.gray }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Courses Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aligned Courses</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              {showAll ? 'Show less' : 'See all'}
            </Text>
          </TouchableOpacity>
        </View>

        {(showAll ? courses : courses.slice(0, 3)).map((course, idx) => {
          const isCompleted = completedCourses.includes(course.title);
          return (
            <View
              key={idx}
              style={[styles.courseCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            >
              <TouchableOpacity
                onPress={() => toggleCourseCompletion(course.title)}
                activeOpacity={0.7}
                style={styles.courseCheckBtn}
              >
                <Ionicons 
                  name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={isCompleted ? "#10B981" : colors.grayLight} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenCourse(course.url)}
                style={styles.courseInfoContainer}
              >
                <View style={[styles.courseIcon, { backgroundColor: course.color + '20' }]}>
                  <Feather name={course.icon as any} size={20} color={course.color} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={[styles.courseProvider, { color: colors.gray }]} numberOfLines={1}>
                    {course.provider} • {course.duration}
                  </Text>
                </View>
                <View style={styles.coursePrice}>
                  <Text 
                    style={[styles.priceText, { color: course.price.toLowerCase().includes('free') ? '#10B981' : colors.text }]}
                    numberOfLines={1}
                  >
                    {course.price}
                  </Text>
                  <Text style={[styles.priceAction, { color: colors.primary }]}>Enroll →</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Skill Gap Analysis */}
        <TouchableOpacity 
          onPress={() => router.push('/roadmap')}
          style={[styles.skillGapCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <View style={styles.skillGapHeaderRow}>
            <Text style={[styles.skillGapTitle, { color: '#FFF' }]}>Skill Gap Analysis</Text>
            <View style={[styles.readinessBadge, { borderColor: '#FFF', borderWidth: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={[styles.readinessBadgeText, { color: '#FFF' }]}>{readinessScore}% Ready</Text>
            </View>
          </View>
          <Text style={[styles.skillGapText, { color: 'rgba(255, 255, 255, 0.85)' }]}>
            {missingCount > 0 
              ? `You are missing or weak in ${missingCount} key skill${missingCount > 1 ? 's' : ''} (${missingSkills.map(s => s.name).join(', ')}) for this path. Let's build your learning roadmap.` 
              : 'You have all the fundamental skills required for this career path! View your learning roadmap to begin scaling up.'}
          </Text>
          <View style={styles.skillGapBtn}>
            <Text style={[styles.skillGapBtnText, { color: colors.primary }]}>View Learning Roadmap →</Text>
          </View>
        </TouchableOpacity>

        {/* Recommendation Evaluation (Objective 5) */}
        <View style={[styles.feedbackCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.feedbackTitle, { color: colors.text }]}>Rate This Recommendation</Text>
          <Text style={[styles.feedbackSubtitle, { color: colors.gray }]}>
            Help evaluate the system's effectiveness and recommendation accuracy.
          </Text>

          {feedbackSaved ? (
            <View style={styles.feedbackSuccessRow}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <Text style={[styles.feedbackSuccessText, { color: colors.text }]}>
                Feedback recorded! Thank you for evaluating our system.
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackForm}>
              {/* Star Rating Row */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFeedbackRating(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Ionicons 
                      name={star <= feedbackRating ? "star" : "star-outline"} 
                      size={28} 
                      color={star <= feedbackRating ? "#F59E0B" : colors.grayLight} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment text area */}
              <TextInput
                style={[styles.feedbackInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Write your comments or suggestions..."
                placeholderTextColor={colors.grayLight}
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                onPress={handleFeedbackSubmit}
                style={[styles.feedbackSubmitBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.feedbackSubmitBtnText}>Submit Evaluation →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  logoutText: { fontSize: 12, fontWeight: '700' },

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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10
  },
  courseCheckBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  courseProvider: { fontSize: 11, fontWeight: '500' },
  coursePrice: { alignItems: 'flex-end', gap: 2 },
  priceText: { fontSize: 13, fontWeight: '800' },
  priceAction: { fontSize: 10, fontWeight: '700' },

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
  skillGapBtnText: { fontSize: 14, fontWeight: '700' },
  skillGapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  readinessBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readinessBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Feedback Styles
  feedbackCard: {
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    gap: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  feedbackSubtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  feedbackSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginTop: 6
  },
  feedbackSuccessText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18
  },
  feedbackForm: {
    marginTop: 6,
    gap: 14
  },
  starRow: {
    flexDirection: 'row',
    gap: 12
  },
  starBtn: {
    padding: 2
  },
  feedbackInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  feedbackSubmitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
