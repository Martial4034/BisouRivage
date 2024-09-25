import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function useUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);

  const refreshUser = async (email: string) => {
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
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      refreshUser(session.user.email);
    }
  }, [session, status]);

  return { user, isLoading: status === 'loading', refreshUser };
}
