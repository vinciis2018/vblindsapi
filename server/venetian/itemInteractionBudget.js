export default async function itemInteractionBudget(itemParams) {
  const item = itemParams.item;
  try {
    const B = item.itBudget;
    const N = item.expectedViews;
    const V = item.viewedBy.length;
    let K;
    K = Math.pow(((N-1)/N), V);
    let Kb;
    Kb = B*K;
    const Bdash = parseFloat(Kb).toPrecision(5);
    return {Bdash};
  } catch (error) {
    console.log("error venetian screen worth logic", error)
    return {error};
  }
}