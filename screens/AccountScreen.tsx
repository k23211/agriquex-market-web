import { useCallback, useEffect, useState } from 'react'

import {

  View, Text, TouchableOpacity,

  StyleSheet, Image, ImageBackground,

  ActivityIndicator, ScrollView,

  Alert, Modal,

} from 'react-native'

import { useFocusEffect } from '@react-navigation/native'

import * as ImagePicker from 'expo-image-picker'

import { supabase } from '../lib/supabase'

import { useProfile } from '../lib/profileContext'

import * as FileSystem from 'expo-file-system/legacy'

const profileBg = require('../assets/images/profile.png')

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

export default function AccountScreen({ navigation }: any) {

  const [_session, setSession] = useState<any>(undefined)

  const { profile, setProfile } = useProfile()

  const [loading, setLoading] = useState(true)

  const [uploading, setUploading] = useState(false)

  const [agreementVisible, setAgreementVisible] = useState(false)

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))

    return () => listener.subscription.unsubscribe()

  }, [])



  const fetchProfile = async () => {

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {

      const { data } = await supabase

        .from('profiles')

        .select('*')

        .eq('id', user.id)

        .single()

      setProfile(data)

    }

    setLoading(false)

  }



  useEffect(() => {

    fetchProfile()

  }, [])



  useFocusEffect(

    useCallback(() => {

      fetchProfile()

    }, [])

  )



  // ─── UNAUTHENTICATED VIEW ─────────────────────────────────────────────────

  if (_session === null) {

    return (

      <View style={{ flex: 1, backgroundColor: '#070707', alignItems: 'center', justifyContent: 'center', padding: 32 }}>

        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>

        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>Sign in to your account</Text>

        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>Create an account or sign in to manage your profile and listings.</Text>

        <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12, width: '100%', alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>

          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Sign In</Text>

        </TouchableOpacity>

        <TouchableOpacity style={{ borderWidth: 1, borderColor: '#16a34a', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center' }} onPress={() => navigation.navigate('Register')}>

          <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 16 }}>Create Account</Text>

        </TouchableOpacity>

      </View>

    )

  }

  const handleSignOut = async () => {

    await supabase.auth.signOut()

  }

  const handleChangePhoto = async () => {

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {

      Alert.alert('Permission required', 'Please allow access to your gallery to change your profile photo.')

      return

    }

    const result = await ImagePicker.launchImageLibraryAsync({

      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      allowsEditing: true,

      quality: 0.7,

    })

    if (result.canceled) return

    const imageUri = result.assets[0].uri

    const fileExt = imageUri.split('.').pop()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {

      Alert.alert('Error', 'Unable to identify current user.')

      return

    }

    const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`

    const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg'

    try {

      setUploading(true)

      let uploadData: Uint8Array | Blob

      if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {

        // Web: fetch blob directly

        const response = await fetch(imageUri)

        uploadData = await response.blob()

      } else {

        // Native (Android/iOS): read as base64 via expo-file-system/legacy

        const base64 = await FileSystem.readAsStringAsync(imageUri, {

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

        .from('avatars')

        .upload(fileName, uploadData, { contentType: mimeType, upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage

        .from('avatars')

        .getPublicUrl(fileName)

      // Use UPDATE instead of upsert to avoid RLS insert violation

      const { error: updateError } = await supabase

        .from('profiles')

        .update({ avatar_url: publicUrl })

        .eq('id', user.id)

      if (updateError) throw updateError

      const { error: authUpdateError } = await supabase.auth.updateUser({

        data: { avatar_url: publicUrl },

      })

      if (authUpdateError) throw authUpdateError

      setProfile({ ...(profile ?? {}), avatar_url: publicUrl })

      Alert.alert('Success', 'Profile photo updated.')

    } catch (error: any) {

      Alert.alert('Upload failed', error?.message || 'Could not upload the photo.')

    } finally {

      setUploading(false)

    }

  }

  if (loading) return <ActivityIndicator color="#16a34a" style={{ flex: 1 }} />

  return (

    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      <ImageBackground source={profileBg} style={styles.banner} imageStyle={styles.bannerImage}>

        <View style={styles.bannerOverlay} />

        <View style={styles.topBar}>

          <Text style={styles.headerTitle}>Account</Text>

        </View>

        <TouchableOpacity style={styles.signOutTop} onPress={handleSignOut}>

          <Text style={styles.signOutTopText}>Sign Out</Text>

        </TouchableOpacity>

                <View style={styles.profileHeader}>

          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangePhoto} disabled={uploading} activeOpacity={0.8}>

            <View style={styles.avatarCircle}>

              {profile?.avatar_url

                ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />

                : <Text style={styles.initial}>

                    {profile?.full_name?.[0]?.toUpperCase() || '?'}

                  </Text>

              }

            </View>

            <View style={styles.cameraBadge}>

              <Text style={styles.cameraBadgeIcon}>{uploading ? '⏳' : '📷'}</Text>

            </View>

          </TouchableOpacity>

          <View style={styles.userInfo}>

            <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>

            <Text style={styles.email}>{profile?.email || 'No email set'}</Text>

            <Text style={styles.member}>Ghana · Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : ''}</Text>

          </View>

        </View>

      </ImageBackground>

      <View style={styles.detailsCard}>

        <Text style={styles.sectionTitle}>ACCOUNT INFO</Text>

        <View style={styles.detailRow}>

          <Text style={styles.detailLabel}>👤 Name</Text>

          <Text style={styles.detailValue}>{profile?.full_name || '-'}</Text>

        </View>

        <View style={styles.detailRow}>

          <Text style={styles.detailLabel}>✉️ Email</Text>

          <Text style={styles.detailValue}>{profile?.email || '-'}</Text>

        </View>

        <View style={styles.detailRow}>

          <Text style={styles.detailLabel}>📞 Phone</Text>

          <Text style={styles.detailValue}>{profile?.phone || 'Not set'}</Text>

        </View>

        <View style={styles.detailRow}>

          <Text style={styles.detailLabel}>📍 Location</Text>

          <Text style={styles.detailValue}>{profile?.location || 'Not set'}</Text>

        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>

          <Text style={styles.editBtnText}>✏️ Edit Profile</Text>

        </TouchableOpacity>

        <TouchableOpacity style={styles.termsBtn} onPress={() => setAgreementVisible(true)}>

          <Text style={styles.termsBtnText}>📄 User Agreement & Terms</Text>

        </TouchableOpacity>

      </View>

      {/* User Agreement Modal */}

      <Modal

        visible={agreementVisible}

        animationType="slide"

        transparent

        onRequestClose={() => setAgreementVisible(false)}

      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalSheet}>

            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>User Agreement</Text>

              <TouchableOpacity onPress={() => setAgreementVisible(false)} style={styles.modalClose}>

                <Text style={{ color: '#9ca3af', fontSize: 16 }}>✕</Text>

              </TouchableOpacity>

            </View>

            <ScrollView style={styles.agreementScroll} showsVerticalScrollIndicator={false}>

              <Text style={styles.agreementBody}>{AGREEMENT_TEXT}</Text>

            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setAgreementVisible(false)}>

              <Text style={styles.closeBtnText}>Close</Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </ScrollView>

  )

}

const styles = StyleSheet.create({

  screen: { flex: 1, backgroundColor: '#070707' },

  container: { paddingBottom: 120 },

  banner: { width: '100%', minHeight: 320, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, justifyContent: 'space-between' },

  bannerImage: { resizeMode: 'cover' },

  bannerOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.44)' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },

  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },

  signOutTop: { position: 'absolute', top: 24, right: 20, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },

  signOutTopText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  profileHeader: { alignItems: 'center', marginTop: 18 },

  avatarWrapper: { position: 'relative', alignSelf: 'center' },

  avatarCircle: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#84cc16', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#070707' },

  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#84cc16', borderWidth: 2, borderColor: '#070707', alignItems: 'center', justifyContent: 'center' },

  cameraBadgeIcon: { fontSize: 13 },

  avatar: { width: 92, height: 92, borderRadius: 46 },

  initial: { fontSize: 36, fontWeight: 'bold', color: '#070707' },

  userInfo: { alignItems: 'center', marginTop: 16 },

  name: { fontSize: 24, fontWeight: '700', color: '#fff' },

  email: { fontSize: 14, color: '#e5e7eb', marginTop: 6 },

  member: { fontSize: 13, color: '#84cc16', marginTop: 6 },

  detailsCard: { backgroundColor: '#111111', borderRadius: 28, marginHorizontal: 20, padding: 22, marginTop: -64, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 10 },

  sectionTitle: { color: '#84cc16', fontSize: 12, letterSpacing: 1.5, marginBottom: 18 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 1, paddingVertical: 16 },

  detailLabel: { color: '#94a3b8', fontSize: 13 },

  detailValue: { color: '#fff', fontSize: 15, fontWeight: '700', maxWidth: '70%', textAlign: 'right' },

  editBtn: { marginTop: 20, backgroundColor: '#84cc16', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },

  editBtnText: { color: '#070707', fontWeight: '800', fontSize: 15 },

  termsBtn: { marginTop: 12, backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },

  termsBtnText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },

  // Modal

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },

  modalSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: '90%' },

  modalHandle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 8 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },

  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },

  modalClose: { padding: 6, backgroundColor: '#1f2937', borderRadius: 99 },

  agreementScroll: { maxHeight: 460 },

  agreementBody: { color: '#d1d5db', fontSize: 13, lineHeight: 22 },

  closeBtn: { backgroundColor: '#1f2937', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },

  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

})

