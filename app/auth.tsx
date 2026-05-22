import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { AppleLogo, GoogleLogo } from '../components/social-logos';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';
import { GOOGLE_WEB_CLIENT_ID } from '../lib/firebase';

// Required for expo-auth-session to properly close the browser on Android
WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { signIn, signUp, googleSignIn } = useAuth();

  // expo-auth-session Google provider
  // construct the redirect URI once so we can register it with Google and
  // log it during development.
  const redirectUri = makeRedirectUri({ scheme: 'careerpath' });

  const showRedirectUri = () => {
    console.log('Google redirect URI:', redirectUri);
    Alert.alert('Redirect URI', redirectUri);
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated tab indicator
  const tabAnim = useRef(new Animated.Value(0)).current;

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
      // Route to onboarding
      router.replace('/onboarding');
    } catch (error: any) {
      const msg = firebaseErrorMessage(error.code);
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle the OAuth response from Google
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        setLoading(true);
        googleSignIn(idToken)
          .then(() => {
            router.replace('/onboarding');
          })
          .catch((error: any) => {
            const msg = firebaseErrorMessage(error.code);
            Alert.alert('Google Sign-In Error', msg);
          })
          .finally(() => setLoading(false));
      } else {
        Alert.alert('Google Sign-In', 'Could not retrieve ID token from Google. Please try again.');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In', response.error?.message ?? 'An error occurred during Google sign-in.');
    }
  }, [response]);

  const handleGoogleAuth = async () => {
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('Google Sign-In', err.message ?? 'Failed to open Google sign-in.');
    }
  };

  const handleAppleAuth = async () => {
    Alert.alert(
      'Apple Sign-In',
      'Apple authentication is only supported on iOS 13+ and requires additional expo-apple-authentication setup.',
    );
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
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoMarkText}>C</Text>
            </View>
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
            <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Animated.View style={[styles.tabIndicator, {
                backgroundColor: colors.primary,
                left: tabIndicatorLeft,
              }]} />
              <TouchableOpacity
                onPress={() => switchMode('login')}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.gray }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchMode('signup')}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: mode === 'signup' ? '#FFF' : colors.gray }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
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
                    <Text style={styles.inputIcon}>👤</Text>
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
                  <Text style={styles.inputIcon}>✉️</Text>
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
                  <Text style={styles.inputIcon}>🔒</Text>
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
                    <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
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
                    <Text style={styles.inputIcon}>🔏</Text>
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
                      <Text style={{ fontSize: 16 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Primary CTA Button */}
              <TouchableOpacity
                onPress={handleEmailAuth}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {mode === 'login' ? 'Sign In →' : 'Create Account →'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerLabel, { color: colors.gray }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  onPress={handleGoogleAuth}
                  disabled={loading}
                  style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <GoogleLogo size={20} color="#000" />
                  <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAppleAuth}
                  disabled={loading}
                  style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  activeOpacity={0.7}
                >
                  <AppleLogo size={20} color={colors.text} />
                  <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
                </TouchableOpacity>
              </View>
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
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0 8px 16px rgba(124, 58, 237, 0.4)',
    elevation: 8,
  },
  logoMarkText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
    elevation: 12,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 14,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    fontSize: 17,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0 8px 16px rgba(124, 58, 237, 0.35)',
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
