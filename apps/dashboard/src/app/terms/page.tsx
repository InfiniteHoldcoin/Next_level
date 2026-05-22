export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-bold">Conditions d'utilisation</h1>
        <p className="text-muted-foreground mt-1">Dernière mise à jour : 19 mai 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">1. Service fourni</h2>
        <p>NextLevel Inc. fournit une plateforme SaaS permettant aux commerçants de connecter leurs données d'affaires et d'accéder à des agents IA configurés par l'équipe NextLevel. Le service inclut : tableau de bord client, connecteurs de données, messagerie avec l'équipe, et (Phase 2) agents IA actifs.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">2. Utilisation acceptable</h2>
        <p>Vous vous engagez à :</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Fournir des informations exactes lors de l'inscription</li>
          <li>Ne pas tenter de contourner les mécanismes de sécurité</li>
          <li>Ne pas utiliser la plateforme à des fins illégales</li>
          <li>Détenir les droits sur les données que vous uploadez</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">3. Abonnement et facturation</h2>
        <p>Le service est facturé selon le plan convenu avec l'équipe NextLevel (nombre d'agents actifs, complexité, volume de tokens mensuel). Les modalités spécifiques sont définies dans votre entente de service individuelle.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">4. Disponibilité</h2>
        <p>NextLevel vise une disponibilité de 99% mais ne garantit pas un service ininterrompu. Des maintenances planifiées peuvent survenir avec préavis de 24h.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">5. Résiliation</h2>
        <p>Vous pouvez résilier votre compte à tout moment depuis la page Paramètres. NextLevel peut suspendre un compte en cas de non-paiement ou de violation des présentes conditions.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">6. Limitation de responsabilité</h2>
        <p>NextLevel n'est pas responsable des décisions d'affaires prises sur la base des recommandations de ses agents IA. Les agents sont des outils d'assistance, pas des conseillers professionnels.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">7. Droit applicable</h2>
        <p>Ces conditions sont régies par les lois de la province de Québec, Canada. Tout litige sera soumis aux tribunaux compétents du Québec.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-base">8. Contact</h2>
        <p>Pour toute question : <strong>edouardtherrien81@gmail.com</strong></p>
      </section>
    </div>
  );
}
