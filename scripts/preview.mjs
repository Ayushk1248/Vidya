import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
process.env.NEXT_BUILD_DIR='.next-preview';
// Keep source editing (npm run dev) separate from this optimized local build.
const build=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',windowsHide:true});
build.on('error',error=>{console.error(error.message);process.exitCode=1});
build.on('exit',code=>{
 if(code){process.exitCode=code;return}
 const server=spawn(process.execPath,['scripts/dev.mjs','--production','--local-preview'],{stdio:'inherit',windowsHide:true});
 server.on('error',error=>{console.error(error.message);process.exitCode=1});
 server.on('exit',code=>{process.exitCode=code||0});
 process.on('SIGINT',()=>server.kill('SIGINT'));process.on('SIGTERM',()=>server.kill('SIGTERM'));
});
