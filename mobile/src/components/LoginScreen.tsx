import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  Text, 
  Pressable, 
  ActivityIndicator, 
  Modal, 
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Boxes, Eye, EyeOff, AlertCircle, X } from 'lucide-react-native';
import * as api from '@/services/api';
import { useAuth } from '@/components/AuthContext';
import { Colors, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await api.login({ username, password });
      await login(res.token, res.role);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock OAuth for developer testing (dispatches correct OAuth payloads directly to backend /oauth route)
  const handleMockOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError('');
    
    // Simulating login payload for different user roles mapped to sqlite DB
    const email = provider === 'google' 
      ? 'admin.google@roboticsclub.org' 
      : 'member.github@roboticsclub.org';
    const name = provider === 'google' ? 'Google Admin' : 'GitHub Member';

    try {
      const res = await api.oauthLogin({ email, name });
      await login(res.token, res.role);
    } catch (err: any) {
      setError(err.response?.data?.error || `OAuth Sign In with ${provider} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = scheme === 'dark';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Neon blur shapes behind layout */}
        <LinearGradient 
          colors={isDark ? ['#ff4b892a', 'transparent'] : ['#ff4b8915', 'transparent']} 
          style={[styles.neonBlob, styles.neonPink]}
        />
        <LinearGradient 
          colors={isDark ? ['#4a8eff1e', 'transparent'] : ['#4a8eff10', 'transparent']} 
          style={[styles.neonBlob, styles.neonBlue]}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <SafeAreaView style={styles.formContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Brand Header */}
              <View style={styles.brandContainer}>
                <View style={[styles.logoBox, { backgroundColor: isDark ? '#ffffff10' : '#0000000a' }]}>
                  <Boxes size={36} color={colors.text} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter credentials to access the Inventory Dashboard
                </Text>
              </View>

              {/* Error Toast */}
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: isDark ? '#dc262620' : '#fef2f2' }]}>
                  <AlertCircle size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={() => setError('')}>
                    <X size={16} color="#dc2626" />
                  </Pressable>
                </View>
              ) : null}

              {/* Inputs */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Username or Email</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    placeholder="Enter your username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoComplete="username"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.passwordField, { borderColor: colors.backgroundSelected }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Submit */}
              <Pressable 
                onPress={handleLogin} 
                style={({ pressed }) => [
                  styles.submitBtn, 
                  { backgroundColor: colors.text, opacity: pressed || isLoading ? 0.8 : 1 }
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.background }]}>Sign In</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.backgroundSelected }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.backgroundSelected }]} />
              </View>

              {/* OAuth Buttons */}
              <View style={styles.oauthContainer}>
                <Pressable 
                  onPress={() => handleMockOAuth('google')}
                  style={({ pressed }) => [
                    styles.oauthBtn, 
                    { borderColor: colors.backgroundSelected, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={[styles.oauthText, { color: colors.text }]}>Sign In with Google</Text>
                </Pressable>

                <Pressable 
                  onPress={() => handleMockOAuth('github')}
                  style={({ pressed }) => [
                    styles.oauthBtn, 
                    styles.oauthBtnGithub,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={styles.oauthTextGithub}>Sign In with GitHub</Text>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Pressable onPress={() => setActiveModal('privacy')}>
                  <Text style={[styles.footerLink, { color: colors.textSecondary }]}>PRIVACY</Text>
                </Pressable>
                <View style={[styles.footerDot, { backgroundColor: colors.textSecondary }]} />
                <Pressable onPress={() => setActiveModal('terms')}>
                  <Text style={[styles.footerLink, { color: colors.textSecondary }]}>TERMS</Text>
                </Pressable>
              </View>

            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Modal Overlay for Terms/Privacy */}
        <Modal
          visible={activeModal !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </Text>
                <Pressable onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                  <X size={20} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {activeModal === 'privacy' ? (
                  <View style={styles.policyTextWrapper}>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>1. Data Collection</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      Robotics & Software Club collects minimal data necessary to facilitate the Inventory Management System, primarily your authentication markers (email, username) and component check-out histories.
                    </Text>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>2. Single Sign-On (SSO)</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      When linking authentication providers like Google or GitHub, we only retrieve your primary public profile details for authorization mapping.
                    </Text>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>3. Token Security</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      Live session tokens are persistently stored via secure device storage and explicitly govern API endpoint handshakes. We do not track cross-site tracking markers.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.policyTextWrapper}>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>1. Fair Use</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      You agree to check out hardware and inventory strictly for club, academic, or sanctioned hackathon pursuits. Commercial misuse of Robotics & Software Club property is strictly forbidden.
                    </Text>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>2. Liability & Returns</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      Members assume full responsibility for the condition of checked-out assets. Items must be returned by their specified deadline to avoid dashboard delinquency locks.
                    </Text>
                    <Text style={[styles.policyHeader, { color: colors.text }]}>3. System Abuse</Text>
                    <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                      Reverse-engineering the Inventory Dashboard APIs, exploiting SSO vulnerabilities, or attempting privilege escalation into Admin/Manager routes will result in immediate club termination.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  neonBlob: {
    position: 'absolute',
    borderRadius: 999,
    width: 300,
    height: 300,
    opacity: 0.8,
  },
  neonPink: {
    top: -50,
    left: -50,
  },
  neonBlue: {
    bottom: -50,
    right: -50,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoBox: {
    padding: Spacing.two,
    borderRadius: 16,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  passwordField: {
    flexDirection: 'row',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.three,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  oauthContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  oauthBtn: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oauthText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  oauthBtnGithub: {
    backgroundColor: '#24292e',
    borderColor: '#24292e',
  },
  oauthTextGithub: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  footerLink: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalContent: {
    padding: Spacing.three,
  },
  policyTextWrapper: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  policyHeader: {
    fontSize: 14,
    fontWeight: '700',
  },
  policyBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
