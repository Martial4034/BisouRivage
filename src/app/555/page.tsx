'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { signOut } from 'next-auth/react';

export default function ArtistRedirectPage() {
  const router = useRouter();

  const handleArtistLogin = async () => {
    const email = window.sessionStorage.getItem('userEmail');
    console.log('Email:', email);
    
    try {
      await signOut({ redirect: false });
      
      if (email) {
        router.push(`/auth/signin?email=${encodeURIComponent(email)}`);
      } else {
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accès Artiste</DialogTitle>
          <DialogDescription>
            Il semblerait que vous tentiez d'accéder à une page pour publier des images.
            Si on vous a indiqué que votre rôle a été récemment modifié en tant qu'artiste,
            cela est normal. Vous avez uniquement besoin de vous reconnecter pour que vos droits vous soient accordés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/')}>
            Annuler
          </Button>
          <Button onClick={handleArtistLogin}>
            Me connecter en tant qu'artiste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
