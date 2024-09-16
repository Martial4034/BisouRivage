"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ArtisteFormContent from '@/app/components/artiste/form';
export default function ArtisteFormPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
  
    const storedEditId = localStorage.getItem('editId');
    if (storedEditId) {
      setEditId(storedEditId);
    }
  }, [router]);

  return <ArtisteFormContent editId={editId} />;
}
