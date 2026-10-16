# Encrypted Chat – Text verschlüsseln

Kleine Web-App, die einen Text mit einem Passwort verschlüsselt. Den entstehenden Code
(`ENC1:…`) verschickt man über einen beliebigen Weg – E-Mail, WhatsApp, Signal, SMS.
Der Empfänger fügt ihn in dieselbe App ein und entschlüsselt ihn mit dem vereinbarten Passwort.

Es gibt keinen Server: Alles läuft im Browser, nichts wird gespeichert oder ins Internet gesendet.

## Benutzung

1. **Verschlüsseln:** Text eingeben, Passwort eingeben oder „Sicheres Passwort erzeugen“,
   dann „Verschlüsseln“. Den Code kopieren, teilen oder per E-Mail schicken.
2. **Passwort getrennt weitergeben** – persönlich, per Anruf oder über einen anderen Kanal,
   nie in derselben Nachricht wie der Code.
3. **Entschlüsseln:** Code (oder gleich die ganze E-Mail) einfügen, Passwort eingeben,
   „Entschlüsseln“.

Der Code darf vom Mail-Programm umgebrochen, mit `>` zitiert oder von Text umgeben sein.

## Sicherheit

| Baustein | Umsetzung |
|---|---|
| Verschlüsselung | AES-256-GCM (Web Crypto API) |
| Schlüssel aus Passwort | PBKDF2-HMAC-SHA256, 600.000 Runden, 16 Byte Salt pro Nachricht |
| Manipulationsschutz | GCM-Prüfsumme über Inhalt **und** Header |
| Erzeugte Passwörter | 20 Zeichen aus 32 eindeutigen Zeichen ≈ 100 Bit |
| Netzwerk | Content-Security-Policy mit `connect-src 'none'` im Build |

Die Sicherheit hängt vollständig am Passwort. Ein kurzes oder erratbares Passwort lässt sich
trotz PBKDF2 durch Ausprobieren knacken.

### Format

```
ENC1:<base64url>
Bytes: Version(1) | Iterationen(4) | Länge(4) | Salt(16) | IV(12) | Ciphertext+Tag
```

Details in [`src/lib/crypto.ts`](src/lib/crypto.ts).

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Unit-Tests (Vitest)
npm run build      # Typprüfung + Produktions-Build nach dist/
```

**Wichtig:** Die Web Crypto API gibt es nur auf `https://` oder `localhost`. Wird der
Dev-Server auf dem Handy über `http://192.168.…` geöffnet, funktioniert das Verschlüsseln
nicht – die App zeigt dann einen Hinweis.

## Verteilen

- **Als Webseite:** `dist/` z. B. über GitHub Pages hosten (kostenlos, mit HTTPS).
- **Als Android-App:** mit Capacitor (`npx cap add android`) in eine App verpacken.
