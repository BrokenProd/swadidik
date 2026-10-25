const loadFont = async (fontSize: number) => {
  await import("./fonts/JetBrainsMono.css");
  await document.fonts.load(`400 ${fontSize}px "JetBrains Mono"`);
  await document.fonts.load(`700 ${fontSize}px "JetBrains Mono"`);
};

export default loadFont;
