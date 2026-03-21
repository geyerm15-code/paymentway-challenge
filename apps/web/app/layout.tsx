import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PaymentWay — Batch Upload",
  description: "Bulk payment processing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
