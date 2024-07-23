// src/app/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export function useUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);

  const fetchUser = async (email: string) => {
    try {
      const response = await fetch('/api/getUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await signIn('credentials', { user: JSON.stringify(userData), redirect: false });
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchUser(session.user.email);
    }
  }, [session, status]);

  return { user, isLoading: status === 'loading', fetchUser };
}
