// screens/admin/users/AdminUsers.js
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const AdminUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const roles = [
    { id: 'all', label: 'Все', count: users.length },
    { id: 'client', label: 'Клиенты', count: 5 },
    { id: 'admin', label: 'Админы', count: 1 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#94A3B8';
      case 'blocked': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'blocked': return 'Заблокирован';
      default: return 'Неизвестно';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#8B5CF6';
      case 'client': return '#3B82F6';
      default: return '#94A3B8';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'client': return 'Клиент';
      default: return 'Пользователь';
    }
  };

  const handleUserAction = (userId, action) => {
    switch (action) {
      case 'block':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'blocked' } : user
        ));
        Alert.alert('Успешно', 'Пользователь заблокирован');
        break;
      case 'unblock':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        ));
        Alert.alert('Успешно', 'Пользователь разблокирован');
        break;
      case 'delete':
        Alert.alert(
          'Удалить пользователя',
          'Вы уверены? Это действие нельзя отменить.',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Удалить', 
              style: 'destructive',
              onPress: () => {
                setUsers(users.filter(user => user.id !== userId));
                Alert.alert('Пользователь удален');
              }
            }
          ]
        );
        break;
      case 'makeAdmin':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: 'admin' } : user
        ));
        Alert.alert('Успешно', 'Пользователь назначен администратором');
        break;
    }
    setShowUserModal(false);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {getRoleText(item.role)}
              </Text>
            </View>
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.joinDate}>Зарегистрирован: {item.joinDate}</Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.requests} заявок</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cash" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.totalSpent.toLocaleString()} ₽</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#94A3B8" />
          <Text style={styles.statText}>{item.lastActive}</Text>
        </View>
      </View>

      <View style={styles.userFooter}>
        <TouchableOpacity 
          style={[styles.statusButton, { backgroundColor: getStatusColor(item.status) + '20' }]}
          onPress={() => {
            setSelectedUser(item);
            setShowUserModal(true);
          }}
        >
          <Text style={[styles.statusButtonText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="mail" size={18} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUserModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.userModal}>
          {selectedUser && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.modalUserInfo}>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                  <View style={styles.modalBadges}>
                    <View style={[styles.modalBadge, { backgroundColor: getRoleColor(selectedUser.role) + '20' }]}>
                      <Text style={[styles.modalBadgeText, { color: getRoleColor(selectedUser.role) }]}>
                        {getRoleText(selectedUser.role)}
                      </Text>
                    </View>
                    <View style={[styles.modalBadge, { backgroundColor: getStatusColor(selectedUser.status) + '20' }]}>
                      <Text style={[styles.modalBadgeText, { color: getStatusColor(selectedUser.status) }]}>
                        {getStatusText(selectedUser.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>{selectedUser.requests}</Text>
                  <Text style={styles.modalStatLabel}>Заявок</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>{selectedUser.totalSpent.toLocaleString()} ₽</Text>
                  <Text style={styles.modalStatLabel}>Потрачено</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>{selectedUser.joinDate}</Text>
                  <Text style={styles.modalStatLabel}>Регистрация</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                {selectedUser.status === 'blocked' ? (
                  <TouchableOpacity 
                    style={[styles.modalActionButton, { backgroundColor: '#10B98120' }]}
                    onPress={() => handleUserAction(selectedUser.id, 'unblock')}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={[styles.modalActionText, { color: '#10B981' }]}>Разблокировать</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.modalActionButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleUserAction(selectedUser.id, 'block')}
                  >
                    <Ionicons name="ban" size={20} color="#EF4444" />
                    <Text style={[styles.modalActionText, { color: '#EF4444' }]}>Заблокировать</Text>
                  </TouchableOpacity>
                )}

                {selectedUser.role === 'client' && (
                  <TouchableOpacity 
                    style={[styles.modalActionButton, { backgroundColor: '#8B5CF620' }]}
                    onPress={() => handleUserAction(selectedUser.id, 'makeAdmin')}
                  >
                    <Ionicons name="shield" size={20} color="#8B5CF6" />
                    <Text style={[styles.modalActionText, { color: '#8B5CF6' }]}>Сделать админом</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.modalActionButton, { backgroundColor: '#334155' }]}
                  onPress={() => handleUserAction(selectedUser.id, 'delete')}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={[styles.modalActionText, { color: '#EF4444' }]}>Удалить</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.modalCloseText}>Закрыть</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = searchQuery.length === 0 || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalRevenue: users.reduce((sum, user) => sum + user.totalSpent, 0),
    // Пустой список даёт деление на ноль — показываем 0, а не NaN
    avgRequests: users.length
      ? (users.reduce((sum, user) => sum + user.requests, 0) / users.length).toFixed(1)
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
              <Text style={styles.headerTitle}>Пользователи</Text>
              <Text style={styles.headerSubtitle}>Всего: {users.length} пользователей</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

       
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#8B5CF6" />
            <View style={styles.statCardContent}>
              <Text style={styles.statCardValue}>{totalStats.totalUsers}</Text>
              <Text style={styles.statCardLabel}>Пользователей</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <View style={styles.statCardContent}>
              <Text style={styles.statCardValue}>{totalStats.activeUsers}</Text>
              <Text style={styles.statCardLabel}>Активных</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#F59E0B" />
            <View style={styles.statCardContent}>
              <Text style={styles.statCardValue}>{(totalStats.totalRevenue / 1000).toFixed(0)}K</Text>
              <Text style={styles.statCardLabel}>Выручка</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск пользователей..."
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
          {roles.map(role => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.filterChip,
                selectedRole === role.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <Text style={[
                styles.filterText,
                selectedRole === role.id && styles.filterTextActive
              ]}>
                {role.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedRole === role.id && styles.filterCountActive
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedRole === role.id && styles.filterCountTextActive
                ]}>
                  {role.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

       
        {filteredUsers.length > 0 ? (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#334155" />
            <Text style={styles.emptyStateTitle}>Пользователи не найдены</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет пользователей в этой категории'}
            </Text>
          </View>
        )}
      </View>

      {renderUserModal()}
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
  statCardContent: {
    marginLeft: 12,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statCardLabel: {
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
  listContent: {
    paddingBottom: 100,
  },
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatarText: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 56,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  userStats: {
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
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
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
  userModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 8,
  },
  modalBadges: {
    flexDirection: 'row',
  },
  modalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalStats: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalStat: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
  },
  modalActions: {
    marginBottom: 16,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalCloseButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminUsers;