"use client";

import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";

interface BreadcrumbsProps {
  formatFilter: string;
  setFormatFilter: (value: string) => void;
}

export default function Breadcrumbs({ formatFilter, setFormatFilter }: BreadcrumbsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Par défaut, "Horizontal" est sélectionné
  useEffect(() => {
    setFormatFilter("H");
  }, [setFormatFilter]);

  // Fonction pour gérer le changement de filtre
  const handleFormatChange = (format: string) => {
    setFormatFilter(format);
    setIsOpen(false); // Ferme le dropdown après sélection
  };

  return (
    <div className="flex flex-col items-start space-y-2 mb-4">
      <div className="flex items-center space-x-2">
        <span>/ Home</span>
        <span>/</span>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {formatFilter === "all"
                ? "Format"
                : formatFilter === "V"
                ? "Vertical"
                : "Horizontal"}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="p-4 bg-white border rounded-lg shadow-lg space-y-2">
            <DropdownMenuItem
              className={formatFilter === "H" ? "font-bold" : ""}
              onClick={() => handleFormatChange("H")}
            >
              Horizontal
            </DropdownMenuItem>

            <DropdownMenuItem
              className={formatFilter === "V" ? "font-bold" : ""}
              onClick={() => handleFormatChange("V")}
            >
              Vertical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/ New</span>
      </div>
    </div>
  );
}
