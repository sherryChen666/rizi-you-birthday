import {readdir,readFile,writeFile,rename,mkdir,rm,stat} from 'node:fs/promises';
import {createHash,createCipheriv,randomBytes} from 'node:crypto';
import {join,extname,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const inbox=resolve(process.argv[2]||join(root,'photos'));
const privateDir=join(root,'private');
const media=join(root,'build','media');
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const key=await readFile(join(privateDir,'key.bin'));
if(key.length!==32)throw new Error('Invalid encryption key');
await mkdir(media,{recursive:true});
async function collect(dir,relative='',depth=0){
  const found=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const name=relative?`${relative}/${entry.name}`:entry.name;
    if(entry.isDirectory()&&depth<4)found.push(...await collect(join(dir,entry.name),name,depth+1));
    else if(entry.isFile()&&types[extname(entry.name).toLowerCase()])found.push({name,path:join(dir,entry.name)});
  }
  return found;
}
const entries=(await collect(inbox)).sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')).slice(0,30);
const files=[];
for(const entry of entries){
  const path=entry.path,info=await stat(path);
  if(info.size>20*1024*1024||info.size===0)continue;
  const bytes=await readFile(path);
  files.push({name:entry.name,type:types[extname(entry.name).toLowerCase()],bytes});
}
const fingerprint=createHash('sha256');
for(const file of files){fingerprint.update(file.name);fingerprint.update(file.bytes)}
const hash=fingerprint.digest('hex');
try{if((await readFile(join(privateDir,'state.txt'),'utf8')).trim()===hash)process.exit(0)}catch{}
const items=[];
for(let i=0;i<files.length;i++){
  const file=files[i],iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([iv,cipher.update(file.bytes),cipher.final(),cipher.getAuthTag()]);
  const name=`${i+1}.bin`,tmp=join(media,`${name}.tmp`);
  await writeFile(tmp,encrypted,{mode:0o644});await rename(tmp,join(media,name));
  items.push({file:name,type:file.type});
}
const manifest=join(media,'manifest.json');
await writeFile(`${manifest}.tmp`,JSON.stringify({items}),{mode:0o644});
await rename(`${manifest}.tmp`,manifest);
for(const name of await readdir(media)){
  if(/^\d+\.bin$/.test(name)&&Number(name.slice(0,-4))>items.length)await rm(join(media,name));
}
await writeFile(join(privateDir,'state.txt'),hash+'\n',{mode:0o600});
console.log(`Published ${items.length} encrypted photos`);
