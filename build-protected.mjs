import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import {randomBytes,pbkdf2Sync,createCipheriv} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname);
const source=resolve(root,'public'),privateDir=resolve(root,'private'),buildDir=resolve(root,'build');
async function readPassword(){
  if(!process.stdin.isTTY)return new Promise(resolve=>process.stdin.once('data',b=>resolve(b.toString('utf8').trim())));
  return new Promise((resolve,reject)=>{
    let value='';process.stdout.write('设置访问密码：');process.stdin.setRawMode(true);process.stdin.resume();
    const finish=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n')};
    const onData=buffer=>{for(const char of buffer.toString('utf8')){
      if(char==='\r'||char==='\n'){finish();resolve(value);return}
      if(char==='\u0003'){finish();reject(new Error('Cancelled'));return}
      if(char==='\u007f'){value=value.slice(0,-1);continue}
      value+=char;
    }};
    process.stdin.on('data',onData);
  });
}
const password=await readPassword();
if(!password)throw new Error('Missing password on stdin');
await mkdir(privateDir,{recursive:true,mode:0o700});await mkdir(buildDir,{recursive:true});
let salt;try{salt=await readFile(resolve(privateDir,'salt.bin'))}catch{salt=randomBytes(16);await writeFile(resolve(privateDir,'salt.bin'),salt,{mode:0o600})}
const key=pbkdf2Sync(password,salt,200000,32,'sha256');
await writeFile(resolve(privateDir,'key.bin'),key,{mode:0o600});await chmod(resolve(privateDir,'key.bin'),0o600);
const [html,css,js,loader]=await Promise.all(['index.html','style.css','script.js'].map(f=>readFile(resolve(source,f),'utf8')).concat(readFile(resolve(root,'loader.html'),'utf8')));
const body=html.match(/<body>([\s\S]*?)<\/body>/)?.[1];if(!body)throw new Error('Missing body');
const page={html:body.replace(/<script src="\.\/script\.js(?:\?v=\d+)?"><\/script>/,'').trim(),css,js};
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify(page),'utf8'),cipher.final(),cipher.getAuthTag()]);
await writeFile(resolve(buildDir,'payload.bin'),Buffer.concat([iv,encrypted]));
const music=await readFile(resolve(root,'audio/piano-theme.mp3'));
const musicIv=randomBytes(12),musicCipher=createCipheriv('aes-256-gcm',key,musicIv);
const musicEncrypted=Buffer.concat([musicIv,musicCipher.update(music),musicCipher.final(),musicCipher.getAuthTag()]);
await writeFile(resolve(buildDir,'music.bin'),musicEncrypted);
await writeFile(resolve(buildDir,'index.html'),loader.replace('__SALT__',salt.toString('base64')));
console.log('Protected page built');
