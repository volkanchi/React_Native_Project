import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface ProfileUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function ProfileUpdateModal({ visible, onClose, onProfileUpdated }: ProfileUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form stateleri (Şifre hariç değiştirilebilir alanlar)
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (visible) {
      loadProfileData();
    }
  }, [visible]);

  const loadProfileData = async () => {
    setLoading(true);
    const token = await storageService.getToken();
    if (token) {
      const response = await authService.getProfile(token);
      if (response.success && response.data) {
        setName(response.data.name || '');
        setSurname(response.data.surname || '');
        setPhone(response.data.phoneNumber || '');
      }
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!name || !surname || !phone) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setSaving(true);
    const token = await storageService.getToken();
    if (token) {
      const response = await authService.updateProfile({
        name: name,
        surname: surname,
        phoneNumber: phone
      }, token);

      if (response.success) {
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
        onProfileUpdated();
        onClose();
      } else {
        Alert.alert('Hata', response.message || 'Güncelleme başarısız oldu.');
      }
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Profilimi Güncelle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Ad</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Adınız" />

              <Text style={styles.label}>Soyad</Text>
              <TextInput style={styles.input} value={surname} onChangeText={setSurname} placeholder="Soyadınız" />

              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="05XX XXX XX XX" />

              <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '50%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeBtn: { padding: 4 },
  form: { gap: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: -8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 50, color: '#111827' },
  saveButton: { backgroundColor: '#2563EB', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});