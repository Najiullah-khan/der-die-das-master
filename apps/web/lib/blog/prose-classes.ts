/**
 * Shared markdown-content styling for rendered post HTML — used by the real `/blog/[slug]`
 * page and by the admin editor's live preview modal, so a draft preview looks exactly like the
 * published result instead of a lookalike reimplementation drifting out of sync.
 */
export const ARTICLE_PROSE_CLASS = `text-lg leading-relaxed [&_a]:text-der [&_a]:underline
  [&_a[href^='/das/']]:rounded-md [&_a[href^='/das/']]:bg-das/10 [&_a[href^='/das/']]:px-1.5 [&_a[href^='/das/']]:py-0.5 [&_a[href^='/das/']]:font-semibold [&_a[href^='/das/']]:text-das [&_a[href^='/das/']]:no-underline
  [&_a[href^='/der/']]:rounded-md [&_a[href^='/der/']]:bg-der/10 [&_a[href^='/der/']]:px-1.5 [&_a[href^='/der/']]:py-0.5 [&_a[href^='/der/']]:font-semibold [&_a[href^='/der/']]:text-der [&_a[href^='/der/']]:no-underline
  [&_a[href^='/die/']]:rounded-md [&_a[href^='/die/']]:bg-die/10 [&_a[href^='/die/']]:px-1.5 [&_a[href^='/die/']]:py-0.5 [&_a[href^='/die/']]:font-semibold [&_a[href^='/die/']]:text-die [&_a[href^='/die/']]:no-underline
  [&_.callout-tip]:my-6 [&_.callout-tip]:rounded-r-lg [&_.callout-tip]:border-l-4 [&_.callout-tip]:border-der [&_.callout-tip]:bg-der/5 [&_.callout-tip]:py-3 [&_.callout-tip]:pl-4 [&_.callout-tip]:pr-4 [&_.callout-tip]:text-base
  [&_.callout-warning]:my-6 [&_.callout-warning]:rounded-r-lg [&_.callout-warning]:border-l-4 [&_.callout-warning]:border-amber-500 [&_.callout-warning]:bg-amber-500/10 [&_.callout-warning]:py-3 [&_.callout-warning]:pl-4 [&_.callout-warning]:pr-4 [&_.callout-warning]:text-base
  [&_blockquote]:my-6 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:bg-neutral-100/60 [&_blockquote]:py-3 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:text-base dark:[&_blockquote]:border-neutral-700 dark:[&_blockquote]:bg-neutral-800/40
  [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-neutral-800
  [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-neutral-200 [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-bold dark:[&_h2]:border-neutral-800
  [&_h3]:mt-6 [&_h3]:border-l-4 [&_h3]:border-der [&_h3]:pl-3 [&_h3]:text-xl [&_h3]:font-semibold
  [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6
  [&_p]:my-4
  [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-100 [&_pre]:p-4 [&_pre]:text-base dark:[&_pre]:bg-neutral-900
  [&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:rounded-lg [&_table]:border [&_table]:border-neutral-200 [&_table]:text-base dark:[&_table]:border-neutral-800
  [&_th]:border-b [&_th]:border-neutral-200 [&_th]:bg-neutral-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-neutral-800 dark:[&_th]:bg-neutral-800
  [&_td]:border-b [&_td]:border-neutral-100 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-neutral-900
  [&_tbody_tr:nth-child(even)]:bg-neutral-50 dark:[&_tbody_tr:nth-child(even)]:bg-neutral-900/60
  [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6`;
