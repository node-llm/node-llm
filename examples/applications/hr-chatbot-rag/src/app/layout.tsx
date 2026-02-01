import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Internal HR Assistant",
  description: "Secure company chatbot for HR policies and queries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
