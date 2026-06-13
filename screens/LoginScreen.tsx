import { useEffect, useState } from 'react'
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
  ImageBackground, ScrollView,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { useAppTheme } from '../lib/theme'

const SAVE_LOGIN_KEY = 'savedLogin'
const AGREEMENT_TEXT = `AGRIQUEX USER AGREEMENT

Last updated: 2025

Welcome to Agriquex, Ghana's trusted online marketplace. By creating an account or using this app, you agree to the following terms.

1. ACCEPTANCE OF TERMS
By registering or using Agriquex, you confirm that you have read, understood, and agreed to this User Agreement. If you do not agree, please do not use the app.

2. ELIGIBILITY
You must be at least 18 years old to use Agriquex. By agreeing, you confirm you meet this requirement or have parental/guardian consent.

3. ACCOUNT RESPONSIBILITY
You are fully responsible for all activities that occur under your account. Keep your password confidential. Notify us immediately at ghanamarketplacegh@gmail.com if you suspect unauthorized use.

4. BUYING & SELLING RULES
• All listings must be accurate and honest.
• No fake, misleading, or fraudulent listings.
• Sellers must fulfill orders as described.
• Buyers must complete payments for confirmed orders.
• Disputes must be reported to us promptly.

5. PROHIBITED ITEMS
You may not list or sell: illegal goods, weapons, counterfeit products, drugs, stolen items, or any item prohibited under Ghanaian law.

6. PAYMENTS
Agriquex facilitates transactions between buyers and sellers. We are not responsible for payment disputes between users but will assist in resolving issues where possible.

7. PRIVACY POLICY
We collect your name, email, phone, and location to operate the marketplace. We do not sell your personal data to third parties. Your data is stored securely via Supabase.

8. INTELLECTUAL PROPERTY
All content, logos, and branding on Agriquex belong to Ghana Marketplace GH. You may not copy or reproduce them without permission.

9. TERMINATION
We reserve the right to suspend or permanently ban any account that violates these terms without prior notice.

10. LIMITATION OF LIABILITY
Agriquex is a platform connecting buyers and sellers. We are not liable for user-to-user disputes, product quality issues, or losses arising from transactions.

11. GOVERNING LAW
This agreement is governed by the laws of the Republic of Ghana.

12. CONTACT US
For questions or concerns:
Email: ghanamarketplacegh@gmail.com`

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [agreementVisible, setAgreementVisible] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(true)
  const [savedLogin, setSavedLogin] = useState<{ email: string; password: string } | null>(null)
  const theme = useAppTheme()

  useEffect(() => {
    async function loadSavedLogin() {
      try {
        const stored = await AsyncStorage.getItem(SAVE_LOGIN_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.email && parsed?.password) {
            setSavedLogin(parsed)
            setEmail(parsed.email)
          }
        }
      } catch (error) {
        console.log('Load saved login error:', error)
      }
    }
    loadSavedLogin()
  }, [])

  const storeSavedLogin = async (loginData: { email: string; password: string }) => {
    try {
      await AsyncStorage.setItem(SAVE_LOGIN_KEY, JSON.stringify(loginData))
      setSavedLogin(loginData)
    } catch (error) {
      console.log('Save login error:', error)
    }
  }

  const clearSavedLogin = async () => {
    try {
      await AsyncStorage.removeItem(SAVE_LOGIN_KEY)
      setSavedLogin(null)
    } catch (error) {
      console.log('Clear saved login error:', error)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    if (rememberLogin) {
      await storeSavedLogin({ email, password })
    } else {
      await clearSavedLogin()
    }

    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const handleSavedLogin = async () => {
    if (!savedLogin) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: savedLogin.email,
      password: savedLogin.password,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setEmail(savedLogin.email)
    setPassword(savedLogin.password)
    setRememberLogin(true)

    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const handleRegister = () => {
    if (!agreed) {
      Alert.alert(
        '⚠️ Terms Required',
        'You must read and accept the User Agreement & Terms before creating an account on Agriquex.',
        [
          { text: 'Read & Accept', onPress: () => setAgreementVisible(true) },
          { text: 'Cancel', style: 'cancel' }
        ]
      )
      return
    }
    navigation.navigate('Register')
  }

  return (
    <ImageBackground
      source={require('../assets/images/sell.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo & branding */}
          <View style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={[styles.logo, { borderColor: theme.accent }]} />
            <View style={styles.brandText}>
              <Text style={[styles.title, { color: theme.text }]}>Agriquex</Text>
              <Text style={[styles.subtitle, { color: theme.accent2 }]}>Buy. Sell. Connect.</Text>
            </View>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }] }>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Sign in to your account</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.agreementRow}>
              <TouchableOpacity
                style={[styles.checkbox, rememberLogin && styles.checkboxChecked]}
                onPress={() => setRememberLogin(!rememberLogin)}
                activeOpacity={0.8}
              >
                {rememberLogin && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.agreementText}>Save login for next time</Text>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color={theme.background} />
                : <Text style={[styles.btnText, { color: theme.background }]}>Sign In</Text>
              }
            </TouchableOpacity>

            {savedLogin ? (
              <View style={styles.savedLoginSection}>
                <TouchableOpacity style={[styles.savedLoginBtn, { borderColor: theme.accent, backgroundColor: 'transparent' }]} onPress={handleSavedLogin} disabled={loading}>
                  <Text style={[styles.savedLoginTitle, { color: theme.accent } ]}>Use saved login</Text>
                  <Text style={[styles.savedLoginText, { color: theme.accent }]}>{savedLogin.email}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearSavedLogin} style={styles.clearSavedLoginBtn}>
                  <Text style={[styles.clearSavedLoginText, { color: theme.textSecondary }]}>Remove saved login</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Agreement checkbox */}
            <View style={styles.agreementRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreed && styles.checkboxChecked]}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.8}
              >
                {agreed && <Text style={[styles.checkmark, { color: theme.background }]}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.agreementText, { color: theme.textSecondary }]}>I agree to the{' '}
                <Text style={[styles.agreementLink, { color: theme.accent }]} onPress={() => setAgreementVisible(true)}>
                  User Agreement & Terms
                </Text>
              </Text>
            </View>

            <TouchableOpacity onPress={handleRegister}>
              <Text style={[styles.link, { color: theme.textSecondary }]}>Don't have an account?{'  '}
                <Text style={[styles.linkBold, { color: theme.accent }]}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* User Agreement Modal */}
      <Modal
        visible={agreementVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAgreementVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }] }>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }] }>
              <Text style={[styles.modalTitle, { color: theme.text }]}>User Agreement</Text>
              <TouchableOpacity onPress={() => setAgreementVisible(false)} style={[styles.modalClose, { backgroundColor: theme.surface }] }>
                <Text style={{ color: theme.textSecondary, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.agreementScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.agreementBody, { color: theme.textSecondary }]}>{AGREEMENT_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: theme.accent }]}
              onPress={() => { setAgreed(true); setAgreementVisible(false) }}
            >
              <Text style={[styles.acceptBtnText, { color: theme.background }]}>✓ I Accept the Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.62)' },
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

  savedLoginSection: { marginBottom: 20 },
  savedLoginBtn: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  savedLoginTitle: { color: '#d1fae5', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  savedLoginText: { color: '#a7f3d0', fontSize: 13 },
  clearSavedLoginBtn: { alignItems: 'center', paddingVertical: 4 },
  clearSavedLoginText: { color: '#9ca3af', fontSize: 13, textDecorationLine: 'underline' },

  agreementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#16a34a' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  agreementText: { color: '#9ca3af', fontSize: 13, flex: 1, flexWrap: 'wrap' },
  agreementLink: { color: '#16a34a', fontWeight: '700', textDecorationLine: 'underline' },

  link: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  linkBold: { color: '#16a34a', fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalClose: { padding: 6, backgroundColor: '#1f2937', borderRadius: 99 },
  agreementScroll: { maxHeight: 420 },
  agreementBody: { color: '#d1d5db', fontSize: 13, lineHeight: 22 },
  acceptBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
