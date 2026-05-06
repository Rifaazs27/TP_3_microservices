const express=require('express')
const app=express()
const PORT=3000

app.get('/health',(req,res)=>{
res.status(200).json({status:"UP",service:"api-rh",timestamp:new Date()})
})

app.get('/metrics',(req,res)=>{
res.set('Content-Type','text/plain')
res.send(`# HELP node_memory_usage Bytes
node_memory_usage ${process.memoryUsage().rss}
# HELP node_uptime Seconds
node_uptime ${process.uptime()}`)
})

app.get('/',(req,res)=>res.send("L'API RH est fonctionnelle"))

app.listen(PORT,()=>console.log(`Service RH lancé sur le port ${PORT}`))
