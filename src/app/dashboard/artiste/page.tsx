"use client"; // Assurer que ce fichier est bien client-side

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ArtisteFormContent from '@/app/components/artiste/form'; // Importer votre composant

export default function ArtisteFormPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search); // Obtenir les paramètres de l'URL
    const id = params.get('edit'); // Obtenir la valeur du paramètre "edit"
    if (id) {
      setEditId(id);
    }
  }, [router]);

  return <ArtisteFormContent editId={editId} />;
}