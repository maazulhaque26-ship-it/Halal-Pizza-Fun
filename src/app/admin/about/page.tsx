/**
 * Server Component wrapper for the Admin About page editor.
 * This thin wrapper exists so Vercel's serverless function tracer
 * can generate a proper lambda entry for this route. The actual
 * client-side UI lives in AdminAboutClient.tsx.
 */
import AdminAboutClient from "./AdminAboutClient";

export default function AdminAboutPage() {
  return <AdminAboutClient />;
}
