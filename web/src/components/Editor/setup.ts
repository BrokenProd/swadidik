import { minimalSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { keymap, lineNumbers } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";

const loadPython = async () => {
  const { python } = await import("@codemirror/lang-python");
  return python();
};

const loadJavaScript = async () => {
  const { javascript } = await import("@codemirror/lang-javascript");
  return javascript();
};

const loadTypeScript = async () => {
  const { javascript } = await import("@codemirror/lang-javascript");
  return javascript({ typescript: true });
};

const loadJava = async () => {
  const { java } = await import("@codemirror/lang-java");
  return java();
};

const setupExtensions = async (lang: string) => {
  const extensions = [minimalSetup, keymap.of([indentWithTab]), lineNumbers()];

  switch (lang) {
    case "java":
      extensions.push(await loadJava());
      break;
    case "python":
      extensions.push(await loadPython());
      break;
    case "javascript":
      extensions.push(await loadJavaScript());
      break;
    case "typescript":
      extensions.push(await loadTypeScript());
      break;
    case "markdown":
      extensions.push(markdown());
      break;
  }

  return extensions;
};

export { loadJavaScript, loadPython, loadTypeScript, setupExtensions };
