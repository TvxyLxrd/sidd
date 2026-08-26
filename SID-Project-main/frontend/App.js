import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Клиентские экраны
import LoginScreen from './src/screens/auth/login/LoginScreen';
import RegisterScreen from './src/screens/auth/register/RegisterScreen';
import HomeScreen from './src/screens/user/home/HomeScreen';
import ProfileScreen from './src/screens/user/profile/ProfileScreen';
import ChangePasswordScreen from './src/screens/user/profile/ChangePasswordScreen';
import RequestsScreen from './src/screens/user/requests/RequestsScreen';
import CreateRequestScreen from './src/screens/user/requests/CreateRequestScreen';
import StatisticsScreen from './src/screens/user/statistic/StatisticsScreen';
import TeamScreen from './src/screens/user/statistic/TeamScreen';

// Админские экраны
import AdminLoginScreen from './src/screens/auth/admin/AdminLoginScreen';
import AdminDashboard from './src/screens/admin/dashboard/AdminDashboard';
import AdminRequests from './src/screens/admin/requests/AdminRequests';
import AdminUsers from './src/screens/admin/users/AdminUsers';
import AdminServices from './src/screens/admin/services/AdminServices';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="LoginScreen"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
            }}
          >
          
            <Stack.Screen 
              name="LoginScreen" 
              component={LoginScreen} 
            />
            <Stack.Screen 
              name="RegisterScreen" 
              component={RegisterScreen} 
            />
            <Stack.Screen 
              name="HomeScreen" 
              component={HomeScreen} 
            />
            <Stack.Screen 
              name="ProfileScreen" 
              component={ProfileScreen} 
            />
            <Stack.Screen 
              name="ChangePasswordScreen" 
              component={ChangePasswordScreen} 
            />
            <Stack.Screen 
              name="RequestsScreen" 
              component={RequestsScreen} 
            />
            <Stack.Screen 
              name="CreateRequestScreen" 
              component={CreateRequestScreen} 
            />
            <Stack.Screen 
              name="StatisticsScreen" 
              component={StatisticsScreen} 
            />
            <Stack.Screen 
              name="TeamScreen" 
              component={TeamScreen} 
            />
            
            
            <Stack.Screen 
              name="AdminLoginScreen" 
              component={AdminLoginScreen} 
            />
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboard} 
            />
            <Stack.Screen 
              name="AdminRequests" 
              component={AdminRequests} 
            />
            <Stack.Screen 
              name="AdminUsers" 
              component={AdminUsers} 
            />
            <Stack.Screen 
              name="AdminServices" 
              component={AdminServices} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
