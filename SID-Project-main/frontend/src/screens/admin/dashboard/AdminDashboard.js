
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalRequests: 156,
    pendingRequests: 12,
    completedRequests: 89,
    newRequests: 5,
    totalUsers: 45,
    activeUsers: 32,
    revenue: 284500,
    conversion: 15.8,
  });

  const [recentRequests] = useState([]);

  const [quickActions] = useState([
    { title: 'Все заявки', icon: 'list', color: '#8B5CF6', screen: 'AdminRequests' },
    { title: 'Пользователи', icon: 'people', color: '#10B981', screen: 'AdminUsers' },
    { title: 'Услуги', icon: 'briefcase', color: '#F59E0B', screen: 'AdminServices' },
    { title: 'Аналитика', icon: 'stats-chart', color: '#3B82F6', screen: 'AdminAnalytics' },
    { title: 'Настройки', icon: 'settings', color: '#EC4899', screen: 'AdminSettings' },
    { title: 'Уведомления', icon: 'notifications', color: '#06B6D4', screen: 'AdminNotifications' },
  ]);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="shield" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.userName}>Администратор</Text>
          <Text style={styles.userRole}>Супер-админ</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => navigation.navigate('AdminLoginScreen')}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatCard = ({ title, value, change, icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {change && (
          <View style={[styles.changeBadge, { backgroundColor: change > 0 ? '#10B98120' : '#EF444420' }]}>
            <Text style={[styles.changeText, { color: change > 0 ? '#10B981' : '#EF4444' }]}>
              {change > 0 ? '+' : ''}{change}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderQuickAction = ({ title, icon, color, screen }) => (
    <TouchableOpacity 
      key={title}
      style={styles.quickActionCard}
      onPress={() => navigation.navigate(screen)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const renderRecentRequest = (request) => (
    <TouchableOpacity 
      key={request.id}
      style={styles.requestCard}
      onPress={() => navigation.navigate('AdminRequestDetail', { request })}
    >
      <View style={styles.requestHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {request.user.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestUserName}>{request.user}</Text>
          <Text style={styles.requestService}>{request.service}</Text>
        </View>
        <View style={styles.requestAmount}>
          <Text style={styles.amountText}>{request.amount.toLocaleString()} ₽</Text>
        </View>
      </View>
      <View style={styles.requestFooter}>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: 
              request.status === 'completed' ? '#10B98120' :
              request.status === 'inProgress' ? '#3B82F620' :
              '#F59E0B20'
          }
        ]}>
          <Text style={[
            styles.statusText,
            { 
              color: 
                request.status === 'completed' ? '#10B981' :
                request.status === 'inProgress' ? '#3B82F6' :
                '#F59E0B'
            }
          ]}>
            {request.status === 'completed' ? 'Завершено' :
             request.status === 'inProgress' ? 'В работе' : 'Ожидание'}
          </Text>
        </View>
        <Text style={styles.dateText}>{request.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderHeader()}

          
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeHeader}>
              <Ionicons name="shield-checkmark" size={28} color="#8B5CF6" />
              <Text style={styles.welcomeTitle}>Добро пожаловать, Админ!</Text>
            </View>
            <Text style={styles.welcomeMessage}>
              Сегодня у вас {stats.newRequests} новых заявок и {stats.pendingRequests} ожидают обработки.
              Общая выручка: {stats.revenue.toLocaleString()} ₽
            </Text>
          </View>

         
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Обзор статистики</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {renderStatCard({
                  title: 'Всего заявок',
                  value: stats.totalRequests,
                  change: 12,
                  icon: 'document-text',
                  color: '#8B5CF6'
                })}
                {renderStatCard({
                  title: 'Новых заявок',
                  value: stats.newRequests,
                  change: -5,
                  icon: 'add-circle',
                  color: '#10B981'
                })}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard({
                  title: 'Пользователей',
                  value: stats.totalUsers,
                  change: 8,
                  icon: 'people',
                  color: '#3B82F6'
                })}
                {renderStatCard({
                  title: 'Конверсия',
                  value: `${stats.conversion}%`,
                  change: 2.4,
                  icon: 'trending-up',
                  color: '#EC4899'
                })}
              </View>
            </View>
          </View>

        
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Быстрые действия</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map(renderQuickAction)}
            </View>
          </View>

         
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Недавние заявки</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminRequests')}>
                <Text style={styles.seeAllText}>Все</Text>
              </TouchableOpacity>
            </View>
            {recentRequests.map(renderRecentRequest)}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Последнее обновление: сегодня 09:30</Text>
            <Text style={styles.footerSubtext}>Система работает стабильно</Text>
          </View>
        </ScrollView>
      </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  welcomeMessage: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: '31%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
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
    alignItems: 'center',
    marginBottom: 12,
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
  requestInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  requestService: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  requestAmount: {
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateText: {
    fontSize: 13,
    color: '#94A3B8',
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
  footerSubtext: {
    fontSize: 12,
    color: '#10B981',
  },
});

export default AdminDashboard;