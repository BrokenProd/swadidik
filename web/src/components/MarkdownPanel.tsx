import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
    markdown: string
}

const MarkdownPanel = ({ markdown }: Props) => {
    return (
        <article className="p-5">
            <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
        </article>
    );
};

export default MarkdownPanel;
