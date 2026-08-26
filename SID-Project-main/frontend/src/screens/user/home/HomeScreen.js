import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [user] = useState({
    name: 'Александр Иванов',
    role: 'Менеджер проектов',
    avatarInitials: 'AI',
  });

  const [statistics, setStatistics] = useState({
    total: 156,
    inProgress: 78,
    completed: 54,
    pending: 24,
  });

  const [recentRequests] = useState([]);

  const [quickActions] = useState([
    { title: 'Новая заявка', icon: 'add-circle-outline', color: '#6366F1', screen: 'CreateRequestScreen' },
    { title: 'Мои заявки', icon: 'list', color: '#10B981', screen: 'RequestsScreen' },
    { title: 'Статистика', icon: 'bar-chart', color: '#F59E0B', screen: 'StatisticsScreen' },
    // { title: 'Команда', icon: 'people', color: '#8B5CF6', screen: 'TeamScreen' },
  ]);

  const [progressAnimations] = useState({
    inProgress: new Animated.Value(0),
    completed: new Animated.Value(0),
    pending: new Animated.Value(0),
  });

  const calculatePercentage = (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const animateProgress = () => {
    const animations = Object.keys(progressAnimations).map((key) => {
      const percentage = calculatePercentage(statistics[key], statistics.total);
      return Animated.timing(progressAnimations[key], {
        toValue: percentage,
        duration: 1500,
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();
  };

  useEffect(() => {
    animateProgress();
  }, []);

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

  const ProgressCircle = ({ percentage, color, label, value }) => {
    const radius = 60;
    const strokeWidth = 10;
    const circleCircumference = 2 * Math.PI * radius;
    
    const animatedStrokeDashoffset = progressAnimations[label]?.interpolate({
      inputRange: [0, 100],
      outputRange: [circleCircumference, 0],
    }) || circleCircumference;

    return (
      <View style={styles.progressCircleContainer}>
        <View style={styles.progressCircleWrapper}>
          <View style={styles.progressCircleBackground} />
          <Animated.View style={[
            styles.progressCircle,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
            }
          ]}>
            <Animated.View
              style={[
                styles.progressCircleFill,
                {
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  borderWidth: strokeWidth,
                  borderColor: color,
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  transform: [{ rotate: '-45deg' }],
                  borderEndColor: color,
                }
              ]}
            />
          </Animated.View>
          <View style={styles.progressCircleText}>
            <Text style={styles.progressCircleValue}>{value}</Text>
            <Text style={styles.progressCircleLabel}>
              {label === 'inProgress' ? 'В работе' : 
               label === 'completed' ? 'Готово' : 
               'Ожидание'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

 
  const handleProfilePress = () => {
    console.log('Navigating to ProfileScreen...');
    navigation.navigate('ProfileScreen');
  };

  const handleMyRequestsPress = () => {
    console.log('Navigating to RequestsScreen...');
    navigation.navigate('RequestsScreen');
  };

  const handleCreateRequestPress = () => {
    console.log('Navigating to CreateRequestScreen...');
    navigation.navigate('CreateRequestScreen');
  };

  const handleQuickActionPress = (screen) => {
    console.log(`Navigating to ${screen}...`);
    navigation.navigate(screen);
  };

  const handleRecentRequestPress = (requestId) => {
    console.log(`Viewing request ${requestId}...`);
 
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={handleProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.avatarInitials}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeMessage}>
        Сегодня у вас {statistics.inProgress} заявок в работе. 
        {statistics.completed > 0 && ` ${statistics.completed} уже готовы.`}
      </Text>
      <View style={styles.dateContainer}>
        <Ionicons name="calendar" size={16} color="#94A3B8" />
        <Text style={styles.dateText}>15 марта 2024</Text>
      </View>
    </View>
  );

  const renderStatistics = () => (
    <View style={styles.statisticsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Статистика заявок</Text>
        <TouchableOpacity onPress={handleMyRequestsPress}>
          <Text style={styles.seeAllText}>Все {statistics.total}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statisticsCards}>
        <View style={styles.totalCard}>
          <View style={styles.totalCardHeader}>
            <MaterialIcons name="assignment" size={24} color="#6366F1" />
            <Text style={styles.totalCardTitle}>Всего заявок</Text>
          </View>
          <Text style={styles.totalCardValue}>{statistics.total}</Text>
          <Text style={styles.totalCardSubtitle}>За текущий месяц</Text>
        </View>
        
        <View style={styles.progressCirclesContainer}>
          <ProgressCircle 
            percentage={calculatePercentage(statistics.inProgress, statistics.total)}
            color="#3B82F6"
            label="inProgress"
            value={statistics.inProgress}
          />
          <ProgressCircle 
            percentage={calculatePercentage(statistics.completed, statistics.total)}
            color="#10B981"
            label="completed"
            value={statistics.completed}
          />
          <ProgressCircle 
            percentage={calculatePercentage(statistics.pending, statistics.total)}
            color="#F59E0B"
            label="pending"
            value={statistics.pending}
          />
        </View>
      </View>
      
      <View style={styles.statsDetails}>
        <View style={styles.statDetailItem}>
          <View style={[styles.statDetailDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.statDetailText}>В работе: {statistics.inProgress}</Text>
        </View>
        <View style={styles.statDetailItem}>
          <View style={[styles.statDetailDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statDetailText}>Готово: {statistics.completed}</Text>
        </View>
        <View style={styles.statDetailItem}>
          <View style={[styles.statDetailDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.statDetailText}>Ожидание: {statistics.pending}</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Быстрые действия</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.quickActionCard}
            onPress={() => handleQuickActionPress(action.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentRequests = () => (
    <View style={styles.recentRequestsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Недавние заявки</Text>
        <TouchableOpacity onPress={handleMyRequestsPress}>
          <Text style={styles.seeAllText}>Все</Text>
        </TouchableOpacity>
      </View>
      
      {recentRequests.map((request) => (
        <TouchableOpacity 
          key={request.id} 
          style={styles.requestCard}
          onPress={() => handleRecentRequestPress(request.id)}
          activeOpacity={0.7}
        >
          <View style={styles.requestHeader}>
            <View style={styles.requestTitleContainer}>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(request.priority) }]} />
              <Text style={styles.requestTitle} numberOfLines={1}>{request.title}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {getStatusText(request.status)}
              </Text>
            </View>
          </View>
          <View style={styles.requestFooter}>
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text style={styles.dateTextSmall}>{request.date}</Text>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.requestActionButton}>
                <Ionicons name="eye-outline" size={16} color="#6366F1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.requestActionButton}>
                <Ionicons name="share-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderWelcomeCard()}
        {renderStatistics()}
        {renderQuickActions()}
        {renderRecentRequests()}
        
        <View style={styles.footer}>
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
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  statisticsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  statisticsCards: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalCardTitle: {
    fontSize: 16,
    color: '#CBD5E1',
    marginLeft: 10,
    fontWeight: '600',
  },
  totalCardValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  totalCardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  progressCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0F172A',
  },
  progressCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  progressCircleFill: {
    position: 'absolute',
  },
  progressCircleText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  progressCircleLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  statsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  statDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statDetailText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  recentRequestsSection: {
    marginBottom: 24,
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
  requestTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  requestTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextSmall: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 6,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default HomeScreen;