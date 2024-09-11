"use client";

import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";

interface BreadcrumbsProps {
  formatFilter: string;
  setFormatFilter: (value: string) => void;
}

export default function Breadcrumbs({ formatFilter, setFormatFilter }: BreadcrumbsProps) {
  const [isVerticalChecked, setIsVerticalChecked] = useState(true);
  const [isHorizontalChecked, setIsHorizontalChecked] = useState(true);
  const [showError, setShowError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fonction pour gérer la sélection des checkboxes
  const handleCheckboxChange = (format: string) => {
    if (format === "vertical") {
      setIsVerticalChecked(!isVerticalChecked);
    } else if (format === "horizontal") {
      setIsHorizontalChecked(!isHorizontalChecked);
    }
  };

  // Fonction pour appliquer les filtres et fermer le menu
  const applyFilters = () => {
    if (!isVerticalChecked && !isHorizontalChecked) {
      setShowError(true); // Affiche l'erreur si aucune case n'est cochée
    } else {
      setShowError(false); // Réinitialise l'erreur si un format est sélectionné

      // Mise à jour du filtre
      if (isVerticalChecked && isHorizontalChecked) {
        setFormatFilter("all");
      } else if (isVerticalChecked) {
        setFormatFilter("V");
      } else if (isHorizontalChecked) {
        setFormatFilter("H");
      }

      setIsOpen(false); // Fermer le menu après validation
    }
  };

  return (
    <div className="flex flex-col items-start space-y-2 mb-4">
      <div className="flex items-center space-x-2">
        <span>/ Home</span>
        <span>/</span>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {isVerticalChecked && isHorizontalChecked
                ? "Format"
                : isVerticalChecked
                ? "Vertical"
                : isHorizontalChecked
                ? "Horizontal"
                : "Format"}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="p-4 bg-white border rounded-lg shadow-lg space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVerticalChecked}
                onChange={() => handleCheckboxChange("vertical")}
                className="mr-2"
              />
              <span>Vertical</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHorizontalChecked}
                onChange={() => handleCheckboxChange("horizontal")}
                className="mr-2"
              />
              <span>Horizontal</span>
            </label>

            {/* Bouton pour valider */}
            <Button variant="ghost" onClick={applyFilters}>
              Valider
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/ New</span>
      </div>

      {/* Affichage d'un message d'erreur si aucun format n'est sélectionné */}
      {showError && (
        <p className="text-red-500 text-sm ml-20">Au moins un format doit être sélectionné.</p>
      )}
    </div>
  );
}
