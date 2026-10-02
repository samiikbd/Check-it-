import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Profile, UserRole } from '../types';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, pass: string, role?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: Profile = {
  id: 'usr_demo_admin_777',
  email: 'admin@checkit.ai',
  role: 'admin',
  created_at: new Date().toISOString(),
};

const DEMO_USER: Profile = {
  id: 'usr_demo_user_123',
  email: 'investigator@checkit.ai',
  role: 'user',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        const defaultProfile: Profile = { id: userId, email, role: 'user' };
        setProfile(defaultProfile);
      }
    } catch (e) {
      console.warn('Error fetching profile:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            await fetchProfile(session.user.id, session.user.email || '');
          } else {
            setProfile(DEMO_ADMIN);
            setUser({ id: DEMO_ADMIN.id, email: DEMO_ADMIN.email });
          }
        } catch {
          setProfile(DEMO_ADMIN);
          setUser({ id: DEMO_ADMIN.id, email: DEMO_ADMIN.email });
        }
      } else {
        const savedDemo = localStorage.getItem('checkit_active_role');
        const activeProfile = savedDemo === 'user' ? DEMO_USER : DEMO_ADMIN;
        setProfile(activeProfile);
        setUser({ id: activeProfile.id, email: activeProfile.email });
      }

      if (mounted) setIsLoading(false);
    }

    initAuth();

    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      subscription = authListener?.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (isSupabaseConfigured) {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
        await fetchProfile(data.user.id, data.user.email || '');
      }
      return { error: null };
    } else {
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      const p: Profile = { id: 'usr_' + Date.now(), email, role, created_at: new Date().toISOString() };
      setProfile(p);
      setUser({ id: p.id, email: p.email });
      localStorage.setItem('checkit_active_role', role);
      return { error: null };
    }
  };

  const signUp = async (email: string, pass: string, role: UserRole = 'user') => {
    if (isSupabaseConfigured) {
      const { error, data } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { role } },
      });
      if (error) return { error };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
        setProfile({ id: data.user.id, email, role });
      }
      return { error: null };
    } else {
      const p: Profile = { id: 'usr_' + Date.now(), email, role, created_at: new Date().toISOString() };
      setProfile(p);
      setUser({ id: p.id, email: p.email });
      localStorage.setItem('checkit_active_role', role);
      return { error: null };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('checkit_active_role');
  };

  const switchDemoRole = (role: UserRole) => {
    const target = role === 'admin' ? DEMO_ADMIN : DEMO_USER;
    setProfile(target);
    setUser({ id: target.id, email: target.email });
    localStorage.setItem('checkit_active_role', role);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email);
    }
  };

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, isLoading, signIn, signUp, signOut, switchDemoRole, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};