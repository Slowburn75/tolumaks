"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#f4f4f4] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/** Nike-inspired immersive gallery: stacked or large main + scrub thumbs */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-[#f4f4f4] flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop: Nike-style multi-image stack for first 2, then main selector */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        {images.slice(0, 4).map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative aspect-[4/5] overflow-hidden bg-[#f4f4f4] focus:outline-none",
              index === 0 && images.length === 1 && "col-span-2"
            )}
          >
            <GalleryImage
              src={image}
              alt={`${productName} ${index + 1}`}
              className="img-aritzia h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Mobile / focus view */}
      <div className="lg:hidden">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
          <GalleryImage
            src={images[selectedIndex]}
            alt={productName}
            className="h-full w-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "relative h-16 w-14 shrink-0 overflow-hidden border transition-colors",
                  index === selectedIndex ? "border-foreground" : "border-transparent"
                )}
                onClick={() => setSelectedIndex(index)}
              >
                <GalleryImage
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {images.length > 4 && (
        <div className="hidden gap-2 overflow-x-auto lg:flex">
          {images.slice(4).map((image, index) => {
            const i = index + 4;
            return (
              <button
                key={i}
                type="button"
                className="relative h-24 w-20 shrink-0 overflow-hidden bg-[#f4f4f4]"
                onClick={() => setSelectedIndex(i)}
              >
                <GalleryImage src={image} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
