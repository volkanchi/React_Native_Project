import { API_BASE_URL } from '@/constants/config';
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
} from 'react-native';

interface AuthScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
  if (!email || !password || (!isLogin && !fullName)) {
    Alert.alert('Uyarı', 'Lütfen tüm zorunlu alanları doldurun.');
    return;
  }

  setLoading(true);
  try {
    const endpoint = isLogin 
      ? `${API_BASE_URL}/api/Auth/login` 
      : `${API_BASE_URL}/api/Auth/register`;

    const payload = isLogin
      ? { email, password }
      : { fullName, email, password, phone, role: 'Passenger' };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Giriş yapılamadı.');
    }

    // data.token ve kullanıcı bilgisi döner
    onLoginSuccess(data.token, data.user || { email, fullName });

  } catch (error: any) {
    Alert.alert('Hata', error.message || 'Sunucuya bağlanılamadı.');
  } finally {
    setLoading(false);
  }
};
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Servis Takip</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Personel Girişi' : 'Personel Kayıt'}
        </Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}

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
            placeholder="Telefon (İsteğe bağlı)"
            value={phone}
            onChangeText={setPhone}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14 },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 18, alignItems: 'center' },
  switchText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});