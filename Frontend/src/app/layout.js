import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Role Based Login",
  description: "Student/Teacher/Admin Supabase Auth",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#060606] text-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
