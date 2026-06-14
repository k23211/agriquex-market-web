import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { useEffect, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from './lib/supabase'
import { ProfileProvider } from './lib/profileContext'
import { useAppTheme } from './lib/theme'

import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import ProductsScreen from './screens/ProductsScreen'
import AccountScreen from './screens/AccountScreen'
import SellerDashboard from './screens/SellerDashboard'
import EditProfileScreen from './screens/EditProfileScreen'
import ProductDetailScreen from './screens/productDetailScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()




function MainTabs() {
  const insets = useSafeAreaInsets()

  const theme = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActiveTint,
        tabBarInactiveTintColor: theme.tabBarInactiveTint,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0,
          elevation: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom || 12,
          backgroundColor: theme.tabBarBg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginBottom: 6,
          color: theme.textSecondary,
          textShadowColor: 'rgba(0,0,0,0.8)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 3,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }: any) => (
            <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, size, focused }: any) => (
            <MaterialCommunityIcons name={focused ? 'shopping' : 'shopping-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SellerDashboard"
        component={SellerDashboard}
        options={{
          tabBarLabel: 'Sell',
          tabBarIcon: ({ color, size, focused }: any) => (
            <MaterialCommunityIcons name={focused ? 'plus-box' : 'plus-box-outline'} size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size, focused }: any) => (
            <MaterialCommunityIcons name={focused ? 'account' : 'account-outline'} size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBarBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
})

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const theme = useAppTheme()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (loading) return null

  return (
    <ProfileProvider>
      <SafeAreaProvider>
        {/* apply navigation container background from theme */}
        <NavigationContainer
          theme={{
            dark: theme.dark,
            colors: {
              background: theme.background,
              card: theme.surface,
              text: theme.text,
              border: theme.border,
              primary: theme.accent,
              notification: theme.accent2,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '900' },
            },
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Always show main app first */}
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            {/* Auth screens pushed on top when needed */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ presentation: 'modal' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ProfileProvider>
  )
}
