// screens/admin/requests/AdminRequests.js
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
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const AdminRequests = ({ navigation }) => {
  const [requests, setRequests] = useState([]);

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const filters = [
    { id: 'all', label: 'Все', count: requests.length },
    { id: 'pending', label: 'Ожидание', count: 2 },
    { id: 'inProgress', label: 'В работе', count: 2 },
    { id: 'completed', label: 'Завершено', count: 1 },
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
      case 'completed': return 'Завершено';
      case 'pending': return 'Ожидание';
      default: return 'Неизвестно';
    }
  };

  const handleRequestAction = (requestId, action) => {
    switch (action) {
      case 'accept':
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'inProgress' } : req
        ));
        Alert.alert('Успешно', 'Заявка принята в работу');
        break;
      case 'reject':
        Alert.alert(
          'Отклонить заявку',
          'Укажите причину отклонения:',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Отправить', 
              onPress: () => {
                setRequests(requests.filter(req => req.id !== requestId));
                Alert.alert('Заявка отклонена', 'Клиент уведомлен');
              }
            }
          ]
        );
        break;
      case 'complete':
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'completed' } : req
        ));
        Alert.alert('Успешно', 'Заявка отмечена как завершенная');
        break;
    }
    setShowActionModal(false);
  };

  const handleStatusChange = (requestId, newStatus) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
    setShowStatusModal(false);
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = selectedFilter === 'all' || request.status === selectedFilter;
    const matchesSearch = searchQuery.length === 0 || 
      request.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderRequestItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('AdminRequestDetail', { request: item })}
      onLongPress={() => {
        setSelectedRequest(item);
        setShowActionModal(true);
      }}
    >
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.user.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.requestMeta}>
          <Text style={styles.amount}>{item.amount.toLocaleString()} ₽</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.requestBody}>
        <Text style={styles.serviceTitle}>{item.service}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.footerLeft}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий'}
            </Text>
          </View>
          {item.attachments > 0 && (
            <View style={styles.attachmentBadge}>
              <Ionicons name="attach" size={12} color="#8B5CF6" />
              <Text style={styles.attachmentText}>{item.attachments}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          onPress={() => {
            setSelectedRequest(item);
            setShowStatusModal(true);
          }}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionModal}>
              <Text style={styles.modalTitle}>Действия с заявкой</Text>
              <Text style={styles.modalSubtitle}>#{selectedRequest?.id} от {selectedRequest?.user}</Text>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRequestAction(selectedRequest.id, 'accept')}
              >
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Принять в работу</Text>
                  <Text style={styles.actionButtonSubtitle}>Начать выполнение заявки</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRequestAction(selectedRequest.id, 'complete')}
              >
                <Ionicons name="checkmark-done" size={24} color="#3B82F6" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Завершить</Text>
                  <Text style={styles.actionButtonSubtitle}>Отметить как выполненную</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRequestAction(selectedRequest.id, 'reject')}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Отклонить</Text>
                  <Text style={styles.actionButtonSubtitle}>Отправить клиенту уведомление</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.statusModal}>
              <Text style={styles.modalTitle}>Изменить статус</Text>
              
              <TouchableOpacity 
                style={[styles.statusOption, { borderColor: '#F59E0B' }]}
                onPress={() => handleStatusChange(selectedRequest.id, 'pending')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statusOptionText}>Ожидание</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.statusOption, { borderColor: '#3B82F6' }]}
                onPress={() => handleStatusChange(selectedRequest.id, 'inProgress')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.statusOptionText}>В работе</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.statusOption, { borderColor: '#10B981' }]}
                onPress={() => handleStatusChange(selectedRequest.id, 'completed')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statusOptionText}>Завершено</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
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
              <Text style={styles.headerTitle}>Управление заявками</Text>
              <Text style={styles.headerSubtitle}>Всего: {requests.length} заявок</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="#fff" />
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

        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Всего</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>284 500 ₽</Text>
            <Text style={styles.statLabel}>Выручка</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>64%</Text>
            <Text style={styles.statLabel}>Выполнено</Text>
          </View>
        </View>

        
        {filteredRequests.length > 0 ? (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={64} color="#334155" />
            <Text style={styles.emptyStateTitle}>Заявки не найдены</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет заявок в этом статусе'}
            </Text>
          </View>
        )}
      </View>

      {renderActionModal()}
      {renderStatusModal()}
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
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
    marginBottom: 16,
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
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
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
    color: '#8B5CF6',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#94A3B8',
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
  requestBody: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachmentText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminRequests;