"use client";

import { useState, useEffect } from "react";

interface BreadcrumbsProps {
  formatFilter: string;
  setFormatFilter: (value: string) => void;
}

export default function Breadcrumbs({ formatFilter, setFormatFilter }: BreadcrumbsProps) {
  useEffect(() => {
    setFormatFilter("H");
  }, [setFormatFilter]);

  return (
    <div className="flex justify-center space-x-4 my-4">
      <button
        onClick={() => setFormatFilter("V")}
        className={`w-32 px-6 py-0 text-sm transition-colors ${
          formatFilter === "V"
            ? "bg-black text-white"
            : "bg-white text-black border border-gray-200 hover:border-gray-400"
        } rounded-full`}
      >
        Vertical
      </button>
      <button
        onClick={() => setFormatFilter("H")}
        className={`w-32 px-6 py-0 text-sm transition-colors ${
          formatFilter === "H"
            ? "bg-black text-white"
            : "bg-white text-black border border-gray-200 hover:border-gray-400"
        } rounded-full`}
      >
        Horizontal
      </button>
      <div className="group relative">
        <button
          disabled
          className="w-32 px-6 py-0 text-sm bg-gray-100 text-gray-400 border border-gray-200 rounded-full cursor-not-allowed"
        >
          Carte postale
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          Les cartes postales arrivent bientôt
        </div>
      </div>
    </div>
  );
}
