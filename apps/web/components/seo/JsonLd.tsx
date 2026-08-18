/** Renders one `<script type="application/ld+json">` per object, sanitized against XSS per Next's JSON-LD guide. */
export function JsonLd({ data }: { data: object[] }) {
  return (
    <>
      {data.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
