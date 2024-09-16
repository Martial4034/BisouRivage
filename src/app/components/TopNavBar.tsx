"use client";

import { ShoppingBag, User, ArrowDownToLine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import Cart from "@/app/components/cart/Cart";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { useInitializeCart } from '@/app/hooks/use-cart';
import Link from "next/link";
import { useUser } from '@/app/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';

// Function to extract initials from email

const getInitialsFromEmail = (email: string): string => {
  const [localPart] = email.split('@');
  const parts = localPart.split('.');

  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else {
    return localPart.slice(0, 2).toUpperCase();
  }
};

export function TopNavBar() {
  const { user, isLoading } = useUser();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  useInitializeCart();

  if (isLoading) {
    // Display skeleton when loading
    return (
      <div className="flex items-center justify-between w-full p-4 border-b">
        <Skeleton width={80} height={30} />
        <Skeleton width={120} height={30} />
        <Skeleton width={80} height={30} />
      </div>
    );
  }

  return (
    <header className="flex items-center justify-between w-full p-4 border-b">
      {/* Mobile logo on the left, center on larger screens */}
      <div className="flex sm:justify-center w-full sm:w-auto">
        <Link href="/">
          <img src="/center-logo.svg" alt="Center Logo" className="h-8" />
        </Link>
      </div>

      {/* Right part for desktop and larger screens */}
      <div className="hidden sm:flex items-center space-x-4">
        <Cart />

        {/* Dropdown menu for artists */}
        {user?.role === 'artiste' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArrowDownToLine />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="text-center">
              <DropdownMenuItem className="justify-center">
                <Link href="/dashboard/artiste" className="flex items-center justify-center gap-2" prefetch={false}>
                  <div className="h-4 w-4" />
                  <span>Publier une image</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-center">
                <Link href="/dashboard/artiste/manage" className="flex items-center justify-center gap-2" prefetch={false}>
                  <div className="h-4 w-4" />
                  <span>Gérer ses images</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="#" className="block">
            <ShoppingBag />
          </Link>
        )}

        {/* User avatar or login button */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="rounded-full">
              {session ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>
                    {user?.email ? getInitialsFromEmail(user.email) : 'JP'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-8 w-8" />
              )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          {session && (
            <DropdownMenuContent align="center">
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

      {/* Mobile responsive menu */}
      <div className="sm:hidden flex items-center space-x-2">
        <Cart />
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>
                  {user?.email ? getInitialsFromEmail(user.email) : 'FR'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem>
                <Link href="#" className="flex items-center gap-2" prefetch={false}>
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {user?.role === 'artiste' && (
                <DropdownMenuItem>
                  <Link href="/orders" className="flex items-center gap-2" prefetch={false}>
                    <span>Commandes</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user?.role === 'artiste' && (
                <>
                  <DropdownMenuItem>
                    <Link href="/dashboard/artiste" className="flex items-center gap-2">
                      <span>Publier</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/dashboard/artiste/manage" className="flex items-center gap-2">
                      <span>Gérer</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <Button variant="ghost" onClick={() => signOut()}>
                  Logout
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <User className="h-8 w-8" onClick={() => router.push('/auth/signin')} />
        )}
      </div>
    </header>
  );
}
