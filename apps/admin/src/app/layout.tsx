import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">NextLevel</span>
            <span className="text-gray-400 text-sm">Admin</span>
          </div>
          <span className="text-xs text-gray-400">Usage interne seulement</span>
        </header>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
