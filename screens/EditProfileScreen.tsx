import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useProfile } from '../lib/profileContext'

export default function EditProfileScreen({ navigation }: any) {
  const { profile, setProfile } = useProfile()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      Alert.alert('Error', userError?.message || 'Unable to load user')
      setLoading(false)
      return
    }

    setEmail(user.email || '')
    setFullName(user.user_metadata?.full_name || profile?.full_name || '')
    setPhone(profile?.phone || '')
    setLocation(profile?.location || '')

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, location')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // ignore "No rows found" style errors for empty profile
      Alert.alert('Error', error.message)
    }

    if (data) {
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      Alert.alert('Error', userError?.message || 'Unable to save profile')
      setSaving(false)
      return
    }

    const updates = {
      id: user.id,
      full_name: fullName,
      phone,
      location,
    }

    const { error } = await supabase.from('profiles').upsert(updates)
    if (error) {
      Alert.alert('Error', error.message)
      setSaving(false)
      return
    }

    await supabase.auth.updateUser({ data: { full_name: fullName } })

    setProfile({
      ...(profile ?? {}),
      full_name: fullName,
      phone,
      location,
    })

    setSaving(false)
    Alert.alert('Profile saved')
    navigation.goBack()
  }

  if (loading) return <ActivityIndicator color="#16a34a" style={{ flex: 1 }} />

  return (
    <ImageBackground
      source={require('../assets/images/profile.png')}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Edit Profile</Text>
        </View>

        <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          placeholderTextColor="#fff"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone"
          placeholderTextColor="#fff"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Location"
          placeholderTextColor="#fff"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { padding: 24, backgroundColor: 'rgba(7, 7, 7, 0.8)', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { marginRight: 18, padding: 8 },
  backButtonText: { color: '#fff', fontSize: 24 },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(7,7,7,0.88)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  label: { color: '#d1d5db', fontSize: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  disabledInput: { opacity: 0.7 },
  saveButton: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
