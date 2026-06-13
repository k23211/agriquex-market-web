import { useState, useEffect, useCallback } from 'react'

import {

  View, Text, TextInput, TouchableOpacity,

  StyleSheet, Alert, ActivityIndicator,

  ScrollView, Image, RefreshControl, ImageBackground,

} from 'react-native'

import * as ImagePicker from 'expo-image-picker'

import * as FileSystem from 'expo-file-system/legacy'

import { supabase } from '../lib/supabase'



const sellBg = require('../assets/images/sell.png')

const categories = ['Electronics', 'Fashion', 'Food', 'Home', 'Beauty', 'Vehicles', 'Other']



type Product = {

  id: string

  name: string

  price: number

  description: string

  category: string

  image_url: string

  status?: string

}



type View = 'dashboard' | 'post'



export default function SellerDashboard({ navigation }: any) {

  const [_session, setSession] = useState<any>(undefined)



  const [view, setView] = useState<View>('dashboard')

  const [products, setProducts] = useState<Product[]>([])

  const [userName, setUserName] = useState('')

  const [loadingProducts, setLoadingProducts] = useState(true)

  const [refreshing, setRefreshing] = useState(false)



  // Post form state

  const [title, setTitle] = useState('')

  const [price, setPrice] = useState('')

  const [description, setDescription] = useState('')

  const [category, setCategory] = useState('Electronics')

  const [image, setImage] = useState<string | null>(null)

  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState('')



  // Edit mode

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)



  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))

    return () => listener.subscription.unsubscribe()

  }, [])



  const fetchProducts = useCallback(async () => {

    try {

      const { data: { session } } = await supabase.auth.getSession()

      const user = session?.user

      if (!user) return



      const { data: profile } = await supabase

        .from('profiles')

        .select('full_name, username')

        .eq('id', user.id)

        .single()



      if (profile) setUserName(profile.full_name || profile.username || 'Seller')



      const { data, error } = await supabase

        .from('products')

        .select('*')

        .eq('seller_id', user.id)

        .order('created_at', { ascending: false })



      if (error) throw error

      setProducts(data || [])

    } catch (err: any) {

      console.log('fetchProducts error:', err)

    } finally {

      setLoadingProducts(false)

      setRefreshing(false)

    }

  }, [])



  useEffect(() => {

    fetchProducts()

  }, [fetchProducts])



  const onRefresh = () => {

    setRefreshing(true)

    fetchProducts()

  }



  const pickImage = async () => {

    const result = await ImagePicker.launchImageLibraryAsync({

      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      allowsEditing: true,

      quality: 0.7,

    })

    if (!result.canceled && result.assets?.length) {

      setImage(result.assets[0].uri)
      setFormError('')

    }

  }



  const resetForm = () => {

    setTitle(''); setPrice(''); setDescription('')

    setCategory('Electronics'); setImage(null)

    setEditingProduct(null)
    setFormError('')

  }



  const openEditForm = (product: Product) => {

    setEditingProduct(product)
    setFormError('')

    setTitle(product.name)

    setPrice(String(product.price))

    setDescription(product.description || '')

    setCategory(product.category || 'Electronics')

    setImage(product.image_url)

    setView('post')

  }



  const handleDelete = (product: Product) => {

    Alert.alert(

      'Delete Product',

      `Are you sure you want to delete "${product.name}"?`,

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Delete', style: 'destructive',

          onPress: async () => {

            const { error } = await supabase.from('products').delete().eq('id', product.id)

            if (error) {

              Alert.alert('Error', error.message)

            } else {

              setProducts(prev => prev.filter(p => p.id !== product.id))

            }

          }

        }

      ]

    )

  }



  const handlePost = async () => {

    setFormError('')
    const trimmedTitle = title.trim()
    const trimmedPrice = price.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle) {
      setFormError('Please enter a product title')
      return
    }
    if (!trimmedPrice) {
      setFormError('Please enter a price')
      return
    }
    const priceValue = parseFloat(trimmedPrice.replace(/,/g, ''))
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setFormError('Please enter a valid price')
      return
    }
    if (!trimmedDescription) {
      setFormError('Please enter a product description')
      return
    }

    if (!editingProduct && !image) {
      setFormError('Please add a product image')
      return
    }



    setPosting(true)

    try {

      const { data: { session } } = await supabase.auth.getSession()

      const user = session?.user

      if (!user) throw new Error('Not authenticated')



      let publicUrl = editingProduct?.image_url || ''



      if (image && !image.startsWith('http')) {

        const fileExt = image.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'

        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg'



        let uploadData: Uint8Array | Blob



        if (image.startsWith('blob:') || image.startsWith('data:')) {

          const response = await fetch(image)

          uploadData = await response.blob()

        } else {

          const base64 = await FileSystem.readAsStringAsync(image, {

            encoding: FileSystem.EncodingType.Base64,

          })

          const binary = atob(base64)

          const bytes = new Uint8Array(binary.length)

          for (let i = 0; i < binary.length; i++) {

            bytes[i] = binary.charCodeAt(i)

          }

          uploadData = bytes

        }



        const { error: uploadError } = await supabase.storage

          .from('products')

          .upload(fileName, uploadData, { contentType: mimeType })

        if (uploadError) throw uploadError



        const { data: { publicUrl: url } } = supabase.storage

          .from('products')

          .getPublicUrl(fileName)

        publicUrl = url

      }



      if (editingProduct) {

        const { data: updateData, error } = await supabase.from('products').update({

          name: title,

          price: priceValue,

          description,

          category,

          image_url: publicUrl,

        }).eq('id', editingProduct.id).eq('seller_id', user.id).select()



        console.log('update result data:', updateData, 'error:', error)

        if (error) throw error



        Alert.alert('Success', 'Product updated!', [

          { text: 'OK', onPress: () => { resetForm(); setView('dashboard'); fetchProducts() } }

        ])

      } else {

        const { error } = await supabase.from('products').insert({

          name: title,

          price: priceValue,

          description,

          category,

          image_url: publicUrl,

          seller_id: user.id,

        })

        if (error) throw error



        Alert.alert('Success', 'Product posted!', [

          { text: 'OK', onPress: () => { resetForm(); setView('dashboard'); fetchProducts() } }

        ])

      }

    } catch (err: any) {

      console.log('handlePost error:', err)

      Alert.alert('Error', err?.message || 'Please try again')

    } finally {

      setPosting(false)

    }

  }



  // ─── UNAUTHENTICATED VIEW ─────────────────────────────────────────────────

  if (_session === null) {

    return (

      <View style={{ flex: 1, backgroundColor: '#070707', alignItems: 'center', justifyContent: 'center', padding: 32 }}>

        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏪</Text>

        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>Start Selling on Agriquex</Text>

        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>Sign in or create a free account to list your products and reach buyers across Ghana.</Text>

        <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12, width: '100%', alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>

          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Sign In to Sell</Text>

        </TouchableOpacity>

        <TouchableOpacity style={{ borderWidth: 1, borderColor: '#16a34a', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center' }} onPress={() => navigation.navigate('Register')}>

          <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 16 }}>Create Free Account</Text>

        </TouchableOpacity>

      </View>

    )

  }



  // ─── DASHBOARD VIEW ───────────────────────────────────────────────────────

  if (view === 'dashboard') {

    return (

      <ImageBackground source={sellBg} style={styles.background} imageStyle={styles.imageBackground}>

        <ScrollView

          style={styles.dashContainer}

          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}

        >

          {/* Header */}

          <View style={styles.dashHeader}>

            <View>

              <Text style={styles.brandText}>

                <Text style={styles.brandBold}>Agri</Text>

                <Text style={styles.brandGold}>quex</Text>

              </Text>

              <Text style={styles.dashSubtitle}>Seller Dashboard</Text>

            </View>

            <Text style={styles.hiText}>

              Hi, <Text style={styles.hiName}>{userName}</Text>

            </Text>

          </View>



          {/* Welcome banner */}

          <View style={styles.welcomeBanner}>

            <Text style={styles.welcomeText}>

              Welcome back, <Text style={styles.welcomeName}>{userName}</Text>

            </Text>

            <Text style={styles.welcomeSub}>Manage your products and services</Text>

          </View>



          {/* Stats */}

          <View style={styles.statsCard}>

            <Text style={styles.statsNumber}>{products.length}</Text>

            <Text style={styles.statsLabel}>Products</Text>

          </View>



          {/* Products section */}

          <View style={styles.sectionRow}>

            <Text style={styles.sectionTitle}>Products</Text>

            <Text style={styles.itemCount}>{products.length} items</Text>

          </View>



          {/* Add button */}

          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setView('post') }}>

            <Text style={styles.addBtnText}>+ Add New Product</Text>

          </TouchableOpacity>



          {/* Product list */}

          {loadingProducts ? (

            <ActivityIndicator color="#f59e0b" style={{ marginTop: 32 }} />

          ) : products.length === 0 ? (

            <Text style={styles.emptyText}>No products yet. Tap "+ Add New Product" to get started.</Text>

          ) : (

            products.map(product => (

              <View key={product.id} style={styles.productCard}>

                <Image

                  source={{ uri: product.image_url }}

                  style={styles.productImage}

                  resizeMode="cover"

                />

                <View style={styles.productInfo}>

                  <Text style={styles.productName}>{product.name}</Text>

                  <Text style={styles.productPrice}>GH₵ {product.price.toLocaleString()}</Text>

                  <View style={styles.statusBadge}>

                    <Text style={styles.statusText}>{product.status || 'Active'}</Text>

                  </View>

                </View>

                <View style={styles.productActions}>

                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditForm(product)}>

                    <Text style={styles.editBtnText}>Edit</Text>

                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(product)}>

                    <Text style={styles.deleteBtnText}>Delete</Text>

                  </TouchableOpacity>

                </View>

              </View>

            ))

          )}



          <View style={{ height: 100 }} />

        </ScrollView>

      </ImageBackground>

    )

  }



  // ─── POST / EDIT FORM VIEW ────────────────────────────────────────────────

  return (

    <ImageBackground source={sellBg} style={styles.background} imageStyle={styles.imageBackground}>

      <ScrollView style={styles.formContainer}>

        <View style={styles.formHeaderRow}>

          <TouchableOpacity onPress={() => { resetForm(); setView('dashboard') }}>

            <Text style={styles.backBtn}>← Back</Text>

          </TouchableOpacity>

          <Text style={styles.heading}>

            {editingProduct ? 'Edit Product' : 'Post a Product'}

          </Text>

        </View>



        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>

          {image

            ? <Image source={{ uri: image }} style={styles.previewImage} />

            : <Text style={styles.imagePickerText}>📷 Tap to add photo</Text>

          }

        </TouchableOpacity>



        <TextInput style={styles.input} placeholder="Product Title" value={title} onChangeText={setTitle} placeholderTextColor="#fff" />

        <TextInput style={styles.input} placeholder="Price (GH₵)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#fff" />

        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholderTextColor="#fff" />



        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <Text style={styles.label}>Category</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>

          {categories.map(cat => (

            <TouchableOpacity

              key={cat}

              style={[styles.catChip, category === cat && styles.catActive]}

              onPress={() => setCategory(cat)}

            >

              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>

            </TouchableOpacity>

          ))}

        </ScrollView>



        <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={posting}>

          {posting

            ? <ActivityIndicator color="#fff" />

            : <Text style={styles.btnText}>{editingProduct ? 'Update Product' : 'Post Product'}</Text>

          }

        </TouchableOpacity>



        <View style={{ height: 80 }} />

      </ScrollView>

    </ImageBackground>

  )

}



const styles = StyleSheet.create({

  // ── Shared ──

  background: { flex: 1 },

  imageBackground: { resizeMode: 'cover', opacity: 1 },



  // ── Dashboard ──

  dashContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)' },

  dashHeader: {

    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',

    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,

  },

  brandText: { fontSize: 20 },

  brandBold: { color: '#fff', fontWeight: 'bold' },

  brandGold: { color: '#f59e0b', fontWeight: 'bold' },

  dashSubtitle: { color: '#aaa', fontSize: 12, marginTop: 2 },

  hiText: { color: '#fff', fontSize: 14 },

  hiName: { color: '#f59e0b', fontWeight: 'bold' },

  welcomeBanner: {

    backgroundColor: '#1c1c1e', marginHorizontal: 16, marginTop: 8,

    borderRadius: 12, padding: 16, marginBottom: 16,

  },

  welcomeText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

  welcomeName: { color: '#f59e0b' },

  welcomeSub: { color: '#aaa', marginTop: 4, fontSize: 13 },

  statsCard: {

    backgroundColor: '#1c1c1e', marginHorizontal: 16, borderRadius: 12,

    padding: 20, alignItems: 'center', marginBottom: 20,

  },

  statsNumber: { color: '#f59e0b', fontSize: 36, fontWeight: 'bold' },

  statsLabel: { color: '#aaa', fontSize: 14, marginTop: 4 },

  sectionRow: {

    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',

    paddingHorizontal: 16, marginBottom: 12,

  },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  itemCount: { color: '#aaa', fontSize: 13 },

  addBtn: {

    backgroundColor: '#f59e0b', marginHorizontal: 16, borderRadius: 12,

    padding: 16, alignItems: 'center', marginBottom: 16,

  },

  addBtnText: { color: '#111', fontWeight: 'bold', fontSize: 16 },

  emptyText: { color: '#888', textAlign: 'center', marginTop: 32, paddingHorizontal: 32, fontSize: 14 },

  productCard: {

    backgroundColor: '#1c1c1e', marginHorizontal: 16, borderRadius: 12,

    flexDirection: 'row', alignItems: 'center', marginBottom: 12, overflow: 'hidden', padding: 10,

  },

  productImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#333' },

  productInfo: { flex: 1, paddingHorizontal: 12 },

  productName: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },

  productPrice: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },

  statusBadge: {

    backgroundColor: '#14532d', borderRadius: 20, paddingHorizontal: 10,

    paddingVertical: 3, alignSelf: 'flex-start',

  },

  statusText: { color: '#4ade80', fontSize: 11, fontWeight: '600' },

  productActions: { gap: 8 },

  editBtn: {

    backgroundColor: '#0d9488', borderRadius: 8,

    paddingHorizontal: 14, paddingVertical: 8,

  },

  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  deleteBtn: {

    backgroundColor: '#7f1d1d', borderRadius: 8,

    paddingHorizontal: 14, paddingVertical: 8,

  },

  deleteBtnText: { color: '#f87171', fontWeight: 'bold', fontSize: 13 },



  // ── Form ──

  formContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', padding: 16 },

  formHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },

  backBtn: { color: '#16a34a', fontSize: 16, fontWeight: '600' },

  heading: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

  imagePicker: {

    width: '100%', height: 180, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,

    alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden',

    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',

  },

  imagePickerText: { color: '#aaa', fontSize: 16 },

  previewImage: { width: '100%', height: '100%' },

  input: {

    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 10,

    padding: 13, marginBottom: 12, fontSize: 15, color: '#fff',

    backgroundColor: 'rgba(255,255,255,0.12)',

  },

  label: { fontSize: 14, fontWeight: '600', color: '#ccc', marginBottom: 8 },
  formError: { color: '#fca5a5', marginBottom: 12, fontSize: 14 },

  catChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },

  catActive: { backgroundColor: '#16a34a' },

  catText: { color: '#aaa', fontSize: 13 },

  catTextActive: { color: '#fff' },

  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 16 },

  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

})

