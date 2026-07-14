import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Personalized Careers',
    description: 'Discover AI-guided career options based on your custom personality profile.',
    image: require('../assets/images/recommended_career_1.jpg'),
    tag: 'EXPLORE',
  },
  {
    id: '2',
    title: 'Career Evaluation',
    description: 'Compare career metrics, growth rates, salary potentials, and matching attributes.',
    image: require('../assets/images/recommended_career_2.jpg'),
    tag: 'DECIDE',
  },
  {
    id: '3',
    title: 'Learning Roadmaps',
    description: 'Visualize your professional path with interactive step-by-step roadmap guides.',
    image: require('../assets/images/learning_roadmap_1.jpg'),
    tag: 'LEARN',
  },
  {
    id: '4',
    title: 'Curated Resources',
    description: 'Dive into top-tier learning resources and customize your specific focus skills.',
    image: require('../assets/images/learning_roadmap_2.jpg'),
    tag: 'STUDY',
  },
  {
    id: '5',
    title: 'Weekly Milestones',
    description: 'Track your weekly progress, course check-offs, and achievement logs.',
    image: require('../assets/images/progress_analytics_1.jpg'),
    tag: 'GROW',
  },
  {
    id: '6',
    title: 'Personality Breakdown',
    description: 'Analyze your Holland codes (RIASEC) dynamic profile to find ideal pathways.',
    image: require('../assets/images/progress_analytics_2.jpg'),
    tag: 'ANALYZE',
  },
];

export default function WelcomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const completeWalkthrough = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_walkthrough', 'true');
      router.replace('/auth?mode=signup');
    } catch (err) {
      console.warn('Failed to save walkthrough completion:', err);
      router.replace('/auth?mode=signup');
    }
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeWalkthrough();
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Background decorative blobs */}
      <View style={styles.blobContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1, { backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.05)' }]} />
        <View style={[styles.blob, styles.blob2, { backgroundColor: isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.04)' }]} />
      </View>

      {/* Brand Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.brandName, { color: colors.text }]}>CareerPath AI</Text>
          <Text style={[styles.brandSubtitle, { color: colors.gray }]}>Discover. Learn. Excel.</Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carouselContainer}
        contentContainerStyle={styles.carouselContent}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slideWidthWrapper}>
            <View style={styles.slideCard}>
              {/* Image Frame with shadow/border */}
              <View style={[styles.imageFrame, { borderColor: colors.cardBorder, shadowColor: colors.shadow }]}>
                <Image source={slide.image} style={styles.screenshotImage} resizeMode="contain" />
              </View>

              {/* Tag Badge */}
              <View style={[styles.tagBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{slide.tag}</Text>
              </View>

              {/* Title & Description */}
              <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
              <Text style={[styles.slideDesc, { color: colors.gray }]}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 18 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button Row */}
        <View style={styles.buttonRow}>
          {activeIndex < SLIDES.length - 1 ? (
            <TouchableOpacity style={styles.skipBtn} onPress={completeWalkthrough} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: colors.gray }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started 🚀' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 150,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -50,
    left: -50,
  },
  blob2: {
    width: 250,
    height: 250,
    bottom: 50,
    right: -50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  carouselContainer: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'center',
  },
  slideWidthWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideCard: {
    width: '100%',
    alignItems: 'center',
  },
  imageFrame: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.42,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#0F0F15',
    marginBottom: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    alignSelf: 'center',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skipPlaceholder: {
    width: 60,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
