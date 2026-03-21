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
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>{children}</body>
    </html>
  );
}
