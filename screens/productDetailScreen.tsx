import {
  View, Text, ScrollView, Image,
  TouchableOpacity, StyleSheet, Linking, Alert,
  TextInput, ActivityIndicator, Modal
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useEffect, useState, useRef } from 'react'
import * as Location from 'expo-location'
import { useAppTheme } from '../lib/theme'

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [session, setSession] = useState<any>(undefined)

  // Views Counter
  const [viewCount, setViewCount] = useState<number>(product.views || 0)

  // Reviews & Ratings
  const [reviews, setReviews] = useState<any[]>([])
  const [myRating, setMyRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Nearby Listings
  const [nearbyProducts, setNearbyProducts] = useState<any[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)

  // Boost
  const [isBoosted, setIsBoosted] = useState(product.is_boosted || false)
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostModalVisible, setBoostModalVisible] = useState(false)

  const theme = useAppTheme()

  const hasIncrementedView = useRef(false)

  // ─── Session ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  // ─── Seller Profile ────────────────────────────────────────────────
  useEffect(() => {
    if (product?.seller_id) {
      supabase
        .from('profiles')
        .select('full_name, phone, location, avatar_url')
        .eq('id', product.seller_id)
        .single()
        .then((res: any) => setSellerProfile(res.data))
    }
  }, [])

  // ─── 1. Product Views Counter ──────────────────────────────────────
  useEffect(() => {
    if (hasIncrementedView.current) return
    hasIncrementedView.current = true

    const incrementViews = async () => {
      const { data } = await supabase
        .from('products')
        .select('views')
        .eq('id', product.id)
        .single()

      const currentViews = data?.views || 0
      const newViews = currentViews + 1

      await supabase
        .from('products')
        .update({ views: newViews })
        .eq('id', product.id)

      setViewCount(newViews)
    }

    incrementViews()
  }, [])

  // ─── 2. Reviews & Ratings ─────────────────────────────────────────
  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id, profiles(full_name, avatar_url)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (e) {
      // Fallback without profiles join
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
      setReviews(data || [])
    } finally {
      setReviewsLoading(false)
    }
  }

  const submitReview = async () => {
    if (!session) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.')
      return
    }
    if (myRating === 0) {
      Alert.alert('Select Rating', 'Please tap a star to rate.')
      return
    }
    setSubmittingReview(true)

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product.id)
      .eq('reviewer_id', session.user.id)
      .single()

    if (existing) {
      await supabase
        .from('reviews')
        .update({ rating: myRating, comment: reviewText })
        .eq('id', existing.id)
    } else {
      await supabase.from('reviews').insert({
        product_id: product.id,
        seller_id: product.seller_id,
        reviewer_id: session.user.id,
        rating: myRating,
        comment: reviewText,
      })
    }

    setReviewText('')
    setMyRating(0)
    setSubmittingReview(false)
    await fetchReviews()
    Alert.alert('Thanks!', 'Your review has been submitted.')
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  // ─── 3. Nearby Listings ────────────────────────────────────────────
  const loadNearbyListings = async () => {
    setNearbyLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed for nearby listings.')
        setNearbyLoading(false)
        return
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords

      // Get products in same category, filter by seller location if available
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, profiles(location)')
        .eq('category', product.category)
        .neq('id', product.id)
        .limit(6)

      setNearbyProducts(data || [])
    } catch {
      Alert.alert('Error', 'Could not fetch nearby listings.')
    }
    setNearbyLoading(false)
  }

  // ─── 4. Boost Listings ─────────────────────────────────────────────
  const handleBoost = async () => {
    if (!session) {
      Alert.alert('Sign In Required', 'Please sign in to boost your listing.')
      return
    }
    if (session.user.id !== product.seller_id) {
      Alert.alert('Not Your Listing', 'Only the seller can boost this listing.')
      return
    }
    setBoostModalVisible(true)
  }

  const confirmBoost = async (days: number) => {
    setBoostModalVisible(false)
    setBoostLoading(true)

    const boostUntil = new Date()
    boostUntil.setDate(boostUntil.getDate() + days)

    await supabase
      .from('products')
      .update({ is_boosted: true, boosted_until: boostUntil.toISOString() })
      .eq('id', product.id)

    setIsBoosted(true)
    setBoostLoading(false)
    Alert.alert('🚀 Boosted!', `Your listing is now promoted for ${days} day${days > 1 ? 's' : ''}.`)
  }

  // ─── Contact Helpers ───────────────────────────────────────────────
  const requireLogin = (action: () => void) => {
    if (session === null) {
      Alert.alert('Sign In Required', 'You need to sign in to contact sellers.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        { text: 'Register', onPress: () => navigation.navigate('Register') },
      ])
      return
    }
    action()
  }

  const handleContact = () => {
    if (sellerProfile?.phone) {
      Linking.openURL(`tel:${sellerProfile.phone}`)
    } else {
      Alert.alert('No contact', 'Seller has not provided a phone number.')
    }
  }

  const handleWhatsApp = () => {
    if (sellerProfile?.phone) {
      const phone = sellerProfile.phone.replace(/^0/, '233')
      Linking.openURL(`https://wa.me/${phone}`)
    } else {
      Alert.alert('No contact', 'Seller has not provided a phone number.')
    }
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
      </TouchableOpacity>

      {/* Product Image */}
      <Image
        source={{ uri: product.image_url || 'https://via.placeholder.com/400' }}
        style={styles.image}
      />

      {/* Views Badge */}
      <View style={styles.viewsBadge}>
        <Text style={styles.viewsText}>👁 {viewCount} views</Text>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: theme.surface }] }>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>
          {isBoosted && (
            <View style={styles.boostedBadge}>
              <Text style={styles.boostedText}>🚀 Boosted</Text>
            </View>
          )}
        </View>
        <Text style={[styles.price, { color: theme.accent2 }]}>GH₵ {product.price}</Text>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, { color: theme.accent }]}>{product.category}</Text>
        </View>
        {avgRating && (
          <View style={styles.ratingRow}>
            <Text style={styles.starDisplay}>{'⭐'.repeat(Math.round(Number(avgRating)))}</Text>
            <Text style={styles.ratingLabel}>{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</Text>
          </View>
        )}
        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}
      </View>

      {/* Seller Card */}
      {sellerProfile && (
        <View style={[styles.sellerCard, { backgroundColor: theme.surface }] }>
          <Text style={[styles.sellerHeading, { color: theme.textSecondary }]}>SELLER</Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              {sellerProfile.avatar_url
                ? <Image source={{ uri: sellerProfile.avatar_url }} style={styles.avatarImg} />
                : <Text style={styles.avatarInitial}>{sellerProfile.full_name?.[0]?.toUpperCase() || '?'}</Text>
              }
            </View>
            <View>
              <Text style={[styles.sellerName, { color: theme.text }]}>{sellerProfile.full_name || 'Unknown Seller'}</Text>
              {sellerProfile.location
                ? <Text style={[styles.sellerLocation, { color: theme.textSecondary }]}>📍 {sellerProfile.location}</Text>
                : null}
            </View>
          </View>

          {/* Boost Button (seller only) */}
          {session?.user?.id === product.seller_id && (
            <TouchableOpacity
              style={[styles.boostBtn, isBoosted && styles.boostBtnActive, { borderColor: theme.accent }]}
              onPress={handleBoost}
              disabled={boostLoading}
            >
              {boostLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.boostBtnText}>{isBoosted ? '🚀 Currently Boosted' : '🚀 Boost This Listing'}</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Contact Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.callBtn, { backgroundColor: theme.accent }]} onPress={() => requireLogin(handleContact)}>
          <Text style={[styles.callBtnText, { color: theme.background }]}>📞 Call Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.waBtn} onPress={() => requireLogin(handleWhatsApp)}>
          <Text style={styles.waBtnText}>💬 WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* ── Reviews & Ratings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Reviews & Ratings</Text>

        {/* Leave a review */}
        <View style={styles.reviewForm}>
          <Text style={styles.reviewFormLabel}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setMyRating(star)}>
                <Text style={[styles.starBtn, myRating >= star && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.reviewInput}
            placeholder="Write a comment (optional)..."
            placeholderTextColor="#6b7280"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
          />
          <TouchableOpacity
            style={styles.submitReviewBtn}
            onPress={submitReview}
            disabled={submittingReview}
          >
            {submittingReview
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitReviewText}>Submit Review</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Reviews List */}
        {reviewsLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginTop: 16 }} />
        ) : reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
        ) : (
          reviews.map(r => (
            <View key={r.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {r.profiles?.full_name || 'Anonymous'}
                </Text>
                <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              <Text style={styles.reviewDate}>
                {new Date(r.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Nearby Listings ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📍 Nearby Listings</Text>
          <TouchableOpacity onPress={loadNearbyListings} disabled={nearbyLoading}>
            <Text style={styles.loadBtn}>{nearbyLoading ? 'Loading...' : 'Load'}</Text>
          </TouchableOpacity>
        </View>

        {nearbyProducts.length === 0 && !nearbyLoading && (
          <Text style={styles.emptyText}>Tap "Load" to find similar products nearby.</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyScroll}>
          {nearbyProducts.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.nearbyCard}
              onPress={() => navigation.push('ProductDetail', { product: p })}
            >
              <Image
                source={{ uri: p.image_url || 'https://via.placeholder.com/120' }}
                style={styles.nearbyImage}
              />
              <Text style={styles.nearbyName} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.nearbyPrice}>GH₵ {p.price}</Text>
              {p.profiles?.location && (
                <Text style={styles.nearbyLocation} numberOfLines={1}>📍 {p.profiles.location}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 80 }} />

      {/* ── Boost Modal ── */}
      <Modal
        visible={boostModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBoostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚀 Boost Your Listing</Text>
            <Text style={styles.modalSubtitle}>
              Boosted listings appear at the top of search results.
            </Text>
            {[
              { label: '1 Day', days: 1 },
              { label: '3 Days', days: 3 },
              { label: '7 Days', days: 7 },
            ].map(opt => (
              <TouchableOpacity
                key={opt.days}
                style={styles.boostOption}
                onPress={() => confirmBoost(opt.days)}
              >
                <Text style={styles.boostOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setBoostModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070707' },
  backBtn: { padding: 16, paddingBottom: 8 },
  backText: { color: '#16a34a', fontSize: 15, fontWeight: '700' },
  image: { width: '100%', height: 280, resizeMode: 'cover' },

  // Views
  viewsBadge: { position: 'absolute', top: 230, right: 16, backgroundColor: '#00000099', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  viewsText: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },

  // Info Card
  infoCard: { backgroundColor: '#111827', margin: 16, borderRadius: 16, padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', flex: 1, marginRight: 8 },
  price: { color: '#f59e0b', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#16a34a22', borderWidth: 1, borderColor: '#16a34a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  categoryText: { color: '#16a34a', fontSize: 13, fontWeight: '600' },
  description: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  starDisplay: { fontSize: 16 },
  ratingLabel: { color: '#9ca3af', fontSize: 13 },

  // Boosted
  boostedBadge: { backgroundColor: '#f59e0b22', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  boostedText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },

  // Seller Card
  sellerCard: { backgroundColor: '#111827', marginHorizontal: 16, borderRadius: 16, padding: 18, marginBottom: 16 },
  sellerHeading: { color: '#6b7280', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#84cc16', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarInitial: { color: '#070707', fontSize: 20, fontWeight: '800' },
  sellerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sellerLocation: { color: '#9ca3af', fontSize: 13, marginTop: 4 },

  // Boost Button
  boostBtn: { backgroundColor: '#1e3a5f', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  boostBtnActive: { backgroundColor: '#f59e0b22', borderColor: '#f59e0b' },
  boostBtnText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },

  // Contact Buttons
  btnRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  callBtn: { flex: 1, backgroundColor: '#16a34a', padding: 16, borderRadius: 14, alignItems: 'center' },
  callBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  waBtn: { flex: 1, backgroundColor: '#25D366', padding: 16, borderRadius: 14, alignItems: 'center' },
  waBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Sections
  section: { backgroundColor: '#111827', marginHorizontal: 16, borderRadius: 16, padding: 18, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  loadBtn: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingVertical: 12 },

  // Review Form
  reviewForm: { backgroundColor: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 16 },
  reviewFormLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starBtn: { fontSize: 28, color: '#374151' },
  starActive: { color: '#f59e0b' },
  reviewInput: { backgroundColor: '#1f2937', color: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 70, textAlignVertical: 'top', marginBottom: 10 },
  submitReviewBtn: { backgroundColor: '#16a34a', borderRadius: 10, padding: 12, alignItems: 'center' },
  submitReviewText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Review Items
  reviewItem: { borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 12, marginTop: 4, marginBottom: 4 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { color: '#e5e7eb', fontWeight: '700', fontSize: 14 },
  reviewStars: { fontSize: 14 },
  reviewComment: { color: '#d1d5db', fontSize: 14, marginBottom: 4 },
  reviewDate: { color: '#6b7280', fontSize: 12 },

  // Nearby
  nearbyScroll: { marginHorizontal: -4 },
  nearbyCard: { width: 130, marginHorizontal: 6, backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' },
  nearbyImage: { width: '100%', height: 90, resizeMode: 'cover' },
  nearbyName: { color: '#e5e7eb', fontSize: 12, fontWeight: '600', padding: 8, paddingBottom: 2 },
  nearbyPrice: { color: '#f59e0b', fontSize: 13, fontWeight: '800', paddingHorizontal: 8 },
  nearbyLocation: { color: '#6b7280', fontSize: 11, padding: 8, paddingTop: 2 },

  // Boost Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 20 },
  boostOption: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 16, marginBottom: 10, alignItems: 'center' },
  boostOptionText: { color: '#60a5fa', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 4, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontSize: 15 },
})
