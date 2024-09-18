
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/app/components/ui/button';
import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { fetchData } from "@/app/lib/fetchData";
import { useUser } from '@/app/hooks/useUser';

// Schéma de validation
const schema = z.object({
  description: z.string().min(1, 'La description est requise'),
  format: z.enum(['vertical', 'horizontal'], {
    required_error: "Le format est requis",
  }),
  images: z.array(z.any()).min(1, 'Au moins deux images sont requises'),
  sizes: z.array(
    z.object({
      size: z.string(),
      price: z.number().min(1, "Le prix doit être supérieur ou égal à 2€"),
      stock: z.number().min(3, "Le stock doit être supérieur ou égal à 4"),
    })
  ).min(1, 'Vous devez sélectionner au moins un format'),
});

const isValidId = (id: string) => {
  const regex = /^[VH]\d+$/;
  return regex.test(id);
};

interface ArtisteFormContentProps {
  editId: string | null;
}

export default function ArtisteFormContent({ editId }: ArtisteFormContentProps) {

  const { data: session } = useSession();
  const { user } = useUser();
  console.log(user?.artiste_name);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(schema),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<(File | { link: string } | null)[]>([null, null, null, null, null, null]);
  const [selectedSizes, setSelectedSizes] = useState<{ size: string; stock: number; price: number }[]>([]);

  const sizesWithDescription = [
    { size: '10x15 cm', description: '10x15 cm (Carte Postale)' },
    { size: '20x30 cm', description: '20x30 cm (A4)' },
    { size: '30x40 cm', description: '30x40 cm (A3)' },
    { size: '50x70 cm', description: '50x70 cm (Grand Format)' }
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      if (!session) return;

      if (session.user.role !== 'artiste') {
        router.push('/403');
        return;
      }

      if (editId) {
        if (!isValidId(editId)) {
          router.push('/404');
          return;
        }

        const data = await fetchData('uploads', editId);
        if (!data) {
          router.push('/404');
          return;
        }

        if (session.user.email !== data.email) {
          router.push('/403');
          return;
        }

        reset(data);
        setUploadedImages(data.images.map((image: { link: string }) => ({ link: image.link })));
        setSelectedSizes(data.sizes);
      }
      setLoading(false);
    };

    fetchProductData();
  }, [session, editId, reset, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-8">
        <h1 className="text-3xl mb-8 text-left font-semibold text-gray-800">Chargement...</h1>
        <div className="flex justify-center">
          <CircularProgress />
        </div>
      </div>
    );
  }

  const handleImageChange = (index: number, file: File | null) => {
    setUploadedImages((prevImages) => {
      const newImages = [...prevImages];
      newImages[index] = file;
      return newImages;
    });
    setValue('images', [...uploadedImages]); 
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prevImages) => {
      const newImages = [...prevImages];
      newImages[index] = null;  
      return newImages;
    });
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
    setValue('sizes', selectedSizes); 
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!uploadedImages.some((image) => image)) {
        setError('Vous devez uploader au moins deux images.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('artiste_name', user?.artiste_name || '');
      formData.append('format', data.format);
      formData.append('sizes', JSON.stringify(selectedSizes));

      uploadedImages.forEach((image, index) => {
        if (image && (image instanceof File)) {
          formData.append(`images_${index}`, image); 
        } else if (image && (image as { link: string }).link) {
          formData.append(`images_${index}`, (image as { link: string }).link); 
        }
      });

      const apiEndpoint = editId ? `/api/artiste/edit/${editId}` : '/api/artiste/upload';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "L'upload ou la mise à jour a échoué.");

      setSuccess(editId ? 'Mise à jour réussie!' : 'Images et formats uploadés avec succès!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl mb-8 text-left font-semibold text-gray-800">{editId ? "Modifier l'Upload" : "Upload des photos"}</h1>
      {/* Form content */}

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

      {/* Toggle Group pour les formats et le stock */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Formats disponibles</label>
        <div className="flex flex-col space-y-4 mt-2">
          {sizesWithDescription.map(({ size, description }) => (
            <div key={size} className="flex items-center space-x-4">
              <label className="cursor-pointer flex-1" onClick={() => handleToggleSize(size)}>
                <input
                  type="checkbox"
                  checked={selectedSizes.some((s) => s.size === size)}
                  onChange={() => handleToggleSize(size)}  // Ajout du gestionnaire d'événements
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

      {/* Gestion des images (6 cases maximum) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Images (maximum 6)</label>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="relative border-2 border-dashed border-gray-400 rounded-lg p-2 w-full h-40 flex items-center justify-center">
              {uploadedImages[index] instanceof File ? (
                <>
                  <img
                    src={URL.createObjectURL(uploadedImages[index] as File)}
                    alt={`Image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ✕
                  </button>
                </>
              ) : uploadedImages[index] && (uploadedImages[index] as { link: string }).link ? (
                <>
                  <img
                    src={(uploadedImages[index] as { link: string }).link}
                    alt={`Image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div
                  className="flex flex-col items-center justify-center text-gray-500 cursor-pointer w-full h-full"
                  onClick={() => {
                    const inputElement = document.getElementById(`upload-image-${index}`);
                    if (inputElement) {
                      inputElement.click();
                    }
                  }}
                >
                  <span>{`Image ${index + 1}`}</span>
                  <input
                    type="file"
                    id={`upload-image-${index}`} 
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.images && <p className="text-red-500 mt-1">{String(errors.images.message)}</p>}
      </div>
  
      {/* Submit Button */}
      <Button disabled={isLoading} type="submit" className="w-full py-3 bg-indigo-600 text-white hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all duration-300">
        {isLoading ? <CircularProgress size={20} /> : editId ? 'Mettre à jour' : 'Upload'}
      </Button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">{success}</p>}
      </form>
  );
}