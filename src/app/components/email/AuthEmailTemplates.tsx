import * as React from 'react';

interface EmailTemplateProps {
  url: string;
  email: string;
}

// Global styles for the email, ensuring UTF-8 encoding and mobile responsiveness
const containerStyle = {
  fontFamily: "'Arial', sans-serif",
  color: "#333",
  backgroundColor: "#fff",
  margin: 0,
  padding: "20px",
  textAlign: "center" as const,
  lineHeight: 1.6,
  maxWidth: "600px",
  width: "100%",
  marginInline: "auto",
  border: "1px solid #eaeaea",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#000",
  marginBottom: "16px",
};

const textStyle = {
  fontSize: "16px",
  color: "#666",
  marginBottom: "24px",
};

const linkStyle = {
  display: "inline-block",
  padding: "12px 24px",
  fontSize: "16px",
  backgroundColor: "#000",
  color: "#fff",
  textDecoration: "none",
  borderRadius: "4px",
  margin: "16px 0",
};

const footerStyle = {
  fontSize: "12px",
  color: "#aaa",
  marginTop: "24px",
};

// Template for the Sign-In email
export const SignInEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ url, email }) => (
  <html lang="fr">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Connexion Bisourivage</title>
    </head>
    <body style={containerStyle}>
      <img src="https://bisourivage.fr/logo.svg" alt="Bisourivage Logo" style={{ width: "100px", marginBottom: "24px" }} />
      <h1 style={headingStyle}>Bienvenue sur Bisourivage</h1>
      <p style={textStyle}>Merci de vous être connecté. Cliquez sur le bouton ci-dessous pour accéder à votre compte :</p>
      <a href={url} style={linkStyle}>Se connecter à mon compte</a>
      <p style={textStyle}>Si vous n'avez pas demandé cette connexion, veuillez ignorer cet email.</p>
      <p style={footerStyle}>Email : {email}</p>
    </body>
  </html>
);

// Template for the Sign-Up email
export const SignUpEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ url, email }) => (
  <html lang="fr">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Inscription Bisourivage</title>
    </head>
    <body style={containerStyle}>
      <img src="https://bisourivage.fr/logo.svg" alt="Bisourivage Logo" style={{ width: "100px", marginBottom: "24px" }} />
      <h1 style={headingStyle}>Bienvenue sur Bisourivage</h1>
      <p style={textStyle}>Merci pour votre inscription. Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
      <a href={url} style={linkStyle}>Activer mon compte</a>
      <p style={textStyle}>Si vous n'avez pas demandé cette inscription, veuillez ignorer cet email.</p>
      <p style={footerStyle}>Email : {email}</p>
    </body>
  </html>
);
