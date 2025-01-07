"use client";

import { Button } from "@/app/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CircularProgress } from '@mui/material';
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

interface ProductDetailsProps {
  id: string;
  artisteName: string;
  createdAt: string;
  description: string;
  frameOption: "avec" | "sans";
  setFrameOption: (option: "avec" | "sans") => void;
  selectedSize: string | null;
  sizes: any[];
  handleSizeChange: (size: string) => void;
  colorPoints: any[];
  selectedColor: string | null;
  handleColorSelect: (color: string) => void;
  isLoadingColors: boolean;
  selectedFrame: any;
  calculatePrice: () => number;
  handleAddToCart: () => void;
  isAdded: boolean;
  isVertical: boolean;
}

export default function ProductDetails({
  id,
  artisteName,
  createdAt,
  description,
  frameOption,
  setFrameOption,
  selectedSize,
  sizes,
  handleSizeChange,
  colorPoints,
  selectedColor,
  handleColorSelect,
  isLoadingColors,
  selectedFrame,
  calculatePrice,
  handleAddToCart,
  isAdded,
  isVertical
}: ProductDetailsProps) {
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  return (
    <div className="flex-1 border-2 border-gray-300 p-6 rounded-2xl shadow-lg relative">
      <button 
        onClick={() => router.back()} 
        className="absolute top-4 right-4 text-black hover:text-gray-700 transition-colors"
        aria-label="Retour"
      >
        <X size={24} strokeWidth={2.5} />
      </button>

      <h2 className="text-[1.7rem] font-semibold text-gray-800 mb-4 pr-8" style={{ fontFamily: 'Inter, sans-serif' }}>
        {id}
      </h2>

      <p className="text-md text-gray-800 mb-1.5">
        Artiste : <span className="font-semibold text-black">{artisteName}</span>
      </p>
      <p className="text-md text-gray-800 mb-2">
        Date : <span className="font-semibold text-black">{createdAt}</span>
      </p>
      <p className="text-gray-600 italic mb-4">{description}</p>

      {/* Informations produit */}
      <div className="pl-4 mb-7 space-y-2">
        <ProductInfoItem text="Impression pigment giclée sur papier fine Art mat" />
        <ProductInfoItem text={`Tirages limités en ${selectedSize ? sizes.find((s) => s.size === selectedSize)?.initialStock : "..."} exemplaires`} />
        <ProductInfoItem text="Œuvre fournie avec un certificat d'authenticité NFC" />
      </div>

      {/* Options de finition */}
      <div className="mb-6">
        <h3 className="text-l font-medium text-black mt-1 mb-3">TYPE DE FINITION :</h3>
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => {
              setFrameOption("sans");
              if (selectedSize) handleSizeChange(selectedSize);
            }}
            variant={frameOption === "sans" ? "default" : "outline"}
            className="transition-transform duration-200 hover:scale-105"
          >
            Sans cadre
          </Button>
          <Button
            onClick={() => {
              setFrameOption("avec");
              if (selectedSize) handleSizeChange(selectedSize);
            }}
            variant={frameOption === "avec" ? "default" : "outline"}
            className="transition-transform duration-200 hover:scale-105"
          >
            Avec cadre
          </Button>
        </div>

        {/* Sélection des formats */}
        <div className="mb-6">
          <h4 className="text-l font-medium text-black mt-1 mb-3">FORMAT :</h4>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size.size}
                onClick={() => handleSizeChange(size.size)}
                variant={selectedSize === size.size ? "default" : "outline"}
                className="transition-transform duration-200 hover:scale-105"
              >
                {frameOption === "sans" ? size.size : size.equivalentFrameSize}
              </Button>
            ))}
          </div>
        </div>

        {/* Sélection des couleurs */}
        {frameOption === "avec" && selectedSize && (
          <div className="mt-0">
            <h4 className="text-l font-medium text-black mb-4">COULEUR :</h4>
            {isLoadingColors ? (
              <div className="flex justify-center">
                <CircularProgress size={24} />
              </div>
            ) : (
              <ColorSelection
                colorPoints={colorPoints}
                selectedColor={selectedColor}
                handleColorSelect={handleColorSelect}
              />
            )}
          </div>
        )}
      </div>

      {/* Prix et Panier */}
      <div className="mt-6">
        <p className="text-2xl font-bold mb-4">Prix : {calculatePrice()}€</p>
        <Button
          onClick={handleAddToCart}
          className="w-full"
          disabled={isAdded || !selectedSize}
        >
          {isAdded ? "Ajouté au panier" : "Ajouter au panier"}
        </Button>
      </div>

      {/* Message de disponibilité */}
      <StockMessage selectedSize={selectedSize} sizes={sizes} />

      {/* Sections accordéon */}
      <ProductAccordions />
    </div>
  );
}

// Composants auxiliaires
function ProductInfoItem({ text }: { text: string }) {
  return (
    <div>
      <span className="text-gray-700 -ml-3 inline-block mr-2 relative top-[2px]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path d="M4 12h16M14 6l6 6-6 6" strokeWidth="2.2" stroke="currentColor" fill="none" />
        </svg>
      </span>
      <span>{text}</span>
    </div>
  );
}

function ColorSelection({ colorPoints, selectedColor, handleColorSelect }: any) {
  return (
    <div className="flex flex-wrap gap-4 mb-14">
      {colorPoints.map((point: any) => (
        <ColorPoint
          key={point.color}
          point={point}
          isSelected={selectedColor === point.color}
          onSelect={() => handleColorSelect(point.color)}
        />
      ))}
    </div>
  );
}

function ColorPoint({ point, isSelected, onSelect }: any) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative 
        cursor-pointer 
        transition-all 
        duration-200
        mb-6
        w-[40px]
        h-[40px]
        flex
        flex-col
        items-center
        justify-center
        ${isSelected ? 'transform scale-110' : 'hover:scale-105'}
      `}
    >
      <div className={`
        rounded-full 
        p-0.5
        ${isSelected 
          ? 'border-2 border-blue-500' 
          : 'border border-gray-300 hover:border-gray-400'
        }
      `}>
        <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-50">
          <Image
            src={point.urlPoint}
            alt={`Couleur ${point.color}`}
            width={30}
            height={30}
            className="rounded-full object-cover"
            priority={true}
          />
        </div>
      </div>
      <span className="absolute top-[45px] left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
        {point.color.replace('motif-', '')}
      </span>
    </div>
  );
}

function StockMessage({ selectedSize, sizes }: any) {
  if (!selectedSize) return null;

  const selectedSizeData = sizes.find((s: any) => s.size === selectedSize);
  if (!selectedSizeData) return null;

  const { nextSerialNumber, initialStock, stock } = selectedSizeData;

  if (nextSerialNumber === 1) {
    return (
      <p className="text-green-600 font-medium text-center mt-4">
        Vous serez le premier et obtiendrez le n°1
      </p>
    );
  }
  
  if (stock >= initialStock / 2) {
    return (
      <p className="text-blue-600 font-medium text-center mt-4">
        Vous obtiendrez l'exemplaire n°{nextSerialNumber}.
        Vous serez parmi les {Math.ceil(initialStock / 2)} premiers
      </p>
    );
  }
  
  return (
    <p className="text-orange-600 font-medium text-center mt-4">
      Plus que {stock} exemplaires disponibles dans le format sélectionné
    </p>
  );
}

function ProductAccordions() {
  return (
    <div className="mt-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="about-artist">
          <AccordionTrigger className="text-left font-semibold">
            À propos de l'artiste
          </AccordionTrigger>
          <AccordionContent className="text-sm text-gray-600 space-y-4">
            <p>à venir</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="printing-framing">
          <AccordionTrigger className="text-left font-semibold">
            Impression et Encadrement
          </AccordionTrigger>
          <AccordionContent className="text-sm text-gray-600 space-y-4">
            <PrintingFramingContent />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-left font-semibold">
            Livraison et Retours
          </AccordionTrigger>
          <AccordionContent className="text-sm text-gray-600 space-y-4">
            <ShippingContent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function PrintingFramingContent() {
  return (
    <>
      <p>
        Toutes nos impressions sont réalisées avec soin dans notre atelier, grâce à une imprimante professionnelle dédiée à l'art et à la photographie.
      </p>
      <p>
        À l'exception des cartes postales, chaque tirage est signé, numéroté et limité à 10 exemplaires par format. 
        Nous les réalisons uniquement sur commande afin d'éviter le surstock, le gaspillage et la surconsommation de papier et d'encre.
      </p>
      <p>
        Pour garantir un rendu de qualité muséale, nous utilisons des encres pigmentaires d'archives, sans solvant, qui offrent une profondeur de couleurs exceptionnelle et une longévité dépassant 200 ans.
      </p>
      <p>
        Pour le papier, nous avons choisi un « Fine Art » mat, blanc et sans acide, issu d'une gestion responsable des forêts. 
        Les formats A4, A5 et cartes postales sont imprimés sur un papier épais de 300g, tandis que les formats A3 et A2 utilisent un papier de 230g, 
        idéal pour être soigneusement roulés et transportés sans défaut.
      </p>
      <p>
        Si vous optez pour une affiche encadrée, nous avons décidé de les accompagner d'un passe-partout en contrecollé sans acide, blanc, ouvert en biseau à 45°.
        Ce choix met en valeur le tirage et lui donne de la profondeur, tout en créant une marge qui isole visuellement l'œuvre de son cadre. 
        Il contribue également à une meilleure préservation de l'œuvre en limitant tout contact direct avec sa vitre.
      </p>
    </>
  );
}

function ShippingContent() {
  return (
    <>
      <p>
        Comme nous manipulons des œuvres d'art fragiles, chaque pièce est soigneusement emballée pour assurer une protection optimale. 
        En mettant la qualité au cœur de nos priorités, nos délais de livraison ne sont pas fixes et peuvent varier de quelques jours à 2 ou 3 semaines. 
        Cela dit, nous vous tiendrons informé à chaque étape, par email ou par SMS.
      </p>
      <p>
        Pour garantir le bon état et le transport de vos commandes, les formats cartes postales et A4 sont expédiés à plat, 
        tandis que le format A2 et A3 est envoyé roulé dans des tubes spécialement conçus, plus larges que les standards habituels, afin d'éviter toute courbure importante.
      </p>
      <p className="italic">
        Pour les expéditions vers l'Union européenne et le reste du monde, des droits de douane ou frais supplémentaires peuvent s'appliquer et restent à la charge de l'acheteur.
      </p>
    </>
  );
} 