export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
        <p className="text-muted-foreground mt-1">Dernière mise à jour : 19 mai 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">1. Qui sommes-nous</h2>
        <p>NextLevel Inc. («&nbsp;NextLevel&nbsp;», «&nbsp;nous&nbsp;») est une agence IA managée dont le siège est au Québec, Canada. Nous fournissons une plateforme permettant aux commerçants de connecter leurs données d'affaires à des agents IA personnalisés.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">2. Données que nous collectons</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Adresse courriel (pour l'authentification)</li>
          <li>Nom de l'entreprise, ville, site web (fournis à l'inscription)</li>
          <li>Données d'affaires uploadées : documents, listes de contacts, catalogues de services</li>
          <li>Messages échangés avec l'équipe NextLevel</li>
          <li>Données de navigation (logs techniques anonymisés)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">3. Où vos données sont stockées</h2>
        <p>Toutes les données sont stockées sur les serveurs de Supabase (Amazon Web Services, région Canada — ca-central-1). Vos données ne quittent pas le Canada dans le cadre normal d'opération de la plateforme.</p>
        <p className="text-muted-foreground text-xs">Note : lors de l'activation des agents IA (Phase 2), certaines données peuvent être transmises à Anthropic (États-Unis) pour le traitement par Claude. Une divulgation spécifique vous sera faite avant l'activation.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">4. Qui a accès à vos données</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>L'équipe NextLevel — pour configurer vos agents et vous supporter</li>
          <li>Vous-même — via votre tableau de bord</li>
          <li>Aucun tiers sans votre consentement préalable</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">5. Durée de conservation</h2>
        <p>Vos données sont conservées pendant toute la durée de votre abonnement, plus 30 jours après résiliation pour permettre une récupération en cas d'erreur. Après ce délai, toutes les données sont effacées de manière permanente.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">6. Vos droits (Loi 25 — Québec)</h2>
        <p>Conformément à la Loi modernisant des dispositions législatives en matière de protection des renseignements personnels (Loi 25), vous avez le droit de :</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Accéder à vos données personnelles</li>
          <li>Corriger des informations inexactes</li>
          <li>Demander la suppression de votre compte et de toutes vos données</li>
          <li>Obtenir une copie de vos données en format structuré</li>
        </ul>
        <p>Pour exercer ces droits ou pour toute question : <strong>edouardtherrien81@gmail.com</strong></p>
        <p className="text-xs text-muted-foreground">Vous pouvez également supprimer votre compte directement depuis la page Paramètres de votre tableau de bord.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">7. Données de vos propres clients</h2>
        <p>Si vous uploadez des listes de contacts (noms, courriels, téléphones de vos clients), vous confirmez détenir les droits nécessaires pour nous confier ces données. NextLevel agit comme sous-traitant et ne les utilise qu'aux fins de configuration de vos agents. Une convention de traitement des données est disponible sur demande.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">8. Modifications</h2>
        <p>Toute modification substantielle à cette politique vous sera notifiée par courriel 30 jours à l'avance.</p>
      </section>
    </div>
  );
}
