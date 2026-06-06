import React from 'react';
import { Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import { useAuth } from '@/components/AuthContext';
import { Colors } from '@/constants/theme';
import { 
  Boxes, 
  PackageSearch, 
  ClipboardList, 
  UserCheck, 
  RefreshCw, 
  Users, 
  LogOut 
} from 'lucide-react-native';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { role, logout } = useAuth();

  const isManagerOrAdmin = role === 'ADMIN' || role === 'INVENTORY_MANAGER';
  const isAdmin = role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#185FA5',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
          elevation: 2,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundElement,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => (
          <Pressable 
            onPress={logout} 
            style={({ pressed }) => [
              { marginRight: 16, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <LogOut color="#dc2626" size={20} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => <PackageSearch color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lending"
        options={{
          title: 'Lending',
          tabBarLabel: 'Lending',
          href: isManagerOrAdmin ? '/lending' : null,
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          href: isManagerOrAdmin ? '/history' : null,
          tabBarIcon: ({ color, size }) => <RefreshCw color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarLabel: 'Users',
          href: isAdmin ? '/users' : null,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
