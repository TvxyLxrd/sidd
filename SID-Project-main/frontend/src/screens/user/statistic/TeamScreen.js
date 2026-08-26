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
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const TeamScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const teamMembers = [];

  const departments = [
    { id: 'all', name: 'Все отделы', count: teamMembers.length },
    { id: 'development', name: 'Разработка', count: 2 },
    { id: 'design', name: 'Дизайн', count: 1 },
    { id: 'management', name: 'Управление', count: 1 },
    { id: 'analytics', name: 'Аналитика', count: 1 },
    { id: 'qa', name: 'QA', count: 1 },
    { id: 'support', name: 'Поддержка', count: 1 },
    { id: 'infrastructure', name: 'Инфраструктура', count: 1 },
  ];

  // Считается по фактическому составу, а не задаётся числами
  const teamStats = {
    total: teamMembers.length,
    active: teamMembers.filter((member) => member.status === 'active').length,
    remote: teamMembers.filter((member) => member.status === 'remote').length,
    busy: teamMembers.filter((member) => member.status === 'inMeeting').length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inMeeting': return '#3B82F6';
      case 'remote': return '#8B5CF6';
      case 'busy': return '#F59E0B';
      case 'offline': return '#94A3B8';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'В сети';
      case 'inMeeting': return 'На встрече';
      case 'remote': return 'Удаленно';
      case 'busy': return 'Занят';
      case 'offline': return 'Не в сети';
      default: return 'Неизвестно';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Команда</Text>
          <Text style={styles.headerSubtitle}>{teamMembers.length} участников</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTeamMember')}
      >
        <Ionicons name="person-add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderTeamStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#6366F1' }]}>
            <Ionicons name="people" size={20} color="#fff" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{teamStats.total}</Text>
            <Text style={styles.statLabel}>Всего в команде</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="wifi" size={20} color="#fff" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{teamStats.active}</Text>
            <Text style={styles.statLabel}>В сети</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск участников..."
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
  );

  const renderDepartmentFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.departmentsContainer}
    >
      {departments.map(dept => (
        <TouchableOpacity
          key={dept.id}
          style={[
            styles.departmentChip,
            selectedDepartment === dept.id && styles.departmentChipActive
          ]}
          onPress={() => setSelectedDepartment(dept.id)}
        >
          <Text style={[
            styles.departmentText,
            selectedDepartment === dept.id && styles.departmentTextActive
          ]}>
            {dept.name}
          </Text>
          <View style={[
            styles.departmentCount,
            selectedDepartment === dept.id && styles.departmentCountActive
          ]}>
            <Text style={[
              styles.departmentCountText,
              selectedDepartment === dept.id && styles.departmentCountTextActive
            ]}>
              {dept.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTeamMember = ({ item }) => (
    <TouchableOpacity 
      style={styles.memberCard}
      onPress={() => navigation.navigate('TeamMemberDetail', { member: item })}
    >
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatarContainer}>
          <View style={[styles.memberAvatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.memberAvatarText}>{item.initials}</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>{item.role}</Text>
          <Text style={styles.memberDepartment}>{item.department}</Text>
        </View>
        <TouchableOpacity style={styles.memberMenuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.memberStats}>
        <View style={styles.statItemSmall}>
          <Ionicons name="document-text" size={16} color="#94A3B8" />
          <Text style={styles.statTextSmall}>Задачи: {item.tasks}</Text>
        </View>
        <View style={styles.statItemSmall}>
          <Ionicons name="checkmark-circle" size={16} color="#94A3B8" />
          <Text style={styles.statTextSmall}>Выполнено: {item.completed}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.memberContacts}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail" size={16} color="#6366F1" />
          <Text style={styles.contactText}>{item.email}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={16} color="#10B981" />
          <Text style={styles.contactText}>{item.phone}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.memberActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#94A3B8" />
          <Text style={styles.actionText}>Написать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={18} color="#94A3B8" />
          <Text style={styles.actionText}>Видеозвонок</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          <Text style={styles.actionText}>Встреча</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#334155" />
      <Text style={styles.emptyStateTitle}>Команда не найдена</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет участников в выбранном отделе'}
      </Text>
    </View>
  );

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchQuery.length === 0 || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
      member.department.toLowerCase().includes(selectedDepartment);
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.container}>
        {renderHeader()}
        {renderTeamStats()}
        {renderSearch()}
        {renderDepartmentFilters()}
        
        {filteredMembers.length > 0 ? (
          <FlatList
            data={filteredMembers}
            renderItem={renderTeamMember}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  Найдено {filteredMembers.length} участников
                </Text>
              </View>
            }
          />
        ) : (
          renderEmptyState()
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
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
    marginHorizontal: 20,
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
  departmentsContainer: {
    marginBottom: 20,
  },
  departmentChip: {
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
  departmentChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  departmentText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  departmentTextActive: {
    color: '#fff',
  },
  departmentCount: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  departmentCountActive: {
    backgroundColor: '#fff',
  },
  departmentCountText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  departmentCountTextActive: {
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
  memberCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  memberDepartment: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    backgroundColor: '#6366F120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  memberMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  statItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextSmall: {
    fontSize: 13,
    color: '#CBD5E1',
    marginLeft: 6,
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
  memberContacts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginLeft: 8,
    flex: 1,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
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
});

export default TeamScreen;