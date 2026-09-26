const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  let file=pathname==='/'?'preview/index.html':pathname.slice(1);
  if(!/^(preview\/(index\.html|app\.js|style\.css)|miniprogram\/(utils\/model\.js|assets\/[a-z-]+\.svg))$/.test(file)) {res.writeHead(404);return res.end('Not found');}
  fs.readFile(path.join(root,file),(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
  });
}).listen(4173,'127.0.0.1',()=>console.log('车马慢预览 http://127.0.0.1:4173'));
