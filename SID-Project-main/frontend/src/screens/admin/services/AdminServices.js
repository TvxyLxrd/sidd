// screens/admin/services/AdminServices.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const AdminServices = ({ navigation }) => {
  const [services, setServices] = useState([]);

  const [categories] = useState([
    { id: 'all', name: 'Все', count: 6 },
    { id: 'Разработка', name: 'Разработка', count: 1 },
    { id: 'Дизайн', name: 'Дизайн', count: 2 },
    { id: 'Поддержка', name: 'Поддержка', count: 1 },
    { id: 'Консультации', name: 'Консультации', count: 1 },
    { id: 'Маркетинг', name: 'Маркетинг', count: 1 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: '',
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Разработка': return '#8B5CF6';
      case 'Дизайн': return '#EC4899';
      case 'Поддержка': return '#10B981';
      case 'Консультации': return '#3B82F6';
      case 'Маркетинг': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  const getPopularityColor = (popularity) => {
    if (popularity >= 80) return '#10B981';
    if (popularity >= 60) return '#3B82F6';
    if (popularity >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const handleServiceAction = (serviceId, action) => {
    switch (action) {
      case 'toggleStatus':
        setServices(services.map(service => 
          service.id === serviceId ? { 
            ...service, 
            status: service.status === 'active' ? 'inactive' : 'active' 
          } : service
        ));
        break;
      case 'edit':
        setSelectedService(services.find(s => s.id === serviceId));
        setIsEditing(true);
        setShowServiceModal(true);
        break;
      case 'delete':
        Alert.alert(
          'Удалить услугу',
          'Вы уверены? Это действие нельзя отменить.',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Удалить', 
              style: 'destructive',
              onPress: () => {
                setServices(services.filter(service => service.id !== serviceId));
                Alert.alert('Услуга удалена');
              }
            }
          ]
        );
        break;
    }
  };

  const handleSaveService = () => {
    if (!newService.title || !newService.description || !newService.category || !newService.price) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    if (isEditing) {
      setServices(services.map(service => 
        service.id === selectedService.id ? {
          ...service,
          ...newService,
          price: parseInt(newService.price),
        } : service
      ));
      Alert.alert('Успешно', 'Услуга обновлена');
    } else {
      const newId = Math.max(...services.map(s => s.id)) + 1;
      setServices([...services, {
        id: newId,
        ...newService,
        price: parseInt(newService.price),
        status: 'active',
        popularity: 50,
        orders: 0,
      }]);
      Alert.alert('Успешно', 'Новая услуга добавлена');
    }

    setNewService({
      title: '',
      description: '',
      category: '',
      price: '',
      duration: '',
    });
    setIsEditing(false);
    setShowServiceModal(false);
    setShowAddModal(false);
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => {
        setSelectedService(item);
        setShowServiceModal(true);
      }}
    >
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                {item.category}
              </Text>
            </View>
          </View>
          <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <TouchableOpacity 
          style={styles.serviceMenu}
          onPress={() => handleServiceAction(item.id, 'edit')}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.serviceStats}>
        <View style={styles.statItem}>
          <Ionicons name="cash" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.price.toLocaleString()} ₽</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.popularity}%</Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.ordersBadge}>
            <Text style={styles.ordersText}>{item.orders} заказов</Text>
          </View>
          <View style={[styles.popularityBar, { width: `${item.popularity}%` }]} />
        </View>
        <View style={styles.footerRight}>
          <Switch
            value={item.status === 'active'}
            onValueChange={() => handleServiceAction(item.id, 'toggleStatus')}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderServiceModal = () => (
    <Modal
      visible={showServiceModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowServiceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.serviceModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Редактирование услуги' : 'Детали услуги'}
            </Text>
            <TouchableOpacity onPress={() => setShowServiceModal(false)}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <>
              <View style={styles.serviceInfoSection}>
                <Text style={styles.infoLabel}>Название услуги</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={newService.title || selectedService.title}
                    onChangeText={(text) => setNewService({...newService, title: text})}
                    placeholder="Введите название"
                    placeholderTextColor="#64748B"
                  />
                ) : (
                  <Text style={styles.infoValue}>{selectedService.title}</Text>
                )}

                <Text style={styles.infoLabel}>Описание</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={newService.description || selectedService.description}
                    onChangeText={(text) => setNewService({...newService, description: text})}
                    placeholder="Введите описание"
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                ) : (
                  <Text style={styles.infoValue}>{selectedService.description}</Text>
                )}

                <Text style={styles.infoLabel}>Категория</Text>
                {isEditing ? (
                  <View style={styles.categorySelect}>
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          (newService.category || selectedService.category) === category.name && 
                          styles.categoryOptionActive
                        ]}
                        onPress={() => setNewService({...newService, category: category.name})}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          (newService.category || selectedService.category) === category.name && 
                          styles.categoryOptionTextActive
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedService.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(selectedService.category) }]}>
                      {selectedService.category}
                    </Text>
                  </View>
                )}

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.infoLabel}>Цена</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={newService.price || selectedService.price.toString()}
                        onChangeText={(text) => setNewService({...newService, price: text})}
                        placeholder="0"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{selectedService.price.toLocaleString()} ₽</Text>
                    )}
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.infoLabel}>Срок</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={newService.duration || selectedService.duration}
                        onChangeText={(text) => setNewService({...newService, duration: text})}
                        placeholder="Например: 14 дней"
                        placeholderTextColor="#64748B"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{selectedService.duration}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.infoLabel}>Популярность</Text>
                    <View style={styles.popularityContainer}>
                      <View style={[styles.popularityBarFull, { backgroundColor: getPopularityColor(selectedService.popularity) + '20' }]}>
                        <View style={[
                          styles.popularityBarFill,
                          { 
                            width: `${selectedService.popularity}%`,
                            backgroundColor: getPopularityColor(selectedService.popularity)
                          }
                        ]} />
                      </View>
                      <Text style={[styles.popularityText, { color: getPopularityColor(selectedService.popularity) }]}>
                        {selectedService.popularity}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.infoLabel}>Заказов</Text>
                    <Text style={styles.infoValue}>{selectedService.orders}</Text>
                  </View>
                </View>

                <Text style={styles.infoLabel}>Статус</Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedService.status === 'active' ? '#10B98120' : '#EF444420' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: selectedService.status === 'active' ? '#10B981' : '#EF4444' }
                    ]}>
                      {selectedService.status === 'active' ? 'Активна' : 'Неактивна'}
                    </Text>
                  </View>
                  <Switch
                    value={selectedService.status === 'active'}
                    onValueChange={() => handleServiceAction(selectedService.id, 'toggleStatus')}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                {isEditing ? (
                  <>
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={handleSaveService}
                    >
                      <Ionicons name="save" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Сохранить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsEditing(false);
                        setNewService({
                          title: '',
                          description: '',
                          category: '',
                          price: '',
                          duration: '',
                        });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        setIsEditing(true);
                        setNewService({
                          title: selectedService.title,
                          description: selectedService.description,
                          category: selectedService.category,
                          price: selectedService.price.toString(),
                          duration: selectedService.duration,
                        });
                      }}
                    >
                      <Ionicons name="create" size={20} color="#3B82F6" />
                      <Text style={styles.actionButtonText}>Редактировать</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { borderColor: '#EF444420' }]}
                      onPress={() => handleServiceAction(selectedService.id, 'delete')}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                      <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Удалить</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = searchQuery.length === 0 || 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalStats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.status === 'active').length,
    totalRevenue: services.reduce((sum, service) => sum + (service.price * service.orders), 0),
    // Пустой список даёт деление на ноль — показываем 0, а не NaN
    avgPopularity: services.length
      ? (services.reduce((sum, service) => sum + service.popularity, 0) / services.length).toFixed(0)
      : '0',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Услуги</Text>
              <Text style={styles.headerSubtitle}>Всего: {services.length} услуг</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="briefcase" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{totalStats.totalServices}</Text>
              <Text style={styles.statLabel}>Всего услуг</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{totalStats.activeServices}</Text>
              <Text style={styles.statLabel}>Активных</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="trending-up" size={20} color="#F59E0B" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{totalStats.avgPopularity}%</Text>
              <Text style={styles.statLabel}>Популярность</Text>
            </View>
          </View>
        </View>

      
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск услуг..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

       
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive
              ]}>
                {category.name}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === category.id && styles.categoryCountActive
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  selectedCategory === category.id && styles.categoryCountTextActive
                ]}>
                  {category.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        
        {filteredServices.length > 0 ? (
          <FlatList
            data={filteredServices}
            renderItem={renderServiceItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#334155" />
            <Text style={styles.emptyStateTitle}>Услуги не найдены</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет услуг в этой категории'}
            </Text>
          </View>
        )}
      </View>

      {renderServiceModal()}

      
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.addModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавить новую услугу</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Название услуги *</Text>
              <TextInput
                style={styles.formInput}
                value={newService.title}
                onChangeText={(text) => setNewService({...newService, title: text})}
                placeholder="Введите название услуги"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.formLabel}>Описание *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newService.description}
                onChangeText={(text) => setNewService({...newService, description: text})}
                placeholder="Подробное описание услуги"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.formLabel}>Категория *</Text>
              <View style={styles.categorySelect}>
                {categories.filter(c => c.id !== 'all').map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      newService.category === category.name && styles.categoryOptionActive
                    ]}
                    onPress={() => setNewService({...newService, category: category.name})}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newService.category === category.name && styles.categoryOptionTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Цена (₽) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newService.price}
                    onChangeText={(text) => setNewService({...newService, price: text})}
                    placeholder="0"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Срок выполнения</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newService.duration}
                    onChangeText={(text) => setNewService({...newService, duration: text})}
                    placeholder="Например: 14 дней"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveService}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Добавить услугу</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewService({
                    title: '',
                    description: '',
                    category: '',
                    price: '',
                    duration: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryChipText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryCount: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryCountActive: {
    backgroundColor: '#fff',
  },
  categoryCountText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCountTextActive: {
    color: '#8B5CF6',
  },
  listContent: {
    paddingBottom: 100,
  },
  serviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  serviceMenu: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
    marginRight: 12,
  },
  ordersBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  ordersText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  popularityBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  popularityBarFull: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  popularityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  popularityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRight: {
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serviceModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  addModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  serviceInfoSection: {
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 24,
  },
  editInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  editTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryOptionActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 6,
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  formContainer: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  formGroup: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default AdminServices;