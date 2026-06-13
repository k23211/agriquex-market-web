import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { useEffect, useState } from 'react'
import { StyleSheet, ImageBackground, View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from './lib/supabase'
import { ProfileProvider } from './lib/profileContext'

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

const navBg = require('./assets/images/nav.png')

function NavHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets()
  return (
    <ImageBackground
      source={navBg}
      style={[styles.navHeader, { paddingTop: insets.top }]}
      imageStyle={styles.navHeaderImage}
    >
      <View style={styles.navOverlay} />
      <Text style={styles.navTitle}>{title}</Text>
    </ImageBackground>
  )
}

function MainTabs() {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#a3e635',
        tabBarInactiveTintColor: '#ffffff',
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
          backgroundColor: '#070707',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginBottom: 6,
          color: '#ffffff',
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
          header: () => <NavHeader title="Home" />,
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
          header: () => <NavHeader title="Browse" />,
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
          header: () => <NavHeader title="Sell" />,
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
          header: () => <NavHeader title="Account" />,
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
  navHeader: {
    width: '100%',
    height: 90,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  navHeaderImage: {
    resizeMode: 'cover',
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
})

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        <NavigationContainer>
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
