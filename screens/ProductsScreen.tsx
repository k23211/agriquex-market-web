import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ImageBackground, ActivityIndicator, TextInput
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useAppTheme } from '../lib/theme'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const categories = ['All', 'Electronics', 'Fashion', 'Food', 'Home', 'Beauty', 'Vehicles', 'Other']

export default function ProductsScreen({ navigation, route }: any) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState(route?.params?.category || 'All')
  const [search, setSearch] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({})
  const theme = useAppTheme()

  useEffect(() => {
    fetchProducts(selectedCat)
  }, [selectedCat])

  useEffect(() => {
    const cat = route?.params?.category
    if (cat && cat !== selectedCat) setSelectedCat(cat)
  }, [route?.params?.category])

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('recent_searches')
        if (raw) setRecentSearches(JSON.parse(raw))
      } catch (e) {
        // ignore
      }
    }
    load()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchProducts(selectedCat)
    }, [selectedCat])
  )

  const fetchProducts = async (cat: string) => {
    setLoading(true)
    try {
      let query: any = supabase
        .from('products')
        .select('*')
        // Boosted first, then newest
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })

      if (cat !== 'All') query = query.eq('category', cat)

      const { data, error } = await query
      const productList = error ? [] : (data || [])
      setProducts(productList)

      // Fetch average ratings for all products
      if (productList.length > 0) {
        const ids = productList.map((p: any) => p.id)
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', ids)

        // Aggregate ratings per product
        const ratingMap: Record<string, { sum: number; count: number }> = {}
        ;(reviewData || []).forEach((r: any) => {
          if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 }
          ratingMap[r.product_id].sum += r.rating
          ratingMap[r.product_id].count += 1
        })

        const avgMap: Record<string, { avg: number; count: number }> = {}
        Object.entries(ratingMap).forEach(([id, { sum, count }]) => {
          avgMap[id] = { avg: sum / count, count }
        })
        setRatings(avgMap)
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const saveSearch = async (term: string) => {
    const t = term?.trim()
    if (!t) return
    try {
      const next = [t, ...recentSearches.filter(s => s !== t)].slice(0, 10)
      setRecentSearches(next)
      await AsyncStorage.setItem('recent_searches', JSON.stringify(next))
    } catch (e) {
      // ignore
    }
  }

  const renderStars = (avg: number) => {
    const full = Math.round(avg)
    return '⭐'.repeat(full)
  }

  return (
    <ImageBackground
      source={require('../assets/images/browse.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <TextInput
          style={styles.search}
          placeholder="🔍 Search products..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => saveSearch(search)}
        />

        {recentSearches.length > 0 && search.trim() === '' && (
          <FlatList
            data={recentSearches}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.recentChip, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { setSearch(item); saveSearch(item); }}>
                  <Text style={[styles.recentText, { color: theme.text }]}>{item}</Text>
                </TouchableOpacity>
            )}
          />
        )}

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          style={styles.catRow}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item && styles.catActive, { backgroundColor: selectedCat === item ? theme.accent : theme.surface, borderColor: theme.border }]}
              onPress={() => setSelectedCat(item)}
            >
              <Text style={[styles.catText, selectedCat === item && styles.catTextActive, { color: selectedCat === item ? '#fff' : theme.text }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 8, paddingBottom: 80 }}
            renderItem={({ item }) => {
              const rating = ratings[item.id]
              return (
                <TouchableOpacity
                  style={[styles.card, item.is_boosted && styles.cardBoosted]}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                >
                  {/* Boosted badge */}
                  {item.is_boosted && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostBadgeText}>🚀 Boosted</Text>
                    </View>
                  )}

                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.image}
                  />

                  <View style={styles.cardInfo}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.price}>GH₵ {item.price}</Text>

                    {/* Rating row */}
                    {rating ? (
                      <View style={styles.ratingRow}>
                        <Text style={styles.stars}>{renderStars(rating.avg)}</Text>
                        <Text style={styles.ratingCount}>({rating.count})</Text>
                      </View>
                    ) : null}

                    {/* Views */}
                    {item.views > 0 && (
                      <Text style={styles.views}>👁 {item.views}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: 'transparent' },
  backgroundImage: { opacity: 0.8 },
  container: { flex: 1, backgroundColor: 'transparent' },
  search: { margin: 12, padding: 12, backgroundColor: '#ffffffde', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 15, color: '#111' },
  catRow: { marginBottom: 8, maxHeight: 46 },
  catChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, height: 36, justifyContent: 'center' },
  catActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catText: { color: '#666', fontSize: 13 },
  catTextActive: { color: '#fff' },
  recentChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, height: 36, justifyContent: 'center' },
  recentText: { color: '#444', fontSize: 13 },

  // Cards
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.88)', margin: 6, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  cardBoosted: { borderWidth: 2, borderColor: '#f59e0b', elevation: 6 },

  // Boost badge
  boostBadge: { position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  boostBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  image: { width: '100%', height: 140 },
  cardInfo: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 4 },
  price: { fontSize: 14, color: '#16a34a', fontWeight: 'bold', marginBottom: 4 },

  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  stars: { fontSize: 11 },
  ratingCount: { color: '#6b7280', fontSize: 11 },

  // Views
  views: { color: '#9ca3af', fontSize: 11 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 16 },
}) as any
