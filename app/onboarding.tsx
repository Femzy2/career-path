import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { auth, db } from '../lib/firebase';
import { getCareerRecommendation } from '../services/gemini';

interface OnboardingState {
    educationLevel: string | null;
    academicBackground: string | null;
    age?: string | null;
    country?: string | null;
    interests: string[];
    skills: Record<string, string>;
    personality: Record<string, number>;
    careerGoal: string | null;
    timeCommitment: string | null;
    budget: string | null;
    aboutMe?: string;
    excitingWork?: string;
    dreamCareer?: string;
    freeTimeActivities?: string;
    additionalInsights?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 9;

// ─── Step Data ───────────────────────────────────────────────────────────────

const EDUCATION_LEVELS = [
    { label: 'Secondary School', iconFamily: 'Ionicons', iconName: 'school' },
    { label: 'Diploma', iconFamily: 'Ionicons', iconName: 'document-text' },
    { label: 'Undergraduate', iconFamily: 'Ionicons', iconName: 'ribbon' },
    { label: 'Graduate', iconFamily: 'Ionicons', iconName: 'trophy' },
    { label: 'Self-taught', iconFamily: 'Ionicons', iconName: 'bulb' },
];

const ACADEMIC_BACKGROUNDS = [
    { label: 'Science', iconFamily: 'Ionicons', iconName: 'flask' },
    { label: 'Arts', iconFamily: 'Ionicons', iconName: 'color-palette' },
    { label: 'Engineering', iconFamily: 'Ionicons', iconName: 'construct' },
    { label: 'Business', iconFamily: 'Ionicons', iconName: 'briefcase' },
    { label: 'IT', iconFamily: 'Ionicons', iconName: 'code-working' },
    { label: 'Others', iconFamily: 'Ionicons', iconName: 'folder-open' },
];

const INTERESTS = [
    { label: 'Technology', iconFamily: 'Feather', iconName: 'cpu' },
    { label: 'Healthcare', iconFamily: 'Feather', iconName: 'activity' },
    { label: 'Business', iconFamily: 'Feather', iconName: 'trending-up' },
    { label: 'Law', iconFamily: 'Ionicons', iconName: 'scale-outline' },
    { label: 'Agriculture', iconFamily: 'Ionicons', iconName: 'leaf-outline' },
    { label: 'Engineering', iconFamily: 'Feather', iconName: 'tool' },
    { label: 'Arts', iconFamily: 'Ionicons', iconName: 'color-palette-outline' },
    { label: 'Finance', iconFamily: 'Feather', iconName: 'dollar-sign' },
    { label: 'Aviation', iconFamily: 'Ionicons', iconName: 'airplane-outline' },
    { label: 'Environmental Science', iconFamily: 'Ionicons', iconName: 'earth-outline' },
    { label: 'Hospitality', iconFamily: 'Ionicons', iconName: 'cafe-outline' },
    { label: 'Education', iconFamily: 'Feather', iconName: 'book-open' },
    { label: 'Government', iconFamily: 'Ionicons', iconName: 'business-outline' },
    { label: 'Sports', iconFamily: 'Ionicons', iconName: 'trophy-outline' },
    { label: 'Others', iconFamily: 'Ionicons', iconName: 'folder-open-outline' },
];

const SKILLS = [
    { label: 'Communication', iconFamily: 'Feather', iconName: 'message-square' },
    { label: 'Leadership', iconFamily: 'Feather', iconName: 'award' },
    { label: 'Creativity', iconFamily: 'Feather', iconName: 'feather' },
    { label: 'Analytical Thinking', iconFamily: 'Feather', iconName: 'search' },
    { label: 'Teamwork', iconFamily: 'Feather', iconName: 'users' },
    { label: 'Time Management', iconFamily: 'Feather', iconName: 'clock' },
    { label: 'Problem Solving', iconFamily: 'Feather', iconName: 'check-square' },
    { label: 'Research', iconFamily: 'Feather', iconName: 'book' },
    { label: 'Customer Service', iconFamily: 'Feather', iconName: 'smile' },
    { label: 'Mathematics', iconFamily: 'Feather', iconName: 'percent' },
    { label: 'Critical Thinking', iconFamily: 'Feather', iconName: 'help-circle' },
];

const PERSONALITY_QUESTIONS = [
    { q: 'I enjoy working with hands-on tools, hardware, or machines.', key: 'technical_1', category: 'technical' },
    { q: 'I like repairing electrical or mechanical items.', key: 'technical_2', category: 'technical' },
    { q: 'I enjoy analyzing scientific datasets and solving complex puzzles.', key: 'investigative_1', category: 'investigative' },
    { q: 'I like conducting research and understanding how things work.', key: 'investigative_2', category: 'investigative' },
    { q: 'I express myself through writing, design, music, or digital art.', key: 'creative_1', category: 'creative' },
    { q: 'I enjoy brainstorming unconventional ideas or styling visual themes.', key: 'creative_2', category: 'creative' },
    { q: 'I find fulfillment in teaching, helping, or mentoring others.', key: 'social_1', category: 'social' },
    { q: 'I enjoy team activities and collaborating in group projects.', key: 'social_2', category: 'social' },
    { q: 'I like organizing datasets, managing files, and following structured checklists.', key: 'structured_1', category: 'structured' },
    { q: 'I prefer clear schedules and systematic, detail-oriented routines.', key: 'structured_2', category: 'structured' },
];

const CAREER_GOALS = [
    { label: 'High Salary', iconFamily: 'Feather', iconName: 'dollar-sign', desc: 'Maximize earning potential' },
    { label: 'Job Security', iconFamily: 'Feather', iconName: 'shield', desc: 'Stable, long-term career' },
    { label: 'Work-Life Balance', iconFamily: 'Feather', iconName: 'heart', desc: 'Prioritize health and personal life' },
    { label: 'Entrepreneurship', iconFamily: 'Ionicons', iconName: 'rocket-outline', desc: 'Build your own business' },
    { label: 'Helping Others', iconFamily: 'Feather', iconName: 'users', desc: 'Make a positive social impact' },
    { label: 'Remote Work', iconFamily: 'Feather', iconName: 'monitor', desc: 'Work from anywhere' },
    { label: 'Travel Opportunities', iconFamily: 'Ionicons', iconName: 'globe-outline', desc: 'See the world while working' },
    { label: 'Leadership Positions', iconFamily: 'Feather', iconName: 'award', desc: 'Lead teams and shape strategy' },
];

const TIME_COMMITMENTS = [
    { label: '< 3 months', iconFamily: 'Feather', iconName: 'zap', desc: 'Quick upskill' },
    { label: '3–6 months', iconFamily: 'Feather', iconName: 'calendar', desc: 'Short course' },
    { label: '6–12 months', iconFamily: 'Feather', iconName: 'clock', desc: 'Part-time study' },
    { label: '1+ year', iconFamily: 'Feather', iconName: 'target', desc: 'Full programme' },
];

const BUDGET_PREFERENCES = [
    { label: 'Free Only', iconFamily: 'Feather', iconName: 'gift', desc: 'Open source & free resources' },
    { label: 'Low Cost', iconFamily: 'Feather', iconName: 'credit-card', desc: 'Under $50/month' },
    { label: 'No Preference', iconFamily: 'Feather', iconName: 'database', desc: 'Best quality available' },
];

// ─── Step Metadata ────────────────────────────────────────────────────────────

const STEPS = [
    { title: 'Welcome to CareerPath AI', subtitle: 'How it works & What to expect', iconFamily: 'Ionicons', iconName: 'rocket-outline' },
    { title: 'Tell us about yourself', subtitle: 'Basic educational and demographic context', iconFamily: 'Ionicons', iconName: 'school-outline' },
    { title: 'What are your interests?', subtitle: 'Select fields that trigger your curiosity', iconFamily: 'Ionicons', iconName: 'bulb-outline' },
    { title: 'Rate your transferable skills', subtitle: 'Be honest — this helps identify career compatibility', iconFamily: 'Feather', iconName: 'zap' },
    { title: 'Personality & Working Style', subtitle: 'RIASEC personality assessment', iconFamily: 'Ionicons', iconName: 'analytics-outline' },
    { title: 'Goals & Preferences', subtitle: 'Set your career targets, time availability, and budget', iconFamily: 'Feather', iconName: 'target' },
    { title: 'Open-Ended Reflections', subtitle: 'Tell us in your own words (optional)', iconFamily: 'Feather', iconName: 'edit-3' },
    { title: 'Additional Context', subtitle: 'Anything else we should know? (optional)', iconFamily: 'Feather', iconName: 'plus-circle' },
    { title: 'Ready for AI Analysis!', subtitle: 'Here is a summary of your profile', iconFamily: 'Feather', iconName: 'check-circle' },
];

const DIAGNOSTIC_LOGS = [
    'Structuring user profile vector...',
    'Evaluating RIASEC personality dimensions...',
    'Analyzing skills gap vs. job market demand...',
    'Fetching Coursera catalog courses...',
    'Interleaving Udemy and YouTube tutorials...',
    'Ranking recommendation matches...',
    'Finalizing career roadmap steps...'
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const orbScale = useRef(new Animated.Value(1)).current;

    const [currentStep, setCurrentStep] = useState(0);
    const [personalityQ, setPersonalityQ] = useState(0);
    const [logIndex, setLogIndex] = useState(0);
    const [state, setState] = useState<OnboardingState>({
        educationLevel: null,
        academicBackground: null,
        age: '',
        country: '',
        interests: [],
        skills: {},
        personality: {},
        careerGoal: null,
        timeCommitment: null,
        budget: null,
        aboutMe: '',
        excitingWork: '',
        dreamCareer: '',
        freeTimeActivities: '',
        additionalInsights: '',
    });

    const [processing, setProcessing] = useState(false);

    const isDark = colorScheme === 'dark';

    // Looping animation for the AI orb during calculation
    useEffect(() => {
        if (processing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(orbScale, {
                        toValue: 1.1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(orbScale, {
                        toValue: 1.0,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ])
            ).start();

            const interval = setInterval(() => {
                setLogIndex(prev => Math.min(prev + 1, DIAGNOSTIC_LOGS.length - 1));
            }, 750);

            return () => clearInterval(interval);
        }
    }, [processing]);

    // ── Validation ──────────────────────────────────────────────────────────────

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return true; // Welcome
            case 1: return !!state.educationLevel && !!state.academicBackground; // Basic Info
            case 2: return state.interests.length > 0; // Interests
            case 3: return Object.keys(state.skills).length >= SKILLS.length; // Skills
            case 4: return Object.keys(state.personality).length >= PERSONALITY_QUESTIONS.length; // Personality
            case 5: return !!state.careerGoal && !!state.timeCommitment && !!state.budget; // Goals & Preferences
            case 6: return true; // Open-Ended Reflections (optional)
            case 7: return true; // Additional Context (optional)
            case 8: return true; // Summary
            default: return false;
        }
    };

    // ── Navigation ──────────────────────────────────────────────────────────────

    const goNext = () => {
        if (!isStepValid()) return;
        if (currentStep < TOTAL_STEPS - 1) {
            const next = currentStep + 1;
            setCurrentStep(next);
            Animated.spring(progressAnim, {
                toValue: next / (TOTAL_STEPS - 1),
                useNativeDriver: false,
                tension: 60,
                friction: 8,
            }).start();
        }
    };

    const goPrev = () => {
        if (currentStep > 0) {
            const prev = currentStep - 1;
            setCurrentStep(prev);
            Animated.spring(progressAnim, {
                toValue: prev / (TOTAL_STEPS - 1),
                useNativeDriver: false,
                tension: 60,
                friction: 8,
            }).start();
        }
    };

    const handleComplete = async () => {
        setProcessing(true);
        const startTime = Date.now();
        try {
            // Aggregate personality scores for RIASEC
            const finalPersonality = {
                technical: Math.round(((state.personality['technical_1'] || 3) + (state.personality['technical_2'] || 3)) / 2),
                investigative: Math.round(((state.personality['investigative_1'] || 3) + (state.personality['investigative_2'] || 3)) / 2),
                creative: Math.round(((state.personality['creative_1'] || 3) + (state.personality['creative_2'] || 3)) / 2),
                social: Math.round(((state.personality['social_1'] || 3) + (state.personality['social_2'] || 3)) / 2),
                structured: Math.round(((state.personality['structured_1'] || 3) + (state.personality['structured_2'] || 3)) / 2),
            };

            const payloadState = {
                ...state,
                personality: finalPersonality,
            };

            const recommendation = await getCareerRecommendation(payloadState);
            await AsyncStorage.setItem('@career_recommendation', JSON.stringify(recommendation));
            await AsyncStorage.setItem('@user_skills', JSON.stringify(state.skills));
            await AsyncStorage.setItem('@user_personality', JSON.stringify(finalPersonality));
            await AsyncStorage.setItem('@onboarding_state', JSON.stringify(state));

            // Sync career recommendation to Firebase Firestore (non-blocking)
            const currentUser = auth.currentUser;
            if (currentUser) {
                setDoc(doc(db, 'users', currentUser.uid), {
                    recommendation,
                    skills: state.skills,
                    personality: finalPersonality,
                    onboardingState: state,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(firestoreErr => {
                    console.warn('Failed to sync career recommendation to Firestore:', firestoreErr);
                });
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(5200 - elapsed, 0); // Extended slightly to display full diagnostic logging list

            setTimeout(() => {
                router.replace('/(tabs)');
            }, remaining);
        } catch (error) {
            console.error('Error during AI analysis:', error);
            setProcessing(false);
            Alert.alert(
                'AI Analysis Failed',
                'We encountered an error while analyzing your profile with Gemini. Please check your internet connection and try again.',
                [{ text: 'OK' }]
            );
        }
    };

    // ── State Updaters ──────────────────────────────────────────────────────────

    const toggleInterest = (item: string) => setState(prev => ({
        ...prev,
        interests: prev.interests.includes(item)
            ? prev.interests.filter(i => i !== item)
            : [...prev.interests, item],
    }));

    const setSkill = (skill: string, level: string) => setState(prev => ({
        ...prev, skills: { ...prev.skills, [skill]: level },
    }));

    const setPersonality = (key: string, score: number) => {
        setState(prev => ({ ...prev, personality: { ...prev.personality, [key]: score } }));
        if (personalityQ < PERSONALITY_QUESTIONS.length - 1) {
            setTimeout(() => setPersonalityQ(personalityQ + 1), 300);
        }
    };

    // ── Render Helpers ──────────────────────────────────────────────────────────

    const OptionCard = ({
        label, iconFamily, iconName, selected, onPress, desc,
    }: { label: string; iconFamily: string; iconName: string; selected: boolean; onPress: () => void; desc?: string }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.optionCard,
                {
                    backgroundColor: selected
                        ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(124,58,237,0.08)')
                        : colors.cardBackground,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1.5,
                },
            ]}
        >
            <View style={styles.optionIconContainer}>
                {iconFamily === 'Feather' ? (
                    <Feather name={iconName as any} size={22} color={selected ? colors.primary : colors.gray} />
                ) : (
                    <Ionicons name={iconName as any} size={22} color={selected ? colors.primary : colors.gray} />
                )}
            </View>
            <View style={styles.optionTextGroup}>
                <Text style={[styles.optionLabel, { color: colors.text, fontWeight: selected ? '700' : '500' }]}>
                    {label}
                </Text>
                {desc && <Text style={[styles.optionDesc, { color: colors.gray }]}>{desc}</Text>}
            </View>
            <View style={[styles.optionCheck, {
                backgroundColor: selected ? colors.primary : 'transparent',
                borderColor: selected ? colors.primary : colors.border,
            }]}>
                {selected && <Feather name="check" size={12} color="#FFF" />}
            </View>
        </TouchableOpacity>
    );

    const InterestChip = ({ label, iconFamily, iconName, selected, onPress }: {
        label: string; iconFamily: string; iconName: string; selected: boolean; onPress: () => void;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[styles.chip, {
                backgroundColor: selected ? colors.primary : colors.cardBackground,
                borderColor: selected ? colors.primary : colors.border,
            }]}
        >
            {iconFamily === 'Feather' ? (
                <Feather name={iconName as any} size={16} color={selected ? '#FFF' : colors.gray} />
            ) : (
                <Ionicons name={iconName as any} size={16} color={selected ? '#FFF' : colors.gray} />
            )}
            <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    // ── Step Renderers ──────────────────────────────────────────────────────────

    const renderWelcome = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeBody}>
                <Image
                    source={require('../assets/images/welcome.png')}
                    style={styles.welcomeImage}
                    resizeMode="cover"
                />

                <Text style={[styles.welcomeIntro, { color: colors.text }]}>
                    Welcome to CareerPath AI! We're here to help you navigate your professional journey using the power of artificial intelligence.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Unified Assessment Flow:</Text>

                {[
                    { text: 'Tell us your basic educational context', icon: 'user' },
                    { text: 'Select interests across multiple fields & industries', icon: 'lightbulb' },
                    { text: 'Rate your transferable skills (communication, analytical, etc.)', icon: 'zap' },
                    { text: 'Take a short RIASEC personality check (10 questions)', icon: 'activity' },
                    { text: 'Set your goals, budget, & time commitments', icon: 'target' },
                    { text: 'Share voluntary personal reflections & custom requests', icon: 'edit-3' },
                ].map((feat, i) => (
                    <View key={i} style={[styles.featureRow, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(124,58,237,0.05)', borderColor: colors.border }]}>
                        <Feather name={feat.icon as any} size={18} color={colors.primary} style={{ marginRight: 12 }} />
                        <Text style={[styles.featureText, { color: colors.text, flex: 1 }]}>{feat.text}</Text>
                    </View>
                ))}

                <View style={[styles.privacyNote, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Feather name="shield" size={18} color={colors.gray} style={{ marginRight: 10 }} />
                    <Text style={[styles.privacyText, { color: colors.gray, flex: 1 }]}>
                        Your privacy is our priority. Your profile and answers are saved locally and securely synced to your cloud account.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );

    const renderBasicInfo = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[styles.subSectionHeader, { color: colors.text }]}>Education Level</Text>
            {EDUCATION_LEVELS.map(({ label, iconFamily, iconName }) => (
                <OptionCard
                    key={label}
                    label={label}
                    iconFamily={iconFamily}
                    iconName={iconName}
                    selected={state.educationLevel === label}
                    onPress={() => setState(p => ({ ...p, educationLevel: label }))}
                />
            ))}

            <Text style={[styles.subSectionHeader, { color: colors.text, marginTop: 16 }]}>Academic Background</Text>
            {ACADEMIC_BACKGROUNDS.map(({ label, iconFamily, iconName }) => (
                <OptionCard
                    key={label}
                    label={label}
                    iconFamily={iconFamily}
                    iconName={iconName}
                    selected={state.academicBackground === label}
                    onPress={() => setState(p => ({ ...p, academicBackground: label }))}
                />
            ))}

            <Text style={[styles.subSectionHeader, { color: colors.text, marginTop: 16 }]}>Additional Details</Text>
            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Age (Optional)</Text>
                <View style={[styles.textInputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                    <Feather name="calendar" size={16} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="e.g. 24"
                        placeholderTextColor={colors.grayLight}
                        value={state.age || ''}
                        onChangeText={(val: string) => setState(p => ({ ...p, age: val }))}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Country (Optional)</Text>
                <View style={[styles.textInputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                    <Feather name="map-pin" size={16} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="e.g. Nigeria"
                        placeholderTextColor={colors.grayLight}
                        value={state.country || ''}
                        onChangeText={(val: string) => setState(p => ({ ...p, country: val }))}
                    />
                </View>
            </View>
        </ScrollView>
    );

    const renderInterests = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.chipGrid}>
                {INTERESTS.map(({ label, iconFamily, iconName }) => (
                    <InterestChip
                        key={label}
                        label={label}
                        iconFamily={iconFamily}
                        iconName={iconName}
                        selected={state.interests.includes(label)}
                        onPress={() => toggleInterest(label)}
                    />
                ))}
            </View>
            {state.interests.length > 0 && (
                <Text style={[styles.selectedCount, { color: colors.primary }]}>
                    {state.interests.length} selected ✓
                </Text>
            )}
        </ScrollView>
    );

    const renderSkills = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.skillsExplanation}>
                <Text style={[styles.skillsHint, { color: colors.gray }]}>
                    Select how comfortable you feel with each transferable skill today.
                </Text>
            </View>
            {SKILLS.map(({ label, iconFamily, iconName }) => {
                const currentLevel = state.skills[label];
                return (
                    <View key={label} style={[styles.skillCard, { backgroundColor: colors.cardBackground, borderColor: currentLevel ? colors.primary : colors.border }]}>
                        <View style={styles.skillHeader}>
                            <Feather name={iconName as any} size={18} color={currentLevel ? colors.primary : colors.gray} />
                            <Text style={[styles.skillName, { color: colors.text }]}>{label}</Text>
                            {currentLevel && <Text style={[styles.skillLevelBadge, { color: colors.primary }]}>✓ {currentLevel}</Text>}
                        </View>
                        <View style={styles.skillOptionsContainer}>
                            {[
                                { id: 'Beginner', label: 'Just Starting', iconName: 'leaf-outline' },
                                { id: 'Intermediate', label: 'Some Knowledge', iconName: 'leaf' },
                                { id: 'Advanced', label: 'Very Confident', iconName: 'flower' }
                            ].map(lv => (
                                <TouchableOpacity
                                    key={lv.id}
                                    onPress={() => setSkill(label, lv.id)}
                                    activeOpacity={0.7}
                                    style={[styles.skillOptionBtn, {
                                        backgroundColor: currentLevel === lv.id ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(124,58,237,0.1)') : 'transparent',
                                        borderColor: currentLevel === lv.id ? colors.primary : colors.border,
                                    }]}
                                >
                                    <Ionicons name={lv.iconName as any} size={18} color={currentLevel === lv.id ? colors.primary : colors.gray} />
                                    <Text style={[styles.skillOptionLabel, { color: currentLevel === lv.id ? colors.text : colors.gray }]}>{lv.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );

    const renderPersonality = () => {
        const { q, key } = PERSONALITY_QUESTIONS[personalityQ];
        const currentAnswer = state.personality[key];
        const totalAnswered = Object.keys(state.personality).length;

        return (
            <View style={styles.personalityContainer}>
                <View style={[styles.questionProgress, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.questionCounter, { color: colors.gray }]}>
                        Question {personalityQ + 1} of {PERSONALITY_QUESTIONS.length}
                    </Text>
                    <View style={[styles.qProgressBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.qProgressFill, {
                            backgroundColor: colors.primary,
                            width: `${((personalityQ + 1) / PERSONALITY_QUESTIONS.length) * 100}%`,
                        }]} />
                    </View>
                    <Text style={[styles.answeredLabel, { color: colors.primary }]}>{totalAnswered}/{PERSONALITY_QUESTIONS.length} completed</Text>
                </View>

                <View style={[styles.qCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.questionText, { color: colors.text }]}>{q}</Text>

                    <Text style={[styles.scaleHint, { color: colors.gray }]}>
                        1 = Strongly Disagree  ·  5 = Strongly Agree
                    </Text>

                    <View style={styles.scaleRow}>
                        {[1, 2, 3, 4, 5].map(score => (
                            <TouchableOpacity
                                key={score}
                                onPress={() => setPersonality(key, score)}
                                activeOpacity={0.7}
                                style={[styles.scaleBtn, {
                                    backgroundColor: currentAnswer === score ? colors.primary : 'transparent',
                                    borderColor: currentAnswer === score ? colors.primary : colors.border,
                                }]}
                            >
                                <Text style={[styles.scaleBtnText, { color: currentAnswer === score ? '#FFF' : colors.text }]}>
                                    {score}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Previous question nav */}
                <View style={styles.personalityNav}>
                    {personalityQ > 0 ? (
                        <TouchableOpacity onPress={() => setPersonalityQ(personalityQ - 1)} style={styles.prevQuestion}>
                            <Text style={[styles.prevQuestionText, { color: colors.primary }]}>← Previous Question</Text>
                        </TouchableOpacity>
                    ) : <View />}

                    {personalityQ < PERSONALITY_QUESTIONS.length - 1 && currentAnswer ? (
                        <TouchableOpacity onPress={() => setPersonalityQ(personalityQ + 1)} style={styles.nextQuestion}>
                            <Text style={[styles.nextQuestionText, { color: colors.primary }]}>Next Question →</Text>
                        </TouchableOpacity>
                    ) : <View />}
                </View>

                {totalAnswered < PERSONALITY_QUESTIONS.length && (
                    <Text style={[styles.personalityWarning, { color: colors.gray }]}>
                        Please answer all {PERSONALITY_QUESTIONS.length} questions to continue.
                    </Text>
                )}
            </View>
        );
    };

    const renderGoalsAndPreferences = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[styles.subSectionHeader, { color: colors.text }]}>Primary Goal Priority</Text>
            <View style={{ gap: 4 }}>
                {CAREER_GOALS.map(({ label, iconFamily, iconName, desc }) => (
                    <OptionCard
                        key={label}
                        label={label}
                        iconFamily={iconFamily}
                        iconName={iconName}
                        desc={desc}
                        selected={state.careerGoal === label}
                        onPress={() => setState(p => ({ ...p, careerGoal: label }))}
                    />
                ))}
            </View>

            <Text style={[styles.subSectionHeader, { color: colors.text, marginTop: 16 }]}>Time Available for Upskilling</Text>
            <View style={{ gap: 4 }}>
                {TIME_COMMITMENTS.map(({ label, iconFamily, iconName, desc }) => (
                    <OptionCard
                        key={label}
                        label={label}
                        iconFamily={iconFamily}
                        iconName={iconName}
                        desc={desc}
                        selected={state.timeCommitment === label}
                        onPress={() => setState(p => ({ ...p, timeCommitment: label }))}
                    />
                ))}
            </View>

            <Text style={[styles.subSectionHeader, { color: colors.text, marginTop: 16 }]}>Budget Preference</Text>
            <View style={{ gap: 4 }}>
                {BUDGET_PREFERENCES.map(({ label, iconFamily, iconName, desc }) => (
                    <OptionCard
                        key={label}
                        label={label}
                        iconFamily={iconFamily}
                        iconName={iconName}
                        desc={desc}
                        selected={state.budget === label}
                        onPress={() => setState(p => ({ ...p, budget: label }))}
                    />
                ))}
            </View>
        </ScrollView>
    );

    const renderOpenEndedQuestions = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[styles.sectionSubtitleText, { color: colors.gray, marginBottom: 16 }]}>
                Provide short answers to customize your recommendation. Leave blank to skip.
            </Text>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Tell us about yourself in a few sentences</Text>
                <TextInput
                    style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                    placeholder="e.g. I am structured, enjoy problem solving, and work well in small teams..."
                    placeholderTextColor={colors.grayLight}
                    multiline
                    numberOfLines={3}
                    value={state.aboutMe || ''}
                    onChangeText={(val: string) => setState(p => ({ ...p, aboutMe: val }))}
                />
            </View>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>What type of work excites you the most?</Text>
                <TextInput
                    style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                    placeholder="e.g. Designing visual layouts, building things, or conducting research..."
                    placeholderTextColor={colors.grayLight}
                    multiline
                    numberOfLines={3}
                    value={state.excitingWork || ''}
                    onChangeText={(val: string) => setState(p => ({ ...p, excitingWork: val }))}
                />
            </View>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Is there any career you've always been interested in?</Text>
                <TextInput
                    style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                    placeholder="e.g. Aviation specialist, Lawyer, Creative artist, Architect..."
                    placeholderTextColor={colors.grayLight}
                    multiline
                    numberOfLines={2}
                    value={state.dreamCareer || ''}
                    onChangeText={(val: string) => setState(p => ({ ...p, dreamCareer: val }))}
                />
            </View>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>What activities do you enjoy during your free time?</Text>
                <TextInput
                    style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                    placeholder="e.g. Reading, drawing, playing games, sports, gardening..."
                    placeholderTextColor={colors.grayLight}
                    multiline
                    numberOfLines={2}
                    value={state.freeTimeActivities || ''}
                    onChangeText={(val: string) => setState(p => ({ ...p, freeTimeActivities: val }))}
                />
            </View>
        </ScrollView>
    );

    const renderAdditionalContext = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[styles.sectionSubtitleText, { color: colors.gray, marginBottom: 16 }]}>
                Share specific constraints or preferences you want CareerPathAI to factor in.
            </Text>

            <View style={styles.inputFieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Anything else you'd like us to know?</Text>
                <TextInput
                    style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground, height: 120 }]}
                    placeholder="e.g. I prefer working outdoors and dislike office desks. OR I am trying to switch careers from accounting to engineering..."
                    placeholderTextColor={colors.grayLight}
                    multiline
                    numberOfLines={5}
                    value={state.additionalInsights || ''}
                    onChangeText={(val: string) => setState(p => ({ ...p, additionalInsights: val }))}
                />
            </View>
        </ScrollView>
    );

    const renderSummary = () => {
        const summaryItems = [
            { label: 'Education', value: state.educationLevel, iconFamily: 'Ionicons', iconName: 'school' },
            { label: 'Background', value: state.academicBackground, iconFamily: 'Ionicons', iconName: 'book' },
            { label: 'Age', value: state.age || '—', iconFamily: 'Feather', iconName: 'calendar' },
            { label: 'Country', value: state.country || '—', iconFamily: 'Feather', iconName: 'map-pin' },
            { label: 'Interests', value: state.interests.join(' · ') || '—', iconFamily: 'Ionicons', iconName: 'bulb' },
            { label: 'Goal', value: state.careerGoal, iconFamily: 'Feather', iconName: 'target' },
            { label: 'Time', value: state.timeCommitment, iconFamily: 'Feather', iconName: 'clock' },
            { label: 'Budget', value: state.budget, iconFamily: 'Feather', iconName: 'dollar-sign' },
        ];

        const skillCount = Object.keys(state.skills).length;
        const personalityCount = Object.keys(state.personality).length;
        const openEndedCount = [state.aboutMe, state.excitingWork, state.dreamCareer, state.freeTimeActivities].filter(Boolean).length;
        const additionalContext = state.additionalInsights ? 'Provided' : 'Skipped';

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(124,58,237,0.05)', borderColor: colors.primary }]}>
                    <Text style={[styles.summaryCardTitle, { color: colors.primary }]}>Profile Complete!</Text>
                    <Text style={[styles.summaryCardSubtitle, { color: colors.gray }]}>
                        Our AI is ready to analyze your profile and find matching paths.
                    </Text>
                </View>

                {summaryItems.map(({ label, value, iconFamily, iconName }) => value ? (
                    <View key={label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.summaryIconBox}>
                            {iconFamily === 'Feather' ? (
                                <Feather name={iconName as any} size={20} color={colors.primary} />
                            ) : (
                                <Ionicons name={iconName as any} size={20} color={colors.primary} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{label}</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
                        </View>
                    </View>
                ) : null)}

                <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.summaryIconBox}>
                        <Feather name="zap" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Transferable Skills</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{skillCount} of {SKILLS.length} Rated</Text>
                    </View>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.summaryIconBox}>
                        <Ionicons name="analytics" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Personality Check</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{personalityCount} of {PERSONALITY_QUESTIONS.length} Questions Answered</Text>
                    </View>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.summaryIconBox}>
                        <Feather name="edit-3" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Open Reflections</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{openEndedCount} of 4 Questions Answered</Text>
                    </View>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: 'transparent' }]}>
                    <View style={styles.summaryIconBox}>
                        <Feather name="plus-circle" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Additional Context</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{additionalContext}</Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderProcessing = () => (
        <View style={styles.processingContainer}>
            <Animated.Image
                source={require('../assets/images/ai_orb.png')}
                style={[styles.aiOrbImage, { transform: [{ scale: orbScale }] }]}
                resizeMode="contain"
            />
            <Text style={[styles.processingTitle, { color: colors.text }]}>Analyzing Profile</Text>

            <View style={styles.diagnosticLogBox}>
                <Text style={[styles.diagnosticText, { color: colors.primary }]}>
                    {DIAGNOSTIC_LOGS[logIndex]}
                </Text>
            </View>

            <View style={styles.loadingBarContainer}>
                <View style={[styles.loadingBar, { backgroundColor: colors.border }]}>
                    <Animated.View style={[styles.loadingFill, {
                        backgroundColor: colors.primary,
                        width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        })
                    }]} />
                </View>
            </View>
        </View>
    );

    const renderStep = () => {
        if (processing) return renderProcessing();
        switch (currentStep) {
            case 0: return renderWelcome();
            case 1: return renderBasicInfo();
            case 2: return renderInterests();
            case 3: return renderSkills();
            case 4: return renderPersonality();
            case 5: return renderGoalsAndPreferences();
            case 6: return renderOpenEndedQuestions();
            case 7: return renderAdditionalContext();
            case 8: return renderSummary();
            default: return renderWelcome();
        }
    };

    const step = STEPS[currentStep];
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const canProceed = isStepValid();

    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                {/* ── Top Header ── */}
                <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
                    <View style={styles.topBarLeft}>
                        <Text style={[styles.stepLabel, { color: colors.gray }]}>Step {currentStep + 1}/{TOTAL_STEPS}</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                        <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: progressWidth }]} />
                    </View>
                    <View style={styles.topBarRight}>
                    </View>
                </View>

                {/* ── Step Header ── */}
                {!processing && (
                    <View style={styles.stepHeader}>
                        <View style={styles.headerIconContainer}>
                            {step.iconFamily === 'Feather' ? (
                                <Feather name={step.iconName as any} size={28} color={colors.primary} />
                            ) : (
                                <Ionicons name={step.iconName as any} size={28} color={colors.primary} />
                            )}
                        </View>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.gray }]}>{step.subtitle}</Text>
                    </View>
                )}

                {/* ── Content ── */}
                <View style={styles.content}>
                    {renderStep()}
                </View>

                {/* ── Footer Navigation ── */}
                {!processing && (
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        {currentStep > 0 ? (
                            <TouchableOpacity
                                onPress={goPrev}
                                activeOpacity={0.7}
                                style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                            >
                                <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
                            </TouchableOpacity>
                        ) : <View style={styles.backBtnPlaceholder} />}

                        <TouchableOpacity
                            onPress={isLastStep ? handleComplete : goNext}
                            activeOpacity={0.85}
                            disabled={!canProceed}
                            style={[styles.nextBtn, {
                                backgroundColor: canProceed ? colors.primary : colors.border,
                                boxShadow: canProceed ? '0 6px 12px rgba(124, 58, 237, 0.3)' : 'none',
                            }]}
                        >
                            <Text style={[styles.nextBtnText, { color: canProceed ? '#FFF' : colors.gray }]}>
                                {currentStep === 0 ? "Get Started →" : isLastStep ? 'Find My Path' : 'Continue →'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: { flex: 1 },

    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    topBarLeft: { width: 60 },
    topBarRight: { width: 60, alignItems: 'flex-end' },
    stepLabel: { fontSize: 12, fontWeight: '600' },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },

    // Step header
    stepHeader: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        alignItems: 'flex-start',
    },
    headerIconContainer: {
        marginBottom: 12,
    },
    stepTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6, lineHeight: 30 },
    stepSubtitle: { fontSize: 14, fontWeight: '400', lineHeight: 20 },

    // Content
    content: { flex: 1, paddingHorizontal: 20 },

    // Welcome
    welcomeBody: { paddingTop: 8 },
    welcomeImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 20,
    },
    welcomeIntro: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    featureRow: {
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: { fontSize: 15, fontWeight: '500' },
    privacyNote: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    privacyText: { fontSize: 13, lineHeight: 20 },

    // Option Cards
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionTextGroup: { flex: 1 },
    optionLabel: { fontSize: 15, lineHeight: 22 },
    optionDesc: { fontSize: 12, marginTop: 2 },
    optionCheck: {
        width: 24,
        height: 24,
        borderRadius: 24,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Interest chips
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8, paddingTop: 4 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1.5,
        gap: 6,
        marginBottom: 4,
    },
    chipText: { fontSize: 14, fontWeight: '600' },
    selectedCount: { marginTop: 4, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingBottom: 8 },

    // Skills Refactor
    skillsExplanation: { marginBottom: 16 },
    skillsHint: { fontSize: 13, fontStyle: 'italic' },
    skillCard: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 16,
    },
    skillHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    skillName: { fontSize: 16, fontWeight: '700', flex: 1 },
    skillLevelBadge: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    skillOptionsContainer: { flexDirection: 'row', gap: 8 },
    skillOptionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: 6,
    },
    skillOptionLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

    // Personality
    personalityContainer: { paddingTop: 8 },
    questionProgress: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    answeredLabel: { fontSize: 11, fontWeight: '800', marginTop: 8, textAlign: 'right' },
    questionCounter: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
    qProgressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
    qProgressFill: { height: '100%', borderRadius: 3 },
    qCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
    questionText: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 12 },
    scaleHint: { fontSize: 12, marginBottom: 20 },
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    scaleBtn: {
        width: (SCREEN_WIDTH - 80 - 48) / 5,
        aspectRatio: 1,
        borderRadius: 999,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scaleBtnText: { fontSize: 18, fontWeight: '700' },
    personalityNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 16 },
    prevQuestion: {},
    nextQuestion: {},
    prevQuestionText: { fontSize: 14, fontWeight: '600' },
    nextQuestionText: { fontSize: 14, fontWeight: '600' },
    personalityWarning: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

    // Processing Redesign
    processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    aiOrbImage: {
        width: 140,
        height: 140,
        marginBottom: 24,
    },
    processingTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    diagnosticLogBox: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    diagnosticText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingBarContainer: { width: '100%', marginBottom: 16 },
    loadingBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    loadingFill: { height: '100%', borderRadius: 4 },

    // Summary
    summaryCard: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
    },
    summaryCardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
    summaryCardSubtitle: { fontSize: 14, textAlign: 'center' },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    summaryIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    summaryValue: { fontSize: 15, fontWeight: '500' },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 12,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    },
    backBtn: {
        height: 52,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnText: { fontSize: 15, fontWeight: '600' },
    backBtnPlaceholder: { width: 80 },
    nextBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
    nextBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
    subSectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 0.1,
    },
    inputFieldGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 14,
        minHeight: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 12,
    },
    multilineInput: {
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 14,
        fontSize: 15,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    sectionSubtitleText: {
        fontSize: 13,
        lineHeight: 18,
    },
});
