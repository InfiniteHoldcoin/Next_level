export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight">NextLevel</span>
          <p className="text-sm text-muted-foreground mt-1">Agence IA</p>
        </div>
        {children}
      </div>
    </div>
  );
}
