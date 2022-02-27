export default async function advertInteractionBudget(advertParams) {
  const video = advertParams.video;
  try {
    const B = video.adBudget;
    const N = video.expectedViews;
    const V = video.viewedBy.length;
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