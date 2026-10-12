/** Convierte una foto (file://, blob: o http) a data-URI para incrustarla en la hoja impresa. null si no se pudo leer. */
export async function toDataUri(uri: string): Promise<string | null> {
  if (uri.startsWith('data:')) return uri;
  try {
    const blob = await (await fetch(uri)).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
