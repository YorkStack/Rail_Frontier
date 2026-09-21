/** Terrain-guided search heights, with look-ahead in both directions. These
 * samples propose a vertical corridor; only the fitted curve certificate can
 * establish its grade, curvature and endpoint-tangent validity. */
export function elevationEnvelopes(ground:readonly number[],distances:readonly number[],startY:number,endY:number,maxGrade:number):number[][] {
  const last=ground.length-1,total=distances[last]??NaN;
  if(last<1||distances.length!==ground.length||!Number.isFinite(total)||total<=0||![...ground,...distances,startY,endY,maxGrade].every(Number.isFinite)||maxGrade<=0)return [];
  if(distances[0]!==0||distances.some((d,i)=>i>0&&d<=distances[i-1]!))return [];
  const profiles:number[][]=[];
  // Separate gentler and steeper corridors. The minimum necessary endpoint
  // slope keeps sloping connections possible; it never raises the class limit.
  for(const fraction of [.4,.65]){
    const grade=Math.max(maxGrade*fraction,Math.abs(endY-startY)/total);
    if(grade>maxGrade)continue;
    const low=distances.map(d=>Math.max(startY-grade*d,endY-grade*(total-d))),high=distances.map(d=>Math.min(startY+grade*d,endY+grade*(total-d)));
    const target=ground.map((y,i)=>Math.max(low[i]!,Math.min(high[i]!,y)));
    target[0]=startY;target[last]=endY;
    for(const below of [true,false]){
      const heights=[...target],choose=below?Math.min:Math.max;
      // Lower/upper Lipschitz envelopes anticipate a ridge or hollow before
      // reaching it, unlike sampling only the ground under the next node.
      for(let i=1;i<=last;i++)heights[i]=choose(heights[i]!,heights[i-1]!+(below?1:-1)*grade*(distances[i]!-distances[i-1]!));
      for(let i=last-1;i>=0;i--)heights[i]=choose(heights[i]!,heights[i+1]!+(below?1:-1)*grade*(distances[i+1]!-distances[i]!));
      for(let i=0;i<=last;i++)heights[i]=Math.max(low[i]!,Math.min(high[i]!,heights[i]!));
      heights[0]=startY;heights[last]=endY;
      profiles.push(heights);
    }
  }
  return profiles;
}
