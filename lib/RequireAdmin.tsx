import { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { useProfile } from './profileContext'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile } = useProfile()

  const isAdmin = !!(profile && (profile.is_admin === true || profile.role === 'admin'))

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Not authorized</Text>
        <Text style={{ marginTop: 8, color: '#666' }}>You need admin access to view this page.</Text>
      </View>
    )
  }

  return <>{children}</>
}
