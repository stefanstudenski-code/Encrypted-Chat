/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Strenge Content-Security-Policy für den fertigen Build:
 * Die App lädt nichts von fremden Servern und darf auch keine Verbindungen aufbauen
 * (connect-src 'none'). Im Entwicklungsmodus wird sie weggelassen, weil Vite dort
 * Inline-Skripte und eine WebSocket-Verbindung für Hot-Reload braucht.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // Relative Pfade, damit der Build auch unter einem Unterordner (z. B. GitHub Pages)
  // oder in einer App-WebView (Capacitor) funktioniert
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    environment: 'node',
  },
});
