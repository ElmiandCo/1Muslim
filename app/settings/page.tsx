"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** Old /settings URLs now open the unified floating Settings workspace on Search Home. */
export default function SettingsPage(){
 const router=useRouter();
 useEffect(()=>{router.replace("/search?settings=1")},[router]);
 return <main aria-label="Opening integrated settings"/>;
}
