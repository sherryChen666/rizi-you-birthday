const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const notes = {
  suit: { index: '01 / 工作装', title: '四季通用的西装', text: '衣柜里那套熟悉的西装，总是收拾得妥妥帖帖。看着它，就知道某位先生又准备认真出门了。' },
  shoes: { index: '06 / 出门之前', title: '那双皮鞋', text: '皮鞋擦得亮亮的，和西装刚好是一套。穿上它们，某位先生的专业模式就上线了。' },
  clock: { index: '02 / 到家时间', title: '熟悉的节奏', text: '早上六点出门，傍晚六点半左右回来。听到门响，就知道是你到了。' },
  bag: { index: '03 / 顺手带回', title: '袋子里的小惊喜', text: '生活里许多值得高兴的事，其实都不大。能被记住，就已经很好。' },
  pot: { index: '04 / 一日三餐', title: '烟火气', text: '再普通不过的一顿饭，因为是和你一起吃，就有了特别的味道。' },
  folder: { index: '05 / 文件袋', title: '总能想出办法', text: '遇到事情，你总会先想清楚，再一步一步处理。复杂的事，也能稳稳当当地解决。' }
};
const manualPages = [
  ['运行时间', '每天 6:00 启动，<br>18:30 左右返回。<br>工作装四季通用，运行稳定。'],
  ['厨房模块', '支持买菜、做饭。<br>妻子不想下厨时，<br>自动接管厨房。'],
  ['问题处理', '遇事冷静。<br>先分析问题，<br>再执行解决方案。'],
  ['谈判能力', '擅长谈判。<br>复杂情况也能<br>耐心处理。'],
  ['特别设置', '对妻子拥有较高容错率。<br>建议长期保留此功能。'],
  ['版本履历', '2001 正式上线。<br>2022 解锁丈夫身份，<br>2024 升级爸爸身份。<br>2026 更新至 25.0。']
];
let currentPage = 0;
let audioContext=window.__birthdayAudioContext;
let soundOn=true;
let musicStarted=false;
let musicGain;
let musicLoading=null;
async function startMusic(){
  if(musicStarted||musicLoading)return musicLoading;
  musicLoading=(async()=>{try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    audioContext.resume().catch(()=>{});
    const response=await fetch('./music.bin',{cache:'no-store'});if(!response.ok)throw Error('music unavailable');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},window.__birthdayKey,bytes.slice(12));
    const decoded=await audioContext.decodeAudioData(plain);
    musicGain=audioContext.createGain();musicGain.gain.value=soundOn?.31:0;musicGain.connect(audioContext.destination);
    const source=audioContext.createBufferSource();source.buffer=decoded;source.loop=true;source.connect(musicGain);source.start();
    musicStarted=true;
  }catch{soundOn=false;updateSoundButton()}finally{musicLoading=null}})();
  return musicLoading;
}
function updateSoundButton(){const button=$('#soundBtn');button.setAttribute('aria-pressed',String(soundOn));button.setAttribute('aria-label',soundOn?'关闭背景音乐':'开启背景音乐');button.title=soundOn?'关闭背景音乐':'开启背景音乐'}
function chime(){}
function goTo(id){document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#chapterMenu').hidden=true;$('#menuBtn').setAttribute('aria-expanded','false');chime()}
$$('[data-target]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.target)));
$('#homeBtn').addEventListener('click',()=>goTo('opening'));
$('#menuBtn').addEventListener('click',()=>{const menu=$('#chapterMenu');menu.hidden=!menu.hidden;$('#menuBtn').setAttribute('aria-expanded',String(!menu.hidden))});
$('#soundBtn').addEventListener('click',()=>{soundOn=!soundOn;updateSoundButton();if(soundOn){startMusic();audioContext?.resume().catch(()=>{});musicGain?.gain.setTargetAtTime(.31,audioContext.currentTime,.15)}else if(musicGain)musicGain.gain.setTargetAtTime(0,audioContext.currentTime,.12)});
startMusic();
$$('.room-object').forEach(b=>b.addEventListener('click',()=>{const note=notes[b.dataset.note];$('#noteIndex').textContent=note.index;$('#noteTitle').textContent=note.title;$('#noteText').textContent=note.text;$('#noteCard').hidden=false;chime()}));
$('#closeNote').addEventListener('click',()=>$('#noteCard').hidden=true);
function showManual(page){currentPage=(page+manualPages.length)%manualPages.length;const card=$('#manualCard');card.classList.add('flip');setTimeout(()=>{const [label,body]=manualPages[currentPage];$('#manualLabel').textContent=label;$('#manualText').innerHTML=body;$('#manualText').classList.toggle('compact',currentPage===0||currentPage===5);$('#manualPageNumber').textContent=String(currentPage+1).padStart(2,'0')+' / '+String(manualPages.length).padStart(2,'0');$$('.manual-dots button').forEach((b,i)=>b.classList.toggle('active',i===currentPage));card.classList.remove('flip')},180);chime()}
$('#manualCard').addEventListener('click',()=>showManual(currentPage+1));$('#manualCard').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showManual(currentPage+1)}});$$('.manual-dots button').forEach(b=>b.addEventListener('click',()=>showManual(Number(b.dataset.page))));
$('#envelope').addEventListener('click',()=>{const open=$('#letterPaper').hidden;$('#letterPaper').hidden=!open;$('#envelope').classList.toggle('open',open);$('#envelope').setAttribute('aria-expanded',String(open));$('#letterPrompt').textContent=open?'继续往下，还有一件小事。':'轻触信封，拆开今天的祝福';$('#cakeMoment').hidden=!open;if(open){setTimeout(()=>$('#letterPaper').scrollIntoView({behavior:'smooth',block:'center'}),350);chime()}});
let micStream=null,micContext=null,micFrame=0,micTimer=0;
function stopMic(){cancelAnimationFrame(micFrame);clearTimeout(micTimer);micStream?.getTracks().forEach(track=>track.stop());micStream=null;micContext?.close().catch(()=>{});micContext=null}
function blowOut(){if($('#cakeMoment').classList.contains('blown'))return;stopMic();$('#cakeMoment').classList.add('blown');$('#cakeHint').textContent='愿望已经收到。生日快乐。';$('#candle').setAttribute('aria-label','蜡烛已经吹灭');chime()}
$('#candle').addEventListener('click',blowOut);
$('#blowButton').addEventListener('click',async()=>{if($('#cakeMoment').classList.contains('blown'))return;if(!navigator.mediaDevices?.getUserMedia){$('#cakeHint').textContent='可以轻触烛火吹灭蜡烛。';return}try{stopMic();micStream=await navigator.mediaDevices.getUserMedia({audio:true});micContext=new (window.AudioContext||window.webkitAudioContext)();const source=micContext.createMediaStreamSource(micStream);const analyser=micContext.createAnalyser();analyser.fftSize=1024;source.connect(analyser);const samples=new Uint8Array(analyser.fftSize);let strongFrames=0;$('#cakeHint').textContent='对着手机麦克风吹一口气…';const detect=()=>{if(!micStream)return;analyser.getByteTimeDomainData(samples);let sum=0;for(const value of samples){const n=(value-128)/128;sum+=n*n}const level=Math.sqrt(sum/samples.length);strongFrames=level>.075?strongFrames+1:Math.max(0,strongFrames-1);if(strongFrames>=5){blowOut();return}micFrame=requestAnimationFrame(detect)};detect();micTimer=setTimeout(()=>{stopMic();$('#cakeHint').textContent='也可以轻触烛火。'},12000)}catch{stopMic();$('#cakeHint').textContent='没有麦克风权限，可以轻触烛火。'}});
const updateProgress=()=>{const doc=document.documentElement;$('#progressBar').style.width=(100*doc.scrollTop/(doc.scrollHeight-doc.clientHeight))+'%'};document.addEventListener('scroll',updateProgress,{passive:true});updateProgress();
const memoryPlayer=$('#memoryPlayer');
const memoryStack=$('.photo-stack');
const memoryImage=$('#memoryImage');
let memoryItems=[],memoryIndex=0,memoryTimer=null,memoryBusy=false;
const memoryCache=new Map();
async function decryptedPhoto(index){if(memoryCache.has(index))return memoryCache.get(index);const promise=(async()=>{const item=memoryItems[index];const response=await fetch('./media/'+item.file+'?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('照片暂时无法读取');const bytes=new Uint8Array(await response.arrayBuffer());const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},window.__birthdayKey,bytes.slice(12));return URL.createObjectURL(new Blob([plain],{type:item.type}))})();memoryCache.set(index,promise);return promise}
async function showMemory(index){if(memoryBusy||!memoryItems.length)return;memoryBusy=true;try{memoryIndex=(index+memoryItems.length)%memoryItems.length;const url=await decryptedPhoto(memoryIndex);memoryImage.classList.add('changing');await new Promise(resolve=>setTimeout(resolve,220));memoryImage.src=url;$('#memoryCount').textContent=String(memoryIndex+1).padStart(2,'0')+' / '+String(memoryItems.length).padStart(2,'0');memoryImage.classList.remove('changing');decryptedPhoto((memoryIndex+1)%memoryItems.length).catch(()=>{});}catch{memoryImage.classList.remove('changing')}finally{memoryBusy=false}}
async function loadMemories(){try{const response=await fetch('./media/manifest.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)return;const manifest=await response.json();if(!Array.isArray(manifest.items)||!manifest.items.length)return;memoryItems=manifest.items;memoryStack.hidden=true;memoryPlayer.hidden=false;await showMemory(0);memoryTimer=setInterval(()=>showMemory(memoryIndex+1),4800)}catch{}}
$('#memoryPrev').addEventListener('click',()=>showMemory(memoryIndex-1));
$('#memoryNext').addEventListener('click',()=>showMemory(memoryIndex+1));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&memoryTimer){clearInterval(memoryTimer);memoryTimer=null}else if(!document.hidden&&memoryItems.length&&!memoryTimer){memoryTimer=setInterval(()=>showMemory(memoryIndex+1),4800)}});
loadMemories();
