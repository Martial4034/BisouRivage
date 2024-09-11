"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/app/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import Sortable from 'sortablejs';

// Validation Schema avec Zod (ajout des prix pour chaque taille)
const schema = z.object({
  description: z.string().min(1, 'La description est requise'),
  format: z.enum(['vertical', 'horizontal'], {
    required_error: "Le format est requis",
  }),
  images: z.array(z.instanceof(File)).min(1, 'Au moins une image est requise'), // Requiert au moins une image
  sizes: z.array(
    z.object({
      size: z.string(),
      price: z.number().min(1, "Le prix doit être supérieur ou égal à 1€"), // Validation du prix
      stock: z.number().min(3, "Le stock doit être supérieur ou égal à 4"), // Validation du stock
    })
  ).min(1, 'Vous devez sélectionner au moins un format')
});

export default function ArtisteForm() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<{ size: string; stock: number; price: number }[]>([]);

  const sizesWithDescription = [
    { size: '10x15 cm', description: '10x15 cm (Carte Postale)' },
    { size: '20x30 cm', description: '20x30 cm (A4)' },
    { size: '30x40 cm', description: '30x40 cm (A3)' },
    { size: '50x70 cm', description: '50x70 cm (Grand Format)' }
  ];

  useEffect(() => {
    if (imageContainerRef.current) {
      Sortable.create(imageContainerRef.current, {
        animation: 150,
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== undefined && newIndex !== undefined) {
            const reorderedImages = [...uploadedImages];
            const [movedImage] = reorderedImages.splice(oldIndex, 1);
            reorderedImages.splice(newIndex, 0, movedImage);
            setUploadedImages(reorderedImages);
          }
        },
      });
    }
  }, [uploadedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedImages((prev) => [...prev, ...files]);
    setValue("images", [...uploadedImages, ...files]);
  };

  const handleToggleSize = (size: string) => {
    if (selectedSizes.some((s) => s.size === size)) {
      setSelectedSizes(selectedSizes.filter((s) => s.size !== size));
    } else {
      setSelectedSizes([...selectedSizes, { size, stock: 0, price: 0 }]);
    }
  };

  const handleSizeDetailsChange = (size: string, key: 'stock' | 'price', value: number) => {
    setSelectedSizes(
      selectedSizes.map((s) => s.size === size ? { ...s, [key]: value } : s)
    );
    setValue('sizes', selectedSizes); // Mettre à jour la valeur dans le formulaire
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation des tailles et du stock
      if (selectedSizes.length === 0) {
        setError('Vous devez sélectionner au moins un format.');
        setIsLoading(false);
        return;
      }

      if (selectedSizes.some((size) => size.stock < 3)) {
        setError('Le stock de chaque format doit être supérieur ou égal à 3.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('format', data.format);
      formData.append('sizes', JSON.stringify(selectedSizes));

      uploadedImages.forEach((image) => formData.append('images', image));

      const response = await fetch('/api/artiste/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'L\'upload a échoué.');

      setSuccess('Images uploadées avec succès!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl mb-8 text-left font-semibold text-gray-800">Upload des photos</h1>

      {/* Format */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Format</label>
        <div className="mt-2 flex items-center space-x-6">
          <label className="inline-flex items-center">
            <input
              {...register('format')}
              type="radio"
              value="vertical"
              className="form-radio text-indigo-600"
            />
            <span className="ml-2 text-sm text-gray-600">Vertical</span>
          </label>
          <label className="inline-flex items-center">
            <input
              {...register('format')}
              type="radio"
              value="horizontal"
              className="form-radio text-indigo-600"
            />
            <span className="ml-2 text-sm text-gray-600">Horizontal</span>
          </label>
        </div>
        {errors.format && <p className="text-red-500 mt-1">{String(errors.format.message)}</p>}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          className="form-textarea mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
        ></textarea>
        {errors.description && <p className="text-red-500 mt-1">{String(errors.description.message)}</p>}
      </div>

      {/* Toggle Group pour les formats avec validation de stock et prix */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Formats disponibles</label>
        <div className="flex flex-col space-y-4 mt-2">
          {sizesWithDescription.map(({ size, description }) => (
        <div key={size} className="flex items-center space-x-4">
          <label className="cursor-pointer flex-1" onClick={() => handleToggleSize(size)}>
            <input
          type="checkbox"
          checked={selectedSizes.some((s) => s.size === size)}
          className="form-checkbox mr-2"
            />
            <span className="text-gray-700">{description}</span>
          </label>

          {selectedSizes.some((s) => s.size === size) && (
            <div className="flex space-x-4 flex-1">
          <input
            type="number"
            placeholder="Quantité"
            min="3"
            value={selectedSizes.find((s) => s.size === size)?.stock || ''}
            onChange={(e) => handleSizeDetailsChange(size, 'stock', Number(e.target.value))}
            className="form-input w-full p-2 rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="Prix"
            min="1"
            value={selectedSizes.find((s) => s.size === size)?.price || ''}
            onChange={(e) => handleSizeDetailsChange(size, 'price', Number(e.target.value))}
            className="form-input w-full p-2 rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
            </div>
          )}
        </div>
          ))}
        </div>
        {errors.sizes && <p className="text-red-500 mt-1">{String(errors.sizes.message)}</p>}
      </div>

      {/* Upload d'images */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <input
          type="file"
          multiple
          onChange={handleImageUpload}
          className="form-input mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.images && <p className="text-red-500 mt-1">{String(errors.images.message)}</p>}
      </div>

      {/* Liste des images triables */}
      {uploadedImages.length > 0 && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Réorganiser les images</label>
          <div className="grid grid-cols-3 gap-4" ref={imageContainerRef}>
            {uploadedImages.map((image, index) => (
              <div key={index} className="p-2">
                <img src={URL.createObjectURL(image)} alt={`uploaded-${index}`} className="h-40 w-40 object-cover border rounded-md" />
                <p className="text-center mt-2 text-gray-700">Image {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button disabled={isLoading} type="submit" className="w-full py-3 bg-indigo-600 text-white hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all duration-300">
        {isLoading ? <CircularProgress size={20} /> : 'Upload'}
      </Button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">{success}</p>}
    </form>
  );
}
