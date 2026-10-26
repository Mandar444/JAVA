import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),"dist");
const port=Number(process.argv[2]||48260);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error("Choose a port between 1024 and 65535.");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".json":"application/json; charset=utf-8"};
const server=http.createServer(async(req,res)=>{
  if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);res.end("Method not allowed");return}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname)}catch{res.writeHead(400);res.end("Invalid request");return}
  if(pathname==="/__health"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({app:"DSA-Now",version:2}));return}
  const filename=path.resolve(root,"."+ (pathname==="/" ? "/index.html":pathname));
  if(!filename.startsWith(root+path.sep)||!mime[path.extname(filename)]){res.writeHead(404);res.end("Not found");return}
  try{
    const data=await fs.readFile(filename);
    res.writeHead(200,{"Content-Type":mime[path.extname(filename)],"Cache-Control":"no-cache",
      "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
      "Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"});
    res.end(req.method==="HEAD"?undefined:data);
  }catch{res.writeHead(404);res.end("Not found")}
});
server.on("error",e=>{console.error(e.code==="EADDRINUSE"?`Port ${port} is already in use. Open the existing app or choose another port.`:e.message);process.exitCode=1});
server.listen(port,"127.0.0.1",()=>console.log(`DSA Now is ready: http://127.0.0.1:${port}`));
for(const sig of ["SIGINT","SIGTERM"])process.on(sig,()=>server.close(()=>process.exit(0)));
