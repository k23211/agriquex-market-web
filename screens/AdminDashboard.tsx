import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import RequireAdmin from '../lib/RequireAdmin'
import { useAppTheme } from '../lib/theme'
import { useProfile } from '../lib/profileContext'

function AdminDashboardInner() {
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const theme = useAppTheme()
  const { profile } = useProfile()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setUsers(usersData || [])
      setProducts(productsData || [])
    } catch (e) {
      console.log('admin fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteUser = (u: any) => {
    Alert.alert('Delete user', `Delete ${u.full_name || u.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteUser(u) },
    ])
  }

  const handleDeleteUser = async (u: any) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', u.id)
      if (error) throw error
      setUsers(prev => prev.filter(p => p.id !== u.id))
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete user')
    }
  }

  const confirmDeleteProduct = (p: any) => {
    Alert.alert('Delete product', `Delete ${p.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteProduct(p) },
    ])
  }

  const handleDeleteProduct = async (p: any) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id)
      if (error) throw error
      setProducts(prev => prev.filter(x => x.id !== p.id))
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete product')
    }
  }

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.background }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Admin Dashboard</Text>

      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>Users</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View>
              <Text style={{ fontWeight: '700' }}>{item.full_name || item.username || '—'}</Text>
              <Text style={{ color: theme.textSecondary }}>{item.email}</Text>
            </View>
            <TouchableOpacity onPress={() => confirmDeleteUser(item)} style={{ padding: 8 }}>
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: theme.textSecondary }}>No users found.</Text>}
      />

      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>Products</Text>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View>
              <Text style={{ fontWeight: '700' }}>{item.name || '—'}</Text>
              <Text style={{ color: theme.textSecondary }}>{item.price ? `GHS ${item.price}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => confirmDeleteProduct(item)} style={{ padding: 8 }}>
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: theme.textSecondary }}>No products found.</Text>}
      />
    </View>
  )
}

export default function AdminDashboardScreen() {
  return (
    <RequireAdmin>
      <AdminDashboardInner />
    </RequireAdmin>
  )
}
