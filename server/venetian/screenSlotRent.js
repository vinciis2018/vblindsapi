
export default async function screenSlotRent (screenParams) {
  const req = screenParams.req;
  const screen = screenParams.screen;
  const calender = screenParams.calender;

  try {

    const S = screen.subscribers.length;
    // console.log("subscribers", S);

    const A = screen.allies.length;
    // console.log("allies", A);

    const R = screen.rentPerSlot;
    console.log("rent set by master", R);

    let K;

    const slotTP = screen.slotsTimePeriod;

    const fUsed = calender.slotDetails.filter(slotDetail => 
      new Date(slotDetail.slotTimeStart).getDate() === 
      new Date().getDate()).length;

    const fMax = (24 * 60 * 60 )/slotTP; //max frequency

    const fRem = fMax - fUsed; //remaining frequency

    let HcT;
    if(req.body) {
      if(req.body.dateHere) {
        K = 1 || Number(req?.body?.slotsPerDay);
        HcT = new Date(req?.body?.dateHere).toTimeString().split(" ")[0] 
      } 
      if (req.body.startDateHere) {
        K = Number(req?.body?.slotsPerDay);
        HcT = new Date(req.body.startDateHere).toTimeString().split(" ")[0] 
      }
    } else {
      K = 1;
      HcT = req.timeHere
    }
    console.log("K", K)
    console.log("HcT", HcT)

    const Hc = HcT.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Hc", Hc);

    const Hi1 = '06:59:59';
    const Hi1T = Hi1.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Hi1T", Hi1T);

    
    const Hi2 = '12:59:59';
    const Hi2T = Hi2.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Hi2T", Hi2T);
    
    const Hi3 = '18:59:59';
    const Hi3T = Hi3.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Hi3T", Hi3T);
    
    const Hi4 = '01:00:00';
    const Hi4T = Hi4.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Hi4T", Hi4T);
    
    let Hi;

    const Ho1 = '12:59:59';
    const Ho1T = Ho1.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Ho1T", Ho1T);
    
    const Ho2 = '18:59:59';
    const Ho2T = Ho2.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Ho2T", Ho2T);
    
    const Ho3 = '24:59:59';
    const Ho3T = Ho3.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Ho3T", Ho3T);
    
    const Ho4 = '06:59:59';
    const Ho4T = Ho4.split(':')
      .map(function(val) { return parseInt(val, 10); } )
      .reduce( function(previousValue, currentValue, index, array){
          return previousValue + currentValue / Math.pow(60, index);
      });
    console.log("Ho4T", Ho4T);
    
    let Ho;

    const M = 2;
    const L = 1;
    const E = 3;
    const N = 1;
    let Q; //Quadrant Constants
    let deltaR;
    

    if(Hi1T <= Hc && Hc <= Ho1T) {
      Hi = Hi1T;
      Ho = Ho1T;
      Q = M;
    };

    if(Hi2T <= Hc && Hc <= Ho2T) {
      Hi = Hi2T;
      Ho = Ho2T;
      Q = L;
    };

    if(Hi3T <= Hc && Hc <= Ho3T) {
      Hi = Hi3T;
      Ho = Ho3T;
      Q = E;
    };

    if(Hi4T <= Hc && Hc <= Ho4T) {
      Hi = Hi4T;
      Ho = Ho4T;
      Q = N;
    };

    console.log({Hi, Ho, Q})
    //Time Quadrant Multiplier
    const T = parseFloat(Q*((Ho-Hi)/(Ho-Hc))).toPrecision(5); 
    console.log("T", T);

    if(S === 0 && A === 0) {
      deltaR = (R/(fRem/T))
    } else if(S === 0 && A !== 0) {
      deltaR = ((R*(A+1))/(fRem/T))
    } else if(S !== 0 && A === 0) {
      deltaR = ((R*(S+1))/(fRem/T))
    } else {
      deltaR = (((S+A+1)*R)/((S*A)+(fRem/T)))
    }
    const Rdash = K*(parseFloat(R + deltaR).toPrecision(5));
    console.log(Rdash)
    return {Rdash};

  } catch (error) {
    console.log("error screen rent venetian logic", error)
    return {error}
}

}