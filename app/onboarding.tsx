import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

interface OnboardingState {
    educationLevel: string | null;
    academicBackground: string | null;
    interests: string[];
    skills: Record<string, string>;
    personality: Record<string, number>;
    careerGoal: string | null;
    timeCommitment: string | null;
    budget: string | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 10;

// ─── Step Data ───────────────────────────────────────────────────────────────

const EDUCATION_LEVELS = [
    { label: 'Secondary School', emoji: '🏫' },
    { label: 'Diploma', emoji: '📜' },
    { label: 'Undergraduate', emoji: '🎓' },
    { label: 'Graduate', emoji: '🏅' },
    { label: 'Self-taught', emoji: '🧠' },
];

const ACADEMIC_BACKGROUNDS = [
    { label: 'Science', emoji: '🔬' },
    { label: 'Arts', emoji: '🎨' },
    { label: 'Engineering', emoji: '⚙️' },
    { label: 'Business', emoji: '💼' },
    { label: 'IT', emoji: '💻' },
    { label: 'Others', emoji: '📂' },
];

const INTERESTS = [
    { label: 'Technology', emoji: '🤖' },
    { label: 'Healthcare', emoji: '🏥' },
    { label: 'Finance', emoji: '💰' },
    { label: 'Creative Arts', emoji: '🎨' },
    { label: 'Business', emoji: '📈' },
    { label: 'Engineering', emoji: '🔧' },
    { label: 'Social Impact', emoji: '🌍' },
    { label: 'Education', emoji: '📚' },
    { label: 'Data & AI', emoji: '🧠' },
];

const SKILLS = [
    { label: 'Programming', emoji: '💻' },
    { label: 'Communication', emoji: '🗣️' },
    { label: 'Mathematics', emoji: '📐' },
    { label: 'Creativity', emoji: '✨' },
    { label: 'Leadership', emoji: '👑' },
    { label: 'Analytical Thinking', emoji: '🔍' },
    { label: 'Problem Solving', emoji: '🧩' },
];

const CAREER_GOALS = [
    { label: 'High Salary', emoji: '💵', desc: 'Maximize earning potential' },
    { label: 'Job Security', emoji: '🛡️', desc: 'Stable, long-term career' },
    { label: 'Passion-based', emoji: '❤️', desc: 'Do what you love' },
    { label: 'Remote Work', emoji: '🌐', desc: 'Work from anywhere' },
    { label: 'Entrepreneurship', emoji: '🚀', desc: 'Build your own business' },
];

const TIME_COMMITMENTS = [
    { label: '< 3 months', emoji: '⚡', desc: 'Quick upskill' },
    { label: '3–6 months', emoji: '📅', desc: 'Short course' },
    { label: '6–12 months', emoji: '🗓️', desc: 'Part-time study' },
    { label: '1+ year', emoji: '🎯', desc: 'Full programme' },
];

const BUDGET_PREFERENCES = [
    { label: 'Free Only', emoji: '🆓', desc: 'Open source & free resources' },
    { label: 'Low Cost', emoji: '💳', desc: 'Under $50/month' },
    { label: 'No Preference', emoji: '💎', desc: 'Best quality available' },
];

const PERSONALITY_QUESTIONS = [
    { q: 'I enjoy solving complex technical problems.', key: 'technical' },
    { q: 'I prefer creative and expressive tasks.', key: 'creative' },
    { q: 'I love collaborating and working with people.', key: 'social' },
    { q: 'I prefer structure and planned schedules.', key: 'structured' },
    { q: 'I am curious about scientific research.', key: 'investigative' },
];

// ─── Step Metadata ────────────────────────────────────────────────────────────

const STEPS = [
    { title: 'Welcome to CareerPath AI', subtitle: 'How it works & What to expect', emoji: '🚀' },
    { title: "What's your education level?", subtitle: 'This helps calibrate recommendation difficulty', emoji: '🎓' },
    { title: 'Academic background?', subtitle: 'Helps match courses to your foundation', emoji: '📚' },
    { title: 'What are you interested in?', subtitle: 'Select all that apply — more = better matches', emoji: '💡' },
    { title: 'Rate your skills', subtitle: 'Be honest — this powers your skill gap analysis', emoji: '⚡' },
    { title: 'Quick personality check', subtitle: 'Based on the RIASEC model', emoji: '🧠' },
    { title: "What's your primary goal?", subtitle: 'This adjusts your recommendation weights', emoji: '🎯' },
    { title: 'Time commitment?', subtitle: 'How long can you dedicate to learning?', emoji: '⏰' },
    { title: 'Budget preference?', subtitle: 'Filter courses by your budget', emoji: '💰' },
    { title: "You're all set!", subtitle: "Here's what we've learned about you", emoji: '✅' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const progressAnim = useRef(new Animated.Value(0)).current;

    const [currentStep, setCurrentStep] = useState(0);
    const [personalityQ, setPersonalityQ] = useState(0);
    const [state, setState] = useState<OnboardingState>({
        educationLevel: null,
        academicBackground: null,
        interests: [],
        skills: {},
        personality: {},
        careerGoal: null,
        timeCommitment: null,
        budget: null,
    });

    const [processing, setProcessing] = useState(false);

    const isDark = colorScheme === 'dark';

    // ── Validation ──────────────────────────────────────────────────────────────

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return true; // Welcome
            case 1: return !!state.educationLevel;
            case 2: return !!state.academicBackground;
            case 3: return state.interests.length > 0;
            case 4: return Object.keys(state.skills).length >= SKILLS.length;
            case 5: return Object.keys(state.personality).length >= PERSONALITY_QUESTIONS.length;
            case 6: return !!state.careerGoal;
            case 7: return !!state.timeCommitment;
            case 8: return !!state.budget;
            case 9: return true; // Summary
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

    const handleComplete = () => {
        setProcessing(true);
        // Simulate AI analysis for 3 seconds
        setTimeout(() => {
            router.replace('/(tabs)');
        }, 3000);
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
        label, emoji, selected, onPress, desc,
    }: { label: string; emoji: string; selected: boolean; onPress: () => void; desc?: string }) => (
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
            <Text style={styles.optionEmoji}>{emoji}</Text>
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
                {selected && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
            </View>
        </TouchableOpacity>
    );

    const InterestChip = ({ label, emoji, selected, onPress }: {
        label: string; emoji: string; selected: boolean; onPress: () => void;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[styles.chip, {
                backgroundColor: selected ? colors.primary : colors.cardBackground,
                borderColor: selected ? colors.primary : colors.border,
            }]}
        >
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    // ── Step Renderers ──────────────────────────────────────────────────────────

    const renderWelcome = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeBody}>
                <Text style={[styles.welcomeIntro, { color: colors.text }]}>
                    Welcome to CareerPath AI! We're here to help you navigate your professional journey using the power of artificial intelligence.
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works:</Text>

                {(['✨ Answer 10 quick questions about your background', '🎯 AI analyzes your skills and interests', '📊 Get personalized course recommendations', '🚀 Discover high-growth career paths tailored for you'] as const).map((feat, i) => (
                    <View key={i} style={[styles.featureRow, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(124,58,237,0.05)', borderColor: colors.border }]}>
                        <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                    </View>
                ))}

                <View style={[styles.privacyNote, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.privacyText, { color: colors.gray }]}>
                        🛡️ Your privacy is our priority. We only collect data necessary to provide accurate recommendations.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );

    const renderEducation = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {EDUCATION_LEVELS.map(({ label, emoji }) => (
                <OptionCard
                    key={label}
                    label={label}
                    emoji={emoji}
                    selected={state.educationLevel === label}
                    onPress={() => setState(p => ({ ...p, educationLevel: label }))}
                />
            ))}
        </ScrollView>
    );

    const renderAcademic = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {ACADEMIC_BACKGROUNDS.map(({ label, emoji }) => (
                <OptionCard
                    key={label}
                    label={label}
                    emoji={emoji}
                    selected={state.academicBackground === label}
                    onPress={() => setState(p => ({ ...p, academicBackground: label }))}
                />
            ))}
        </ScrollView>
    );

    const renderInterests = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.chipGrid}>
                {INTERESTS.map(({ label, emoji }) => (
                    <InterestChip
                        key={label}
                        label={label}
                        emoji={emoji}
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
                    Select how comfortable you feel with each area today.
                </Text>
            </View>
            {SKILLS.map(({ label, emoji }) => {
                const currentLevel = state.skills[label];
                return (
                    <View key={label} style={[styles.skillCard, { backgroundColor: colors.cardBackground, borderColor: currentLevel ? colors.primary : colors.border }]}>
                        <View style={styles.skillHeader}>
                            <Text style={styles.skillEmoji}>{emoji}</Text>
                            <Text style={[styles.skillName, { color: colors.text }]}>{label}</Text>
                            {currentLevel && <Text style={[styles.skillLevelBadge, { color: colors.primary }]}>✓ {currentLevel}</Text>}
                        </View>
                        <View style={styles.skillOptionsContainer}>
                            {[
                                { id: 'Beginner', label: 'Just Starting', icon: '🌱' },
                                { id: 'Intermediate', label: 'Some Knowledge', icon: '🌿' },
                                { id: 'Advanced', label: 'Very Confident', icon: '🌳' }
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
                                    <Text style={styles.skillOptionIcon}>{lv.icon}</Text>
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

    const renderCareerGoal = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {CAREER_GOALS.map(({ label, emoji, desc }) => (
                <OptionCard
                    key={label}
                    label={label}
                    emoji={emoji}
                    desc={desc}
                    selected={state.careerGoal === label}
                    onPress={() => setState(p => ({ ...p, careerGoal: label }))}
                />
            ))}
        </ScrollView>
    );

    const renderTime = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {TIME_COMMITMENTS.map(({ label, emoji, desc }) => (
                <OptionCard
                    key={label}
                    label={label}
                    emoji={emoji}
                    desc={desc}
                    selected={state.timeCommitment === label}
                    onPress={() => setState(p => ({ ...p, timeCommitment: label }))}
                />
            ))}
        </ScrollView>
    );

    const renderBudget = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {BUDGET_PREFERENCES.map(({ label, emoji, desc }) => (
                <OptionCard
                    key={label}
                    label={label}
                    emoji={emoji}
                    desc={desc}
                    selected={state.budget === label}
                    onPress={() => setState(p => ({ ...p, budget: label }))}
                />
            ))}
        </ScrollView>
    );

    const renderSummary = () => {
        const summaryItems = [
            { label: 'Education', value: state.educationLevel, emoji: '🎓' },
            { label: 'Background', value: state.academicBackground, emoji: '📚' },
            { label: 'Interests', value: state.interests.join(' · ') || '—', emoji: '💡' },
            { label: 'Goal', value: state.careerGoal, emoji: '🎯' },
            { label: 'Time', value: state.timeCommitment, emoji: '⏰' },
            { label: 'Budget', value: state.budget, emoji: '💰' },
        ];

        const skillCount = Object.keys(state.skills).length;
        const personalityCount = Object.keys(state.personality).length;

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(124,58,237,0.05)', borderColor: colors.primary }]}>
                    <Text style={[styles.summaryCardTitle, { color: colors.primary }]}>🎉 Profile Complete!</Text>
                    <Text style={[styles.summaryCardSubtitle, { color: colors.gray }]}>
                        Our AI is ready to analyze your profile.
                    </Text>
                </View>

                {summaryItems.map(({ label, value, emoji }) => value ? (
                    <View key={label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                        <Text style={{ fontSize: 20, marginRight: 12 }}>{emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{label}</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
                        </View>
                    </View>
                ) : null)}

                <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
                    <View>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Skills Rated</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{skillCount} of {SKILLS.length}</Text>
                    </View>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: 'transparent' }]}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>🧠</Text>
                    <View>
                        <Text style={[styles.summaryLabel, { color: colors.gray }]}>Personality Questions</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{personalityCount} of {PERSONALITY_QUESTIONS.length} answered</Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderProcessing = () => (
        <View style={styles.processingContainer}>
            <View style={[styles.aiCore, { backgroundColor: colors.primary }]}>
                <Text style={styles.aiCoreText}>AI</Text>
            </View>
            <Text style={[styles.processingTitle, { color: colors.text }]}>Analyzing Your Profile...</Text>
            <Text style={[styles.processingSubtitle, { color: colors.gray }]}>
                We're matching your skills, interests, and personality with thousands of career paths.
            </Text>
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
            <Text style={[styles.loadingFunny, { color: colors.primary }]}>
                Finding the high-salary shortcuts... 💰
            </Text>
        </View>
    );

    const renderStep = () => {
        if (processing) return renderProcessing();
        switch (currentStep) {
            case 0: return renderWelcome();
            case 1: return renderEducation();
            case 2: return renderAcademic();
            case 3: return renderInterests();
            case 4: return renderSkills();
            case 5: return renderPersonality();
            case 6: return renderCareerGoal();
            case 7: return renderTime();
            case 8: return renderBudget();
            case 9: return renderSummary();
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
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
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
                            {currentStep === 0 ? "Get Started →" : isLastStep ? '🚀 Find My Path' : 'Continue →'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
    skipText: { fontSize: 13, fontWeight: '500' },
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
    stepEmoji: { fontSize: 36, marginBottom: 12 },
    stepTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6, lineHeight: 30 },
    stepSubtitle: { fontSize: 14, fontWeight: '400', lineHeight: 20 },

    // Content
    content: { flex: 1, paddingHorizontal: 20 },

    // Welcome
    welcomeIntro: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    welcomeBody: { paddingTop: 8 },
    featureRow: {
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    featureText: { fontSize: 15, fontWeight: '500' },
    privacyNote: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
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
    optionEmoji: { fontSize: 24, marginRight: 14 },
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
    skillHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    skillEmoji: { fontSize: 20 },
    skillName: { fontSize: 16, fontWeight: '700', flex: 1 },
    skillLevelBadge: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    skillOptionsContainer: { flexDirection: 'row', gap: 8 },
    skillOptionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        gap: 4,
    },
    skillOptionIcon: { fontSize: 18 },
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
    prevQuestionText: { fontSize: 14, fontWeight: '600' },
    nextQuestionText: { fontSize: 14, fontWeight: '600' },
    personalityWarning: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

    // Processing
    processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    aiCore: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 10, boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)' },
    aiCoreText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
    processingTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    processingSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    loadingBarContainer: { width: '100%', marginBottom: 16 },
    loadingBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    loadingFill: { height: '100%', borderRadius: 4 },
    loadingFunny: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

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
        alignItems: 'flex-start',
        paddingVertical: 14,
        borderBottomWidth: 1,
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
});
