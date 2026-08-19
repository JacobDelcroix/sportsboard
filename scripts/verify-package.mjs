const entryPoints = [
  '@jacobdelcroix/sportsboard/core',
  '@jacobdelcroix/sportsboard/viewer',
  '@jacobdelcroix/sportsboard/editor',
  '@jacobdelcroix/sportsboard/element',
  '@jacobdelcroix/sportsboard/editor/element',
  '@jacobdelcroix/sportsboard/viewer/element',
  '@jacobdelcroix/sportsboard/basketball/viewer',
  '@jacobdelcroix/sportsboard/basketball/editor',
  '@jacobdelcroix/sportsboard/football/viewer',
  '@jacobdelcroix/sportsboard/football/editor'
];

for (const entryPoint of entryPoints) {
  const module = await import(entryPoint);

  if (Object.keys(module).length === 0) {
    throw new Error(`${entryPoint} does not expose any public API.`);
  }
}

console.log(`Verified ${entryPoints.length} public package entry points.`);
