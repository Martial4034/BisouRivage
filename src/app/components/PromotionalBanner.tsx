import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import Link from "next/link";

export default function PromotionalBanner() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className="w-full bg-[#bbcdff] h-8 cursor-pointer flex items-center justify-center"
          role="button"
        >
          <span className="text-[#565656] font-normal">
            🎁 3 + 1 OFFERT 🎁
          </span>
        </div>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conditions Générales de l'Offre "3+1 Offert"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-normal">
            Dès que votre panier contient trois (3) articles, un quatrième (4ème) article est offert. 
            Le choix de l'article offert se base sur l'article au format le plus petit parmi les trois (3) articles achetés :
          </p>

          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Si votre panier contient 3 tirages grands formats, le 4ème article offert sera également un tirage grand format.</li>
            <li>Si votre panier contient 2 tirages grands formats et 1 carte postale, le 4ème article offert sera une carte postale.</li>
          </ul>

          <div className="text-sm text-muted-foreground">
            Cette offre inclut tous les produits (tirages limités et{' '}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help underline">
                  cartes postales
                </TooltipTrigger>
                <TooltipContent>
                  <p>Les cartes postales arrivent bientôt !</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            ) et ne peut être combinée avec d'autres promotions. Pour toute question,{' '}
            <Link 
              href="/contact" 
              className="text-primary underline hover:text-primary/90"
            >
              contactez-nous
            </Link>
            .
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 