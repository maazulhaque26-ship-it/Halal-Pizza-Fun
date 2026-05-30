/**
 * JsonLd — renders a JSON-LD <script> tag.
 *
 * Safe in Server Components (no hydration mismatch).
 * Can be used in both layout.tsx and individual page.tsx files.
 *
 * Usage:
 *   import { JsonLd } from "@/components/seo/JsonLd";
 *   <JsonLd data={organizationSchema()} />
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML is the correct approach for JSON-LD in Next.js.
      // It does not cause hydration issues in server components.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}