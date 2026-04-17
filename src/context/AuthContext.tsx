import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile logic: Ensure a profile exists in Supabase for this Firebase user
  const syncProfile = async (firebaseUser: User) => {
    // 1. Check if profile exists by ID (Firebase UID)
    const { data: profileById, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', firebaseUser.uid)
      .single();

    if (profileById) {
      setProfile(profileById);
      return;
    }

    // 2. If not found by ID, check by email (to handle cross-platform consistency as requested)
    if (firebaseUser.email) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', firebaseUser.email)
        .maybeSingle();

      if (profileByEmail) {
        const { data: linkedProfile } = await supabase
          .from('profiles')
          .upsert({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || profileByEmail.phone,
            full_name: firebaseUser.displayName || profileByEmail.full_name,
            avatar_url: firebaseUser.photoURL || profileByEmail.avatar_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        setProfile(linkedProfile);
        return;
      }
    }

    // 3. If not found by ID or email, check by phone
    if (firebaseUser.phoneNumber) {
      const { data: profileByPhone } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', firebaseUser.phoneNumber)
        .maybeSingle();

      if (profileByPhone) {
        const { data: linkedProfile } = await supabase
          .from('profiles')
          .upsert({
            id: firebaseUser.uid,
            email: firebaseUser.email || profileByPhone.email,
            phone: firebaseUser.phoneNumber,
            full_name: firebaseUser.displayName || profileByPhone.full_name,
            avatar_url: firebaseUser.photoURL || profileByPhone.avatar_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        setProfile(linkedProfile);
        return;
      }
    }

    // 4. Create new profile if none exists
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber,
        full_name: firebaseUser.displayName,
        avatar_url: firebaseUser.photoURL,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    setProfile(newProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
