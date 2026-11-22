export type SalahStage = "stand" | "bow" | "rise" | "prostrate" | "sit";
export type SalahStep = {
 id:string; title:string; term:string; stage:SalahStage; arabic:string; transliteration:string;
 meaning:string; instructions:string; repeat?:string; source?:string; note?:string;
};
// These are common Sunni prayer recitations. Some details differ by madhhab.
// Keep the Arabic, transliteration and translation visible together for learners.
export const SALAH_STEPS:SalahStep[]=[
 {id:"takbir",title:"Opening takbir",term:"Takbīrat al-Iḥrām",stage:"stand",
  arabic:"اللَّهُ أَكْبَرُ",transliteration:"Allāhu akbar",meaning:"Allah is the Greatest.",
  instructions:"Face the Qiblah, form your intention in your heart, raise your hands and say the opening takbir. Stand calmly.",
  source:"https://sunnah.com/bukhari:757"},
 {id:"qiyam",title:"Standing — Al-Fātiḥah",term:"Qiyām / Qirāʾah",stage:"stand",
  arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۞ الرَّحْمَٰنِ الرَّحِيمِ ۞ مَالِكِ يَوْمِ الدِّينِ ۞ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۞ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۞ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  transliteration:"Bismillāhir-raḥmānir-raḥīm. Al-ḥamdu lillāhi rabbil-ʿālamīn. Ar-raḥmānir-raḥīm. Māliki yawmid-dīn. Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdinaṣ-ṣirāṭal-mustaqīm. Ṣirāṭal-ladhīna anʿamta ʿalayhim ghayril-maghḍūbi ʿalayhim wa laḍ-ḍāllīn.",
  meaning:"In Allah's name, the Most Merciful, the Especially Merciful. All praise is for Allah, Lord of all worlds, the Most Merciful, Master of Judgment Day. You alone we worship; You alone we ask for help. Guide us to the straight path: the path of those You have blessed, not those who have incurred anger or gone astray.",
  instructions:"Recite Sūrat al-Fātiḥah while standing in each rakʿah. Say Āmīn after it. Learn this recitation first.",
  source:"https://quran.com/1"},
 {id:"surah",title:"An additional sūrah",term:"Qirāʾah",stage:"stand",
  arabic:"قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
  transliteration:"Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakul-lahū kufuwan aḥad.",
  meaning:"Say: He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born. And none is comparable to Him.",
  instructions:"As a beginner, learn a short sūrah such as Al-Ikhlāṣ. In the first two rakʿahs, recite it after Al-Fātiḥah. This is an example, not the only allowable sūrah.",
  source:"https://quran.com/112"},
 {id:"ruku",title:"Bow",term:"Rukūʿ",stage:"bow",
  arabic:"سُبْحَانَ رَبِّيَ الْعَظِيمِ",transliteration:"Subḥāna rabbiyal-ʿaẓīm",
  meaning:"Glory be to my Lord, the Magnificent.",
  instructions:"Say Allāhu akbar and bow with hands on knees and back steady. Glorify Allah in this position.",
  repeat:"Commonly recited three times.",source:"https://sunnah.com/muslim:772"},
 {id:"rise",title:"Rise from bowing",term:"Iʿtidāl",stage:"rise",
  arabic:"سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۞ رَبَّنَا وَلَكَ الْحَمْدُ",
  transliteration:"Samiʿallāhu liman ḥamidah. Rabbanā wa lakal-ḥamd.",
  meaning:"Allah hears whoever praises Him. Our Lord, to You belongs all praise.",
  instructions:"Rise fully upright after rukūʿ. These phrases are used according to one's role as imam, follower or praying alone.",
  source:"https://sunnah.com/bukhari:789"},
 {id:"sujud",title:"First prostration",term:"Sujūd",stage:"prostrate",
  arabic:"سُبْحَانَ رَبِّيَ الْأَعْلَى",transliteration:"Subḥāna rabbiyal-aʿlā",
  meaning:"Glory be to my Lord, the Most High.",
  instructions:"Say Allāhu akbar and prostrate with forehead, nose, palms, knees and toes touching the ground. Be still.",
  repeat:"Commonly recited three times.",source:"https://sunnah.com/muslim:772"},
 {id:"jalsah",title:"Sit between prostrations",term:"Jalsah",stage:"sit",
  arabic:"رَبِّ اغْفِرْ لِي",transliteration:"Rabbighfir lī",meaning:"My Lord, forgive me.",
  instructions:"Say Allāhu akbar, sit calmly after the first sujūd and ask Allah for forgiveness.",
  source:"https://sunnah.com/ibnmajah:897"},
 {id:"sujud2",title:"Second prostration",term:"Sujūd",stage:"prostrate",
  arabic:"سُبْحَانَ رَبِّيَ الْأَعْلَى",transliteration:"Subḥāna rabbiyal-aʿlā",
  meaning:"Glory be to my Lord, the Most High.",
  instructions:"Say Allāhu akbar and prostrate a second time. This completes one rakʿah. Rise to begin the next rakʿah, or sit for tashahhud when due.",
  repeat:"Commonly recited three times.",source:"https://sunnah.com/muslim:772"},
 {id:"tashahhud",title:"Sitting testimony",term:"Tashahhud",stage:"sit",
  arabic:"التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
  transliteration:"At-taḥiyyātu lillāhi waṣ-ṣalawātu waṭ-ṭayyibāt. As-salāmu ʿalayka ayyuhan-nabiyyu wa raḥmatullāhi wa barakātuh. As-salāmu ʿalaynā wa ʿalā ʿibādillāhiṣ-ṣāliḥīn. Ashhadu al-lā ilāha illallāh, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.",
  meaning:"All greetings, prayers and good words belong to Allah. Peace, mercy and blessings be upon you, O Prophet. Peace upon us and Allah's righteous servants. I bear witness that none has the right to be worshipped but Allah, and Muhammad is His servant and Messenger.",
  instructions:"Sit after the second rakʿah and recite the Tashahhud. In prayers of three or four rakʿahs, stand again after this sitting; in the final sitting continue with ṣalawāt.",
  source:"https://sunnah.com/bukhari:831"},
 {id:"salawat",title:"Send blessings",term:"Aṣ-Ṣalāt al-Ibrāhīmiyyah",stage:"sit",
  arabic:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  transliteration:"Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdun majīd. Allāhumma bārik ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā bārakta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdun majīd.",
  meaning:"O Allah, send Your blessings upon Muhammad and the family of Muhammad as You blessed Abraham and his family; You are Praiseworthy, Glorious. O Allah, bestow blessing upon Muhammad and his family as You blessed Abraham and his family; You are Praiseworthy, Glorious.",
  instructions:"In the last sitting, send blessings upon the Prophet ﷺ before finishing the prayer.",
  source:"https://sunnah.com/bukhari:3370"},
 {id:"salam",title:"Complete the prayer",term:"Taslīm",stage:"sit",
  arabic:"السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",transliteration:"As-salāmu ʿalaykum wa raḥmatullāh",
  meaning:"Peace and the mercy of Allah be upon you.",
  instructions:"Turn your head to your right and say the taslīm, then to your left. The prayer is complete.",
  source:"https://sunnah.com/muslim:582"}
];
export const DAILY_RAKAH=[
 {name:"Fajr",arabic:"الفجر",count:2,icon:"☾"},
 {name:"Dhuhr",arabic:"الظهر",count:4,icon:"☼"},
 {name:"Asr",arabic:"العصر",count:4,icon:"✺"},
 {name:"Maghrib",arabic:"المغرب",count:3,icon:"◒"},
 {name:"Isha",arabic:"العشاء",count:4,icon:"☽"}
] as const;
export const STORY_CHAPTERS=[
 {title:"The Night Journey",subtitle:"Al-Isrāʾ",body:"Allah describes taking His servant by night from al-Masjid al-Ḥarām to al-Masjid al-Aqṣā. The journey is mentioned in Qurʾān 17:1.",source:"https://quran.com/17/1",label:"Qurʾān 17:1",icon:"☾"},
 {title:"The Ascension",subtitle:"Al-Miʿrāj",body:"In the authentic reports, Prophet Muhammad ﷺ ascended through the heavens, meeting earlier prophets. The details come from the Sunnah.",source:"https://sunnah.com/bukhari:349",label:"Ṣaḥīḥ al-Bukhārī 349",icon:"✧"},
 {title:"The Command of Ṣalāh",subtitle:"An act of worship",body:"During the Miʿrāj, the daily prayers were prescribed. Worship and remembrance remain central to the believer's life.",source:"https://sunnah.com/bukhari:349",label:"Ṣaḥīḥ al-Bukhārī 349",icon:"❀"},
 {title:"From Fifty to Five",subtitle:"Five with the reward of fifty",body:"The Prophet ﷺ sought a reduction after speaking with Mūsā. The obligation became five daily prayers, with the reward described as fifty.",source:"https://sunnah.com/bukhari:349",label:"Ṣaḥīḥ al-Bukhārī 349",icon:"50 → 5"},
 {title:"Our Daily Connection",subtitle:"A lasting gift",body:"Fajr, Dhuhr, Asr, Maghrib and Isha anchor the day in remembrance. The Qurʾān calls believers to establish prayer for Allah's remembrance.",source:"https://quran.com/20/14",label:"Qurʾān 20:14",icon:"◉"}
] as const;
