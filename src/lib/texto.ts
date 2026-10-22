/**
 * Normaliza un nombre propio: primera letra de cada palabra en mayúscula y el resto en
 * minúscula, respetando acentos y eñes. También capitaliza después de guion y apóstrofo.
 * Ej.: "ARROYO SECO" -> "Arroyo Seco", "josé maría" -> "José María", "d'angelo" -> "D'Angelo".
 */
export function capitalizar(texto: string) {
  return texto
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-AR")
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toLocaleUpperCase("es-AR"));
}
