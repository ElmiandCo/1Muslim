import {NextResponse} from "next/server";
export async function POST(req:Request){
 const origin=req.headers.get("origin");const host=req.headers.get("host");
 if(origin&&host){try{if(new URL(origin).host!==host)return NextResponse.json({error:"Invalid origin"},{status:403})}catch{return NextResponse.json({error:"Invalid origin"},{status:403})}}
 const data=await req.json().catch(()=>null);
 const rating=data?.rating,feedback=data?.feedback,page=data?.page;
 if(!Number.isInteger(rating)||rating<1||rating>5||typeof feedback!=="string"||feedback.length>2000||typeof page!=="string"||page.length>250)return NextResponse.json({error:"Invalid feedback"},{status:400});
 const key=process.env.RESEND_API_KEY;const sender=process.env.FEEDBACK_FROM_EMAIL;
 if(!key||!sender)return NextResponse.json({error:"Feedback email not configured"},{status:503});
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:sender,to:["hudhudbyelmi@gmail.com"],subject:"1Muslim visitor feedback — "+rating+"/5 stars",text:"Rating: "+rating+"/5\nPage: "+page+"\nFeedback:\n"+(feedback||"(none)")})});
 if(!response.ok)return NextResponse.json({error:"Email delivery failed"},{status:502});
 return NextResponse.json({ok:true});
}
