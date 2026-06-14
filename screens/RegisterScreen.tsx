import { useState } from 'react'
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
  ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useAppTheme } from '../lib/theme'

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const theme = useAppTheme()

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Missing fields', 'Please enter your name, email and password.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    const user = data?.user
    if (user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
      })
      if (profileError) {
        console.log('Profile creation error:', profileError)
      }
    }

    Alert.alert('Success', 'Account created successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  return (
    <View style={[styles.bg, { backgroundColor: theme.background }]}> 
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={[styles.logo, { borderColor: theme.accent }]} />
            <View style={styles.brandText}>
              <Text style={[styles.title, { color: theme.text }]}>Agriquex</Text>
              <Text style={[styles.subtitle, { color: theme.accent2 }]}>Join Agriquex today</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Register and start buying or selling</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color={theme.background} />
                : <Text style={[styles.btnText, { color: theme.background }]}>Create Account</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: theme.textSecondary }]}>Already have an account?{' '}
                <Text style={[styles.linkBold, { color: theme.accent }]}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 14 },
  logo: { width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: '#16a34a' },
  brandText: {},
  title: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#d1fae5', marginTop: 2 },

  card: { backgroundColor: 'rgba(7,7,7,0.88)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSub: { color: '#6b7280', fontSize: 14, marginBottom: 24 },

  input: {
    backgroundColor: '#111827',
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btn: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  linkBold: { color: '#16a34a', fontWeight: '800' },
})