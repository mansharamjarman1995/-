const initialSongs = [
  {id:"demo1",title:"जिंदगी एक सफर है सुहाना",artist:"Kishore Kumar",movie:"Andaz (1971)",duration:"4:38",category:["travel","evergreen"],youtube:"https://www.youtube.com/watch?v=example"},
  {id:"demo2",title:"है रे बिना जिंदगी से",artist:"Lata Mangeshkar",movie:"Aandhi (1975)",duration:"5:12",category:["sad","evergreen"],youtube:"https://www.youtube.com/watch?v=example"},
  {id:"demo3",title:"ये रात ये चांदनी",artist:"Mohammed Rafi",movie:"Jab Jab Phool Khile (1965)",duration:"4:50",category:["night","romantic"],youtube:"https://www.youtube.com/watch?v=example"},
  {id:"demo4",title:"लग जा गले",artist:"Lata Mangeshkar",movie:"Woh Kaun Thi (1964)",duration:"5:28",category:["romantic","evergreen"],youtube:"https://www.youtube.com/watch?v=example"},
  {id:"demo5",title:"मेरे सपनों की रानी",artist:"Kishore Kumar",movie:"Aradhana (1969)",duration:"4:42",category:["romantic","travel"],youtube:"https://www.youtube.com/watch?v=example"}
];

let savedSongs = JSON.parse(localStorage.getItem("safarnamaSongs") || "[]");
let songs = [...initialSongs, ...savedSongs];
let favorites = new Set(JSON.parse(localStorage.getItem("safarnamaFavorites") || "[]"));
let playlists = JSON.parse(localStorage.getItem("safarnamaPlaylists") || '[{"name":"रात का सफ़र","songIds":[]},{"name":"मेरे पसंदीदा पुराने गीत","songIds":[]}]');
let currentIndex = -1, currentSong = null, player = null, isReady = false, timer = null, shuffle = false, repeat = false;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._x); t._x=setTimeout(()=>t.classList.remove("show"),2200); }
function save(){ localStorage.setItem("safarnamaSongs",JSON.stringify(savedSongs)); localStorage.setItem("safarnamaFavorites",JSON.stringify([...favorites])); localStorage.setItem("safarnamaPlaylists",JSON.stringify(playlists)); }
function safeText(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function videoId(url){
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0];
    if(u.hostname.includes("youtube.com")){
      if(u.searchParams.get("v")) return u.searchParams.get("v");
      const p=u.pathname.split("/");
      const i=p.indexOf("embed");
      if(i>=0) return p[i+1];
      const s=p.indexOf("shorts");
      if(s>=0) return p[s+1];
    }
  }catch(e){}
  return null;
}
function renderSongs(list=songs){
  const box=$("#songList");
  if(!list.length){box.innerHTML="";$("#emptyState").classList.remove("hidden");return}
  $("#emptyState").classList.add("hidden");
  box.innerHTML=list.map((s,i)=>`
    <div class="song">
      <div class="art">🎵</div>
      <button class="play" data-play="${safeText(s.id)}">▶</button>
      <div><span class="title">${safeText(s.title)}</span><span class="sub">${safeText(s.movie||"YouTube")} • ${safeText(s.artist||"Unknown")}</span></div>
      <div class="artist-col sub">${safeText(s.artist||"—")}</div>
      <div class="duration sub">${safeText(s.duration||"—")}</div>
      <button class="icon-btn ${favorites.has(s.id)?"active":""}" data-fav="${safeText(s.id)}">${favorites.has(s.id)?"♥":"♡"}</button>
      <button class="icon-btn" data-more="${safeText(s.id)}">⋮</button>
    </div>`).join("");
  box.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>playById(b.dataset.play));
  box.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>toggleFav(b.dataset.fav));
  box.querySelectorAll("[data-more]").forEach(b=>b.onclick=()=>songMenu(b.dataset.more));
}
function renderTop(){
 const names=["ये शाम मस्तानी","लग जा गले","चुरा लिया है तुमने","तुम इतना जो मुस्कुरा रहे हो","मेरे रंग में रंगने वाली","कभी कभी मेरे दिल में","अजीब दास्तां है ये","जिंदगी एक सफर","दिल ढूंढता है","हम से शहर में"];
 $("#topList").innerHTML=names.map((n,i)=>`<div class="top-row"><b>${i+1}</b><span>🎙️</span><span>${n}<small class="sub">${["Kishore Kumar","Lata Mangeshkar","Asha & Rafi","Jagjit Singh"][i%4]}</small></span></div>`).join("");
}
function renderPlaylists(){
 $("#customPlaylists").innerHTML=playlists.map((p,i)=>`<div class="custom-playlist"><b>📂 ${safeText(p.name)}</b><small>${p.songIds.length} songs</small><div style="margin-top:9px"><button class="link-btn" data-pl="${i}">Open</button></div></div>`).join("");
 $$("#customPlaylists [data-pl]").forEach(b=>b.onclick=()=>openPlaylist(+b.dataset.pl));
}
function toggleFav(id){favorites.has(id)?favorites.delete(id):favorites.add(id);save();renderSongs(currentFiltered); if(currentSong?.id===id)$("#playerFav").textContent=favorites.has(id)?"♥":"♡";toast(favorites.has(id)?"Favorite में जोड़ा गया":"Favorite से हटाया गया")}
function songMenu(id){
 const s=songs.find(x=>x.id===id); if(!s)return;
 const answer=prompt(`"${s.title}" को किस playlist में जोड़ना है?\n\n${playlists.map((p,i)=>`${i+1}. ${p.name}`).join("\n")}\n\nनंबर लिखें:`);
 const n=parseInt(answer,10)-1;
 if(n>=0&&n<playlists.length){if(!playlists[n].songIds.includes(id))playlists[n].songIds.push(id);save();renderPlaylists();toast("Playlist में जोड़ दिया गया");}
}
function openPlaylist(i){const ids=playlists[i].songIds; currentFiltered=songs.filter(s=>ids.includes(s.id)); renderSongs(currentFiltered); document.querySelector(".songs-section").scrollIntoView({behavior:"smooth"}); toast(`${playlists[i].name} खुल गई`)}
function playById(id){const i=songs.findIndex(s=>s.id===id);if(i<0)return;currentIndex=i;currentSong=songs[i];updatePlayerInfo();const vid=videoId(currentSong.youtube);if(!vid){toast("इस demo song के लिए YouTube URL जोड़ें");return}loadVideo(vid)}
function updatePlayerInfo(){if(!currentSong)return;$("#playerTitle").textContent=currentSong.title;$("#playerMeta").textContent=`${currentSong.artist||"Unknown"} • ${currentSong.movie||"YouTube"}`;$("#playerFav").textContent=favorites.has(currentSong.id)?"♥":"♡"}
function loadVideo(vid){
 if(!player && window.YT && YT.Player){player=new YT.Player("youtubePlayer",{height:"1",width:"1",videoId:vid,playerVars:{playsinline:1,controls:0,rel:0},events:{onReady:e=>{isReady=true;e.target.playVideo();startTimer()},onStateChange:e=>{if(e.data===YT.PlayerState.ENDED) nextSong()}}})}
 else if(player){player.loadVideoById(vid);player.playVideo();startTimer()}
 else {window.pendingVideo=vid;toast("YouTube player तैयार हो रहा है...")}
}
window.onYouTubeIframeAPIReady=()=>{if(window.pendingVideo)loadVideo(window.pendingVideo)}
function startTimer(){clearInterval(timer);timer=setInterval(()=>{if(!player||!isReady)return;const d=player.getDuration()||0,t=player.getCurrentTime()||0;$("#currentTime").textContent=time(t);$("#duration").textContent=time(d);$("#progress").value=d?(t/d)*100:0},500)}
function time(s){s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
function nextSong(){if(!songs.length)return;let n;if(shuffle)n=Math.floor(Math.random()*songs.length);else n=(currentIndex+1)%songs.length;if(repeat&&currentIndex>=0)n=currentIndex;playById(songs[n].id)}
function prevSong(){if(!songs.length)return;let n=(currentIndex-1+songs.length)%songs.length;playById(songs[n].id)}
let currentFiltered=songs;
function applyFilter(filter){
 if(filter==="all")currentFiltered=songs;
 else if(filter==="favorites")currentFiltered=songs.filter(s=>favorites.has(s.id));
 else currentFiltered=songs.filter(s=>(s.category||[]).includes(filter));
 renderSongs(currentFiltered);
 document.querySelector(".songs-section").scrollIntoView({behavior:"smooth"});
}
function search(){
 const q=$("#searchInput").value.trim().toLowerCase();
 currentFiltered=!q?songs:songs.filter(s=>`${s.title} ${s.artist} ${s.movie}`.toLowerCase().includes(q));
 renderSongs(currentFiltered);
 document.querySelector(".songs-section").scrollIntoView({behavior:"smooth"});
}
function openModal(id){$(id).classList.remove("hidden")}
function closeModal(id){$(id).classList.add("hidden")}
function addYoutube(){
 const url=$("#ytUrl").value.trim(), id=videoId(url);
 if(!id){toast("सही YouTube URL डालें");return}
 const title=$("#ytTitle").value.trim()||"YouTube Old Song";
 const artist=$("#ytArtist").value.trim()||"YouTube";
 const s={id:"yt_"+Date.now(),title,artist,movie:"YouTube",duration:"—",category:["evergreen"],youtube:url,videoId:id};
 savedSongs.push(s);songs=[...initialSongs,...savedSongs];save();renderSongs();closeModal("#youtubeModal");$("#ytUrl").value="";$("#ytTitle").value="";$("#ytArtist").value="";toast("YouTube song जोड़ दिया गया 🎵");playById(s.id);
}
function createPlaylist(){
 const name=$("#playlistName").value.trim();if(!name){toast("Playlist का नाम लिखें");return}
 playlists.push({name,songIds:[]});save();renderPlaylists();closeModal("#playlistModal");$("#playlistName").value="";toast("नई playlist बन गई 📂");
}
function setSection(section){
 $$(".topnav button,.sidebar button").forEach(b=>b.classList.remove("nav-active","side-active"));
 $$(`[data-section="${section}"]`).forEach(b=>b.classList.add(b.closest(".topnav")?"nav-active":"side-active"));
 if(section==="favorites")applyFilter("favorites");
 else if(section==="trending"){$("#trendingSection").scrollIntoView({behavior:"smooth"})}
 else if(section==="playlists"){$("#customPlaylists").parentElement.scrollIntoView({behavior:"smooth"})}
 else if(section==="artists")$("#artistsSection").scrollIntoView({behavior:"smooth"});
 else if(section==="decades")$("#decadesSection").scrollIntoView({behavior:"smooth"});
 else if(section==="about")$("#aboutSection").scrollIntoView({behavior:"smooth"});
 else if(section==="recent"){$("#songsSection").scrollIntoView({behavior:"smooth"});toast("Recently Played: इस version में local history नहीं जोड़ी गई है");}
 else window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
 const sec=e.target.closest("[data-section]"); if(sec)setSection(sec.dataset.section);
 const f=e.target.closest("[data-filter]"); if(f)applyFilter(f.dataset.filter);
});
$("#searchBtn").onclick=search;$("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search()});
$("#addYoutubeBtn").onclick=()=>openModal("#youtubeModal");$("#addYoutubeHero").onclick=()=>openModal("#youtubeModal");
$("#closeModal").onclick=()=>closeModal("#youtubeModal");$("#cancelAdd").onclick=()=>closeModal("#youtubeModal");$("#saveYoutube").onclick=addYoutube;
$("#newPlaylistBtn").onclick=()=>openModal("#playlistModal");$("#closePlaylistModal").onclick=()=>closeModal("#playlistModal");$("#cancelPlaylist").onclick=()=>closeModal("#playlistModal");$("#savePlaylist").onclick=createPlaylist;
$("#playerFav").onclick=()=>currentSong&&toggleFav(currentSong.id);
$("#playBtn").onclick=()=>{if(!player){if(currentSong)playById(currentSong.id);else playById(songs[0].id);return}const st=player.getPlayerState();if(st===YT.PlayerState.PLAYING){player.pauseVideo();$("#playBtn").textContent="▶"}else{player.playVideo();$("#playBtn").textContent="Ⅱ"}};
$("#nextBtn").onclick=nextSong;$("#prevBtn").onclick=prevSong;$("#shuffleBtn").onclick=()=>{shuffle=!shuffle;$("#shuffleBtn").style.color=shuffle?"#f3cf70":""};$("#repeatBtn").onclick=()=>{repeat=!repeat;$("#repeatBtn").style.color=repeat?"#f3cf70":""};
$("#muteBtn").onclick=()=>{if(!player)return;player.isMuted()?player.unMute():player.mute();$("#muteBtn").textContent=player.isMuted()?"🔇":"🔊"};
$("#progress").oninput=e=>{if(player&&player.getDuration())player.seekTo((+e.target.value/100)*player.getDuration(),true)};
$("#radioBtn").onclick=()=>{toast("Radio mode: आपकी current library से songs चलाए जाएंगे");playById(songs[Math.floor(Math.random()*songs.length)].id)};
$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
renderSongs();renderTop();renderPlaylists();
