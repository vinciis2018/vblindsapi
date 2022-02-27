export default async function itemWorth(itemParams) {
  const item = itemParams.item;
  try {
    const W = item.itWorth;
    const L = item.likedBy.length;
    const F = item.flaggedBy.length;
    let K;
    if (F === 0 && L === 0) {
      K = W;
    } else if (F === 0 && L !== 0) {
      K = 3 * (W + (L/(100 * W)))
    } else if(F === 0 && L === 0) {
      K = W - (F/(100 * W));
    } else {
      K = W + ((L - F)/(100 * W));
    }
    const Wdash = parseFloat(K).toPrecision(5);
    console.log(Wdash);
    return {Wdash};
  } catch (error) {
    console.log("error venetian screen worth logic", error)
    return {error};
  }
}