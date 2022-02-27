export default async function filmInteractionBudget(filmParams) {
  const film = filmParams.film;
  try {
    const B = film.flBudget;
    const N = film.expectedViews;
    const V = film.viewedBy.length;
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