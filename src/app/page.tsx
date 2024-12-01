"use client";

import { useState } from "react";
import Breadcrumbs from "@/app/components/home/Breadcrumbs";
import ImageGrid from "@/app/components/home/ImageGrid";

export default function Home() {
  const [formatFilter, setFormatFilter] = useState("all"); // Filtre pour Horizontal / Vertical

  return (
    <div className="h-full bg-white px-8">
      {/* Breadcrumbs pour la navigation */}
      <Breadcrumbs formatFilter={formatFilter} setFormatFilter={setFormatFilter} />

      <div className="max-w-screen-xl  mx-auto">
        {/* Affichage des images */}
        <ImageGrid formatFilter={formatFilter} />
      </div>
    </div>
  );
}
