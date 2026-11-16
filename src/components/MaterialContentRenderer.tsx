import React, { useMemo } from 'react';

interface MaterialContentRendererProps {
  content: string;
  className?: string;
}

function containsHtmlTags(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function sanitizeScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function stripHtmlTags(input: string): string {
  if (!input) return '';
  if (!containsHtmlTags(input)) return input;
  return input
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function MaterialContentRenderer({
  content,
  className = '',
}: MaterialContentRendererProps) {
  const isHtml = useMemo(() => containsHtmlTags(content), [content]);
  const safeHtml = useMemo(
    () => (isHtml ? sanitizeScriptTags(content) : ''),
    [isHtml, content]
  );

  if (!isHtml) {
    return (
      <div
        className={`text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`material-html-content text-sm text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
