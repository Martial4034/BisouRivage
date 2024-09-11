// src/app/components/ImageUpload.tsx
import { useState } from "react";
import { Box, Button } from "@mui/material";

interface ImageUploadProps {
  maxFiles: number;
  onUpload: (files: File[]) => void;
}

export default function ImageUpload({ maxFiles, onUpload }: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > maxFiles) {
      alert(`Vous ne pouvez uploader que ${maxFiles} images maximum.`);
      return;
    }
    setImages(files);
    onUpload(files);
  };

  return (
    <Box>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      <Button variant="contained" component="label">
        Choisir des images
      </Button>
      {images.length > 0 && (
        <Box mt={2}>
          {images.map((file, index) => (
            <p key={index}>{file.name}</p>
          ))}
        </Box>
      )}
    </Box>
  );
}
