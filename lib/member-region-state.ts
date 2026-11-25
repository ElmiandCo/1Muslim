/** State-center labels used by both public and admin consent-based aggregate maps. */
const statePairs="AL:Alabama,AK:Alaska,AZ:Arizona,AR:Arkansas,CA:California,CO:Colorado,CT:Connecticut,DE:Delaware,FL:Florida,GA:Georgia,HI:Hawaii,ID:Idaho,IL:Illinois,IN:Indiana,IA:Iowa,KS:Kansas,KY:Kentucky,LA:Louisiana,ME:Maine,MD:Maryland,MA:Massachusetts,MI:Michigan,MN:Minnesota,MS:Mississippi,MO:Missouri,MT:Montana,NE:Nebraska,NV:Nevada,NH:New Hampshire,NJ:New Jersey,NM:New Mexico,NY:New York,NC:North Carolina,ND:North Dakota,OH:Ohio,OK:Oklahoma,OR:Oregon,PA:Pennsylvania,RI:Rhode Island,SC:South Carolina,SD:South Dakota,TN:Tennessee,TX:Texas,UT:Utah,VT:Vermont,VA:Virginia,WA:Washington,WV:West Virginia,WI:Wisconsin,WY:Wyoming,DC:District of Columbia";
const states:Record<string,string>=Object.fromEntries(statePairs.split(",").map(pair=>pair.split(":")));
const knownStateNames=new Set(Object.values(states));
export function canonicalUsState(value:string|null|undefined):string{
 const raw=(value||"").trim();
 return states[raw.toUpperCase()]||[...knownStateNames].find(name=>name.toLowerCase()===raw.toLowerCase())||raw;
}
export function isKnownUsState(value:string|null|undefined):boolean{
 return knownStateNames.has(canonicalUsState(value));
}
