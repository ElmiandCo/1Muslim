/* Curated YouTube registry: add verified IDs here, up to 100 entries. No fabricated videos. */
export type RegisteredVideo={videoId:string;title:string;category:string;categories?:string[];startSeconds:number;endSeconds:number|null;format:"desktop"|"phone"};
const seed:RegisteredVideo[]=[
  {videoId:"dsgc7wOATtU",title:"Stories of Dead People — S2 EP3: His Death Left a Mystery",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"N6vkcVBd5-M",title:"Stories of Dead People — S2 EP4: What Happens to the Body After We Die",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"eNRdgzVgt-o",title:"Stories of Dead People — S2 EP5: He Died Next to Ibrahim (AS)",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"HXHzI7FSQc8",title:"Stories of Dead People — S2 EP6: 23-Year-Old Dies Smiling, Find Out Why",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"M-qTbC0ST_A",title:"Stories of Dead People — Season 1 Compilation",category:"Series",categories:["Shows","Scary","Stories of Dead People","Compilation","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"50o4JLaFfY4",title:"Stories of Dead People — S2 EP1: They Opened Grave After 11 Years",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"C7XZEcvQTXM",title:"Stories of Dead People — S2 EP2: The End of a Smoker",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"xsJg5cV_BYw",title:"Stories of Dead People — S2 EP28: Sinful Man Invited for Iftar",category:"Series",categories:["Shows","Scary","Stories of Dead People","Season 2","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"Dyf-hcQHVSg",title:"Stories of the Prophets | EP10 — Nooh (AS) & 950 Years Of Da'wah",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"-O7LWSejY0E",title:"Stories of the Prophets | EP11 — The Final Call Before Destruction",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"q2_NhdYU_Tg",title:"Stories of the Prophets | EP12 — Nooh (AS)'s Ark & The Great Flood",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"w9pnYXQcxrs",title:"Stories of the Prophets | EP14 — Final Warnings & The Torment Upon Aad",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"RerLVM4pWeE",title:"Stories of the Prophets | EP5 — Adam (AS) & Hawwa (AS) On Earth",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"4elQ8MMqq6Q",title:"Stories of the Prophets | EP6 — Habil & Qabil — The Sons of Adam (AS)",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"74an2nHujZU",title:"Stories of the Prophets | EP7 — The Death of Adam (AS)",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"eRMdvy0oWKw",title:"Stories of the Prophets | EP8 — Sheeth (AS) & The Invention of Music",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"GWHggtbGQ4s",title:"Stories of the Prophets | EP9 — Idrees (AS)",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"k4hRONalWU4",title:"Stories of the Prophets | EP1 — Introduction",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"jktPehmOlmo",title:"Stories of the Prophets | EP2 — Creation of Adam (AS)",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"hzoo_llwzBI",title:"Stories of the Prophets | EP3 — Creation of Hawwa (AS)",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"kYJLOA3Ku20",title:"Stories of the Prophets | EP4 — The Arrogance of Iblees",category:"Series",categories:["Shows","Stories of the Prophets","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"LgzRb5SYAvo",title:"The 25 Prophets in Islam Explained",category:"Series",categories:["Shows","Prophet Stories","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"Zor1et-rT8c",title:"Khalid Yasin — The Purpose of Life | Part 1 of 3",category:"Series",categories:["Shows","Islamic Lectures","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"PDfCJRqOXQI",title:"The Story Of Prophets Ibrahim & Yunus | Animated Full Movies — One Islam Productions",category:"Animated Movies",categories:["Movies","Animation","Kids","Prophet Stories","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"Qdm70F47b5k",title:"The Story of Dajjal — Hasan Ali",category:"Afterlife",categories:["One Islam Productions","Islamic Lectures","Afterlife"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"iVtFN5NDkCw",title:"Your First Hour in the Grave — Ahmad Ali",category:"Afterlife",categories:["One Islam Productions","Islamic Lectures","Afterlife"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"XFX5q0JILd0",title:"Letters From Jannah | EP5 — The Palace Built for Me",category:"Shows",categories:["Shows","Letters From Jannah"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"XWiVlPH8ycw",title:"Letters From Jannah | EP4 — The Gardens You Were Promised",category:"Shows",categories:["Shows","Letters From Jannah"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"3JJpHR59598",title:"Letters From Jannah | EP3 — The First Welcome in Paradise",category:"Shows",categories:["Shows","Letters From Jannah"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"oVFGrvEwgdE",title:"Letters From Jannah | EP2 — My First Step In Jannah",category:"Shows",categories:["Shows","Letters From Jannah"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"6W3MDgUsrG0",title:"Letters From Jannah | EP1 — The Final Breath",category:"Shows",categories:["Shows","Letters From Jannah"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"QuxSwXGvCDE",title:"The Story of a Crying Sahabi | Animated Film",category:"Islamic History",categories:["Animated Movies","Kids","Islamic History"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"bBHSA4l8LJQ",title:"The Story of Prophet Adam (AS) — One Islam Productions",category:"Prophet Stories",categories:["Animated Movies","Kids","Prophet Stories"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"SxJ2OC7iXo0",title:"1001 Inventions and the Library of Secrets — HD Edition",category:"Islamic Civilization",categories:["Movies","Kids","Documentaries"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"W-C-qyaTJ9A",title:"The Story Of Prophet Yunus (AS) | Animated Full Movie",category:"Prophet Stories",categories:["Animated Movies","Kids","Prophet Stories"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"wuNAlw5kmW8",title:"The Story Of Prophet Ibrahim (AS) | Animated Full Movie",category:"Prophet Stories",categories:["Animated Movies","Kids","Prophet Stories"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"o2iorDE_xHc",title:"Why Some American Muslim Youth Are Doubting Their Faith | Yaqeen Institute",category:"Faith",categories:["Faith","Lectures"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"dAZPkwAo0lE",title:"O Messenger | Ep. 3",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"eOYW4vKaKpc",title:"O Messenger | Ep. 5",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"uSUxDtp-U0Q",title:"O Messenger | Ep. 10",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"pR65Sfhp-AY",title:"O Messenger | Final Episode",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"DW-00ckCAPI",title:"O Messenger | Ep. 1 — Life of Prophet Muhammad ﷺ",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"Qnzam5KcopM",title:"O Messenger | Ep. 2 — The Hardest Days of Islam",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"jx9syOUU1Ms",title:"O Messenger | Ep. 4 — No Food, No Mercy to Prophet’s Family",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"zNpV3UqwyDU",title:"O Messenger | Ep. 6 — Battle of Badr: Last Words of Abu Jahl",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"CPWL76pGaBI",title:"O Messenger | Ep. 7 — Uhud Was Shaken by a Cry",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"QbV9WR28GCg",title:"O Messenger | Ep. 8 — Battle of the Trench",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {videoId:"ebeAyx_E7pc",title:"O Messenger | Ep. 9 — Epic Conquest of Khaybar",category:"Prophet Stories",categories:["Prophet Stories","Shows","Top 100"],startSeconds:0,endSeconds:null,format:"desktop"},
  {"videoId":"LlvFLGAqb5A","title":"Prophet Adam (AS) — Creation | Mufti Menk","category":"Prophet Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"d2D6WuKlymM","title":"Prophet Nuh (AS) — The Ark | Quran Stories","category":"Prophet Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"lZu173pTldI","title":"Prophet Ibrahim (AS) — His Story | Quran Stories","category":"Prophet Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"7ENLDycXU_Y","title":"Prophet Yusuf (AS) and Yaqub (AS) | Islamic Cinema","category":"Prophet Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"vjQEHpfRK5w","title":"Prophet Musa (AS) vs Firawn | Islamic Cinema","category":"Prophet Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"0OSDr4LGwEI","title":"Is New-age Spirituality Harming Us? — Omar Suleiman","category":"Faith & Spirituality","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"DwzG2GO53IY","title":"Friends That Affirm You On Truth — Omar Suleiman","category":"Community & Character","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"8-OU0BIhIEY","title":"The Quran’s Purpose & Beauty — Nouman Ali Khan","category":"Quran Studies","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"LOjDlcA3DkA","title":"Will Every Non-Muslim Enter Hell? — Towards Eternity","category":"Aqeedah & Questions","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {videoId:"gTDm-1JpGkw",title:"Featured Video — New",category:"Featured",startSeconds:0,endSeconds:null,format:"desktop"},
  {
    "videoId": "gF7RjyK8gQ0",
    "title": "Featured Discussion",
    "category": "Dawah",
    "startSeconds": 28,
    "endSeconds": null,
    "format": "desktop"
  },
  {
    "videoId": "Isi6CwpmTX8",
    "title": "Featured Video",
    "category": "Dawah",
    "startSeconds": 1,
    "endSeconds": null,
    "format": "desktop"
  },
  {
    "videoId": "eZVppeK0BMk",
    "title": "Lesson 3",
    "category": "Dawah",
    "startSeconds": 15,
    "endSeconds": 120,
    "format": "desktop"
  },
  {"videoId":"GCipucmh_-I","title":"Community Short — GCipucmh_-I","category":"Shorts","startSeconds":0,"endSeconds":null,"format":"phone"},
  {"videoId":"ylFuM2IcVk8","title":"Community Short","category":"Shorts","startSeconds":0,"endSeconds":null,"format":"phone"},
  {
    "videoId": "KKg-TM8MGlM",
    "title": "Short 1",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "w6iV6gZIYkY",
    "title": "Short 2",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "Mf7EK7EIEXM",
    "title": "Short 3",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "4Kcf3ha_du8",
    "title": "Short 4",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "9iJ5eESSycM",
    "title": "Short 5",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "R7JlVfBbGRQ",
    "title": "Short 6",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "_DrLkl2doyw",
    "title": "Short 7",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "rA5lPeUCHzU",
    "title": "Short 8",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "9Zl_dVkWDes",
    "title": "Short 9",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  }
];
export const kidsVideoIds=new Set(["LlvFLGAqb5A","d2D6WuKlymM","lZu173pTldI","7ENLDycXU_Y","vjQEHpfRK5w"]);
export const isKidsVideo=(video:RegisteredVideo)=>kidsVideoIds.has(video.videoId);
export const videoRegistry=seed.slice(0,100);
export function getRegistryVideos(format:"desktop"|"phone"){return videoRegistry.filter(v=>v.format===format)}
export const VIDEO_REGISTRY_CAPACITY=100;
