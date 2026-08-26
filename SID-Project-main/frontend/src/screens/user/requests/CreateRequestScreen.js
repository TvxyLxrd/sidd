import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CreateRequestScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const priorities = [
    { id: 'low', label: 'Низкий', color: '#10B981', icon: 'flag-outline' },
    { id: 'medium', label: 'Средний', color: '#F59E0B', icon: 'flag' },
    { id: 'high', label: 'Высокий', color: '#EF4444', icon: 'warning-outline' },
  ];

  const categories = [
    { id: 'tech', label: 'Техническая поддержка', icon: 'hardware-chip' },
    { id: 'design', label: 'Дизайн', icon: 'color-palette' },
    { id: 'dev', label: 'Разработка', icon: 'code' },
    { id: 'content', label: 'Контент', icon: 'document-text' },
    { id: 'marketing', label: 'Маркетинг', icon: 'megaphone' },
    { id: 'analytics', label: 'Аналитика', icon: 'stats-chart' },
    { id: 'hr', label: 'HR', icon: 'people' },
    { id: 'other', label: 'Другое', icon: 'ellipsis-horizontal' },
  ];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Доступ запрещен', 'Разрешите доступ к галерее для прикрепления фото');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.uri.split('/').pop(),
          type: 'image'
        }));
        setAttachedImages([...attachedImages, ...newImages]);
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
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImage = {
          uri: result.assets[0].uri,
          name: 'photo.jpg',
          type: 'image'
        };
        setAttachedImages([...attachedImages, newImage]);
      }
    } catch (error) {
      console.error('Ошибка съемки фото:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: 'document',
          size: asset.size
        }));
        setAttachedFiles([...attachedFiles, ...newFiles]);
      }
    } catch (error) {
      console.error('Ошибка выбора документа:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать документ');
    }
  };

  const removeAttachment = (type, index) => {
    if (type === 'image') {
      const newImages = [...attachedImages];
      newImages.splice(index, 1);
      setAttachedImages(newImages);
    } else {
      const newFiles = [...attachedFiles];
      newFiles.splice(index, 1);
      setAttachedFiles(newFiles);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название заявки');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Ошибка', 'Введите описание заявки');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Ошибка', 'Выберите категорию');
      return;
    }

    setLoading(true);
    
    
    const requestData = {
      title,
      description,
      priority: selectedPriority,
      category: selectedCategory,
      attachments: {
        images: attachedImages,
        files: attachedFiles
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      number: `REQ-${Date.now().toString().slice(-6)}`
    };

   
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Успешно!',
        'Заявка создана и отправлена на рассмотрение',
        [
          { 
            text: 'OK', 
            onPress: () => {
              
              setTitle('');
              setDescription('');
              setSelectedPriority('medium');
              setSelectedCategory('');
              setAttachedImages([]);
              setAttachedFiles([]);
              navigation.goBack();
            }
          }
        ]
      );
    }, 1500);
  };

  const renderPriorityOption = (priority) => (
    <TouchableOpacity
      key={priority.id}
      style={[
        styles.priorityOption,
        selectedPriority === priority.id && styles.priorityOptionActive,
        { borderColor: priority.color }
      ]}
      onPress={() => setSelectedPriority(priority.id)}
    >
      <Ionicons 
        name={priority.icon} 
        size={20} 
        color={selectedPriority === priority.id ? '#fff' : priority.color} 
      />
      <Text style={[
        styles.priorityText,
        selectedPriority === priority.id && styles.priorityTextActive
      ]}>
        {priority.label}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryOption = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        selectedCategory === category.id && styles.categoryOptionActive
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory === category.id && styles.categoryIconActive
      ]}>
        <Ionicons 
          name={category.icon} 
          size={24} 
          color={selectedCategory === category.id ? '#fff' : '#6366F1'} 
        />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory === category.id && styles.categoryTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const renderAttachment = (attachment, index, type) => (
    <View key={index} style={styles.attachmentItem}>
      {type === 'image' ? (
        <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.documentIcon}>
          <Ionicons name="document" size={24} color="#6366F1" />
        </View>
      )}
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size && (
          <Text style={styles.attachmentSize}>{formatFileSize(attachment.size)}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.removeAttachmentButton}
        onPress={() => removeAttachment(type, index)}
      >
        <Ionicons name="close-circle" size={20} color="#EF4444" />
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
          <Text style={styles.headerTitle}>Новая заявка</Text>
          <View style={{ width: 44 }} />
        </View>

        
        <View style={styles.formContainer}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Название заявки *</Text>
            <TextInput
              style={styles.input}
              placeholder="Краткое описание задачи"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Подробное описание *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Опишите задачу максимально подробно. Укажите все детали, требования и сроки выполнения."
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{description.length}/2000</Text>
          </View>

          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Приоритет</Text>
            <View style={styles.priorityOptions}>
              {priorities.map(renderPriorityOption)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Категория *</Text>
            <View style={styles.categoryOptions}>
              {categories.map(renderCategoryOption)}
            </View>
          </View>

       
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Прикрепленные файлы</Text>
            
           
            {attachedImages.length > 0 && (
              <View style={styles.attachmentsList}>
                <Text style={styles.attachmentsTitle}>Фотографии ({attachedImages.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {attachedImages.map((img, index) => renderAttachment(img, index, 'image'))}
                </ScrollView>
              </View>
            )}

           
            {attachedFiles.length > 0 && (
              <View style={styles.attachmentsList}>
                <Text style={styles.attachmentsTitle}>Документы ({attachedFiles.length})</Text>
                {attachedFiles.map((file, index) => renderAttachment(file, index, 'document'))}
              </View>
            )}

           
            <View style={styles.attachmentButtons}>
              <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
                <Ionicons name="image" size={20} color="#6366F1" />
                <Text style={styles.attachmentButtonText}>Добавить фото</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentButton} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#6366F1" />
                <Text style={styles.attachmentButtonText}>Сделать фото</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color="#6366F1" />
                <Text style={styles.attachmentButtonText}>Прикрепить файл</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.attachmentHint}>
              Максимальный размер файла: 10MB. Поддерживаемые форматы: JPG, PNG, PDF, DOC, XLS
            </Text>
          </View>

         
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.infoText}>
              После создания заявки она будет отправлена на рассмотрение. Вы сможете отслеживать статус выполнения в разделе "Мои заявки".
            </Text>
          </View>

        
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Создать заявку</Text>
              </>
            )}
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 180,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 2,
  },
  priorityOptionActive: {
    backgroundColor: '#334155',
  },
  priorityText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  priorityTextActive: {
    color: '#fff',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryOption: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryIconActive: {
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#fff',
  },
  attachmentsList: {
    marginBottom: 16,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attachmentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#94A3B8',
  },
  removeAttachmentButton: {
    padding: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attachmentButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  attachmentHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
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
  createButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CreateRequestScreen;