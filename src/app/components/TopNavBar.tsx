'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { ShoppingBag, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import Link from "next/link";
import { useUser } from '@/app/hooks/useUser';
import { useEffect, useCallback } from 'react';

export function TopNavBar() {
  const { data: session, status } = useSession();
  const { user, isLoading: userLoading, fetchUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();


  if (status === 'loading' || userLoading) {
    return (
      <header className="flex items-center justify-between w-full p-4 border-b animate-pulse">
        <div className="flex items-center">
          <div className="h-8 w-32 bg-gray-300 rounded" />
        </div>
        <div className="flex items-center">
          <div className="h-8 w-32 bg-gray-300 rounded" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-300 rounded-full" />
          <div className="h-8 w-8 bg-gray-300 rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between w-full p-4 border-b">
      <div className="flex items-center">
        <img src="/logo.svg" alt="Logo" className="h-8" />
      </div>
      <div className="flex items-center">
        <img src="/center-logo.svg" alt="Center Logo" className="h-8" />
      </div>
      <div className="flex items-center space-x-4">
        <Select>
          <SelectTrigger className="text-muted-foreground">
            <SelectValue placeholder="Tirages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="artist1">Artist 1</SelectItem>
            <SelectItem value="artist2">Artist 2</SelectItem>
          </SelectContent>
        </Select>
        
        {user?.role === 'artiste' ? (
          <a href="#" className="block">
            <Bell />
          </a>
        ) : (
          <a href="#" className="block">
            <ShoppingBag />
          </a>
        )}
        <button
          onClick={() => {
            document.cookie = ""; // Clear cookies
            window.sessionStorage.clear(); // Clear session storage
            window.localStorage.clear(); // Clear local storage
          }}
        >
          Clear Storage
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => {
                if (!session) {
                  if (pathname !== null) {
                    window.localStorage.setItem('redirectUrl', pathname);
                  }
                  router.push('/auth/signin');
                }
              }}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          {session && (
            <DropdownMenuContent align="end">
              <div className="flex items-center gap-2 p-2">
                <div className="grid gap-0.5 leading-none">
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="#" className="flex items-center gap-2" prefetch={false}>
                  <div className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {user?.role === 'artiste' && (
                <DropdownMenuItem>
                  <Link href="/orders" className="flex items-center gap-2" prefetch={false}>
                    <div className="h-4 w-4" />
                    <span>Commandes</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Button 
                  className="flex items-center h-5"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                >
                  <div className="h-4 w-4" />
                  Logout
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>
    </header>
  );
}
