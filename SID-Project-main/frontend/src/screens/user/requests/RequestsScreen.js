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
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
 ;

const RequestsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [requests, setRequests] = useState([]);

  const filters = [
    { id: 'all', label: 'Все', count: requests.length },
    { id: 'inProgress', label: 'В работе', count: 2 },
    { id: 'completed', label: 'Готово', count: 3 },
    { id: 'pending', label: 'Ожидание', count: 2 },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inProgress': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'inProgress': return 'В работе';
      case 'completed': return 'Готово';
      case 'pending': return 'Ожидание';
      default: return 'Неизвестно';
    }
  };

  const handleDeleteRequest = (requestId) => {
    Alert.alert(
      'Удаление заявки',
      'Вы уверены, что хотите удалить эту заявку?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            setRequests(requests.filter(req => req.id !== requestId));
          }
        }
      ]
    );
  };

  const handleChangeStatus = (requestId, newStatus) => {
    Alert.alert(
      'Изменение статуса',
      'Выберите новый статус заявки:',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'В работу', 
          onPress: () => updateRequestStatus(requestId, 'inProgress')
        },
        { 
          text: 'Готово', 
          onPress: () => updateRequestStatus(requestId, 'completed')
        },
        { 
          text: 'Ожидание', 
          onPress: () => updateRequestStatus(requestId, 'pending')
        }
      ]
    );
  };

  const updateRequestStatus = (requestId, newStatus) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = selectedFilter === 'all' || request.status === selectedFilter;
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderRequestItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetail', { request: item })}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestNumber}>{item.number}</Text>
          <Text style={styles.requestTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.requestCategory}>{item.category}</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleChangeStatus(item.id, item.status)}
          >
            <Ionicons name="refresh" size={18} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteRequest(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestDescription} numberOfLines={2}>{item.description}</Text>
      </View>
      
      <View style={styles.requestFooter}>
        <View style={styles.requestMeta}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <View style={styles.priorityInfo}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            <Text style={styles.priorityText}>
              {item.priority === 'high' ? 'Высокий' : 
               item.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
              <Text style={styles.headerTitle}>Мои заявки</Text>
              <Text style={styles.headerSubtitle}>Всего: {requests.length} заявок</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateRequestScreen')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по заявкам..."
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
          style={styles.filtersContainer}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedFilter === filter.id && styles.filterCountActive
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === filter.id && styles.filterCountTextActive
                ]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        
        {filteredRequests.length > 0 ? (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  Найдено {filteredRequests.length} заявок
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={64} color="#334155" />
            <Text style={styles.emptyStateTitle}>Заявки не найдены</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'У вас пока нет заявок в этом статусе'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('CreateRequestScreen')}
            >
              <Ionicons name="add" size={20} color="#6366F1" />
              <Text style={styles.emptyStateButtonText}>Создать первую заявку</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  filtersContainer: {
    marginBottom: 20,
  },
  filterChip: {
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
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  filterTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterCountActive: {
    backgroundColor: '#fff',
  },
  filterCountText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: '#6366F1',
  },
  listHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestNumber: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 22,
  },
  requestCategory: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    backgroundColor: '#6366F120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  requestActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  requestDetails: {
    marginBottom: 12,
  },
  requestDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestMeta: {
    flex: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 6,
  },
  priorityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyStateButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RequestsScreen;