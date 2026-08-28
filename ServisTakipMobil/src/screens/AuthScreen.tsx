import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons'; 
import { authService } from '../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (token: string, userData: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loginRole, setLoginRole] = useState<'Passenger' | 'Driver'>('Passenger');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleLogin = async () => {
    // 1. KONTROL: Alanlar boş mu?
    if (!email || !password) {
      Alert.alert('Uyarı', 'Lütfen email ve şifre alanlarını doldurun.');
      return; // Boşsa işlemi burada durdur
    }
    
    setLoading(true);
    
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      if (response.success && response.data) {
        onLoginSuccess(response.data, { email: email.trim() });
      } else {
        Alert.alert('Giriş Başarısız', response.message || 'Bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!agreedToTerms) return;
    if (!firstName || !lastName || !username || !email || !phone || !password) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.register({
        name: firstName.trim(),
        surname: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        password,
      });

      if (response.success) {
        Alert.alert('Başarılı', 'Kayıt tamamlandı. Şimdi giriş yapabilirsiniz.');
        setIsLoginView(true);
        setPassword('');
        setAgreedToTerms(false);
      } else {
        Alert.alert('Kayıt Başarısız', response.message || 'Kayıt tamamlanamadı.');
      }
    } catch {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGO BİLEŞENİ ───
  const Logo = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoBox}>
        <Ionicons name="bus-outline" size={28} color="#fff" />
      </View>
      <Text style={styles.logoTitle}>ShuttleTrack</Text>
      <Text style={styles.logoSubtitle}>Corporate Transit Portal</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {isLoginView ? (
          /* ═════════ L O G I N   V I E W ═════════ */
          <View style={styles.formWrapper}>
            <Logo />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Sign in to your account to continue</Text>

              {/* ROL SEÇİMİ (SEKME) */}
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity 
                  style={[styles.roleTab, loginRole === 'Passenger' && styles.roleTabActive]}
                  onPress={() => setLoginRole('Passenger')}
                >
                  <Text style={[styles.roleTabText, loginRole === 'Passenger' && styles.roleTabTextActive]}>
                    Personel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleTab, loginRole === 'Driver' && styles.roleTabActive]}
                  onPress={() => setLoginRole('Driver')}
                >
                  <Text style={[styles.roleTabText, loginRole === 'Driver' && styles.roleTabTextActive]}>
                    Şoför
                  </Text>
                </TouchableOpacity>
              </View>

              {/* E-MAIL */}
              <Text style={styles.inputLabel}>Email address</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* PASSWORD */}
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* LOGIN BUTTON */}
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Log In</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setIsLoginView(false)}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyright}>© 2026 ShuttleTrack · Secure access</Text>
          </View>
        ) : (
          /* ═════════ R E G I S T E R   V I E W ═════════ */
          <View style={styles.formWrapper}>
            <View style={styles.registerHeader}>
              <View style={[styles.logoBox, { width: 40, height: 40, borderRadius: 10, marginBottom: 16 }]}>
                <Ionicons name="bus-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.logoTitle}>ShuttleTrack</Text>
              <Text style={[styles.cardTitle, { fontSize: 26, marginTop: 4 }]}>Create your account</Text>
              <Text style={styles.cardSubtitle}>Get started with corporate transit in minutes.</Text>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.inputLabelUppercase}>FIRST NAME</Text>
                <View style={styles.inputContainer}>
                  <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Jane" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelUppercase}>LAST NAME</Text>
                <View style={styles.inputContainer}>
                  <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Doe" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
                </View>
              </View>
            </View>

            <Text style={styles.inputLabelUppercase}>USERNAME</Text>
            <View style={styles.inputContainer}>
              <Feather name="at-sign" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="janedoe42" placeholderTextColor="#9CA3AF" autoCapitalize="none" value={username} onChangeText={setUsername} />
            </View>

            <Text style={styles.inputLabelUppercase}>EMAIL</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="jane.doe@company.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>

            <Text style={styles.inputLabelUppercase}>PHONE NUMBER</Text>
            <View style={styles.inputContainer}>
              <Feather name="phone" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

            <Text style={styles.inputLabelUppercase}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Min. 8 characters" placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.termsContainer}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                {agreedToTerms && <Feather name="check" size={14} color="#2563EB" />}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>

            <TouchableOpacity style={[styles.primaryButton, !agreedToTerms && { backgroundColor: '#93C5FD' }]} onPress={handleRegister} disabled={!agreedToTerms || loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
            </TouchableOpacity>

            <View style={[styles.footer, { marginTop: 24 }]}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => setIsLoginView(true)}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formWrapper: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  
  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 40 },
  logoBox: { backgroundColor: '#2563EB', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  logoSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  // Card
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  
  // Role Toggle (Personel / Şoför)
  roleToggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 24 },
  roleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  roleTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  roleTabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  roleTabTextActive: { color: '#0F172A' },

  // Inputs
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  inputLabelUppercase: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#fff', marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotPassword: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginBottom: 8 },
  
  // Buttons
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#2563EB', fontSize: 14, fontWeight: 'bold' },
  copyright: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24 },

  // Register specifics
  registerHeader: { marginBottom: 16, marginTop: 40 },
  row: { flexDirection: 'row' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  termsText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  linkText: { color: '#2563EB', fontWeight: '500' },
});