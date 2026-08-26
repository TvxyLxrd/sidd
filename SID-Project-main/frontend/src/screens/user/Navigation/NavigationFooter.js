import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NavigationFooter = ({ state, navigation }) => {
  const [activeTab, setActiveTab] = useState(state?.index || 0);

  const tabs = [
    {
      name: 'Главная',
      icon: 'home',
      iconType: 'ionicons',
      screen: 'HomeScreen',
    },
    // {
    //   name: 'Заказы',
    //   icon: 'list-alt',
    //   iconType: 'material',
    //   screen: 'Orders',
    // },
    // {
    //   name: 'Примеры',
    //   icon: 'images',
    //   iconType: 'ionicons',
    //   screen: 'Portfolio',
    // },
    {
      name: 'Профиль',
      icon: 'person',
      iconType: 'ionicons',
      screen: 'ProfileScreen',
    },
  ];

  const handleTabPress = (index, screen) => {
    setActiveTab(index);
    navigation.navigate(screen);
  };

  const renderIcon = (tab, isActive) => {
    const iconColor = isActive ? '#6366F1' : '#94A3B8';
    const iconSize = 24;

    switch (tab.iconType) {
      case 'material':
        return <MaterialIcons name={tab.icon} size={iconSize} color={iconColor} />;
      case 'fontawesome':
        return <FontAwesome5 name={tab.icon} size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name={tab.icon} size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.tabButton}
              onPress={() => handleTabPress(index, tab.screen)}
              activeOpacity={0.7}
            >
              <Animated.View style={[
                styles.tabContent,
                isActive && styles.activeTabContent
              ]}>
                <View style={styles.iconContainer}>
                  {renderIcon(tab, isActive)}
                  {isActive && <View style={styles.activeDot} />}
                </View>
                <Text style={[
                  styles.tabText,
                  isActive && styles.activeTabText
                ]}>
                  {tab.name}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
      
  
      {tabs.map((_, index) => {
        if (activeTab === index) {
          return (
            <Animated.View
              key={`glow-${index}`}
              style={[
                styles.glowEffect,
                {
                  left: (width / tabs.length) * index + (width / tabs.length - 80) / 2,
                }
              ]}
            />
          );
        }
        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 20, 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 70,
  },
  activeTabContent: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    width: 80,
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
    opacity: 0.8,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default NavigationFooter;