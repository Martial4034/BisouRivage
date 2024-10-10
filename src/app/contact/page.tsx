// src/app/contact/page.tsx

'use client';

import React from 'react';
import { Mail, Phone, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4 py-12">
      <div className="text-center max-w-md space-y-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Contactez-nous</h1>
        
        {/* Email */}
        <div className="flex flex-col items-center space-y-2">
          <Mail className="w-6 h-6 text-gray-600" />
          <p className="text-lg font-semibold text-gray-800">Email</p>
          <a href="mailto:bisourivage@gmail.com" className="text-blue-600 hover:underline">
            bisourivage@gmail.com
          </a>
        </div>
        
        {/* Phone */}
        <div className="flex flex-col items-center space-y-2">
          <Phone className="w-6 h-6 text-gray-600" />
          <p className="text-lg font-semibold text-gray-800">Téléphone</p>
          <p className="text-gray-700">06 23 07 21 57</p>
        </div>
        
        {/* Business Hours */}
        <div className="flex flex-col items-center space-y-2">
          <Clock className="w-6 h-6 text-gray-600" />
          <p className="text-lg font-semibold text-gray-800">Horaires</p>
          <p className="text-gray-700">Lundi - Vendredi : 9h - 19h GMT+1</p>
        </div>
      </div>
    </div>
  );
}
