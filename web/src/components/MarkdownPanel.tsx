import { useEffect, useState } from "react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { useTheme } from "#/shared/theme";

interface Props {
  markdown: string;
  onReady?: () => void;
}

type MarkdownNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
};

const alertTitles = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
} as const;

const defaultAttributes = defaultSchema.attributes ?? {};
const shikiSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultAttributes,
    blockquote: [...(defaultAttributes.blockquote ?? []), "className"],
    strong: [...(defaultAttributes.strong ?? []), "className"],
    pre: [...(defaultAttributes.pre ?? []), "className", "style"],
    code: [...(defaultAttributes.code ?? []), "className", "style"],
    span: [...(defaultAttributes.span ?? []), "className", "style"],
  },
};

const rehypeGithubAlerts = () => (tree: MarkdownNode) => {
  const visit = (node: MarkdownNode) => {
    if (node.tagName === "blockquote") {
      const paragraph = node.children?.find((child) => child.tagName === "p");
      const firstText = paragraph?.children?.find(
        (child) => child.type === "text" && typeof child.value === "string",
      );
      const text = firstText?.value ?? "";
      const match = text.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/,
      );

      if (match && firstText && paragraph) {
        const kind = match[1] as keyof typeof alertTitles;
        firstText.value = text.slice(match[0].length);
        node.properties = {
          ...node.properties,
          className: ["markdown-alert", `markdown-alert-${kind.toLowerCase()}`],
        };
        paragraph.children = [
          {
            type: "element",
            tagName: "strong",
            properties: { className: ["markdown-alert-title"] },
            children: [{ type: "text", value: alertTitles[kind] }],
          },
          ...(paragraph.children ?? []),
        ];
      }
    }

    node.children?.forEach(visit);
  };

  visit(tree);
};

const MarkdownPanel = ({ markdown, onReady }: Props) => {
  const [html, setHtml] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    const renderMarkdown = async () => {
      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeGithubAlerts)
        .use(rehypeShiki, {
          theme: theme === "dark" ? "github-dark" : "github-light",
        })
        .use(rehypeSanitize, shikiSanitizeSchema)
        .use(rehypeStringify)
        .process(markdown);

      if (!cancelled) {
        setHtml(String(result));
        onReady?.();
      }
    };

    void renderMarkdown();

    return () => {
      cancelled = true;
    };
  }, [markdown, theme, onReady]);

  return (
    <article
      className="p-5 [&_h2]:py-2  [&_h1]:pb-2  [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-base-300 [&_blockquote]:bg-base-200 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_pre]:my-4 [&_pre]:p-4 [&_.markdown-alert]:border-info [&_.markdown-alert]:bg-info/10 [&_.markdown-alert-title]:mb-1 [&_.markdown-alert-title]:block [&_.markdown-alert-title]:text-info [&_.markdown-alert-tip]:border-success [&_.markdown-alert-tip]:bg-success/10 [&_.markdown-alert-tip_.markdown-alert-title]:text-success [&_.markdown-alert-important]:border-primary [&_.markdown-alert-important]:bg-primary/10 [&_.markdown-alert-important_.markdown-alert-title]:text-primary [&_.markdown-alert-warning]:border-warning [&_.markdown-alert-warning]:bg-warning/10 [&_.markdown-alert-warning_.markdown-alert-title]:text-warning [&_.markdown-alert-caution]:border-error [&_.markdown-alert-caution]:bg-error/10 [&_.markdown-alert-caution_.markdown-alert-title]:text-error"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPanel;
