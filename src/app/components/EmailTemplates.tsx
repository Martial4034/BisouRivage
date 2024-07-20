// src/app/components/EmailTemplate.tsx
import * as React from 'react';

interface EmailTemplateProps {
  url: string;
  email: string;
}

export const SignInEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ url, email }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
    <h1>Bienvenue sur Bisourivage</h1>
    <p>Merci de vous être connecté. Cliquez sur le lien ci-dessous pour vous connecter :</p>
    <a href={url} style={{ display: 'inline-block', padding: '10px 20px', margin: '10px 0', fontSize: '18px', color: '#fff', backgroundColor: '#007bff', textDecoration: 'none' }}>Se connecter</a>
    <p>Si vous n'avez pas demandé cette connexion, ignorez cet email.</p>
    <p>Email: {email}</p>
  </div>
);

export const SignUpEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ url, email }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
    <h1>Bienvenue sur Bisourivage</h1>
    <p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
    <a href={url} style={{ display: 'inline-block', padding: '10px 20px', margin: '10px 0', fontSize: '18px', color: '#fff', backgroundColor: '#007bff', textDecoration: 'none' }}>Activer mon compte</a>
    <p>Si vous n'avez pas demandé cette inscription, ignorez cet email.</p>
    <p>Email: {email}</p>
  </div>
);