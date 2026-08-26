import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authService } from '../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (token: string, user?: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State - Backend DTO'suna (UserRegisterDto) göre güncellendi
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async () => {
    // 1. Tip Güvenli Doğrulama (Validation)
    if (isLogin) {
      if (!email || !password) {
        Alert.alert('Uyarı', 'Lütfen e-posta ve şifrenizi girin.');
        return;
      }
    } else {
      if (!name || !surname || !username || !email || !password || !phoneNumber) {
        Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // 2. Merkezi Servis Çağrısı (Login)
        const result = await authService.login({ email, password });

        if (result.success && result.data) {
          // Başarılıysa dönen datayı (token) ana ekrana aktarıyoruz
          onLoginSuccess(result.data);
        } else {
          Alert.alert('Giriş Başarısız', result.message || 'Bilgilerinizi kontrol edin.');
        }
      } else {
        // 3. Merkezi Servis Çağrısı (Register)
        const result = await authService.register({
          name,
          surname,
          username,
          email,
          phoneNumber,
          password,
        });

        if (result.success) {
          Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı. Lütfen giriş yapın.');
          // Kayıt başarılıysa giriş ekranına yönlendir
          setIsLogin(true);
        } else {
          Alert.alert('Kayıt Başarısız', result.message || 'İşlem tamamlanamadı.');
        }
      }
    } catch (error: any) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Servis Takip</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Personel Girişi' : 'Personel Kayıt'}
          </Text>

          {/* Kayıt Modu Alanları */}
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ad"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Soyad"
                value={surname}
                onChangeText={setSurname}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </>
          )}

          {/* Ortak Alanlar */}
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? 'Hesabınız yok mu? Kayıt Olun'
                : 'Zaten hesabınız var mı? Giriş Yapın'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14 },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 18, alignItems: 'center' },
  switchText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});