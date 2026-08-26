import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Ошибка', 'Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setLoading(true);
    
    
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Успешно',
        'Пароль успешно изменен',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const PasswordInput = ({ 
    placeholder, 
    value, 
    onChangeText, 
    showPassword, 
    setShowPassword,
    secureTextEntry 
  }) => (
    <View style={styles.inputContainer}>
      <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={() => setShowPassword(!showPassword)}
      >
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#94A3B8"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Смена пароля</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#6366F1" />
            <Text style={styles.infoText}>
              Для безопасности рекомендуем использовать сложный пароль с буквами, цифрами и специальными символами.
            </Text>
          </View>

          <Text style={styles.label}>Текущий пароль</Text>
          <PasswordInput
            placeholder="Введите текущий пароль"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
          />

          <Text style={styles.label}>Новый пароль</Text>
          <PasswordInput
            placeholder="Введите новый пароль"
            value={newPassword}
            onChangeText={setNewPassword}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
          />

          <Text style={styles.label}>Подтвердите пароль</Text>
          <PasswordInput
            placeholder="Повторите новый пароль"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
          />

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Требования к паролю:</Text>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={newPassword.length >= 6 ? '#10B981' : '#94A3B8'} 
              />
              <Text style={[styles.requirementText, newPassword.length >= 6 && styles.requirementMet]}>
                Минимум 6 символов
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword === confirmPassword && newPassword ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={newPassword === confirmPassword && newPassword ? '#10B981' : '#94A3B8'} 
              />
              <Text style={[styles.requirementText, newPassword === confirmPassword && newPassword && styles.requirementMet]}>
                Пароли совпадают
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Изменить пароль</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Забыли текущий пароль?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 12,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  requirements: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  requirementText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#10B981',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChangePasswordScreen;