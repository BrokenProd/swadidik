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
}

const defaultAttributes = defaultSchema.attributes ?? {};
const shikiSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultAttributes,
    pre: [...(defaultAttributes.pre ?? []), "className", "style"],
    code: [...(defaultAttributes.code ?? []), "className", "style"],
    span: [...(defaultAttributes.span ?? []), "className", "style"],
  },
};

const MarkdownPanel = ({ markdown }: Props) => {
  const [html, setHtml] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    const renderMarkdown = async () => {
      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeShiki, {
          theme: theme === "dark" ? "github-dark" : "github-light",
        })
        .use(rehypeSanitize, shikiSanitizeSchema)
        .use(rehypeStringify)
        .process(markdown);

      if (!cancelled) setHtml(String(result));
    };

    void renderMarkdown();

    return () => {
      cancelled = true;
    };
  }, [markdown, theme]);

  return (
    <article
      className="p-5 [&_pre]:my-4 [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPanel;
