import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { mode: paramMode } = useLocalSearchParams<{ mode: string }>();
  const { signIn, signUp } = useAuth();

  const initialMode = (paramMode === 'signup' || paramMode === 'register') ? 'signup' : 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated tab indicator
  const tabAnim = useRef(new Animated.Value(initialMode === 'signup' ? 1 : 0)).current;

  // React to parameter changes if screen is already mounted
  useEffect(() => {
    console.log('auth.tsx: paramMode is', paramMode);
    if (paramMode === 'signup' || paramMode === 'register' || paramMode === 'login') {
      const targetMode = (paramMode === 'signup' || paramMode === 'register') ? 'signup' : 'login';
      setMode(targetMode);
      Animated.spring(tabAnim, {
        toValue: targetMode === 'login' ? 0 : 1,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [paramMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    Animated.spring(tabAnim, {
      toValue: newMode === 'login' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        Alert.alert('Missing name', 'Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password mismatch', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (error: any) {
      const msg = firebaseErrorMessage(error.code);
      Alert.alert('Authentication Error', msg);
      setLoading(false);
    }
  };

  const firebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email format.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Background decorative gradient blobs */}
      <View style={styles.blobContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1, { backgroundColor: isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.08)' }]} />
        <View style={[styles.blob, styles.blob2, { backgroundColor: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.06)' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoMarkImage}
              resizeMode="contain"
            />
            <Text style={[styles.brandName, { color: colors.text }]}>CareerPath AI</Text>
            <Text style={[styles.tagline, { color: colors.gray }]}>
              {mode === 'login' ? 'Welcome back! Continue your journey.' : 'Start your AI-powered career journey.'}
            </Text>
          </View>

          {/* Auth Card */}
          <View style={[styles.card, {
            backgroundColor: isDark ? 'rgba(26,26,39,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: colors.cardBorder,
            shadowColor: colors.shadow,
          }]}>
            {/* Tab Switcher */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.tabBtn}
                onPress={() => switchMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, {
                  color: mode === 'login' ? colors.primary : colors.gray,
                  fontWeight: mode === 'login' ? '800' : '600',
                }]}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabBtn}
                onPress={() => switchMode('signup')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, {
                  color: mode === 'signup' ? colors.primary : colors.gray,
                  fontWeight: mode === 'signup' ? '800' : '600',
                }]}>
                  Register
                </Text>
              </TouchableOpacity>

              <Animated.View style={[styles.tabIndicator, {
                backgroundColor: colors.primary,
                left: tabIndicatorLeft,
              }]} />
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Full Name — only on signup */}
              {mode === 'signup' && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                  <View style={[styles.inputWrapper, {
                    borderColor: focusedField === 'name' ? colors.primary : colors.border,
                    backgroundColor: colors.background,
                  }]}>
                    <Feather name="user" size={18} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.grayLight}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!loading}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                <View style={[styles.inputWrapper, {
                  borderColor: focusedField === 'email' ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                }]}>
                  <Feather name="mail" size={18} color={colors.gray} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.grayLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={[styles.inputWrapper, {
                  borderColor: focusedField === 'password' ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                }]}>
                  <Feather name="lock" size={18} color={colors.gray} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.grayLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                {mode === 'login' && (
                  <TouchableOpacity style={styles.forgotBtn}>
                    <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Confirm Password — signup only */}
              {mode === 'signup' && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, {
                    borderColor: focusedField === 'confirm' ? colors.primary : colors.border,
                    backgroundColor: colors.background,
                  }]}>
                    <Feather name="shield" size={18} color={colors.gray} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.grayLight}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                      <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} color={colors.gray} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Primary CTA Button */}
              <TouchableOpacity
                onPress={handleEmailAuth}
                disabled={loading}
                style={[styles.submitBtn, {
                  backgroundColor: colors.primary,
                  boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
                }]}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={[styles.footerText, { color: colors.gray }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
  },
  blob2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMarkImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    elevation: 4,
    marginBottom: 24,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginBottom: 24,
    position: 'relative',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1.5,
    width: '50%',
    height: 3,
    borderRadius: 2,
  },
  form: {
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 3,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
});
