/**
 * Un trazo de la firma tal como lo arma el frontend: `M x,y` seguido de `L x,y`. Solo números:
 * la hoja de recepción los inserta en `<path d="…">`, así que cualquier otro carácter sería una
 * puerta para inyectar HTML.
 */
export const STROKE_PATTERN =
  /^M-?\d{1,5}(\.\d{1,2})?,-?\d{1,5}(\.\d{1,2})?( L-?\d{1,5}(\.\d{1,2})?,-?\d{1,5}(\.\d{1,2})?)*$/;
