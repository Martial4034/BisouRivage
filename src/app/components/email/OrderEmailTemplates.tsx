import * as React from 'react';

interface Product {
  name: string;
  quantity: number;
  price: number;
  format: string;
  artisteName: string;
  imageUrl: string;
}

interface OrderSummaryEmailTemplateProps {
  email: string;
  orderId: string;
  deliveryDate: string; // Format de la date
  products: Product[];
  totalAmount: number;
}

// Global styles for the email
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

const productTableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginBottom: "24px",
};

const tableHeaderStyle = {
  borderBottom: "2px solid #333",
  paddingBottom: "8px",
  fontWeight: "bold",
  fontSize: "16px",
  color: "#333",
  textAlign: "left" as const,
};

const tableCellStyle = {
  padding: "8px 0",
  fontSize: "14px",
  borderBottom: "1px solid #eaeaea",
};

const imageStyle = {
  width: "100px",
  height: "auto",
  objectFit: "cover" as const,
  marginBottom: "8px",
};

const footerStyle = {
  fontSize: "12px",
  color: "#aaa",
  marginTop: "24px",
};

export const OrderSummaryEmailTemplate: React.FC<Readonly<OrderSummaryEmailTemplateProps>> = ({ email, orderId, deliveryDate, products, totalAmount }) => (
  <html lang="fr">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Récapitulatif de commande - Bisourivage</title>
    </head>
    <body style={containerStyle}>
      <img src="https://bisourivage.fr/logo.svg" alt="Bisourivage Logo" style={{ width: "100px", marginBottom: "24px" }} />
      <h1 style={headingStyle}>Merci pour votre commande !</h1>
      <p style={textStyle}>Commande ID : <strong>{orderId}</strong></p>
      <p style={textStyle}>Votre commande sera livrée avant le <strong>{deliveryDate}</strong>.</p>

      <table style={productTableStyle}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Produit</th>
            <th style={tableHeaderStyle}>Quantité</th>
            <th style={tableHeaderStyle}>Prix</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td style={tableCellStyle}>
                <img src={product.imageUrl} alt={product.name} style={imageStyle} />
                <strong>{product.name}</strong> <br />
                Format : {product.format} <br />
                Artiste : {product.artisteName}
              </td>
              <td style={tableCellStyle}>{product.quantity}</td>
              <td style={tableCellStyle}>{product.price.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={textStyle}>
        Montant total : <strong>{totalAmount.toFixed(2)} €</strong>
      </p>

      <p style={footerStyle}>
        Si vous avez des questions concernant votre commande, vous pouvez nous contacter à l'adresse suivante : bisourivage@gmail.com.
      </p>
      <p style={footerStyle}>Email : {email}</p>
    </body>
  </html>
);