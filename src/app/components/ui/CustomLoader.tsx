'use client';

import { CircularProgress } from '@mui/material';

export default function CustomLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="w-full max-w-md px-6 py-12 bg-white text-black shadow-lg rounded-lg">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-20 w-auto mb-8"
            src="/logo.svg"
            alt="Your Company Logo"
          />
          <h2 className="text-center text-3xl font-bold tracking-tight text-black">
            Chargement ...
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center">
          <CircularProgress color="inherit" />
        </div>
      </div>
    </div>
  );
}