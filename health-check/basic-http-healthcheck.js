// npm install fastify@3.2 ioredis@4.17 pg@8.3
const server = require('fastify')();
const HOST = 'localhost';
const PORT = 3300;
const redis = new (require('ioredis'))({
    enableOfflineQueue: false //fail when Redis is offline
});
const pg = new (require('pg').Client)();
pg.connect(); //fail when offline

server.get('/health', async(req, reply) => {
    try{
        const res = await pg.query('SELECT $1::text as status', ['ACK']);
        if (res.rows[0].status !=='ACK'){
            reply.code(500).send('DOWN');
        }      
    } catch(e) {
        reply.code(500).send('DOWN');
    }

    let status = 'OK';

    try{
        if(await redis.ping() !=='PONG'){
            status = 'DEGRADED';
        }
    } catch(e){
        status = 'DEGRADED';
    }

    reply.code(200).send(status);
});

server.listen(PORT, HOST, ()=>{
    console.log(`http://${HOST}:${PORT}`);
});

// PGUSER=tmp PGPASSWORD=hunter2 PGDATABASE=tmp node basic-http-healthcheck.js