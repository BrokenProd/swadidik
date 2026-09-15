import { File } from "lucide-react";
import type { CSSProperties, FunctionComponent } from "react";
import JavaScriptIcon from "./Icons/JavaScriptIcon";
import MarkdownIcon from "./Icons/Markdown";
import PythonIcon from "./Icons/PythonIcon";
import TypeScriptIcon from "./Icons/TypeScriptIcon";
import JavaIcon from "./Icons/JavaIcon";


interface Props {
  language: string;
  style?: CSSProperties;
  className?: string;
}

const iconComponents: Record<string, FunctionComponent<{ style?: CSSProperties; className?: string }>> = {
  java: JavaIcon,
  python: PythonIcon,
  typescript: TypeScriptIcon,
  javascript: JavaScriptIcon,
  markdown: MarkdownIcon,
};

const FileTypeIcon = ({ language, style, className }: Props) => {
  const IconComponent = iconComponents[language.toLowerCase()];

  if (!IconComponent) {
    return <File style={style} className={className} />;
  }

  return <IconComponent style={style} className={className} />;
};

export default FileTypeIcon;
