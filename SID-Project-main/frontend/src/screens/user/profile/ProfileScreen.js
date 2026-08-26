import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  
  const [userData, setUserData] = useState({
    firstName: 'Александр',
    lastName: 'Иванов',
    email: 'alexander.ivanov@example.com',
    phone: '+7 (999) 123-45-67',
    position: 'Менеджер проектов',
    department: 'Разработка',
    joinDate: '15 марта 2022',
  });

  const [originalData, setOriginalData] = useState({ ...userData });
  const [avatarUri, setAvatarUri] = useState('https://randomuser.me/api/portraits/men/32.jpg');
  const [tempAvatar, setTempAvatar] = useState(null);

 
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Доступ запрещен', 'Разрешите доступ к галерее для смены фото');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setTempAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Доступ запрещен', 'Разрешите доступ к камере для съемки фото');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setTempAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Ошибка съемки фото:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
     
      setUserData({ ...originalData });
      setTempAvatar(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setLoading(true);
    
    
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      Alert.alert('Ошибка', 'Имя и фамилия обязательны для заполнения');
      setLoading(false);
      return;
    }

    if (!userData.email.includes('@')) {
      Alert.alert('Ошибка', 'Введите корректный email');
      setLoading(false);
      return;
    }

    
    setTimeout(() => {
      setOriginalData({ ...userData });
      if (tempAvatar) {
        setAvatarUri(tempAvatar);
        setTempAvatar(null);
      }
      setIsEditing(false);
      setLoading(false);
      
      Alert.alert(
        'Успешно',
        'Данные профиля обновлены',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handlePrivacySettings = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удаление аккаунта',
      'Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Аккаунт удален', 'Ваш аккаунт будет удален в течение 24 часов');
          }
        }
      ]
    );
  };

  const renderAvatarSection = () => (
    <View style={styles.avatarSection}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={isEditing ? pickImage : null}
        disabled={!isEditing}
      >
        <Image 
          source={{ uri: tempAvatar || avatarUri }} 
          style={styles.avatar}
        />
        {isEditing && (
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      
      {isEditing && (
        <View style={styles.avatarActions}>
          <TouchableOpacity style={styles.avatarActionButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={18} color="#6366F1" />
            <Text style={styles.avatarActionText}>Галерея</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarActionButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={18} color="#6366F1" />
            <Text style={styles.avatarActionText}>Камера</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.nameContainer}>
        {isEditing ? (
          <View style={styles.nameInputs}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={userData.firstName}
              onChangeText={(text) => setUserData({...userData, firstName: text})}
              placeholder="Имя"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={userData.lastName}
              onChangeText={(text) => setUserData({...userData, lastName: text})}
              placeholder="Фамилия"
              placeholderTextColor="#64748B"
            />
          </View>
        ) : (
          <>
            <Text style={styles.userName}>{userData.firstName} {userData.lastName}</Text>
            <Text style={styles.userPosition}>{userData.position}</Text>
          </>
        )}
      </View>
    </View>
  );

  const renderInfoCard = (icon, title, value, field, keyboardType = 'default') => (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#6366F1" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={userData[field]}
            onChangeText={(text) => setUserData({...userData, [field]: text})}
            placeholder={title}
            placeholderTextColor="#64748B"
            keyboardType={keyboardType}
          />
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Активность</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
            <MaterialIcons name="assignment" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Всего заявок</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark-done" size={24} color="#10B981" />
          </View>
          <Text style={styles.statValue}>89</Text>
          <Text style={styles.statLabel}>Завершено</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="time" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>42</Text>
          <Text style={styles.statLabel}>Дней в системе</Text>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>Настройки</Text>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
        <View style={styles.actionButtonContent}>
          <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
            <Ionicons name="key-outline" size={20} color="#6366F1" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Сменить пароль</Text>
            <Text style={styles.actionSubtitle}>Обновите пароль для безопасности</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handlePrivacySettings}>
        <View style={styles.actionButtonContent}>
          <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Конфиденциальность</Text>
            <Text style={styles.actionSubtitle}>Настройки приватности данных</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionButtonContent}>
          <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Уведомления</Text>
            <Text style={styles.actionSubtitle}>Настройте оповещения</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionButtonContent}>
          <View style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="language-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Язык и регион</Text>
            <Text style={styles.actionSubtitle}>Русский / Москва</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      
      <Animated.View style={[styles.container, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
      
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Профиль</Text>
            <TouchableOpacity 
              style={[styles.editButton, isEditing && styles.editButtonActive]}
              onPress={handleEditToggle}
              disabled={loading}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Отмена' : 'Редактировать'}
              </Text>
            </TouchableOpacity>
          </View>

          {renderAvatarSection()}
          
        
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Личная информация</Text>
            
            {renderInfoCard('mail-outline', 'Email', userData.email, 'email', 'email-address')}
            {renderInfoCard('call-outline', 'Телефон', userData.phone, 'phone', 'phone-pad')}
            {renderInfoCard('briefcase-outline', 'Должность', userData.position, 'position')}
            {renderInfoCard('business-outline', 'Отдел', userData.department, 'department')}
            {renderInfoCard('calendar-outline', 'Дата регистрации', userData.joinDate, 'joinDate')}
          </View>

          {renderStats()}
          {renderActions()}

         
          <View style={styles.bottomActions}>
            {isEditing ? (
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                >
                  <Ionicons name="trash-outline" size={20} color="#94A3B8" />
                  <Text style={styles.deleteButtonText}>Удалить аккаунт</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Версия приложения 1.0.0</Text>
            <Text style={styles.footerText}>Последнее обновление: 15.03.2024</Text>
          </View>
        </ScrollView>
      </Animated.View>

      
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Выйти из аккаунта?</Text>
            <Text style={styles.modalMessage}>
              Вы уверены, что хотите выйти? Для повторного входа потребуется ввести email и пароль.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonConfirm}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonConfirmText}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  editButtonActive: {
    backgroundColor: '#334155',
  },
  editButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.7)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarActionText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  nameContainer: {
    alignItems: 'center',
  },
  nameInputs: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  nameInput: {
    width: '48%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 16,
    color: '#94A3B8',
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    padding: 0,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomActions: {
    marginBottom: 30,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
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
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF444420',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deleteButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#334155',
    marginRight: 8,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    marginLeft: 8,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;