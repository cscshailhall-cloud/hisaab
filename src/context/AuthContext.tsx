import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

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

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userObj: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userObj.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
          // Profile does not exist, let's create it from metadata
          console.log("Creating missing profile for user...", userObj.id);
          const newProfile = {
            id: userObj.id,
            email: userObj.email,
            full_name: userObj.user_metadata?.full_name || '',
            phone: userObj.user_metadata?.phone || '',
            shop_name: userObj.user_metadata?.shop_name || '',
            address: userObj.user_metadata?.address || '',
            updated_at: new Date().toISOString()
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select()
            .single();
            
          if (!createError && createdProfile) {
            setProfile(createdProfile);
          } else {
            console.error("Profile creation error:", createError);
          }
        } else {
          console.error("Profile fetch error:", error);
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error("Auth sync error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
