/** Visibility of a member's public @1Muslim ID.
 * Never use this preference to alter the account's internal username,
 * authentication, or private owner-only identity editor.
 */
export type PublicMemberIdentity={
 display_name?:string|null;
 username?:string|null;
 hide_1muslim_id?:boolean|null;
};
export function publicMemberId(member:PublicMemberIdentity|null|undefined):string|null{
 if(!member||member.hide_1muslim_id||!member.username?.trim())return null;
 return "@"+member.username.trim().replace(/^@/,"");
}
export function publicMemberName(member:PublicMemberIdentity|null|undefined):string{
 return member?.display_name?.trim()||publicMemberId(member)?.slice(1)||"1Muslim member";
}
