"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/hooks/use-cart";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useToast } from "@/app/hooks/use-toast";
import { CircularProgress } from '@mui/material';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/components/ui/carousel";
import { useMediaQuery } from "react-responsive";
import useEmblaCarousel from "embla-carousel-react";
import Head from "next/head";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import ProductImages from "@/app/components/product/ProductImages";
import ProductDetails from "@/app/components/product/ProductDetails";

// Interfaces importées
import { ImageFirestoreData, ImageData } from "@/app/types";

// Ajout des interfaces pour les formats
interface FrameOption {
  name: string;
  color: string;
  imageUrl: string;
  price: number;
  available: boolean;
}

interface Format {
  id: string;
  size: string;
  frameOptions: FrameOption[];
}

// Ajouter cette interface avec les autres
interface ColorPoint {
  color: string;
  urlPoint: string;
}

// Configuration des marges pour chaque format de cadre
type FrameSize = '30x40cm' | '40x50cm' | '50x70cm';
type Orientation = 'vertical' | 'horizontal';

const FRAME_MARGINS: Record<FrameSize, Record<Orientation, { width: string; height: string }>> = {
  '30x40cm': {
    vertical: {
      width: '70%',    // -3% de chaque côté
      height: '70%',
    },
    horizontal: {
      width: '94%',
      height: '94%',
    }
  },
  '40x50cm': {
    vertical: {
      width: '92%',    // -4% de chaque côté
      height: '92%',
    },
    horizontal: {
      width: '92%',
      height: '92%',
    }
  },
  '50x70cm': {
    vertical: {
      width: '90%',    // -5% de chaque côté
      height: '90%',
    },
    horizontal: {
      width: '90%',
      height: '90%',
    }
  }
};

// Composant de débogage
const DebugInfo = ({ 
  data, 
  formats,
  selectedSize,
  selectedColor,
  frameOption,
  selectedFrame,
  colorPoints,
  error 
}: { 
  data: ImageData | null;
  formats: Format[];
  selectedSize: string | null;
  selectedColor: string | null;
  frameOption: "avec" | "sans";
  selectedFrame: FrameOption | null;
  colorPoints: ColorPoint[];
  error?: string;
}) => {
  // Trouver le format équivalent pour la taille sélectionnée
  const selectedSizeData = data?.sizes.find(s => s.size === selectedSize);
  const equivalentFrameSize = selectedSizeData?.equivalentFrameSize;
  const formatData = formats.find(f => f.size === equivalentFrameSize);

  const debugData = {
    "🎯 Sélections actuelles": {
      "Taille sélectionnée": selectedSize,
      "Taille équivalente cadre": equivalentFrameSize,
      "Option de cadre": frameOption,
      "Couleur sélectionnée": selectedColor,
    },
    "📦 Informations produit": {
      "Format du produit": data?.format,
      "Stock disponible": selectedSizeData ? {
        "Taille": selectedSizeData.size,
        "Stock initial": selectedSizeData.initialStock,
        "Stock restant": selectedSizeData.stock,
        "Prochain numéro": selectedSizeData.nextSerialNumber,
      } : null,
    },
    "🎨 Couleurs disponibles": colorPoints.map(point => ({
      color: point.color,
      url: point.urlPoint
    })),
    "🖼️ Format correspondant": formatData ? {
      "Taille": formatData.size,
      "Options de cadre": formatData.frameOptions.map(option => ({
        nom: option.name,
        couleur: option.color,
        prix: option.price,
        disponible: option.available,
        imageUrl: option.imageUrl
      }))
    } : null,
    "🔍 Cadre sélectionné": selectedFrame ? {
      nom: selectedFrame.name,
      couleur: selectedFrame.color,
      prix: selectedFrame.price,
      imageUrl: selectedFrame.imageUrl
    } : null,
  };

  return (
    <div className="fixed top-4 right-4 p-4 bg-black/80 text-white rounded-lg max-w-lg max-h-[80vh] overflow-auto">
      <h3 className="text-xl font-bold mb-2">Debug Info</h3>
      {error && (
        <div className="mb-4 p-2 bg-red-500/50 rounded">
          <h4 className="font-bold">❌ Erreur:</h4>
          <p>{error}</p>
        </div>
      )}
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  );
};

// Ajouter cette fonction de tri avant le composant ImageDetails
const sortSizes = (sizes: any[]) => {
  const order = ['30x40cm', '40x50cm', '50x70cm'];
  return [...sizes].sort((a, b) => {
    const indexA = order.indexOf(a.equivalentFrameSize);
    const indexB = order.indexOf(b.equivalentFrameSize);
    return indexA - indexB;
  });
};

export default function ImageDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [frameOption, setFrameOption] = useState<"avec" | "sans">("avec");
  const [formats, setFormats] = useState<Format[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption | null>(null);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [colorPoints, setColorPoints] = useState<ColorPoint[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Référence pour Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const fetchFormats = async (defaultSize: string) => {
    try {
      const formatsSnapshot = await getDocs(collection(db, 'formats'));
      const formatsData = formatsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Format[];
      
      setFormats(formatsData);

      // Présélectionner le format correspondant
      const formatData = formatsData.find(f => f.size === defaultSize);
      if (formatData) {
        const defaultColor = colorPoints.find(point => point.color === "blanc")?.color || colorPoints[0]?.color;
        if (defaultColor) {
          const frameOption = formatData.frameOptions.find(f => f.color === defaultColor);
          if (frameOption) {
            setSelectedFrame(frameOption);
            setSelectedColor(defaultColor);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des formats:", error);
    }
  };

  // Ajouter cette fonction pour récupérer les points de couleur
  const fetchColorPoints = async () => {
    try {
      console.log("🎨 Récupération des points de couleur...");
      const colorDoc = await getDoc(doc(db, 'formats', 'couleurs'));
      
      if (!colorDoc.exists()) {
        console.error("❌ Document des couleurs non trouvé");
        return;
      }

      const colorData = colorDoc.data();
      console.log("📊 Points de couleur récupérés:", colorData.colors);
      setColorPoints(colorData.colors);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des couleurs:", error);
    } finally {
      setIsLoadingColors(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "uploads", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.error("Document non trouvé");
          return;
        }

        const data = docSnap.data() as ImageFirestoreData;

        // Traitement des données
        const createdAtDate = data.createdAt.toDate();
        const createdAtFormatted = format(createdAtDate, "dd MMMM yyyy", {
          locale: fr,
        });

        setImageData({
          artisteEmail: data.artisteEmail,
          artisteId: data.artisteId,
          artisteName: data.artisteName,
          createdAt: createdAtFormatted,
          description: data.description,
          format: data.format,
          images: data.images,
          mainImage: data.mainImage,
          sizes: data.sizes,
        });

        // Récupération des formats et couleurs
        await Promise.all([
          fetchColorPoints(),
          fetchFormats(data.sizes[0]?.equivalentFrameSize)
        ]);

        // Sélection de la première taille disponible
        const availableSize = data.sizes.find((size) => size.stock > 0) || data.sizes[0];
        if (availableSize) {
        setSelectedSize(availableSize.size);
        }

      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedImageIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const handleAddToCart = async () => {
    try {
      if (!selectedSize) {
        toast({
          title: "Format requis",
          description: "Veuillez sélectionner un format avant d'ajouter au panier",
          variant: "destructive",
        });
        return;
      }

      if (frameOption === "avec" && !selectedFrame) {
        toast({
          title: "Couleur de cadre requise",
          description: "Veuillez sélectionner une couleur de cadre",
          variant: "destructive",
        });
        return;
      }

      // Vérifier le stock
      const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
      if (!sizeData || sizeData.stock <= 0) {
        toast({
          title: "Stock épuisé",
          description: "Ce format n'est plus disponible",
          variant: "destructive",
        });
        return;
      }

      // Créer l'item pour le panier
      const cartItem = {
        id: params.id,
        size: selectedSize,
        frameOption,
        frameColor: frameOption === "avec" ? selectedFrame?.color : undefined,
        quantity: 1
      };

      // Vérifier le prix avant l'ajout
      const priceResponse = await fetch('/api/product/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.id,
          size: selectedSize,
          frameOption,
          frameColor: selectedFrame?.color
        }),
      });

      if (!priceResponse.ok) {
        throw new Error("Erreur lors de la vérification du prix");
      }

      const priceData = await priceResponse.json();
      console.log("💰 Prix vérifié:", priceData);

      // Ajouter au panier
      addItem(cartItem);
      setIsAdded(true);

      toast({
        title: "Ajouté au panier",
        description: `${selectedSize} ${frameOption === "avec" ? `avec cadre ${selectedFrame?.name || ''}` : "sans cadre"}`,
      });

      setTimeout(() => {
        setIsAdded(false);
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout au panier",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  // Fonction pour calculer le prix total
  const calculatePrice = () => {
    console.log("💲 Calcul du prix - Données actuelles:", {
      selectedSize,
      frameOption,
      selectedFrame,
      selectedColor
    });
    
    if (!selectedSize) return 0;
    
    const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
    if (!sizeData) {
      console.log("❌ Données de taille non trouvées");
      return 0;
    }

    const formatData = formats.find(f => f.size === sizeData.equivalentFrameSize);
    if (!formatData) {
      console.log("❌ Format correspondant non trouvé");
      return 0;
    }

    console.log("📐 Format trouvé:", formatData);

    if (frameOption === "sans") {
      const baseFrameOption = formatData.frameOptions.find(f => f.color === "none");
      const price = baseFrameOption?.price || 0;
      console.log("💰 Prix sans cadre:", price);
      return price;
    } else {
      // Avec cadre
      if (selectedFrame) {
        const price = selectedFrame.price;
        console.log("💰 Prix avec cadre sélectionné:", price);
        return price;
      } else {
        // Chercher le cadre blanc par défaut
        const defaultFrame = formatData.frameOptions.find(f => f.color === "blanc") || 
                           formatData.frameOptions.find(f => f.color !== "none");
        const price = defaultFrame?.price || 0;
        console.log("💰 Prix avec cadre par défaut:", price);
        return price;
      }
    }
  };

  // Fonction pour gérer le changement de taille
  const handleSizeChange = (size: string) => {
    console.log("🔄 Changement de taille:", size);
    setSelectedSize(size);
    
    const sizeData = imageData?.sizes.find(s => s.size === size);
    if (!sizeData) {
      console.log("❌ Données de taille non trouvées");
      return;
    }

    const formatData = formats.find(f => f.size === sizeData.equivalentFrameSize);
    if (!formatData) {
      console.log("❌ Format correspondant non trouvé");
      return;
    }

    console.log("📐 Format correspondant trouvé:", formatData);
    console.log("🖼️ Marges appliquées:", getFrameMargins(size, isVertical));

    if (frameOption === "avec") {
      // Présélectionner le cadre blanc ou le premier cadre disponible
      const defaultColor = colorPoints.find(point => point.color === "blanc")?.color || colorPoints[0]?.color;
      if (defaultColor) {
        console.log("🎨 Présélection de la couleur:", defaultColor);
        handleColorSelect(defaultColor);
      }
    }
  };

  // Ajouter cette fonction pour gérer la sélection de couleur
  const handleColorSelect = (color: string) => {
    console.log("🎨 Sélection de la couleur:", color);
    setSelectedColor(color);
    
    if (!selectedSize) {
      console.log("❌ Aucune taille sélectionnée");
      return;
    }

    const sizeData = imageData?.sizes.find(s => s.size === selectedSize);
    if (!sizeData) {
      console.log("❌ Données de taille non trouvées");
      return;
    }

    const formatData = formats.find(f => f.size === sizeData.equivalentFrameSize);
    if (!formatData) {
      console.log("❌ Format correspondant non trouvé");
      return;
    }

    const frameOption = formatData.frameOptions.find(f => f.color === color);
    if (frameOption) {
      console.log("✅ Option de cadre trouvée:", frameOption);
      setSelectedFrame(frameOption);
    } else {
      console.log("❌ Option de cadre non trouvée pour la couleur:", color);
    }
  };

  // Fonction utilitaire pour obtenir les marges
  const getFrameMargins = (size: string | null, isVertical: boolean) => {
    const defaultMargins = { width: '94%', height: '94%' };
    if (!size || !imageData) return defaultMargins;
    
    // Trouver la taille équivalente du cadre
    const sizeData = imageData.sizes.find(s => s.size === size);
    const equivalentFrameSize = sizeData?.equivalentFrameSize as FrameSize;
    
    if (!equivalentFrameSize) return defaultMargins;
    
    const orientation = isVertical ? 'vertical' : 'horizontal';
    return FRAME_MARGINS[equivalentFrameSize]?.[orientation] || defaultMargins;
  };

  const handleClose = () => {
    if (isMobile) {
      router.push("/", { scroll: false });
    }
  };

  // Vérifier si le format est vertical
  const isVertical = imageData?.format.toLowerCase() === "vertical";

  // Dimensions based on format
  const mainImageHeight = isVertical ? 796 : 416;
  const mainImageWidth = isVertical ? 606 : 624;
  const thumbnailHeight = isVertical ? 125 : 100;

  if (isLoading) {
  return (
      <div className="w-full h-full flex items-center justify-center">
        <CircularProgress />
                        </div>
    );
  }

  if (!imageData) {
    return <div>Aucune donnée disponible</div>;
  }

  const content = (
    <div className={`h-full ${isMobile ? 'min-h-screen' : 'overflow-y-auto'} bg-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Section Images */}
          <ProductImages
            images={imageData.images}
            isVertical={isVertical}
            selectedImageIndex={selectedImageIndex}
            setSelectedImageIndex={setSelectedImageIndex}
            frameOption={frameOption}
            selectedFrame={selectedFrame}
            selectedSize={selectedSize}
            getFrameMargins={getFrameMargins}
            mainImageHeight={mainImageHeight}
            mainImageWidth={mainImageWidth}
            thumbnailHeight={thumbnailHeight}
          />

          {/* Section Détails */}
          <ProductDetails
            id={params.id}
            artisteName={imageData.artisteName}
            createdAt={imageData.createdAt}
            description={imageData.description}
            frameOption={frameOption}
            setFrameOption={setFrameOption}
            selectedSize={selectedSize}
            sizes={sortSizes(imageData.sizes)}
            handleSizeChange={handleSizeChange}
            colorPoints={colorPoints}
            selectedColor={selectedColor}
            handleColorSelect={handleColorSelect}
            isLoadingColors={isLoadingColors}
            selectedFrame={selectedFrame}
            calculatePrice={calculatePrice}
            handleAddToCart={handleAddToCart}
            isAdded={isAdded}
            isVertical={isVertical}
                        />
                      </div>
                    </div>
                </div>
  );

  return content;
}
