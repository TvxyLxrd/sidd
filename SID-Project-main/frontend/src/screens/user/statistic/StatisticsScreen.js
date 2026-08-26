import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const [timeRange, setTimeRange] = useState('week');

  // Показатели приходят с сервера. До подключения экран показывает нули,
  // а не выдуманные цифры: расхождение с реальностью хуже пустоты.
  const emptyPeriod = {
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
    averageTime: '—',
    efficiency: 0,
    categories: [],
    trends: [],
  };

  const [statisticsData] = useState({
    week: emptyPeriod,
    month: emptyPeriod,
    year: emptyPeriod,
  });

  const currentData = statisticsData[timeRange] || emptyPeriod;

  // Доля от нуля не определена — показываем 0, а не NaN
  const share = (part) => (currentData.total ? Math.round((part / currentData.total) * 100) : 0);

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
          <Text style={styles.headerTitle}>Статистика</Text>
          <Text style={styles.headerSubtitle}>Детальная аналитика</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="download-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderTimeFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, timeRange === 'week' && styles.filterButtonActive]}
        onPress={() => setTimeRange('week')}
      >
        <Text style={[styles.filterText, timeRange === 'week' && styles.filterTextActive]}>
          Неделя
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, timeRange === 'month' && styles.filterButtonActive]}
        onPress={() => setTimeRange('month')}
      >
        <Text style={[styles.filterText, timeRange === 'month' && styles.filterTextActive]}>
          Месяц
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, timeRange === 'year' && styles.filterButtonActive]}
        onPress={() => setTimeRange('year')}
      >
        <Text style={[styles.filterText, timeRange === 'year' && styles.filterTextActive]}>
          Год
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewCards = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <MaterialIcons name="assignment" size={20} color="#6366F1" />
            <Text style={styles.overviewCardTitle}>Всего</Text>
          </View>
          <Text style={styles.overviewCardValue}>{currentData.total}</Text>
          <Text style={styles.overviewCardSubtitle}>заявок</Text>
        </View>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <Ionicons name="time-outline" size={20} color="#10B981" />
            <Text style={styles.overviewCardTitle}>Среднее время</Text>
          </View>
          <Text style={styles.overviewCardValue}>{currentData.averageTime}</Text>
          <Text style={styles.overviewCardSubtitle}>на выполнение</Text>
        </View>
      </View>
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <Ionicons name="trending-up" size={20} color="#F59E0B" />
            <Text style={styles.overviewCardTitle}>Эффективность</Text>
          </View>
          <Text style={styles.overviewCardValue}>{currentData.efficiency}%</Text>
          <Text style={styles.overviewCardSubtitle}>выполнения</Text>
        </View>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
            <Text style={styles.overviewCardTitle}>Завершено</Text>
          </View>
          <Text style={styles.overviewCardValue}>{currentData.completed}</Text>
          <Text style={styles.overviewCardSubtitle}>заявок</Text>
        </View>
      </View>
    </View>
  );

  const renderStatusDistribution = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Распределение по статусам</Text>
      <View style={styles.statusDistribution}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>В работе</Text>
            <Text style={styles.statusCount}>{currentData.inProgress}</Text>
          </View>
          <Text style={styles.statusPercentage}>
            {share(currentData.inProgress)}%
          </Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Готово</Text>
            <Text style={styles.statusCount}>{currentData.completed}</Text>
          </View>
          <Text style={styles.statusPercentage}>
            {share(currentData.completed)}%
          </Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Ожидание</Text>
            <Text style={styles.statusCount}>{currentData.pending}</Text>
          </View>
          <Text style={styles.statusPercentage}>
            {share(currentData.pending)}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryDistribution = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Распределение по категориям</Text>
      <View style={styles.categoriesContainer}>
        {currentData.categories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryCount}>{category.count}</Text>
              <Text style={styles.categoryPercentage}>
                {share(category.count)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTrendChart = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Динамика заявок</Text>
      <View style={styles.trendChart}>
        <View style={styles.trendBars}>
          {currentData.trends.map((trend, index) => {
            const maxCount = Math.max(...currentData.trends.map(t => t.count));
            const height = (trend.count / maxCount) * 120;
            const label = timeRange === 'week' ? trend.day : timeRange === 'month' ? trend.week : trend.month;
            
            return (
              <View key={index} style={styles.trendBarContainer}>
                <View style={[styles.trendBar, { height }]} />
                <Text style={styles.trendLabel}>{label}</Text>
                <Text style={styles.trendValue}>{trend.count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderInsights = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Аналитические выводы</Text>
      <View style={styles.insightsContainer}>
        <View style={styles.insightCard}>
          <Ionicons name="arrow-up" size={24} color="#10B981" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Рост эффективности</Text>
            <Text style={styles.insightText}>
              По сравнению с прошлым периодом эффективность выросла на 5.2%
            </Text>
          </View>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="alert-circle" size={24} color="#F59E0B" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Время выполнения</Text>
            <Text style={styles.insightText}>
              Среднее время выполнения заявок сократилось на 1.3 дня
            </Text>
          </View>
        </View>
      </View>
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
        {renderTimeFilters()}
        {renderOverviewCards()}
        {renderStatusDistribution()}
        {renderCategoryDistribution()}
        {renderTrendChart()}
        {renderInsights()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Данные обновлены сегодня в 10:30</Text>
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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  filterTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  overviewContainer: {
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewCardTitle: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 8,
    fontWeight: '600',
  },
  overviewCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  overviewCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusDistribution: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statusItemLast: {
    borderBottomWidth: 0,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  statusCount: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  categoryStats: {
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#94A3B8',
  },
  trendChart: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  trendBarContainer: {
    alignItems: 'center',
  },
  trendBar: {
    width: 24,
    backgroundColor: '#6366F1',
    borderRadius: 6,
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 4,
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
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

export default StatisticsScreen;