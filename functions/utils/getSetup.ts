export default async function getSetup(request) {
  const font = fetch(
    new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZFhjQ.ttf'),
    import.meta.url
  ).then((res) => res.arrayBuffer())
  const fontData = await font

  const origin = new URL(request.url).origin
  const watermark = origin + '/images/324x74_App_Watermark.png'
  const check = origin + '/images/54x54_Verified_Check.svg'
  return {
    fontData,
    watermark,
    check,
  }
}