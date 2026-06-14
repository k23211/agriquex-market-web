import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAppTheme } from '../lib/theme'
const SUPPORT_EMAIL = 'ghanamarketplacegh@gmail.com'
const FACEBOOK_URL = 'https://www.facebook.com/share/1CxreYRz36/'
const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.adinkramatchgh.game'
const PLAYSTORE_AGRIQUEXDATA_URL = 'https://play.google.com/store/apps/details?id=com.agriquexdata.app'
const featureCards = [
  { icon: 'shield-check-outline', title: 'AdinkraMatch' },
  { icon: 'android', title: 'Agriquex Data' },
  { icon: 'trophy-outline', title: 'Follow Us' },
  { icon: 'headphones', title: '24/7 Support' },
]
const categories = [
  { label: 'Electronics', icon: 'cellphone', color: '#111827' },
  { label: 'Fashion', icon: 'tshirt-crew-outline', color: '#111827' },
  { label: 'Home', icon: 'home-outline', color: '#111827' },
]
export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [visitorStats, setVisitorStats] = useState({
    totalUsers: 0,
    totalVisitors: 0,
  })
  const [supportVisible, setSupportVisible] = useState(false)
  const [supportTab, setSupportTab] = useState<'help' | 'report' | 'feedback'>('help')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportName, setSupportName] = useState('')
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const theme = useAppTheme()

  const loadName = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0])
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadName(), fetchProducts(), fetchVisitorStats()])
    setRefreshing(false)
  }

  useEffect(() => {
    loadName()
    fetchProducts()
    fetchVisitorStats()
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadName()
      fetchProducts()
      fetchVisitorStats()
    }, [])
  )
  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
    setProducts(data || [])
    setLoading(false)
  }
  const fetchVisitorStats = async () => {
    const [profilesResult, visitorResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('visitor_counts').select('id, count').eq('id', 'global').single(),
    ])
    setVisitorStats({
      totalUsers: profilesResult.count ?? 0,
      totalVisitors: visitorResult.data?.count ?? 0,
    })
  }
  const handlePlayStorePress = async () => {
    const playAppUrl = `market://details?id=com.adinkramatchgh.game`
    try {
      const canOpen = await Linking.canOpenURL(playAppUrl)
      if (canOpen) {
        await Linking.openURL(playAppUrl)
      } else {
        await Linking.openURL(PLAYSTORE_URL)
      }
    } catch {
      await Linking.openURL(PLAYSTORE_URL)
    }
  }
  const handleFastDeliveryPress = async () => {
    const playAppUrl = `market://details?id=com.agriquexdata.app`
    try {
      const canOpen = await Linking.canOpenURL(playAppUrl)
      if (canOpen) {
        await Linking.openURL(playAppUrl)
      } else {
        await Linking.openURL(PLAYSTORE_AGRIQUEXDATA_URL)
      }
    } catch {
      await Linking.openURL(PLAYSTORE_AGRIQUEXDATA_URL)
    }
  }
  const handleFacebookPress = async () => {
    const fbAppUrl = 'fb://facewebmodal/f?href=' + encodeURIComponent(FACEBOOK_URL)
    try {
      const canOpen = await Linking.canOpenURL(fbAppUrl)
      if (canOpen) {
        await Linking.openURL(fbAppUrl)
      } else {
        await Linking.openURL(FACEBOOK_URL)
      }
    } catch {
      await Linking.openURL(FACEBOOK_URL)
    }
  }
  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) {
      Alert.alert('Empty Message', 'Please write your message before sending.')
      return
    }
    setSending(true)
    const subjectMap = {
      help: 'Help Request',
      report: 'Issue Report',
      feedback: 'User Feedback',
    }
    const subject = encodeURIComponent(`[Agriquex] ${subjectMap[supportTab]}${supportName ? ' from ' + supportName : ''}`)
    const body = encodeURIComponent(
      `${supportName ? 'Name: ' + supportName + '\n\n' : ''}Message:\n${supportMessage}`
    )
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
    try {
      const canOpen = await Linking.canOpenURL(mailto)
      if (canOpen) {
        await Linking.openURL(mailto)
        setSupportMessage('')
        setSupportName('')
        setSupportVisible(false)
      } else {
        Alert.alert('No Email App', 'Please contact us directly at ' + SUPPORT_EMAIL)
      }
    } catch {
      Alert.alert('Error', 'Could not open email. Please contact ' + SUPPORT_EMAIL)
    }
    setSending(false)
  }
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      <View style={[styles.hero, { backgroundColor: theme.surface }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.logo, { color: theme.text }]}>Agriquex</Text>
            <Text style={[styles.logoSub, { color: theme.textSecondary }]}>Buy. Sell. Connect.</Text>
          </View>
          {userName ? (
            <View style={styles.topRight}>
              <Text style={[styles.greeting, { color: theme.text }]}>Hi, {userName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Agriquex: <Text style={[styles.heroHighlight, { color: theme.accent2 }]}>Trusted</Text> Marketplace
          </Text>
          <Text style={[styles.heroDescription, { color: theme.textSecondary }]}>Buy and sell with confidence across Ghana</Text>
        </View>
      </View>
      <View style={styles.featuresRow}>
        {featureCards.map((feature) => {
          const isSupport = feature.title === '24/7 Support'
          const isQuality = feature.title === 'Follow Us'
          const isSecurePay = feature.title === 'AdinkraMatch'
          const isAgriquexData = feature.title === 'Agriquex Data'
          if (isSecurePay) {
            return (
              <TouchableOpacity
                key={feature.title}
                style={[styles.featureCard, styles.featureCardPlaystore]}
                onPress={handlePlayStorePress}
                activeOpacity={0.75}
              >
                <View style={[styles.featureIcon, styles.featureIconPlaystore]}>
                  <MaterialCommunityIcons name="google-play" size={20} color={theme.accent} />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </TouchableOpacity>
            )
          }
          if (isSupport) {
            return (
              <TouchableOpacity
                key={feature.title}
                style={[styles.featureCard, styles.featureCardClickable]}
                onPress={() => setSupportVisible(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.featureIcon, styles.featureIconActive]}>
                  <MaterialCommunityIcons name={feature.icon as any} size={20} color={theme.accent} />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </TouchableOpacity>
            )
          }
          if (isQuality) {
            return (
              <TouchableOpacity
                key={feature.title}
                style={[styles.featureCard, styles.featureCardFacebook]}
                onPress={handleFacebookPress}
                activeOpacity={0.75}
              >
                <View style={[styles.featureIcon, styles.featureIconFacebook]}>
                  <MaterialCommunityIcons name="facebook" size={20} color="#1877f2" />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </TouchableOpacity>
            )
          }
          if (isAgriquexData) {
            return (
              <TouchableOpacity
                key={feature.title}
                style={[styles.featureCard, styles.featureCardAgriquexData]}
                onPress={handleFastDeliveryPress}
                activeOpacity={0.75}
              >
                <View style={[styles.featureIcon, styles.featureIconAgriquexData]}>
                  <MaterialCommunityIcons name={feature.icon as any} size={20} color={theme.accent2} />
                </View>
                <Text style={[styles.featureText, styles.featureTextAgriquexData]}>{feature.title}</Text>
              </TouchableOpacity>
            )
          }
          return (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={feature.icon as any} size={20} color={theme.accent} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{feature.title}</Text>
            </View>
          )
        })}
      </View>
      {/* 24/7 Support Modal */}
      <Modal
        visible={supportVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSupportVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>24/7 Support</Text>
                <Text style={styles.modalSubtitle}>We're here to help you anytime</Text>
              </View>
              <TouchableOpacity onPress={() => setSupportVisible(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View style={styles.tabRow}>
              {(['help', 'report', 'feedback'] as const).map((tab) => {
                const tabLabels = { help: '🙋 Get Help', report: '🚨 Report', feedback: '💬 Feedback' }
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, supportTab === tab && styles.tabActive]}
                    onPress={() => { setSupportTab(tab); setSupportMessage('') }}
                  >
                    <Text style={[styles.tabText, supportTab === tab && styles.tabTextActive, { color: supportTab === tab ? '#fff' : theme.textSecondary }]}>
                      {tabLabels[tab]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {supportTab === 'help' && (
                <Text style={styles.tabDescription}>
                  Have a question about buying, selling, payments or your account? Describe your issue and we'll get back to you.
                </Text>
              )}
              {supportTab === 'report' && (
                <Text style={styles.tabDescription}>
                  Found a bug, suspicious listing, or inappropriate content? Let us know and we'll investigate immediately.
                </Text>
              )}
              {supportTab === 'feedback' && (
                <Text style={styles.tabDescription}>
                  We love hearing from you! Share ideas, suggestions or your experience with Agriquex.
                </Text>
              )}
              <TextInput
                style={[styles.inputName, { backgroundColor: theme.surface, color: theme.text }]}
                placeholder="Your name (optional)"
                placeholderTextColor={theme.textSecondary}
                value={supportName}
                onChangeText={setSupportName}
              />
              <TextInput
                style={[styles.inputMessage, { backgroundColor: theme.surface, color: theme.text }]}
                placeholder={
                  supportTab === 'help' ? 'Describe your issue...' :
                  supportTab === 'report' ? 'What would you like to report?' :
                  'Share your feedback...'
                }
                placeholderTextColor={theme.textSecondary}
                value={supportMessage}
                onChangeText={setSupportMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                onPress={handleSupportSubmit}
                disabled={sending}
              >
                <MaterialCommunityIcons name="send" size={16} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.sendBtnText, { color: theme.text }]}>{sending ? 'Opening email...' : 'Send Message'}</Text>
              </TouchableOpacity>
              <Text style={styles.emailNote}>
                Sends to: {SUPPORT_EMAIL}
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Top categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Text style={[styles.browseAll, { color: theme.accent2 }]}>Browse all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoryRow}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.label}
            style={[styles.categoryCard, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('Products', { category: category.label })}
          >
            <View style={[styles.categoryIconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
              <MaterialCommunityIcons name={category.icon as any} size={26} color={theme.text} />
            </View>
            <Text style={[styles.categoryLabel, { color: theme.text }]}>{category.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.visitorCard, { backgroundColor: theme.surface }]}>
        <View style={styles.visitorHeader}>
          <Text style={[styles.visitorTitle, { color: theme.text }]}>Platform Stats</Text>
          <Text style={[styles.visitorSubtitle, { color: theme.textSecondary }]}>Real-time users and visitor insights across Agriquex.</Text>
        </View>
        <Text style={styles.visitorUsersLabel}>TOTAL USERS</Text>
        <Text style={styles.visitorUsersValue}>{visitorStats.totalUsers}</Text>
        <View style={styles.visitorSummaryRow}>
          <View style={[styles.visitorMetricBox, { flex: 1 }]}>
            <Text style={styles.visitorMetricLabel}>TOTAL VISITORS</Text>
            <Text style={styles.visitorMetricValue}>{visitorStats.totalVisitors}</Text>
          </View>
        </View>
      </View>
      <View style={styles.sectionHeaderAlt}>
        <Text style={styles.sectionTitle}>Latest Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Text style={styles.browseAll}>View all →</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.productCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            >
              <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
              />
              <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.productPrice, { color: theme.accent2 }]}>GH₵ {item.price}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070707' },
  contentContainer: { paddingBottom: 32 },
  hero: { width: '100%', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28, backgroundColor: '#111827' },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logoSub: { color: '#d1d5db', marginTop: 4, fontSize: 12 },
  topRight: { alignItems: 'flex-end' },
  greeting: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  heroContent: { marginTop: 36, maxWidth: '72%' },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 40 },
  heroHighlight: { color: '#f59e0b' },
  heroDescription: { color: '#d1d5db', fontSize: 14, marginTop: 10, lineHeight: 20 },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -18 },
  featureCard: { flex: 1, backgroundColor: '#111827', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 12, marginHorizontal: 4, alignItems: 'center' },
  featureCardClickable: { borderColor: '#16a34a', borderWidth: 1 },
  featureCardFacebook: { borderColor: '#1877f2', borderWidth: 1 },
  featureCardPlaystore: { borderColor: '#01875f', borderWidth: 1 },
  featureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#111827', borderColor: '#16a34a', borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureIconActive: { backgroundColor: 'rgba(22,163,74,0.15)' },
  featureIconFacebook: { backgroundColor: 'rgba(24,119,242,0.15)', borderColor: '#1877f2' },
  featureIconPlaystore: { backgroundColor: 'rgba(1,135,95,0.15)', borderColor: '#01875f' },
  featureText: { color: '#f8fafc', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  featureCardAgriquexData: { borderColor: '#f59e0b', borderWidth: 1 },
  featureIconAgriquexData: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: '#f59e0b' },
  featureTextAgriquexData: { color: '#f59e0b' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: '#6b7280', fontSize: 13, marginTop: 3 },
  modalClose: { padding: 6, backgroundColor: '#1f2937', borderRadius: 99 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center' },
  tabActive: { backgroundColor: '#16a34a' },
  tabText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  modalBody: { flexGrow: 0 },
  tabDescription: { color: '#9ca3af', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  inputName: { backgroundColor: '#1f2937', borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 10 },
  inputMessage: { backgroundColor: '#1f2937', borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, height: 120, marginBottom: 16 },
  sendBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emailNote: { color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 26 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  browseAll: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 },
  categoryCard: { flex: 1, backgroundColor: '#111827', borderRadius: 24, padding: 18, marginRight: 12, minHeight: 140, justifyContent: 'space-between' },
  categoryIconContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 20 },
  visitorCard: { width: '100%', borderRadius: 24, overflow: 'hidden', marginTop: 20, padding: 20, alignSelf: 'center', minHeight: 240, justifyContent: 'space-between' },
  
  visitorHeader: { marginBottom: 20 },
  visitorTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  visitorSubtitle: { color: '#d1d5db', fontSize: 12, lineHeight: 18, maxWidth: '85%' },
  visitorUsersLabel: { color: '#e5e7eb', fontSize: 10, letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  visitorUsersValue: { color: '#fbbf24', fontSize: 42, fontWeight: '900' },
  visitorSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  visitorMetricBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  visitorMetricLabel: { color: '#e5e7eb', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  visitorMetricValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  visitorFooter: { color: '#34d399', fontSize: 12, fontWeight: '700', marginTop: 16 },
  bottomSpacer: { height: 120 },
  sectionHeaderAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  productCard: { flex: 1, backgroundColor: '#111827', margin: 8, borderRadius: 12, overflow: 'hidden' },
  productImage: { width: '100%', height: 120 },
  productName: { fontSize: 13, fontWeight: '700', color: '#fff', padding: 8 },
  productPrice: { fontSize: 13, color: '#f59e0b', fontWeight: '800', paddingHorizontal: 8, paddingBottom: 8 },
})
