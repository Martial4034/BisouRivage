"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/app/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useMediaQuery } from "react-responsive";

interface ProductImagesProps {
  images: { link: string }[];
  isVertical: boolean;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  frameOption: "avec" | "sans";
  selectedFrame: any;
  selectedSize: string | null;
  getFrameMargins: (size: string | null, isVertical: boolean) => { width: string; height: string };
  mainImageHeight: number;
  mainImageWidth: number;
  thumbnailHeight: number;
}

export default function ProductImages({
  images,
  isVertical,
  selectedImageIndex,
  setSelectedImageIndex,
  frameOption,
  selectedFrame,
  selectedSize,
  getFrameMargins,
  mainImageHeight,
  mainImageWidth,
  thumbnailHeight
}: ProductImagesProps) {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [emblaRef] = useEmblaCarousel({ loop: false });
  const [showZoom, setShowZoom] = useState(false);
  const cooldownRef = useRef<boolean>(false);
  const [mobileZoomIndex, setMobileZoomIndex] = useState<number | null>(null);

  const handleZoomShow = () => {
    if (!cooldownRef.current) {
      setShowZoom(true);
    }
  };

  const handleZoomHide = () => {
    setShowZoom(false);
    setMobileZoomIndex(null);
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 300);
  };

  const handleMobileImageClick = (index: number) => {
    if (!cooldownRef.current) {
      setMobileZoomIndex(index);
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 300);
    }
  };

  if (isMobile) {
    return (
      <div>
        <Carousel ref={emblaRef} className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div 
                  className={`relative w-full ${isVertical ? "h-[625px]" : "h-[300px]"}`}
                  onClick={() => handleMobileImageClick(index)}
                >
                  <Image
                    src={image.link}
                    alt={`Image ${index + 1}`}
                    fill
                    sizes={`(max-width: 768px) 100vw, ${isVertical ? "400px" : "600px"}`}
                    style={{ objectFit: "cover" }}
                    className="shadow-md"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Overlay de zoom mobile */}
        {mobileZoomIndex !== null && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={handleZoomHide}
          >
            <div className="relative w-auto h-auto max-w-[85%] max-h-[85vh]">
              <Image
                src={images[mobileZoomIndex].link}
                alt={`Image ${mobileZoomIndex + 1}`}
                width={900}
                height={600}
                className="object-contain shadow-2xl rounded-lg"
                priority
              />
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-center space-x-1">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-6 rounded-full cursor-pointer ${
                selectedImageIndex === index ? "bg-black" : "bg-gray-300"
              }`}
              onClick={() => setSelectedImageIndex(index)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Image principale */}
      <div 
        className="relative mb-4" 
        style={{ height: mainImageHeight, width: mainImageWidth }}
        onMouseEnter={handleZoomShow}
      >
        {frameOption === "avec" && selectedFrame ? (
          <div className="relative w-full h-full">
            <Image
              src={selectedFrame.imageUrl}
              alt={`Cadre ${selectedFrame.name}`}
              fill
              style={{
                objectFit: 'fill',
                transform: !isVertical ? 'rotate(90deg)' : 'none',
              }}
              className="pointer-events-none"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div style={{
                position: 'relative',
                ...getFrameMargins(selectedSize, isVertical)
              }}>
                <Image
                  src={images[selectedImageIndex].link}
                  alt={`Image ${selectedImageIndex + 1}`}
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-none"
                  priority
                />
              </div>
            </div>
          </div>
        ) : (
          <Image
            src={images[selectedImageIndex].link}
            alt={`Image ${selectedImageIndex + 1}`}
            fill
            style={{ objectFit: isVertical ? "contain" : "cover" }}
            className="rounded-lg"
            priority
          />
        )}
      </div>

      {/* Overlay de zoom */}
      {showZoom && !isMobile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const isOutsideImage = 
              e.clientX < rect.left + rect.width * 0.2 ||
              e.clientX > rect.left + rect.width * 0.8 ||
              e.clientY < rect.top + rect.height * 0.2 ||
              e.clientY > rect.top + rect.height * 0.8;
            
            if (isOutsideImage) {
              handleZoomHide();
            }
          }}
        >
          <div className="relative w-auto h-auto max-w-[70%] max-h-[70vh]">
            <Image
              src={images[selectedImageIndex].link}
              alt={`Image ${selectedImageIndex + 1}`}
              width={900}
              height={600}
              className="object-contain shadow-2xl rounded-lg"
              priority
            />
          </div>
        </div>
      )}

      {/* Miniatures */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => setSelectedImageIndex(index)}
            className={`relative cursor-pointer ${
              selectedImageIndex === index ? "ring-2 ring-blue-500" : ""
            }`}
            style={{ height: thumbnailHeight }}
          >
            {frameOption === "avec" && selectedFrame ? (
              <div className="relative w-full h-full">
                <Image
                  src={selectedFrame.imageUrl}
                  alt={`Miniature cadre ${index + 1}`}
                  fill
                  style={{
                    objectFit: 'fill',
                    transform: !isVertical ? 'rotate(90deg)' : 'none',
                  }}
                  className="pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{
                    position: 'relative',
                    ...getFrameMargins(selectedSize, isVertical)
                  }}>
                    <Image
                      src={image.link}
                      alt={`Miniature ${index + 1}`}
                      fill
                      style={{ objectFit: "contain" }}
                      className="rounded-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Image
                src={image.link}
                alt={`Miniature ${index + 1}`}
                fill
                style={{ objectFit: isVertical ? "contain" : "cover" }}
                className="rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 