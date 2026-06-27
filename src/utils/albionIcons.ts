export function itemIconUrl(uniqueName: string, size = 64, quality?: number): string {
  let url = `https://render.albiononline.com/v1/item/${uniqueName}.png?size=${size}`
  if (quality !== undefined && quality >= 1 && quality <= 5) url += `&quality=${quality}`
  return url
}
