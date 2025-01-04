import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { fetchData } from "@/app/lib/fetchData";
import { useUser } from '@/app/hooks/useUser';

// Schéma de validation
const artisteNameSchema = z.object({
  artiste_name: z
    .string()
    .min(3, 'Le nom prénom de l\'artiste est requis')
    .refine((val) => val.trim().split(' ').length >= 2, {
      message: 'Veuillez entrer votre nom et prénom',
    }),
});

const schema = z.object({
  title: z.string().optional(),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne doit pas dépasser 1000 caractères'),
  format: z.enum(['horizontal', 'vertical'], {
    required_error: 'Veuillez sélectionner un format',
    invalid_type_error: 'Format invalide'
  }),
  sizes: z.array(z.object({
    size: z.string(),
    equivalentFrameSize: z.string(),
    stock: z.number().min(1, 'Le stock doit être supérieur à 0'),
    initialStock: z.number().min(1, 'Le stock initial doit être supérieur à 0'),
    nextSerialNumber: z.number().min(1)
  })).min(1, 'Veuillez sélectionner au moins une taille'),
  images: z.array(z.any()).min(1, 'Veuillez ajouter au moins une image')
});

// Ajouter un type pour les données du formulaire
type FormData = z.infer<typeof schema>;

const isValidId = (id: string) => {
  const regex = /^[VH]\d+$/;
  return regex.test(id);
};

interface ArtisteFormContentProps {
  editId: string | null;
}

export default function ArtisteFormContent({ editId }: ArtisteFormContentProps) {

  const { data: session } = useSession();
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États pour la Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdatingArtisteName, setIsUpdatingArtisteName] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      format: undefined,
      sizes: [],
      images: []
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<(File | { link: string } | null)[]>([null, null, null, null, null, null]);
  const [selectedSizes, setSelectedSizes] = useState<{ 
    size: string;
    equivalentFrameSize: string;
    stock: number;
    initialStock: number;
    nextSerialNumber: number;
  }[]>([]);

  // Formulaire pour le nom complet
  const { register: registerArtisteName, handleSubmit: handleSubmitArtisteName, formState: { errors: errorsArtisteName },} = useForm<{ artiste_name: string }>({ resolver: zodResolver(artisteNameSchema),});

  const sizesWithDescription = [
    { size: "A4", equivalentFrameSize: '30x40cm', description: 'Format A4' },
    { size: "A3", equivalentFrameSize: '40x50cm', description: 'Format A3' },
    { size: "A2", equivalentFrameSize: '50x70cm', description: 'Format A2' }
  ];

  useEffect(() => {
    const fetchProductData = async () => {
      if (!session) return;
  
      if (session.user.role !== 'artiste') {
        // Store email in session
        if (session.user.email) {
          sessionStorage.setItem('userEmail', session.user.email);
        }
        router.push('/555');
        return;
      }
  
      if (user && !user.artiste_name) {
        setIsDialogOpen(true); 
        setLoading(false);
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
  
        if (session.user.email !== data.artisteEmail) {
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
  }, [session, user, editId, reset, router]);
  
  

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
  
  const onSubmitArtisteName = async (data: { artiste_name: string }) => {
    setIsUpdatingArtisteName(true);
    try {
      const response = await fetch('/api/artiste/updateArtisteName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artiste_name: data.artiste_name }),
      });

      if (!response.ok) {
        throw new Error('Échec de la mise à jour du nom d\'artiste');
      }

      // Rafraîchir les données utilisateur
      if (session?.user?.email) {
        await refreshUser(session.user.email);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom d\'artiste:', error);
      // Gérer l'erreur (afficher un message, etc.)
    } finally {
      setIsUpdatingArtisteName(false);
    }
  };

  const handleImageChange = (index: number, file: File | null) => {
    console.log("🖼️ Tentative d'ajout d'image:", {
      index,
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : null
    });

    setUploadedImages((prevImages) => {
      const newImages = [...prevImages];
      newImages[index] = file;
      console.log("📸 État des images après ajout:", newImages.map(img => 
        img instanceof File ? `File: ${img.name}` : 
        img ? 'Existing image' : 'Empty slot'
      ));
      return newImages;
    });

    // Mettre à jour le champ 'images' du formulaire
    const currentImages = uploadedImages.map((img, i) => i === index ? file : img);
    console.log("🔄 Mise à jour du champ images dans le formulaire");
    setValue('images', currentImages.filter(img => img !== null));
  };

  const handleRemoveImage = (index: number) => {
    console.log("🗑️ Suppression de l'image à l'index:", index);
    setUploadedImages((prevImages) => {
      const newImages = [...prevImages];
      newImages[index] = null;
      console.log("📸 État des images après suppression:", newImages.map(img => 
        img instanceof File ? `File: ${img.name}` : 
        img ? 'Existing image' : 'Empty slot'
      ));
      return newImages;
    });
  };

  const handleToggleSize = (size: string) => {
    if (selectedSizes.some((s) => s.size === size)) {
      setSelectedSizes(selectedSizes.filter((s) => s.size !== size));
    } else {
      const sizeInfo = sizesWithDescription.find(s => s.size === size);
      if (sizeInfo) {
        setSelectedSizes([...selectedSizes, { 
          size: size,
          equivalentFrameSize: sizeInfo.equivalentFrameSize,
          stock: 0,
          initialStock: 0,
          nextSerialNumber: 1
        }]);
      }
    }
  };

  const handleSizeDetailsChange = (size: string, key: 'stock', value: number) => {
    setSelectedSizes(
      selectedSizes.map((s) => {
        if (s.size === size) {
          return { 
            ...s, 
            [key]: value,
            initialStock: value,
            nextSerialNumber: 1
          };
        }
        return s;
      })
    );
    setValue('sizes', selectedSizes);
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.type === 'required') return 'Ce champ est requis';
    if (error?.type === 'minLength') return 'Ce champ est trop court';
    if (error?.type === 'maxLength') return 'Ce champ est trop long';
    if (error?.type === 'pattern') return 'Format invalide';
    return 'Une erreur est survenue';
  };

  const onSubmit = async (data: FormData) => {
    console.log("\n🚀 DÉBUT DU PROCESSUS DE SOUMISSION");
    console.log("================================================");

    console.log("📝 Vérification finale des données:", {
      title: editId ? data.title : '',
      description: data.description,
      format: data.format,
      sizes: selectedSizes,
      imagesCount: uploadedImages.filter(img => img !== null).length
    });

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log("\n📋 VALIDATION DES DONNÉES");
      console.log("------------------------------------------------");

      // Vérification des images
      const validImages = uploadedImages.filter((image) => image !== null);
      console.log(`🖼️ Images valides trouvées: ${validImages.length}`);
      validImages.forEach((img, idx) => {
        if (img instanceof File) {
          console.log(`   Image ${idx + 1}: ${img.name} (${Math.round(img.size / 1024)}KB)`);
        } else {
          console.log(`   Image ${idx + 1}: URL existante`);
        }
      });

      if (validImages.length === 0) {
        throw new Error('Vous devez uploader au moins une image.');
      }
      console.log("✅ Validation des images réussie");

      // Vérification des tailles
      console.log("\n📏 Vérification des tailles sélectionnées:");
      selectedSizes.forEach((size, idx) => {
        console.log(`   Taille ${idx + 1}: ${size.size} (Stock: ${size.stock})`);
      });

      if (selectedSizes.length === 0) {
        throw new Error('Vous devez sélectionner au moins une taille.');
      }
      console.log("✅ Validation des tailles réussie");

      console.log("\n📦 PRÉPARATION DU FORMDATA");
      console.log("------------------------------------------------");
      const formData = new FormData();
      formData.append('title', editId ? (data.title || '') : '');
      formData.append('description', data.description);
      formData.append('artiste_name', user?.artiste_name || '');
      formData.append('format', data.format);
      formData.append('sizes', JSON.stringify(selectedSizes));
      console.log("✅ Données de base ajoutées au FormData");

      // Ajout des images au FormData
      console.log("\n📤 AJOUT DES IMAGES AU FORMDATA");
      let imageCount = 0;
      uploadedImages.forEach((image, index) => {
        if (image) {
          if (image instanceof File) {
            console.log(`   Ajout image ${index}: ${image.name} (${Math.round(image.size / 1024)}KB)`);
            formData.append(`images_${index}`, image);
            imageCount++;
          } else if ((image as { link: string }).link) {
            console.log(`   Ajout lien image ${index}: ${(image as { link: string }).link}`);
            formData.append(`images_${index}`, (image as { link: string }).link);
            imageCount++;
          }
        }
      });
      console.log(`✅ Total des images ajoutées: ${imageCount}`);

      console.log("\n🌐 ENVOI DE LA REQUÊTE");
      console.log("------------------------------------------------");
      const apiEndpoint = editId ? `/api/artiste/edit/${editId}` : '/api/artiste/upload';
      console.log(`📡 Endpoint: ${apiEndpoint}`);

      console.log("⏳ Envoi en cours...");
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      console.log(`📡 Statut de la réponse: ${response.status}`);
      const result = await response.json();
      console.log("📥 Réponse reçue:", result);

      if (!response.ok) {
        throw new Error(result.message || "L'upload ou la mise à jour a échoué.");
      }

      console.log("\n✅ OPÉRATION RÉUSSIE");
      console.log("================================================");
      setSuccess(editId ? 'Mise à jour réussie!' : 'Images et formats uploadés avec succès!');
      router.push('/dashboard/artiste/manage');

    } catch (error: any) {
      console.error("\n❌ ERREUR DÉTECTÉE");
      console.error("------------------------------------------------");
      console.error("Message:", getErrorMessage(error));
      console.error("Détails:", error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      console.log("\n🏁 FIN DU PROCESSUS");
      console.log("================================================\n");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-8">
        <h1 className="text-3xl mb-8 text-left font-semibold text-gray-800">
          {editId ? "Modifier l'Upload" : "Upload des photos"}
        </h1>

        {/* Titre - uniquement visible en mode édition */}
        {editId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Titre de l'œuvre*
            </label>
            <input
              {...register('title')}
              type="text"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Entrez le titre de votre œuvre"
            />
            {errors.title && (
              <p className="text-red-500 mt-1">{getErrorMessage(errors.title)}</p>
            )}
          </div>
        )}

        {/* Format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Format*</label>
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
          {errors.format && (
            <p className="text-red-500 mt-1">{getErrorMessage(errors.format)}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Description*</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Décrivez votre œuvre"
          ></textarea>
          {errors.description && (
            <p className="text-red-500 mt-1">{getErrorMessage(errors.description)}</p>
          )}
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
                  </div>
                )}
              </div>
            ))}
          </div>
          {errors.sizes && <p className="text-red-500 mt-1">{String(errors.sizes.message)}</p>}
        </div>

        {/* Section upload d'images */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Images* (6 maximum)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedImages.map((image, index) => {
              console.log(`🎯 Slot d'image ${index}:`, {
                type: image ? (image instanceof File ? 'File' : 'Existing image') : 'Empty',
                details: image instanceof File ? {
                  name: image.name,
                  size: image.size,
                  type: image.type
                } : image
              });

              return (
                <div key={index} className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log(`📸 Changement détecté dans l'input ${index}:`, {
                        files: e.target.files,
                        hasFile: e.target.files && e.target.files.length > 0
                      });
                      const file = e.target.files?.[0] || null;
                      handleImageChange(index, file);
                    }}
                    className="hidden"
                    id={`image-upload-${index}`}
                  />
                  <label
                    htmlFor={`image-upload-${index}`}
                    className="block w-full aspect-square relative border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    {image ? (
                      <>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : (image as { link: string }).link}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                          onLoad={() => console.log(`✅ Image ${index} chargée avec succès`)}
                          onError={(e) => console.error(`❌ Erreur de chargement de l'image ${index}:`, e)}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log(`🗑️ Clic sur le bouton de suppression pour l'image ${index}`);
                            handleRemoveImage(index);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-600">Cliquez ou glissez une image</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.images)}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all duration-300"
            onClick={() => {
              console.log("🔘 Clic sur le bouton de soumission");
              console.log("📋 État actuel du formulaire:", {
                title: watch('title'),
                description: watch('description'),
                format: watch('format'),
                sizes: selectedSizes,
                images: uploadedImages.filter(img => img !== null)
              });
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <CircularProgress size={20} className="mr-2" />
                <span>Traitement en cours...</span>
              </div>
            ) : editId ? (
              'Mettre à jour'
            ) : (
              'Upload'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{success}</p>
          </div>
        )}
      </form>
      {/* Dialog pour le nom complet */}
      <Dialog open={isDialogOpen}>
        <DialogContent className="p-4 sm:p-6 md:p-8">
          <DialogHeader>
        <DialogTitle>Complétez votre profil artiste</DialogTitle>
        <DialogDescription>
          Veuillez entrer votre nom et prénom (ex : Maxence Laubier)
        </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitArtisteName(onSubmitArtisteName)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="artiste_name" className="block text-sm font-medium text-gray-700 pb-2">
          Nom complet
            </label>
            <Input
          id="artiste_name"
          placeholder="Nom Prénom"
          {...registerArtisteName('artiste_name')}
            />
            {errorsArtisteName.artiste_name && (
          <p className="mt-1 text-sm text-red-600">
            {errorsArtisteName.artiste_name.message}
          </p>
            )}
          </div>
        </div>
        <DialogFooter className='pt-2'>
          <Button type="submit" disabled={isUpdatingArtisteName}>
            {isUpdatingArtisteName ? 'Enregistrement...' : 'Valider'}
          </Button>
        </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>

  );
}