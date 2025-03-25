# Konzept für "ocfitshit" – Interner Fitness-Wettbewerbstracker

## Überblick

"ocfitshit" ist eine interne Webanwendung, die einen firmeninternen Fitness-Wettbewerb organisiert und verfolgt. Ziel ist es, Mitarbeiter durch Wettbewerbe und Gamification-Elemente wie Level und Badges zu motivieren, ihre Fitnessziele zu erreichen. Die Anwendung wird mit einem modernen Tech-Stack entwickelt, der Next.js, ShadCN UI und Clerk für die Authentifizierung umfasst.

## Hauptfunktionen

### 1. Benutzerverwaltung und Authentifizierung

- **Authentifizierung:** Clerk wird für eine sichere und flexible Benutzeranmeldung verwendet. Unterstützt verschiedene Anmeldeoptionen wie Unternehmens-Login, Google oder E-Mail/Passwort.
- **Funktionen:** Registrierung, Anmeldung und Profilmanagement für jeden Nutzer.
- **Sicherheit:** Clerk bietet Multi-Faktor-Authentifizierung und Integration mit internen Systemen als Option.

### 2. Wettbewerbsmanagement

- **Saisonale Wettbewerbe:** Wettbewerbe laufen über festgelegte Zeiträume und werden am Ende jeder Saison automatisch zurückgesetzt.
- **Ranglisten:** Anzeige von globalen und persönlichen Ranglisten basierend auf den Leistungen der Nutzer.
- **Tracking:** Erfassung von Fitnessdaten wie Übungen, Punkten oder anderen Metriken.

### 3. Gamification

- **Level-System:** Nutzer steigen durch das Erreichen von Meilensteinen (z.B. Punkte, abgeschlossene Übungen) in Levels auf.
- **Badges:** Vergabe von Abzeichen für besondere Leistungen, wie z.B. Top-Platzierungen oder Zielerreichung.
- **Motivation:** Gamification-Elemente fördern Engagement und Wettbewerbsgeist.

### 4. Datenvisualisierung

- **Fortschrittsanzeige:** Diagramme zeigen individuelle Fortschritte und Vergleiche mit anderen Nutzern.
- **Technologie:** Integration von Chart.js für responsive und ansprechende Visualisierungen.
- **Interaktivität:** Nutzer können ihre Daten nach Zeitraum oder Kategorie filtern.

### 5. UX-Verbesserungen

- **Animationen:** Einsatz von Framer Motion für flüssige Übergänge, z.B. bei Level-Aufstiegen oder Ranglisten-Updates.
- **Benachrichtigungen:** Hinweise bei wichtigen Ereignissen wie neuen Badges oder Ranglistenänderungen.
- **Design:** ShadCN UI sorgt für eine moderne, intuitive und barrierefreie Benutzeroberfläche.

## Technologiestack

| **Komponente** | **Rolle**                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| **Next.js**    | Full-Stack-Framework für Server-Side Rendering, API-Routen und Frontend     |
| **ShadCN UI**  | Moderne, anpassbare UI-Komponenten für ein konsistentes Design              |
| **Clerk**      | Authentifizierungslösung für sichere und einfache Benutzerverwaltung        |
| **PostgreSQL** | Robuste Datenbank zur Speicherung von Benutzer- und Wettbewerbsdaten        |
| **Drizzle**    | ORM für performante und typensichere Datenbankinteraktionen                 |
| **tRPC**       | Type-sichere API-Routen für die Kommunikation zwischen Frontend und Backend |

## Integration von Clerk

Clerk wird als zentrale Authentifizierungslösung verwendet und nahtlos in die Anwendung integriert:

1. **Setup:** Clerk wird in Next.js eingebunden und konfiguriert, um Benutzerdaten zu verwalten.

   ```typescript
   import { ClerkProvider } from "@clerk/nextjs";

   export default function RootLayout({ children }) {
     return (
       <ClerkProvider>
         {children}
       </ClerkProvider>
     );
   }
   ```

2. **Implementierte Funktionen:**

   - **Clerk SDK Integration:** Das Clerk SDK wurde in Next.js integriert und in der RootLayout-Komponente eingebunden.
   - **Login-Seite:** Eine dedizierte Login-Seite wurde mit Clerk's SignIn-Komponente erstellt.
   - **Registrierungsseite:** Eine Registrierungsseite wurde mit Clerk's SignUp-Komponente implementiert.
   - **Geschützte Routen:** Middleware wurde konfiguriert, um bestimmte Routen nur für authentifizierte Benutzer zugänglich zu machen.
   - **Admin-Rollenzuweisung:** Ein Mechanismus für rollenbasierte Zugriffskontrollen wurde implementiert, um Admin-Funktionen zu schützen.

3. **Projektstruktur:**

   - `/src/app/login/page.tsx` - Login-Seite mit Clerk's SignIn-Komponente
   - `/src/app/register/page.tsx` - Registrierungsseite mit Clerk's SignUp-Komponente
   - `/src/app/dashboard/page.tsx` - Geschützte Dashboard-Seite für authentifizierte Benutzer
   - `/src/app/admin/page.tsx` - Admin-Bereich mit rollenbasierter Zugriffskontrolle
   - `/src/middleware.ts` - Konfiguration für geschützte Routen
   - `/src/components/Navigation.tsx` - Navigation mit dynamischen Links basierend auf dem Authentifizierungsstatus

4. **Umgebungsvariablen:**

   Die folgenden Umgebungsvariablen müssen in `.env.local` konfiguriert werden:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   DATABASE_URL=your_database_url
   ```
