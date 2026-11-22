export type FeatureData={
 slug:string;title:string;description:string;label:string;headline:string;lead:string;
 summary:string;highlights:{title:string;body:string}[];
 questions:{question:string;answer:string}[];primary:{label:string;href:string};
 secondary:{label:string;href:string};related:string[];
};
export const featurePages:FeatureData[]=[
 {
  slug:"muslim-social-network",
  title:"Muslim Social Network | Posts, Messenger, Live Video & Notifications | 1Muslim",
  description:"1Muslim is Muslim social media built like a full social network: profiles, followers, short-video posts, messaging, notifications, live streams, Qur'an tracking, XP and HudHud AI.",
  label:"SOCIAL NETWORKING — NOT JUST A FORUM",
  headline:"A real Muslim social network. Not another message board.",
  lead:"1Muslim brings the familiar building blocks of Facebook and Myspace-style social profiles, TikTok-style short videos and Snapchat-style conversations into a Muslim-focused experience. People can express themselves through posts, follow others, connect in real time, learn Qur'an and grow their XP — without leaving the network.",
  summary:"A network is more than a collection of communities. 1Muslim is designed around member identity, personal profiles, social relationships, individual posts, notifications and direct interaction. Islamic learning is woven into that social foundation rather than sitting in a separate app.",
  highlights:[
   {title:"Personal profiles, followers and identity",body:"Members have individual profiles with avatars, bios, posts, videos, followers, following and XP. Discover Muslims and continue a relationship beyond a single discussion thread."},
   {title:"Create and share posts or videos",body:"Publish original text, photos and videos, share links, react, comment, save posts and discover clips in a scrolling social feed. Social posting and member discovery are core product experiences."},
   {title:"Messenger and group communication",body:"Direct messages, group conversations, voice notes and calling support everyday private conversations. Messaging lives inside 1Muslim, connected to member profiles."},
   {title:"Live broadcasting with audience interaction",body:"Hosts can go live and interact with viewers, messages and invited guests. Live sessions are part of the social network rather than an unrelated video directory."},
   {title:"Notifications that bring you back",body:"Followers, replies, saved-content activity and other platform interactions can trigger notifications, making individual relationships and activity easy to follow."},
   {title:"Qur'an progress and XP in your profile",body:"Read Qur'an, track your journey and participate in learning or other eligible platform activities that award XP. The network connects social identity with personal progress."},
   {title:"HudHud, a Muslim-themed AI companion",body:"HudHud helps users navigate and search 1Muslim through conversational AI. Free users have a short on-site conversational allowance and 1Muslim Unlocked users can continue beyond that free-turn limit."},
   {title:"Shahada-centered member admission",body:"Muslim membership includes sincere Shahada affirmation, with a voice-recognition path or a self-attested declaration. Guests can explore selected public areas first."}
  ],
  questions:[
   {question:"Is 1Muslim a social media platform or an online community?",answer:"1Muslim is a social networking platform. It includes the interactive capabilities associated with mainstream social media: individual profiles, following, feeds, original posts, comments, direct messaging, notifications, video and live interaction. The Muslim community is the audience and purpose, not a substitute for the social network itself."},
   {question:"Is 1Muslim like Facebook, TikTok and Snapchat?",answer:"Its features draw on recognizable interaction patterns: profile pages and following, vertical videos and creator feeds, and private messaging. 1Muslim is an independent Muslim-focused product and is not affiliated with those brands."},
   {question:"Does 1Muslim allow different types of posts?",answer:"Members can share a variety of text, images, videos, links and personal reflections subject to the platform's community and content rules. It is not limited to questions, sermons, prayer requests or discussions in predefined groups."},
   {question:"What makes the experience distinctive?",answer:"The combination of social profiles, a creator feed, messaging, live conversations, Qur'an progress, XP rewards, Shahada-centered onboarding and HudHud AI within one connected platform is central to 1Muslim's design. That is a concrete description of its experience, not a claim that no competing service shares any of these capabilities."}
  ],
  primary:{label:"Explore Ummah Posts",href:"/posts"},secondary:{label:"Meet Muslims",href:"/find"},
  related:["messenger-and-live","hudhud-ai","quran-progress-xp","shahada-membership"]
 },
 {
  slug:"messenger-and-live",
  title:"1Muslim Messenger, Group Chat, Video Calling & Live Streaming",
  description:"Chat, send messages, share posts, get notifications, call friends and go live with 1Muslim Messenger — communication built into a Muslim-first social media network.",
  label:"MESSAGES · CALLS · LIVE",
  headline:"Talk to your Ummah. Stay in the conversation.",
  lead:"The 1Muslim experience is designed for ongoing social connections, not one-off public discussions. People can find a member on the network, view their profile, message them, create group conversations, and join live sessions without switching platforms.",
  summary:"Messaging, notifications and livestreaming turn individual posts into lasting relationships. Public sharing and private conversation are connected to the same member identity.",
  highlights:[
   {title:"Messages between real profiles",body:"Open a private conversation from a 1Muslim member's profile and keep the same identity across your posts, follows and direct messages."},
   {title:"Group conversations",body:"Build conversations with several members through group messaging, giving the social network a place for smaller circles and projects."},
   {title:"Voice notes, media and reactions",body:"Go beyond plain text with voice messages, media sharing, message reactions and Muslim-themed expressions where supported."},
   {title:"Audio and video calling",body:"Stay connected through calling, with an emphasis on convenient in-platform access and fast controls."},
   {title:"Live video and audio",body:"Broadcast to viewers, respond to comments and host guests while your live identity remains part of 1Muslim."},
   {title:"Notifications and discovery",body:"Find conversations again through notifications, follower relationships and profile links rather than isolated anonymous rooms."}
  ],
  questions:[
   {question:"Does 1Muslim have its own messenger?",answer:"Yes. Messaging is integrated into the 1Muslim social-network experience, with direct and group conversations and calling capabilities."},
   {question:"Can people post and then message each other?",answer:"Yes. Social profiles, posts and conversations belong to the same network. A member can discover someone through content and continue through messaging."},
   {question:"Can members go live?",answer:"Yes. 1Muslim has live video and audio experiences with viewer participation. Availability can depend on browser, device, and live-room capabilities."}
  ],
  primary:{label:"Open Messages",href:"/messages"},secondary:{label:"Discover Live",href:"/streaming"},
  related:["muslim-social-network","hudhud-ai","shahada-membership"]
 },
 {
  slug:"hudhud-ai",
  title:"HudHud AI | Muslim-Themed AI Search Inside 1Muslim",
  description:"Meet HudHud, 1Muslim's Muslim-themed AI guide built into a real social network. Search videos, posts, people, Qur'an, lessons and media; free and 1Muslim Unlocked tiers.",
  label:"YOUR AI INSIDE YOUR SOCIAL NETWORK",
  headline:"HudHud isn't another search box. It's your AI inside 1Muslim.",
  lead:"HudHud is 1Muslim's named, Muslim-themed AI companion, designed to help people explore the social network, discover what members have shared and find educational resources. OpenAI technology powers its conversational responses while 1Muslim provides the experience and the searchable site context.",
  summary:"Unlike a generic external chatbot, HudHud belongs to the 1Muslim product. It can use relevant site search matches to guide people toward posts, videos, profiles, Qur'an verses, learning pages, prayer resources and more. It is intended as a discovery and learning companion, not a substitute for a scholar.",
  highlights:[
   {title:"AI available to actual members",body:"HudHud is surfaced from 1Muslim's own interface, not merely an AI tool used by the development team behind the scenes."},
   {title:"Conversational site search",body:"Ask a question in everyday language and receive relevant matches with destinations inside 1Muslim. Refine the search through follow-up conversation."},
   {title:"The Muslim context matters",body:"HudHud is built around Muslim community content and faith-related learning resources while distinguishing sourced Qur'an material from generated explanations."},
   {title:"Real product search, not invented answers",body:"HudHud's supported search workflow retrieves site matches and links to permitted content, rather than pretending it has found material that isn't there."},
   {title:"Free access",body:"The conversational search experience currently includes up to three free AI replies before the upgrade invitation."},
   {title:"1Muslim Unlocked",body:"Unlocked members can use the supported HudHud conversational search without the three-reply free quota. The backend is configured to prefer GPT-6 Sol where API access permits, and it can use a standard model fallback. Platform and provider safety or capacity limits still apply."}
  ],
  questions:[
   {question:"Does 1Muslim really use artificial intelligence?",answer:"Yes. HudHud's conversational search calls OpenAI APIs from the site's backend. The platform also has other AI-related tooling, but not every feature uses the same model."},
   {question:"Is HudHud a Muslim AI?",answer:"HudHud is a Muslim-themed assistant created as part of the 1Muslim experience. It helps users find content and navigate faith-related learning resources. It is not a religious authority or a human scholar."},
   {question:"Is GPT-6 available?",answer:"1Muslim Unlocked HudHud requests are configured to prefer GPT-6 Sol where the configured API account supports it. The system can fall back to a standard OpenAI model, so a particular model is not guaranteed for every answer."},
   {question:"Is HudHud unlimited?",answer:"The free tier has a three-reply conversational cap. Unlocked removes that specific cap in the supported search flow; technical capacity, abuse prevention and upstream API limits still apply."}
  ],
  primary:{label:"Ask HudHud",href:"/search"},secondary:{label:"Explore 1Muslim Unlocked",href:"/unlocked"},
  related:["muslim-social-network","quran-progress-xp","shahada-membership"]
 },
 {
  slug:"shahada-membership",
  title:"1Muslim Shahada Membership | Voice & Self-Attested Admission",
  description:"Learn how 1Muslim uses a Shahada-centered member onboarding process with optional voice recognition, private audio review and a sincere self-attested declaration alternative.",
  label:"MUSLIM-CENTERED MEMBERSHIP",
  headline:"A social network with Shahada at the beginning of the journey.",
  lead:"Membership on 1Muslim begins with a sincere Shahada-centered admission step. Instead of treating Muslim identity as a decorative theme, the platform makes affirmation part of the signup journey. People may choose a voice-recognition experience or a self-attested checkbox declaration.",
  summary:"The Shahada journey reflects 1Muslim's purpose: giving Muslims a social identity and a place to connect, create, learn and grow. It is a distinctive design choice within 1Muslim, not a claim that the platform can measure someone's faith.",
  highlights:[
   {title:"An actual membership step",body:"Shahada affirmation is presented as part of new-member onboarding, before the final admission and profile setup steps."},
   {title:"Optional voice recognition",body:"Members may record and review their Shahada in Arabic or English. Speech recognition checks a transcript for expected elements of the declaration."},
   {title:"Accessible self-attested alternative",body:"Members can also choose a checkbox affirming the Shahada. This option does not use independent voice verification or a microphone."},
   {title:"Privacy-conscious audio handling",body:"For the voice route, the onboarding flow prepares an audio clip for review and stores an uploaded clip in a private Shahada audio vault when the process completes."},
   {title:"Badge and profile identity",body:"The onboarding flow presents a Shahada badge that can appear on the member's profile after completion."},
   {title:"Explore before joining",body:"Visitors can explore selected public parts of 1Muslim before beginning the full member signup path."}
  ],
  questions:[
   {question:"Does 1Muslim require a Shahada declaration for membership?",answer:"The onboarding flow requires the member to complete the Shahada affirmation step. It offers a voice route and a self-attested checkbox route."},
   {question:"Does the microphone prove someone's faith?",answer:"No. Speech recognition can check for words in a recorded declaration; it cannot establish sincerity, religious beliefs or a person's spiritual condition. The checkbox route is explicitly self-attested."},
   {question:"Is this the only Muslim network with a Shahada step?",answer:"The design is distinctive to 1Muslim, but we have not established that no other service worldwide uses a similar process. The verifiable point is what 1Muslim actually asks its members to complete."}
  ],
  primary:{label:"Start the 1Muslim journey",href:"/onboarding"},secondary:{label:"Explore the network",href:"/platform"},
  related:["muslim-social-network","hudhud-ai","quran-progress-xp"]
 },
 {
  slug:"quran-progress-xp",
  title:"Qur'an Progress Tracker & XP Rewards | 1Muslim Social Network",
  description:"Track Qur'an verses and reading progress, study Arabic and Salah, and collect XP within your 1Muslim profile — learning tools connected to a Muslim social network.",
  label:"QUR'AN LEARNING · XP · PROGRESS",
  headline:"Your learning journey belongs to your profile, too.",
  lead:"1Muslim connects the Qur'an reading experience to individual member profiles through saved verse progress, analytics and XP rewards for eligible participation. People can read, listen, learn Arabic, practice Salah and see their journey develop alongside their social connections.",
  summary:"The Qur'an tools are not just separate utility pages. The broader 1Muslim experience ties study, profiles and activity tracking together so members can return to their last verse and follow their progress.",
  highlights:[
   {title:"Continue from your last verse",body:"The Qur'an reader can retain reading position so members can continue the journey rather than start over every time."},
   {title:"Track unique verses",body:"Reading progress analytics can count completed verses, build a completion graph and track progress across devices for signed-in members."},
   {title:"Arabic and English reading",body:"The reader supports Qur'an text and translation views and listening tools to help people understand and revisit verses."},
   {title:"Learn Arabic and Salah",body:"Interactive letter lessons and illustrated Salah guidance sit next to the reader within the same 1Muslim network."},
   {title:"XP, levels and rewards",body:"The member profile records XP and levels. Supported learning and community activities can award points, helping members visualize participation and goals."},
   {title:"Progress is personal",body:"XP is an in-app participation mechanism, not a measurement of piety or a claim about Allah's reward."}
  ],
  questions:[
   {question:"Does 1Muslim track Qur'an reading progress?",answer:"Yes. Signed-in members have saved progress and analytics for their Qur'an reading journey, including verse-based tracking."},
   {question:"What are 1Muslim XP points?",answer:"XP is a platform participation and learning-reward system with a member balance and levels. It is not a substitute for faith, worship or spiritual reward."},
   {question:"Can you learn Salah and Arabic on the same site?",answer:"Yes. 1Muslim includes Arabic alphabet lessons, Qur'an reading tools and illustrated Salah instruction, alongside its social feed and messaging."}
  ],
  primary:{label:"Open Qur'an Studio",href:"/elm-tent/quran"},secondary:{label:"Learn Salah",href:"/widget-tools/prayer/learn"},
  related:["muslim-social-network","hudhud-ai","shahada-membership"]
 }
];
export const featureBySlug=Object.fromEntries(featurePages.map(page=>[page.slug,page])) as Record<string,FeatureData|undefined>;
