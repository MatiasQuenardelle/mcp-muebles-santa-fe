// Una cantidad se escribe con decimales, no con puntos de miles: "2,5" o "2.5". El
// teclado del iPhone pone coma o punto según el idioma, y se aceptan las dos. "1.500"
// se rechaza porque puede ser 1500 o 1,5, y es mejor pedirlo de nuevo.
export function textoACantidad(texto: string): number | null {
  const limpio = texto.trim()
  if (!/^\d+([.,]\d{1,3})?$/.test(limpio) || /\.\d{3}$/.test(limpio)) {
    return null
  }
  const valor = Number(limpio.replace(',', '.'))
  return valor > 0 ? valor : null
}

export function cantidadATexto(valor: number): string {
  return String(valor).replace('.', ',')
}
