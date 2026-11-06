/* Curated YouTube registry: add verified IDs here, up to 100 entries. No fabricated videos. */
export type RegisteredVideo={videoId:string;title:string;category:string;startSeconds:number;endSeconds:number|null;format:"desktop"|"phone"};
const seed:RegisteredVideo[]=[
  {"videoId":"rx-mz9qGQ4I","title":"6,000 Bodies Washed and Buried | Omar Suleiman & Muslim Undertaker","category":"Death Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"xABo3FJufzg","title":"The Deeper Questions About Death, Graves and Barzakh | Omar Suleiman","category":"Afterlife Stories","startSeconds":0,"endSeconds":null,"format":"desktop"},
  {"videoId":"Dh8a8-UOEv0","title":"How Many Lives Do You Really Have? | The Other Side","category":"Muslim Vibes","startSeconds":0,"endSeconds":null,"format":"desktop"},
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
export const videoRegistry=seed.slice(0,100);
export function getRegistryVideos(format:"desktop"|"phone"){return videoRegistry.filter(v=>v.format===format)}
export const VIDEO_REGISTRY_CAPACITY=100;
