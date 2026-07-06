// ESM loader hook: sostituisce src/field.js (visual dispatcher pesante: campo, biomi,
// geo, comp-*) con uno stub che espone solo addMidiNote no-op. Così l'harness audio
// non carica l'intero stack visivo.
export async function load(url, context, nextLoad) {
  if (url.endsWith('/src/field.js')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export function addMidiNote(){}\nexport default {};\n',
    };
  }
  return nextLoad(url, context);
}
