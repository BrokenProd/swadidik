const loadFont = async (fontFamily: string, fontSize: number) => {
  switch (fontFamily) {
    case "JetBrains Mono":
      await import("./fonts/JetBrainsMono.css");
      break;
    case "Fira Code":
      await import("./fonts/FiraCode.css");
      break;
    default:
      throw new Error(`invalid font ${fontFamily}`);
  }

  await document.fonts.load(`400 ${fontSize}px "${fontFamily}"`);
  await document.fonts.load(`700 ${fontSize}px "${fontFamily}"`);
};

export default loadFont;
