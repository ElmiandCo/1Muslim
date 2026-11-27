/** Shared predictable-password rejection for the Search Home account flow. */
export function passwordWarning(value:string,name:string,email:string):string{
 if(value.length<12)return "Use at least 12 characters.";
 const classes=[/[a-z]/.test(value),/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z\d]/.test(value)].filter(Boolean).length;
 if(classes<3)return "Use at least three of: uppercase, lowercase, numbers or symbols.";
 if(/password|passw0rd|qwerty|asdfgh|123456|654321|letmein|admin123|111111|000000|1muslim/i.test(value)||
    /(.)\1{4,}/.test(value))return "Choose something less predictable.";
 const fragments=[...name.toLowerCase().split(/\s+/),email.split("@")[0]?.toLowerCase()].filter(s=>s&&s.length>=4);
 if(fragments.some(s=>value.toLowerCase().includes(s)))return "Avoid using your name or email in the password.";
 return "";
}
